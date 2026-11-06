import { deepEqual, equal } from 'node:assert/strict';
import { test } from 'node:test';
import {
    ensureArchiveBuild,
    libraryBuildOrder,
} from '../build-project';
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
        testScript: null,
        workspaceDependencies: [],
        ...overrides,
    };
}

function fakeLibrary(
    name: string,
    workspaceDependencies: string[] = [],
): PackageInfo {
    return fakePackage({
        dir: `D:/repo/src/.Libs/${name}`,
        relDir: `src/.Libs/${name}`,
        name,
        version: '0.1.0',
        scriptVersion: null,
        archived: false,
        backupDir: null,
        isLibrary: true,
        isException: false,
        buildScript: 'rslib build',
        hasTypecheck: false,
        testScript: null,
        workspaceDependencies,
    });
}

test('链接库没有归档构建，直接跳过', () => {
    const result = ensureArchiveBuild(
        fakePackage({ isLibrary: true, scriptVersion: null }),
        [],
    );

    equal(result.ok, true);
    equal(result.built, false);
});

test('当前版本已归档时跳过构建', () => {
    const result = ensureArchiveBuild(
        fakePackage({ archived: true }),
        [],
    );

    equal(result.ok, true);
    equal(result.built, false);
});

test('已归档的脚本不会连带构建前置库', () => {
    const library = fakeLibrary('@webscripts/base-lib');
    const result = ensureArchiveBuild(
        fakePackage({
            archived: true,
            workspaceDependencies: ['@webscripts/base-lib'],
        }),
        [library],
    );

    equal(result.ok, true);
    equal(result.built, false);
});

test('前置库按依赖闭包排序：被依赖的库排在前面', () => {
    const base = fakeLibrary('@webscripts/base-lib');
    const mid = fakeLibrary('@webscripts/mid-lib', [
        '@webscripts/base-lib',
    ]);
    const extra = fakeLibrary('@webscripts/extra-lib');
    const script = fakePackage({
        workspaceDependencies: [
            '@webscripts/mid-lib',
            '@webscripts/extra-lib',
        ],
    });

    const order = libraryBuildOrder(script, [
        base,
        mid,
        extra,
        script,
    ]);

    deepEqual(
        order.map((pkg) => pkg.name),
        [
            '@webscripts/base-lib',
            '@webscripts/mid-lib',
            '@webscripts/extra-lib',
        ],
    );
});

test('前置库只收链接库，非库依赖被忽略', () => {
    const script = fakePackage({
        workspaceDependencies: [
            '@webscripts/not-a-library',
            '@yiero/not-in-workspace',
        ],
    });
    const other = fakePackage({
        name: '@webscripts/not-a-library',
        relDir: 'src/com/demo/not-a-library',
    });

    const order = libraryBuildOrder(script, [other, script]);

    deepEqual(order, []);
});

test('前置库依赖成环时不死循环', () => {
    const a = fakeLibrary('@webscripts/a-lib', ['@webscripts/b-lib']);
    const b = fakeLibrary('@webscripts/b-lib', ['@webscripts/a-lib']);
    const script = fakePackage({
        workspaceDependencies: ['@webscripts/a-lib'],
    });

    const order = libraryBuildOrder(script, [a, b, script]);

    deepEqual(order.map((pkg) => pkg.name).sort(), [
        '@webscripts/a-lib',
        '@webscripts/b-lib',
    ]);
});
