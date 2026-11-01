import { equal, ok } from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { test } from 'node:test';
import { repoRoot } from '../workspace';

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

test('--dry-run --project 只返回该项目', () => {
    const project = 'src/com/bilibili/bilibili-video-timeline';
    const { status, stdout } = runTsx([
        join('script', 'workspace', 'cli', 'build.ts'),
        '--dry-run',
        '--project',
        project,
    ]);
    equal(status, 0);

    const plan = JSON.parse(stdout) as { project: string }[];
    equal(plan.length, 1);
    equal(plan[0].project, project);
});

test('--project 指向已归档项目时退出码为 2', () => {
    const { status } = runTsx([
        join('script', 'workspace', 'cli', 'build.ts'),
        '--project',
        'src/com/bilibili/bilibili-video-timeline',
    ]);
    equal(status, 2);
});
