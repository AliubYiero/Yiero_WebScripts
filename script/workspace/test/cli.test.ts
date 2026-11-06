import { equal, ok } from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { discoverPackages, repoRoot } from '../workspace';

function runTsx(args: string[]): {
    status: number | null;
    stdout: string;
    stderr: string;
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
    return {
        status: result.status,
        stdout: result.stdout ?? '',
        stderr: result.stderr ?? '',
    };
}

/**
 * 建一个用完即删的探针项目。
 *
 * 探针必须落在 workspace 扫描范围（`src/<域>/<子域>/<项目>`）里，
 * 所以清理不能只靠 finally：进程被中断时也得把目录收掉，
 * 否则 `src/` 下会留下一个幽灵项目。每个探针独占一个根目录，
 * 避免两个用例互相删对方。
 */
function withProbe(
    name: string,
    setup: (probe: string) => void,
    run: (relDir: string) => void,
): void {
    const probeRoot = join(repoRoot, 'src/com', `zz-probe-${name}`);
    const probe = join(probeRoot, 'probe');
    const relDir = `src/com/zz-probe-${name}/probe`;
    const cleanup = () =>
        rmSync(probeRoot, { recursive: true, force: true });

    process.once('exit', cleanup);
    const onSignal = () => {
        cleanup();
        process.exit(130);
    };
    process.once('SIGINT', onSignal);
    process.once('SIGTERM', onSignal);

    try {
        cleanup();
        setup(probe);
        run(relDir);
    } finally {
        cleanup();
        process.off('exit', cleanup);
        process.off('SIGINT', onSignal);
        process.off('SIGTERM', onSignal);
    }
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

test('new:script 拒绝库域并给出专属提示', () => {
    for (const spec of ['.Libs/gmlib', 'src/.Libs/gmlib']) {
        const { status, stderr } = runTsx([
            join('script', 'workspace', 'cli', 'new-script.ts'),
            spec,
        ]);

        equal(status, 2, spec);
        ok(
            stderr.includes('库域不能放脚本项目：src/.Libs/gmlib'),
            stderr,
        );
        ok(stderr.includes('src/.Libs/<库名>/'), stderr);
    }
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

test('--project 例外项目时说明只有 --all 会构建它', () => {
    withProbe(
        'exception',
        (probe) => {
            mkdirSync(join(probe, 'banner'), { recursive: true });
            writeFileSync(
                join(probe, 'package.json'),
                JSON.stringify({
                    name: '@webscripts/probe',
                    version: '0.0.0',
                    scripts: { build: 'node -e ""' },
                }),
                'utf8',
            );
            // 有脚本版本、但没有 backup/：属于例外项目。
            writeFileSync(
                join(probe, 'banner/UserScript.ts'),
                "const UserScript = [['version', '1.0.0']];\n\nexport { UserScript };\n",
                'utf8',
            );
        },
        (relDir) => {
            const { status, stderr } = runTsx([
                join('script', 'workspace', 'cli', 'build.ts'),
                '--project',
                relDir,
            ]);

            equal(status, 2);
            ok(stderr.includes('例外项目'), stderr);
            ok(stderr.includes('--all'), stderr);
        },
    );
});

test('目标脚本被跳过时不因库依赖要构建而假装成功', () => {
    withProbe(
        'pending',
        (probe) => {
            mkdirSync(join(probe, 'banner'), {
                recursive: true,
            });
            mkdirSync(join(probe, 'backup'), {
                recursive: true,
            });
            writeFileSync(
                join(probe, 'package.json'),
                JSON.stringify({
                    name: '@webscripts/probe',
                    version: '0.0.0',
                    scripts: { build: 'node -e ""' },
                    dependencies: {
                        '@yiero/gmlib': 'workspace:*',
                    },
                }),
                'utf8',
            );
            // 未归档的版本：让 gmlib 在全局计划里被判成 build。
            writeFileSync(
                join(probe, 'banner/UserScript.ts'),
                "const UserScript = [['version', '99.0.0']];\n\nexport { UserScript };\n",
                'utf8',
            );
            writeFileSync(
                join(probe, 'backup/versions.json'),
                JSON.stringify({ '0.0.1': 'baseline.js' }),
                'utf8',
            );
        },
        () => {
            const { status, stdout, stderr } = runTsx([
                join('script', 'workspace', 'cli', 'build.ts'),
                '--project',
                'src/com/bilibili/bilibili-video-timeline',
            ]);

            // 目标是已归档脚本：不能因为 gmlib 要构建就 exit 0。
            equal(status, 2);
            ok(stderr.includes('已归档'), stderr);
            ok(
                !stdout.includes('=== [链接库] src/.Libs/gmlib'),
                stdout,
            );
        },
    );
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
