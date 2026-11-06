import { equal } from 'node:assert/strict';
import { test } from 'node:test';
import { ensureArchiveBuild } from '../build-project';
import type { PackageInfo } from '../workspace';

function fakePackage(
    overrides: Partial<PackageInfo> = {},
): PackageInfo {
    const relDir = 'src/com/demo/demo-project';
    return {
        dir: `D:/repo/${relDir}`,
        relDir,
        name: '@webscripts/demo-project',
        version: '0.0.0',
        scriptVersion: '1.2.3',
        archived: true,
        backupDir: `D:/repo/${relDir}/backup`,
        isLibrary: false,
        isException: false,
        buildScript: 'build',
        hasTypecheck: true,
        ...overrides,
    };
}

test('链接库没有归档构建，直接跳过', () => {
    const result = ensureArchiveBuild(
        fakePackage({ isLibrary: true, scriptVersion: null }),
    );

    equal(result.ok, true);
    equal(result.built, false);
});

test('当前版本已归档时跳过构建', () => {
    const result = ensureArchiveBuild(
        fakePackage({ archived: true }),
    );

    equal(result.ok, true);
    equal(result.built, false);
});
