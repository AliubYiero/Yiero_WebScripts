import { equal, ok } from 'node:assert/strict';
import { test } from 'node:test';
import { projectFromInitCwd, resolveScope } from '../project-context';
import { needsArchiveBuild } from '../build-project';
import { type PackageInfo, repoRoot } from '../workspace';

function fakePackage(
    overrides: Partial<PackageInfo> & { relDir: string },
): PackageInfo {
    const name =
        overrides.name ??
        `@webscripts/${overrides.relDir.split('/').at(-1) ?? 'demo'}`;
    return {
        dir: `${repoRoot.replaceAll('\\', '/')}/${overrides.relDir}`,
        name,
        version: '0.0.0',
        scriptVersion: '1.0.0',
        archived: false,
        backupDir: null,
        isLibrary: false,
        isException: false,
        buildScript: 'build',
        hasTypecheck: true,
        ...overrides,
    };
}

const packages = [
    fakePackage({ relDir: 'src/com/bilibili/demo' }),
    fakePackage({ relDir: 'src/com/bilibili/demo-extra' }),
    fakePackage({
        relDir: 'src/com/bilibili/.lib',
        version: '0.3.2',
        scriptVersion: null,
        isLibrary: true,
    }),
];

test('INIT_CWD 在仓库根或不设时视为仓库级操作', () => {
    equal(projectFromInitCwd(packages, undefined), null);
    equal(projectFromInitCwd(packages, ''), null);
    equal(projectFromInitCwd(packages, repoRoot), null);
});

test('INIT_CWD 落在项目目录（含子目录）时定位到该项目', () => {
    const pkg = projectFromInitCwd(
        packages,
        `${repoRoot}\\src\\com\\bilibili\\demo`,
    );
    equal(pkg?.relDir, 'src/com/bilibili/demo');

    const nested = projectFromInitCwd(
        packages,
        `${repoRoot}\\src\\com\\bilibili\\demo\\src`,
    );
    equal(nested?.relDir, 'src/com/bilibili/demo');
});

test('相似前缀的兄弟目录不会被误认', () => {
    const pkg = projectFromInitCwd(
        packages,
        `${repoRoot}\\src\\com\\bilibili\\demo-extra`,
    );
    equal(pkg?.relDir, 'src/com/bilibili/demo-extra');
});

test('--project 可以按完整路径、包名、目录名定位', () => {
    for (const spec of [
        'src/com/bilibili/demo',
        'com/bilibili/demo',
        '@webscripts/demo',
        'demo',
    ]) {
        const scope = resolveScope(spec, packages);
        equal(scope.error, undefined, `${spec} 应能定位`);
        equal(scope.pkg?.relDir, 'src/com/bilibili/demo');
    }
});

test('定位失败与重名都给出错误信息', () => {
    const missing = resolveScope('src/com/nope/none', packages);
    equal(missing.pkg, null);
    ok(missing.error?.includes('找不到项目'));

    const duplicated = resolveScope('demo', [
        ...packages,
        fakePackage({ relDir: 'src/com/other/demo' }),
    ]);
    equal(duplicated.pkg, null);
    ok(duplicated.error?.includes('不唯一'));
});

test('needsArchiveBuild 只看脚本项目且未归档的情况', () => {
    equal(
        needsArchiveBuild(
            fakePackage({ relDir: 'a/b', archived: true }),
        ),
        false,
    );
    equal(
        needsArchiveBuild(
            fakePackage({ relDir: 'a/b', archived: false }),
        ),
        true,
    );
    equal(
        needsArchiveBuild(
            fakePackage({
                relDir: 'a/b',
                archived: false,
                isException: true,
            }),
        ),
        true,
    );
    equal(
        needsArchiveBuild(
            fakePackage({
                relDir: 'a/.lib',
                archived: false,
                isLibrary: true,
                scriptVersion: null,
            }),
        ),
        false,
    );
});
