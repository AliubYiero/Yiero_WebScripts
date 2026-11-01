import { deepEqual, equal } from 'node:assert/strict';
import {
    existsSync,
    mkdirSync,
    mkdtempSync,
    readFileSync,
    rmSync,
    writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import {
    mergeRestore,
    restoreDirectory,
    snapshotDirectory,
} from '../backup-snapshot';

function makeBackupDir(root: string): string {
    const dir = join(root, 'backup');
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'old_1.0.0.backup.js'), 'old');
    writeFileSync(
        join(dir, 'versions.json'),
        JSON.stringify({ '1.0.0': 'old_1.0.0.backup.js' }),
    );
    return dir;
}

test('构建成功后合并归档：新归档保留，旧归档回填', () => {
    const root = mkdtempSync(join(tmpdir(), 'ws-snap-'));
    try {
        const backupDir = makeBackupDir(root);
        const snapshot = snapshotDirectory(backupDir);

        rmSync(backupDir, { recursive: true, force: true });
        mkdirSync(backupDir, { recursive: true });
        writeFileSync(join(backupDir, 'new_2.0.0.backup.js'), 'new');
        writeFileSync(
            join(backupDir, 'versions.json'),
            JSON.stringify({ '2.0.0': 'new_2.0.0.backup.js' }),
        );

        mergeRestore(snapshot);

        ok(join(backupDir, 'new_2.0.0.backup.js'));
        ok(join(backupDir, 'old_1.0.0.backup.js'));
        const versions = JSON.parse(
            readFileSync(join(backupDir, 'versions.json'), 'utf8'),
        ) as Record<string, string>;
        deepEqual(Object.keys(versions).sort(), ['1.0.0', '2.0.0']);
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});

function ok(path: string): void {
    equal(existsSync(path), true, `期望存在：${path}`);
}

test('构建失败时整体还原：丢弃新归档', () => {
    const root = mkdtempSync(join(tmpdir(), 'ws-snap-'));
    try {
        const backupDir = makeBackupDir(root);
        const snapshot = snapshotDirectory(backupDir);

        rmSync(backupDir, { recursive: true, force: true });
        mkdirSync(backupDir, { recursive: true });
        writeFileSync(join(backupDir, 'partial.js'), 'partial');

        restoreDirectory(snapshot);

        ok(join(backupDir, 'old_1.0.0.backup.js'));
        equal(existsSync(join(backupDir, 'partial.js')), false);
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});

test('没有 versions.json 时从归档文件名回填历史版本', () => {
    const root = mkdtempSync(join(tmpdir(), 'ws-snap-'));
    try {
        const backupDir = join(root, 'backup');
        mkdirSync(backupDir, { recursive: true });
        writeFileSync(join(backupDir, 'old_1.0.0.backup.js'), 'a');
        writeFileSync(join(backupDir, 'old_1.0.1.backup.js'), 'b');
        const snapshot = snapshotDirectory(backupDir);

        rmSync(backupDir, { recursive: true, force: true });
        mkdirSync(backupDir, { recursive: true });
        writeFileSync(join(backupDir, 'old_1.0.2.backup.js'), 'c');
        writeFileSync(
            join(backupDir, 'versions.json'),
            JSON.stringify({ '1.0.2': 'old_1.0.2.backup.js' }),
        );

        mergeRestore(snapshot);

        const versions = JSON.parse(
            readFileSync(join(backupDir, 'versions.json'), 'utf8'),
        ) as Record<string, string>;
        deepEqual(Object.keys(versions).sort(), [
            '1.0.0',
            '1.0.1',
            '1.0.2',
        ]);
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});
