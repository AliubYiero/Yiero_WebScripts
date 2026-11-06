import { equal, match } from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
    mkdirSync,
    mkdtempSync,
    rmSync,
    writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { repoRoot } from '../workspace';

interface RunResult {
    status: number | null;
    stdout: string;
    stderr: string;
}

function runCheckLibs(args: string[]): RunResult {
    const result = spawnSync(
        process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm',
        [
            'exec',
            'tsx',
            join('script', 'workspace', 'cli', 'check-libs.ts'),
            ...args,
        ],
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

interface DemoManifest {
    name: string;
    version: string;
    scripts?: Record<string, string>;
}

function makeLibrary(
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

function withTempRoot(run: (root: string) => void): void {
    const root = mkdtempSync(join(tmpdir(), 'ws-gate-'));
    try {
        run(root);
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
}

test('没有链接库时门禁以 0 退出并说明', () => {
    withTempRoot((root) => {
        for (const mode of ['typecheck', 'test']) {
            const result = runCheckLibs([mode, '--root', root]);
            equal(result.status, 0);
            match(result.stdout, /没有链接库/);
        }
    });
});

test('缺少或未知子模式时退出码为 2', () => {
    equal(runCheckLibs([]).status, 2);
    equal(runCheckLibs(['lint']).status, 2);
});

test('有库且测试通过时以 0 退出并真的执行了测试', () => {
    withTempRoot((root) => {
        makeLibrary(root, 'src/.Libs/ok', {
            name: '@demo/ok',
            version: '1.0.0',
            scripts: {
                test: 'node -e "console.log(\'LIB-RAN\')"',
            },
        });

        const result = runCheckLibs(['test', '--root', root]);

        equal(result.status, 0);
        match(result.stdout, /src\/\.Libs\/ok/);
        match(result.stdout, /LIB-RAN/);
    });
});

test('库的测试失败时以 1 退出并点名该库', () => {
    withTempRoot((root) => {
        makeLibrary(root, 'src/.Libs/broken', {
            name: '@demo/broken',
            version: '1.0.0',
            scripts: { test: 'node -e "process.exit(1)"' },
        });

        const result = runCheckLibs(['test', '--root', root]);

        equal(result.status, 1);
        match(result.stderr, /src\/\.Libs\/broken/);
    });
});

test('没有 test 脚本的库被跳过并说明，不静默通过', () => {
    withTempRoot((root) => {
        makeLibrary(root, 'src/.Libs/untested', {
            name: '@demo/untested',
            version: '1.0.0',
        });

        const result = runCheckLibs(['test', '--root', root]);

        equal(result.status, 0);
        match(result.stdout, /跳过/);
        match(result.stdout, /src\/\.Libs\/untested/);
    });
});

test('库缺少 tsconfig 时类型检查失败并点名', () => {
    withTempRoot((root) => {
        makeLibrary(root, 'src/.Libs/no-tsconfig', {
            name: '@demo/no-tsconfig',
            version: '1.0.0',
        });

        const result = runCheckLibs(['typecheck', '--root', root]);

        equal(result.status, 1);
        match(result.stderr, /src\/\.Libs\/no-tsconfig/);
        match(result.stderr, /无法类型检查/);
    });
});

test('库没有自己的 TypeScript 时报错而不是静默通过', () => {
    withTempRoot((root) => {
        makeLibrary(root, 'src/.Libs/no-ts', {
            name: '@demo/no-ts',
            version: '1.0.0',
        });
        writeFileSync(
            join(root, 'src/.Libs/no-ts/tsconfig.json'),
            JSON.stringify({ include: ['src'] }),
            'utf8',
        );

        const result = runCheckLibs(['typecheck', '--root', root]);

        equal(result.status, 1);
        match(result.stderr, /src\/\.Libs\/no-ts/);
        match(result.stderr, /无法类型检查/);
    });
});

test('真实仓库里的链接库能通过类型检查', () => {
    const result = runCheckLibs(['typecheck']);
    equal(result.status, 0);
    match(result.stdout, /@yiero\/bilibili-api-lib/);
});
