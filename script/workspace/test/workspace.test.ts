import { deepEqual, equal } from 'node:assert/strict';
import {
    mkdirSync,
    mkdtempSync,
    rmSync,
    writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { discoverPackages } from '../workspace';

interface DemoManifest {
    name: string;
    version: string;
    scripts?: Record<string, string>;
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
}

function makePackage(
    root: string,
    rel: string,
    manifest: DemoManifest,
): void {
    const dir = join(root, rel);
    mkdirSync(dir, { recursive: true });
    writeFileSync(
        join(dir, 'package.json'),
        JSON.stringify(manifest),
        'utf8',
    );
}

function writeBanner(root: string, rel: string): void {
    const dir = join(root, rel);
    mkdirSync(join(dir, 'banner'), { recursive: true });
    writeFileSync(
        join(dir, 'banner/UserScript.ts'),
        ["[ 'name', 'Demo' ],", "[ 'version', '1.0.0' ],"].join('\n'),
        'utf8',
    );
}

test('库域按两层发现，库内的包一律标记为链接库', () => {
    const root = mkdtempSync(join(tmpdir(), 'ws-libs-'));
    try {
        makePackage(root, 'src/.Libs/gmlib', {
            name: '@yiero/gmlib',
            version: '0.4.7',
            scripts: { build: 'rslib build', test: 'vitest run' },
        });
        // 库域只有两层，更深一层的目录不算包。
        makePackage(root, 'src/.Libs/gmlib/nested', {
            name: '@yiero/nested',
            version: '0.0.0',
        });

        const packages = discoverPackages(root);

        equal(packages.length, 1);
        const lib = packages[0];
        equal(lib.relDir, 'src/.Libs/gmlib');
        equal(lib.isLibrary, true);
        equal(lib.scriptVersion, null);
        equal(lib.testScript, 'vitest run');
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});

test('库域内即使带 banner 也判为链接库', () => {
    const root = mkdtempSync(join(tmpdir(), 'ws-libs-'));
    try {
        makePackage(root, 'src/.Libs/stray', {
            name: '@yiero/stray',
            version: '0.4.7',
        });
        writeBanner(root, 'src/.Libs/stray');

        const lib = discoverPackages(root)[0];

        equal(lib.isLibrary, true);
        equal(lib.scriptVersion, null);
        equal(lib.archived, false);
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});

test('收集 workspace: 协议依赖，按声明顺序去重', () => {
    const root = mkdtempSync(join(tmpdir(), 'ws-libs-'));
    try {
        makePackage(root, 'src/com/demo/alpha', {
            name: '@webscripts/alpha',
            version: '0.0.0',
            dependencies: {
                '@yiero/gmlib': 'workspace:*',
                dayjs: '^1.11.0',
                '@yiero/bilibili-api-lib': 'workspace:^0.3.2',
            },
            devDependencies: {
                '@yiero/gmlib': 'workspace:*',
                vitest: '^3.0.0',
                '@webscripts/shared': 'workspace:*',
            },
        });

        const pkg = discoverPackages(root)[0];

        deepEqual(pkg.workspaceDependencies, [
            '@yiero/gmlib',
            '@yiero/bilibili-api-lib',
            '@webscripts/shared',
        ]);
        equal(pkg.testScript, null);
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});
