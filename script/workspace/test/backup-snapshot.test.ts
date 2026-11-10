import { deepEqual, equal } from 'node:assert/strict';
import {
    existsSync,
    mkdirSync,
    mkdtempSync,
    readFileSync,
    rmSync,
    statSync,
    utimesSync,
    writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import {
    prepareArchiveRebuild,
    restoreDirectory,
    settleArchiveRebuild,
    snapshotDirectory,
    unregisterArchivedVersion,
} from '../backup-snapshot';

interface Fixture {
    root: string;
    backupDir: string;
    userJs: string;
    zip: string;
    manifest: string;
}

/** 按仓库格式写版本表：4 空格缩进 + 结尾换行。 */
function writeManifest(
    path: string,
    versions: Record<string, string>,
): void {
    writeFileSync(path, `${JSON.stringify(versions, null, 4)}\n`);
}

/** 造一个已归档的 `backup/` 目录。 */
function makeBackupDir(versions: Record<string, string>): Fixture {
    const root = mkdtempSync(join(tmpdir(), 'ws-backup-'));
    const backupDir = join(root, 'backup');
    mkdirSync(backupDir, { recursive: true });
    const userJs = join(backupDir, 'demo.user.js');
    const zip = join(backupDir, 'demo.zip');
    const manifest = join(backupDir, 'versions.json');
    writeFileSync(userJs, 'old-user');
    writeFileSync(zip, 'old-zip');
    writeManifest(manifest, versions);
    return { root, backupDir, userJs, zip, manifest };
}

function readJson(path: string): Record<string, string> {
    return JSON.parse(readFileSync(path, 'utf8')) as Record<
        string,
        string
    >;
}

/** 把文件的修改时间钉死，便于断言还原是否保住了时间。 */
function pinMtime(path: string): number {
    const time = new Date('2020-01-02T03:04:05Z');
    utimesSync(path, time, time);
    return statSync(path).mtimeMs;
}

/** 取快照，null 视为用例失败。 */
function prepare(
    backupDir: string,
    version: string,
): NonNullable<ReturnType<typeof prepareArchiveRebuild>> {
    const snapshot = prepareArchiveRebuild(backupDir, version);
    if (snapshot === null) {
        throw new Error('期望拿到快照');
    }
    return snapshot;
}

test('构建失败整体还原：丢弃构建期间的新归档', () => {
    const { root, backupDir, userJs, zip, manifest } = makeBackupDir({
        '1.0.0': 'demo_1.0.0.backup.js',
    });
    try {
        const snapshot = snapshotDirectory(backupDir);

        rmSync(backupDir, { recursive: true, force: true });
        mkdirSync(backupDir, { recursive: true });
        writeFileSync(userJs, 'new-user');
        writeFileSync(zip, 'new-zip');

        restoreDirectory(snapshot);

        equal(readFileSync(userJs, 'utf8'), 'old-user');
        equal(readFileSync(zip, 'utf8'), 'old-zip');
        deepEqual(readJson(manifest), {
            '1.0.0': 'demo_1.0.0.backup.js',
        });
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});

test('快照与还原都保住修改时间', () => {
    const { root, backupDir, userJs, zip } = makeBackupDir({
        '1.0.0': 'demo_1.0.0.backup.js',
    });
    try {
        const userJsMtime = pinMtime(userJs);
        const zipMtime = pinMtime(zip);

        const snapshot = snapshotDirectory(backupDir);
        writeFileSync(userJs, 'rewritten');
        writeFileSync(zip, 'rewritten-zip');
        restoreDirectory(snapshot);

        equal(statSync(userJs).mtimeMs, userJsMtime);
        equal(statSync(zip).mtimeMs, zipMtime);
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});

test('摘掉已归档的版本，让插件肯重建同一个版本', () => {
    const { root, backupDir, manifest } = makeBackupDir({
        '1.0.0': 'demo_1.0.0.backup.js',
        '1.1.0': 'demo_1.1.0.backup.js',
    });
    try {
        unregisterArchivedVersion(backupDir, '1.1.0');

        deepEqual(readJson(manifest), {
            '1.0.0': 'demo_1.0.0.backup.js',
        });
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});

test('摘登记时不动 zip：历史版本还在原地', () => {
    const { root, backupDir, zip } = makeBackupDir({
        '1.1.0': 'demo_1.1.0.backup.js',
    });
    try {
        unregisterArchivedVersion(backupDir, '1.1.0');

        equal(existsSync(zip), true);
        equal(readFileSync(zip, 'utf8'), 'old-zip');
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});

test('摘登记时一并移开同版本的散落归档文件', () => {
    const { root, backupDir } = makeBackupDir({
        '1.1.0': 'demo_1.1.0.backup.js',
    });
    try {
        const loose = join(backupDir, 'demo_1.1.0.backup.js');
        writeFileSync(loose, 'loose');
        unregisterArchivedVersion(backupDir, '1.1.0');

        equal(existsSync(loose), false);
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});

test('版本本来就没登记时不写文件', () => {
    const { root, backupDir, manifest } = makeBackupDir({
        '1.0.0': 'demo_1.0.0.backup.js',
    });
    try {
        const mtime = pinMtime(manifest);

        unregisterArchivedVersion(backupDir, '9.9.9');

        equal(statSync(manifest).mtimeMs, mtime);
        deepEqual(readJson(manifest), {
            '1.0.0': 'demo_1.0.0.backup.js',
        });
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});

test('已归档版本重建：产物变了也整体还原，归档逐字节不变', () => {
    const { root, backupDir, userJs, zip, manifest } = makeBackupDir({
        '1.0.0': 'demo_1.0.0.backup.js',
    });
    try {
        const userJsMtime = pinMtime(userJs);
        const zipMtime = pinMtime(zip);

        const snapshot = prepare(backupDir, '1.0.0');

        // 工具链漂移会产出不同的字节，zip 也会被重新压缩
        writeFileSync(zip, 're-encoded-zip');
        writeFileSync(userJs, 'different-user');
        writeManifest(manifest, {
            '1.0.0': 'demo_1.0.0.backup.js',
        });

        equal(settleArchiveRebuild(snapshot), 'restored');
        equal(readFileSync(zip, 'utf8'), 'old-zip');
        equal(readFileSync(userJs, 'utf8'), 'old-user');
        equal(statSync(zip).mtimeMs, zipMtime);
        equal(statSync(userJs).mtimeMs, userJsMtime);
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});

test('新版本发版：保留新产物并登记新版本', () => {
    const { root, backupDir, userJs, zip, manifest } = makeBackupDir({
        '1.0.0': 'demo_1.0.0.backup.js',
    });
    try {
        const snapshot = prepare(backupDir, '1.1.0');

        // 插件在旧 zip 上追加，历史没有被截断
        writeFileSync(zip, 'appended-zip');
        writeFileSync(userJs, 'new-user');
        writeManifest(manifest, {
            '1.0.0': 'demo_1.0.0.backup.js',
            '1.1.0': 'demo_1.1.0.backup.js',
        });

        equal(settleArchiveRebuild(snapshot), 'kept');
        equal(readFileSync(zip, 'utf8'), 'appended-zip');
        equal(readFileSync(userJs, 'utf8'), 'new-user');
        deepEqual(readJson(manifest), {
            '1.0.0': 'demo_1.0.0.backup.js',
            '1.1.0': 'demo_1.1.0.backup.js',
        });
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});

test('发版时插件丢了旧版本登记要补回', () => {
    const { root, backupDir, userJs, manifest } = makeBackupDir({
        '1.0.0': 'demo_1.0.0.backup.js',
    });
    try {
        const snapshot = prepare(backupDir, '1.1.0');

        writeFileSync(userJs, 'new-user');
        writeManifest(manifest, {
            '1.1.0': 'demo_1.1.0.backup.js',
        });

        settleArchiveRebuild(snapshot);

        deepEqual(readJson(manifest), {
            '1.0.0': 'demo_1.0.0.backup.js',
            '1.1.0': 'demo_1.1.0.backup.js',
        });
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});

test('发版后版本表已含全部登记就不再改写（保留插件写法）', () => {
    const { root, backupDir, userJs, manifest } = makeBackupDir({
        '1.0.0': 'demo_1.0.0.backup.js',
    });
    try {
        const snapshot = prepare(backupDir, '1.1.0');

        // 插件追加成功后按自己的 2 空格格式写版本表，登记齐全
        writeFileSync(userJs, 'new-user');
        writeFileSync(
            manifest,
            JSON.stringify(
                {
                    '1.0.0': 'demo_1.0.0.backup.js',
                    '1.1.0': 'demo_1.1.0.backup.js',
                },
                null,
                2,
            ),
        );
        const before = readFileSync(manifest, 'utf8');
        const mtime = pinMtime(manifest);

        equal(settleArchiveRebuild(snapshot), 'kept');
        equal(readFileSync(manifest, 'utf8'), before);
        equal(statSync(manifest).mtimeMs, mtime);
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});

test('散落归档的老项目也算已归档', () => {
    const root = mkdtempSync(join(tmpdir(), 'ws-backup-'));
    try {
        const backupDir = join(root, 'backup');
        mkdirSync(backupDir, { recursive: true });
        writeFileSync(
            join(backupDir, 'demo_1.0.0.backup.js'),
            'loose',
        );

        const snapshot = prepare(backupDir, '1.0.0');
        writeFileSync(join(backupDir, 'demo.user.js'), 'new-user');

        equal(settleArchiveRebuild(snapshot), 'restored');
        equal(
            existsSync(join(backupDir, 'demo_1.0.0.backup.js')),
            true,
        );
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});

test('没有 backup/ 目录时不准备快照', () => {
    const root = mkdtempSync(join(tmpdir(), 'ws-backup-'));
    try {
        equal(
            prepareArchiveRebuild(join(root, 'missing'), '1.0.0'),
            null,
        );
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});
