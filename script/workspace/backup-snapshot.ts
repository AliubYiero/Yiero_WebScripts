import {
    cpSync,
    existsSync,
    mkdtempSync,
    readdirSync,
    readFileSync,
    rmSync,
    writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export interface BackupSnapshot {
    /** 被快照的原始目录，如 <project>/backup */
    source: string;
    /** 快照副本目录 */
    copyDir: string;
    /** 临时父目录，用于整体清理 */
    parentDir: string;
}

function readVersionMap(backupDir: string): Record<string, string> {
    const manifest = join(backupDir, 'versions.json');
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

function removeSnapshot(snapshot: BackupSnapshot): void {
    rmSync(snapshot.parentDir, { recursive: true, force: true });
}

/** 把备份归档目录整体复制到临时目录。 */
export function snapshotDirectory(source: string): BackupSnapshot {
    const parentDir = mkdtempSync(
        join(tmpdir(), 'webscripts-backup-'),
    );
    const copyDir = join(parentDir, 'backup');
    cpSync(source, copyDir, { recursive: true });
    return { source, copyDir, parentDir };
}

/** 构建失败时整体还原：丢弃构建期间对归档的任何改动。 */
export function restoreDirectory(snapshot: BackupSnapshot): void {
    rmSync(snapshot.source, { recursive: true, force: true });
    cpSync(snapshot.copyDir, snapshot.source, { recursive: true });
    removeSnapshot(snapshot);
}

/**
 * 构建成功时合并还原：新产出的归档保留，快照里原有的归档补回来。
 * versions.json 以「旧 + 新」合并，避免新版本覆盖历史版本记录。
 */
export function mergeRestore(snapshot: BackupSnapshot): void {
    if (!existsSync(snapshot.source)) {
        restoreDirectory(snapshot);
        return;
    }

    for (const entry of readdirSync(snapshot.copyDir)) {
        const target = join(snapshot.source, entry);
        if (!existsSync(target)) {
            cpSync(join(snapshot.copyDir, entry), target, {
                recursive: true,
            });
        }
    }

    const merged = {
        ...readVersionMap(snapshot.copyDir),
        ...readVersionMap(snapshot.source),
    };
    if (Object.keys(merged).length > 0) {
        writeFileSync(
            join(snapshot.source, 'versions.json'),
            `${JSON.stringify(merged, null, 4)}\n`,
            'utf8',
        );
    }

    removeSnapshot(snapshot);
}
