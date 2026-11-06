import { equal, ok } from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { test } from 'node:test';
import { repoRoot } from '../paths';

function runLaunch(args: string[]): {
    status: number | null;
    stdout: string;
    stderr: string;
} {
    const result = spawnSync(
        process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm',
        [
            'exec',
            'tsx',
            join('script', 'browser', 'cli.ts'),
            'launch',
            ...args,
        ],
        {
            cwd: repoRoot,
            encoding: 'utf8',
            shell: process.platform === 'win32',
            env: {
                ...process.env,
                // 指向一个不存在的可执行文件：参数解析通过后会以
                // 「没找到浏览器」失败（退出码 1），不会真的起浏览器。
                WEBSCRIPTS_BROWSER_CHANNEL: join(
                    repoRoot,
                    'no-such-browser.exe',
                ),
            },
        },
    );
    return {
        status: result.status,
        stdout: result.stdout ?? '',
        stderr: result.stderr ?? '',
    };
}

test('launch 认识 --url，不再报未知参数', () => {
    const { status, stderr } = runLaunch([
        '--url',
        'https://example.com',
    ]);

    // 2 是参数错误；走到「没找到浏览器」说明 --url 已被接受。
    equal(status, 1);
    ok(!stderr.includes('未知参数'), stderr);
    ok(stderr.includes('没有找到浏览器可执行文件'), stderr);
});

test('launch --url 缺少取值时仍是参数错误', () => {
    const { status, stderr } = runLaunch(['--url']);
    equal(status, 2);
    ok(stderr.includes('缺少取值'), stderr);
});
