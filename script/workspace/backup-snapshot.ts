import {
    cpSync,
    existsSync,
    mkdtempSync,
    readdirSync,
    readFileSync,
    renameSync,
    rmSync,
    writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { readArchivedVersions } from './workspace';

export interface BackupSnapshot {
    /** 被快照的原始目录，如 `<project>/backup` */
    source: string;
    /** 快照副本目录 */
    copyDir: string;
    /** 临时父目录，用于整体清理 */
    parentDir: string;
}

/** 重建归档需要的现场：重建前的版本表，以及该版本原本是否已归档。 */
export interface RebuildSnapshot extends BackupSnapshot {
    /** 构建前该版本是否已在归档里 */
    wasArchived: boolean;
    /** 构建前的版本表 */
    versionMap: Record<string, string>;
}

const manifestName = 'versions.json';

const archivePattern =
    /^(.+)_(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)\.backup\.js$/;

function manifestPath(backupDir: string): string {
    return join(backupDir, manifestName);
}

function readVersionMap(backupDir: string): Record<string, string> {
    const manifest = manifestPath(backupDir);
    if (!existsSync(manifest)) {
        return {};
    }
    try {
        return JSON.parse(readFileSync(manifest, 'utf8')) as Record<
            string,
            string
        >;
    } catch {
        return {};
    }
}

/**
 * 版本表的文本形态：4 空格缩进 + 结尾换行。
 *
 * 备份插件自己写的是 2 空格、无结尾换行，但仓库里已提交的
 * `versions.json` 统一是 4 空格缩进；这里跟随仓库格式，免得
 * 一次重建就把整个文件重排一遍。
 */
function formatVersionMap(versions: Record<string, string>): string {
    return `${JSON.stringify(versions, null, 4)}\n`;
}

function writeVersionMap(
    backupDir: string,
    versions: Record<string, string>,
): void {
    writeFileSync(
        manifestPath(backupDir),
        formatVersionMap(versions),
        'utf8',
    );
}

/**
 * 归档里是否已有 `version`。
 *
 * 判定复用 `readArchivedVersions`：版本表与散落归档文件名两个
 * 来源都算，避免这里和构建计划各判一套导致前后不一致。
 */
function hasArchivedVersion(
    backupDir: string,
    version: string,
): boolean {
    return readArchivedVersions(dirname(backupDir)).includes(version);
}

/** 把备份归档目录整体复制到临时目录，连同修改时间。 */
export function snapshotDirectory(source: string): BackupSnapshot {
    const parentDir = mkdtempSync(
        join(tmpdir(), 'webscripts-backup-'),
    );
    const copyDir = join(parentDir, 'backup');
    cpSync(source, copyDir, {
        recursive: true,
        preserveTimestamps: true,
    });
    return { source, copyDir, parentDir };
}

/** 丢弃快照，不碰原目录。 */
function discardSnapshot(snapshot: BackupSnapshot): void {
    rmSync(snapshot.parentDir, { recursive: true, force: true });
}

/**
 * 整体还原：内容与修改时间都回到快照那一刻，构建期间对归档的
 * 任何改动都不留痕迹。
 *
 * 修改时间必须一起还原：`backup/<name>.user.js` 的 mtime 是
 * `pnpm update:readme` 在 `getLastUpdateWay: 'file'` 下的
 * 「最后更新」来源，重建同一份归档不该让它漂移。
 *
 * 先复制到同级暂存目录、再换名，而不是先删再复制：复制失败
 * （文件被占用、磁盘满）时原目录还在，归档不会凭空消失。
 */
export function restoreDirectory(snapshot: BackupSnapshot): void {
    const staging = `${snapshot.source}.webscripts-restore`;
    rmSync(staging, { recursive: true, force: true });
    cpSync(snapshot.copyDir, staging, {
        recursive: true,
        preserveTimestamps: true,
    });
    rmSync(snapshot.source, { recursive: true, force: true });
    renameSync(staging, snapshot.source);
    discardSnapshot(snapshot);
}

/**
 * 把 `version` 从归档登记里摘掉，让备份插件把它当成「尚未归档」。
 *
 * 插件在版本已登记时会以 `BackupExistError` 拒绝构建，所以重建
 * 前必须先摘登记。这里只摘登记、不删 `<name>.zip`：zip 留在盘
 * 上，插件就会在它上面追加，历史版本不会被截成只剩当前版本。
 * 散落的同名归档文件也要删掉，否则插件的初始化迁移会把它重新
 * 登记回版本表。调用方已经拍过快照，删除是可回滚的。
 */
export function unregisterArchivedVersion(
    backupDir: string,
    version: string,
): void {
    const versions = readVersionMap(backupDir);
    if (version in versions) {
        delete versions[version];
        writeVersionMap(backupDir, versions);
    }

    if (!existsSync(backupDir)) {
        return;
    }
    for (const entry of readdirSync(backupDir)) {
        const match = archivePattern.exec(entry);
        if (match !== null && match[2] === version) {
            rmSync(join(backupDir, entry), { force: true });
        }
    }
}

/**
 * 构建归档前的准备：拍快照、记下版本表与该版本原本是否已归档，
 * 再把版本登记摘掉，让插件肯重新归档。
 *
 * 没有 `backup/` 的项目（链接库、例外项目）返回 null。
 */
export function prepareArchiveRebuild(
    backupDir: string,
    version: string,
): RebuildSnapshot | null {
    if (!existsSync(backupDir)) {
        return null;
    }

    const snapshot = snapshotDirectory(backupDir);
    const wasArchived = hasArchivedVersion(backupDir, version);
    const versionMap = readVersionMap(backupDir);
    unregisterArchivedVersion(backupDir, version);

    return {
        ...snapshot,
        wasArchived,
        versionMap,
    };
}

/**
 * 构建归档后的收尾。
 *
 * 该版本原本已归档，说明这是一次校验性重建（`pnpm build:all` /
 * `--force`）：归档是只追加的契约，重建不得改写既有归档，所以
 * 无论新产物与旧产物是否一致都整体还原——zip 不会被重新压缩，
 * mtime 也不会被刷新，各项目在 `pnpm update:readme` 里的「最后
 * 更新」因此不再被全量构建污染。
 *
 * 原本未归档的版本则是正常发版：保留新产物（插件是在旧 zip 上
 * 追加的，历史仍在），并把可能被丢掉的旧登记补回去。只有登记
 * 真的缺了才重写版本表，不去动插件刚写好的文件。
 */
export function settleArchiveRebuild(
    snapshot: RebuildSnapshot,
): 'restored' | 'kept' {
    if (snapshot.wasArchived) {
        restoreDirectory(snapshot);
        return 'restored';
    }

    const current = readVersionMap(snapshot.source);
    const merged = {
        ...snapshot.versionMap,
        ...current,
    };
    const manifest = manifestPath(snapshot.source);
    if (!sameVersionMap(current, merged)) {
        writeFileSync(manifest, formatVersionMap(merged), 'utf8');
    }
    discardSnapshot(snapshot);
    return 'kept';
}

/** 两张版本表是否完全一致（键与值都比）。 */
function sameVersionMap(
    left: Record<string, string>,
    right: Record<string, string>,
): boolean {
    const leftKeys = Object.keys(left);
    const rightKeys = Object.keys(right);
    if (leftKeys.length !== rightKeys.length) {
        return false;
    }
    return leftKeys.every(
        (key) => key in right && left[key] === right[key],
    );
}
