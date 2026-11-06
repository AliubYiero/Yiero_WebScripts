import { equal, ok } from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { test } from 'node:test';
import { discoverPackages, repoRoot } from '../workspace';

function runTsx(args: string[]): {
    status: number | null;
    stdout: string;
} {
    const result = spawnSync(
        process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm',
        ['exec', 'tsx', ...args],
        {
            cwd: repoRoot,
            encoding: 'utf8',
            shell: process.platform === 'win32',
        },
    );
    return { status: result.status, stdout: result.stdout ?? '' };
}

test('build --dry-run 输出可解析的 JSON 计划', () => {
    const { status, stdout } = runTsx([
        join('script', 'workspace', 'cli', 'build.ts'),
        '--dry-run',
    ]);
    equal(status, 0);
    const plan = JSON.parse(stdout) as {
        project: string;
        action: string;
    }[];
    ok(Array.isArray(plan));
    ok(plan.length > 0);
    ok(plan.every((entry) => entry.project.startsWith('src/')));
});

test('new:script 参数不合法时退出码为 2', () => {
    const { status } = runTsx([
        join('script', 'workspace', 'cli', 'new-script.ts'),
        'demo',
    ]);
    equal(status, 2);
});

interface PlanEntryJson {
    project: string;
    package: string;
    action: string;
    library: boolean;
}

test('--dry-run --project 返回目标及其链接库依赖', () => {
    const project = 'src/com/bilibili/bilibili-video-timeline';
    const { status, stdout } = runTsx([
        join('script', 'workspace', 'cli', 'build.ts'),
        '--dry-run',
        '--project',
        project,
    ]);
    equal(status, 0);

    const plan = JSON.parse(stdout) as PlanEntryJson[];
    const target = plan.find((entry) => entry.project === project);
    ok(target);
    equal(target.library, false);
    // 库排在脚本之前，目标是最后一条。
    equal(plan.at(-1)?.project, project);
    ok(
        plan.every(
            (entry) => entry.project === project || entry.library,
        ),
    );
});

test('--dry-run --project 支持目录名与包名', () => {
    const project = 'src/com/bilibili/bilibili-video-timeline';
    for (const spec of [
        'bilibili-video-timeline',
        '@webscripts/bilibili-video-timeline',
        'com/bilibili/bilibili-video-timeline',
    ]) {
        const { status, stdout } = runTsx([
            join('script', 'workspace', 'cli', 'build.ts'),
            '--dry-run',
            '--project',
            spec,
        ]);
        equal(status, 0, spec);
        const plan = JSON.parse(stdout) as PlanEntryJson[];
        ok(
            plan.some((entry) => entry.project === project),
            spec,
        );
    }
});

test('--dry-run --project 指向链接库时强制重建', (t) => {
    const library = discoverPackages().find((pkg) => pkg.isLibrary);
    if (library === undefined) {
        t.skip('仓库里还没有链接库');
        return;
    }

    const { status, stdout } = runTsx([
        join('script', 'workspace', 'cli', 'build.ts'),
        '--dry-run',
        '--project',
        library.name,
    ]);
    equal(status, 0);

    const plan = JSON.parse(stdout) as PlanEntryJson[];
    const entry = plan.find(
        (item) => item.project === library.relDir,
    );
    ok(entry);
    equal(entry.library, true);
    equal(entry.action, 'build');
    ok(plan.every((item) => item.library));
});

test('--project 指向已归档项目时退出码为 2', () => {
    const { status } = runTsx([
        join('script', 'workspace', 'cli', 'build.ts'),
        '--project',
        'src/com/bilibili/bilibili-video-timeline',
    ]);
    equal(status, 2);
});

test('--project 找不到项目时退出码为 2', () => {
    const { status } = runTsx([
        join('script', 'workspace', 'cli', 'build.ts'),
        '--dry-run',
        '--project',
        'src/com/demo/not-a-project',
    ]);
    equal(status, 2);
});

test('--project 缺少参数时退出码为 2', () => {
    const { status } = runTsx([
        join('script', 'workspace', 'cli', 'build.ts'),
        '--project',
    ]);
    equal(status, 2);
});
