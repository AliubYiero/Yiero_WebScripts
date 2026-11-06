import { deepEqual, equal, ok } from 'node:assert/strict';
import {
    mkdirSync,
    mkdtempSync,
    rmSync,
    writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { createBuildPlan, selectPlanEntries } from '../build-plan';
import { discoverPackages } from '../workspace';

interface DemoManifest {
    name: string;
    version: string;
    dependencies?: Record<string, string>;
}

function writePackage(
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

function makeLibrary(
    root: string,
    rel: string,
    name: string,
    dependencies: Record<string, string> = {},
): void {
    writePackage(root, rel, {
        name,
        version: '0.0.0',
        dependencies,
    });
}

interface ScriptOptions {
    name: string;
    scriptVersion: string;
    archived: string | null;
    dependencies?: Record<string, string>;
}

function makeScript(
    root: string,
    rel: string,
    options: ScriptOptions,
): void {
    const dir = join(root, rel);
    writePackage(root, rel, {
        name: options.name,
        version: '0.0.0',
        dependencies: options.dependencies,
    });
    mkdirSync(join(dir, 'banner'), { recursive: true });
    writeFileSync(
        join(dir, 'banner/UserScript.ts'),
        [
            "[ 'name', 'Demo' ],",
            `[ 'version', '${options.scriptVersion}' ],`,
            '',
        ].join('\n'),
        'utf8',
    );
    if (options.archived !== null) {
        mkdirSync(join(dir, 'backup'), { recursive: true });
        writeFileSync(
            join(dir, 'backup/versions.json'),
            JSON.stringify({
                [options.archived]: `${options.archived}.js`,
            }),
            'utf8',
        );
    }
}

test('已归档的版本默认跳过，未归档的进入构建', () => {
    const root = mkdtempSync(join(tmpdir(), 'ws-plan-'));
    try {
        makeScript(root, 'src/com/demo/alpha', {
            name: '@webscripts/alpha',
            scriptVersion: '1.0.0',
            archived: '1.0.0',
        });
        makeScript(root, 'src/com/demo/beta', {
            name: '@webscripts/beta',
            scriptVersion: '2.0.0',
            archived: '1.0.0',
        });
        const plan = createBuildPlan(discoverPackages(root));

        equal(plan.length, 2);
        equal(plan[0].project, 'src/com/demo/alpha');
        equal(plan[0].action, 'skip');
        equal(plan[1].project, 'src/com/demo/beta');
        equal(plan[1].action, 'build');

        const forced = createBuildPlan(discoverPackages(root), {
            all: true,
        });
        ok(forced.every((entry) => entry.action === 'build'));
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});

test('有脚本但没有备份目录的项目被标记为例外', () => {
    const root = mkdtempSync(join(tmpdir(), 'ws-plan-'));
    try {
        makeScript(root, 'src/com/demo/gamma', {
            name: '@webscripts/gamma',
            scriptVersion: '3.0.0',
            archived: null,
        });
        const plan = createBuildPlan(discoverPackages(root));

        equal(plan.length, 1);
        equal(plan[0].exception, true);
        equal(plan[0].archived, false);
        equal(plan[0].action, 'skip');

        const forced = createBuildPlan(discoverPackages(root), {
            all: true,
        });
        equal(forced[0].action, 'build');
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});

test('链接库只在依赖它的脚本需要构建时进入计划', () => {
    const root = mkdtempSync(join(tmpdir(), 'ws-plan-'));
    try {
        makeLibrary(root, 'src/.Libs/lib', '@webscripts/lib');
        makeScript(root, 'src/com/demo/alpha', {
            name: '@webscripts/alpha',
            scriptVersion: '1.0.0',
            archived: '1.0.0',
            dependencies: { '@webscripts/lib': 'workspace:*' },
        });

        const skipPlan = createBuildPlan(discoverPackages(root));
        equal(skipPlan[0].project, 'src/.Libs/lib');
        equal(skipPlan[0].library, true);
        equal(skipPlan[0].action, 'skip');

        makeScript(root, 'src/com/demo/beta', {
            name: '@webscripts/beta',
            scriptVersion: '2.0.0',
            archived: '1.0.0',
            dependencies: { '@webscripts/lib': 'workspace:*' },
        });
        const buildPlan = createBuildPlan(discoverPackages(root));
        equal(buildPlan[0].project, 'src/.Libs/lib');
        equal(buildPlan[0].action, 'build');
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});

test('库按依赖先后排序，并排在依赖它的脚本之前', () => {
    const root = mkdtempSync(join(tmpdir(), 'ws-plan-'));
    try {
        makeLibrary(root, 'src/.Libs/a-lib', '@webscripts/a-lib', {
            '@webscripts/z-lib': 'workspace:*',
        });
        makeLibrary(root, 'src/.Libs/z-lib', '@webscripts/z-lib');
        makeScript(root, 'src/com/demo/alpha', {
            name: '@webscripts/alpha',
            scriptVersion: '1.0.0',
            archived: '0.9.0',
            dependencies: { '@webscripts/a-lib': 'workspace:*' },
        });

        const plan = createBuildPlan(discoverPackages(root));

        deepEqual(
            plan.map((entry) => entry.project),
            [
                'src/.Libs/z-lib',
                'src/.Libs/a-lib',
                'src/com/demo/alpha',
            ],
        );
        deepEqual(
            plan.map((entry) => entry.action),
            ['build', 'build', 'build'],
        );
        deepEqual(
            plan.map((entry) => entry.library),
            [true, true, false],
        );
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});

test('无人依赖的库保持跳过', () => {
    const root = mkdtempSync(join(tmpdir(), 'ws-plan-'));
    try {
        makeLibrary(root, 'src/.Libs/unused', '@webscripts/unused');
        makeLibrary(root, 'src/.Libs/used', '@webscripts/used');
        makeScript(root, 'src/com/demo/alpha', {
            name: '@webscripts/alpha',
            scriptVersion: '1.0.0',
            archived: '0.9.0',
            dependencies: { '@webscripts/used': 'workspace:*' },
        });

        const plan = createBuildPlan(discoverPackages(root));
        const unused = plan.find(
            (entry) => entry.project === 'src/.Libs/unused',
        );
        const used = plan.find(
            (entry) => entry.project === 'src/.Libs/used',
        );
        ok(unused);
        ok(used);
        equal(unused.action, 'skip');
        equal(used.action, 'build');
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});

test('库依赖成环时退让为发现顺序且不死循环', () => {
    const root = mkdtempSync(join(tmpdir(), 'ws-plan-'));
    try {
        makeLibrary(root, 'src/.Libs/a-lib', '@webscripts/a-lib', {
            '@webscripts/b-lib': 'workspace:*',
        });
        makeLibrary(root, 'src/.Libs/b-lib', '@webscripts/b-lib', {
            '@webscripts/a-lib': 'workspace:*',
        });
        makeScript(root, 'src/com/demo/alpha', {
            name: '@webscripts/alpha',
            scriptVersion: '1.0.0',
            archived: '0.9.0',
            dependencies: { '@webscripts/a-lib': 'workspace:*' },
        });

        const plan = createBuildPlan(discoverPackages(root));

        deepEqual(
            plan.map((entry) => entry.project),
            [
                'src/.Libs/a-lib',
                'src/.Libs/b-lib',
                'src/com/demo/alpha',
            ],
        );
        deepEqual(
            plan.map((entry) => entry.action),
            ['build', 'build', 'build'],
        );

        // 裁剪时同样要穿过环，不能死循环。
        const selected = selectPlanEntries(
            plan,
            'src/com/demo/alpha',
        );
        deepEqual(
            selected.map((entry) => entry.project),
            plan.map((entry) => entry.project),
        );
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});

test('selectPlanEntries 按项目名或 relDir 取目标及其传递库依赖', () => {
    const root = mkdtempSync(join(tmpdir(), 'ws-plan-'));
    try {
        makeLibrary(
            root,
            'src/.Libs/base-lib',
            '@webscripts/base-lib',
        );
        makeLibrary(
            root,
            'src/.Libs/extra-lib',
            '@webscripts/extra-lib',
        );
        makeLibrary(
            root,
            'src/.Libs/mid-lib',
            '@webscripts/mid-lib',
            {
                '@webscripts/base-lib': 'workspace:*',
            },
        );
        makeScript(root, 'src/com/demo/alpha', {
            name: '@webscripts/alpha',
            scriptVersion: '1.0.0',
            archived: '0.9.0',
            dependencies: { '@webscripts/mid-lib': 'workspace:*' },
        });
        makeScript(root, 'src/com/demo/beta', {
            name: '@webscripts/beta',
            scriptVersion: '1.0.0',
            archived: '0.9.0',
            dependencies: { '@webscripts/extra-lib': 'workspace:*' },
        });

        const plan = createBuildPlan(discoverPackages(root));

        deepEqual(
            selectPlanEntries(plan, 'src/com/demo/alpha').map(
                (entry) => entry.project,
            ),
            [
                'src/.Libs/base-lib',
                'src/.Libs/mid-lib',
                'src/com/demo/alpha',
            ],
        );
        deepEqual(
            selectPlanEntries(plan, '@webscripts/alpha').map(
                (entry) => entry.project,
            ),
            [
                'src/.Libs/base-lib',
                'src/.Libs/mid-lib',
                'src/com/demo/alpha',
            ],
        );
        deepEqual(
            selectPlanEntries(plan, 'src/com/demo/missing'),
            [],
        );
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});

test('selectPlanEntries 选中库时保留库依赖并强制构建', () => {
    const root = mkdtempSync(join(tmpdir(), 'ws-plan-'));
    try {
        makeLibrary(
            root,
            'src/.Libs/base-lib',
            '@webscripts/base-lib',
        );
        makeLibrary(
            root,
            'src/.Libs/mid-lib',
            '@webscripts/mid-lib',
            {
                '@webscripts/base-lib': 'workspace:*',
            },
        );
        makeScript(root, 'src/com/demo/alpha', {
            name: '@webscripts/alpha',
            scriptVersion: '1.0.0',
            archived: '1.0.0',
        });

        const plan = createBuildPlan(discoverPackages(root));
        ok(plan.every((entry) => entry.action === 'skip'));

        const selected = selectPlanEntries(plan, 'src/.Libs/mid-lib');

        deepEqual(
            selected.map((entry) => entry.project),
            ['src/.Libs/base-lib', 'src/.Libs/mid-lib'],
        );
        deepEqual(
            selected.map((entry) => entry.action),
            ['build', 'build'],
        );
        ok(selected.every((entry) => entry.library));
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});
