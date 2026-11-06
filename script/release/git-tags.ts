import { spawnSync } from 'node:child_process';
import {
    closeSync,
    mkdtempSync,
    openSync,
    readFileSync,
    rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { repoRoot } from '../workspace/workspace';

export interface GitOutcome {
    ok: boolean;
    stdout: string;
    stderr: string;
}

/**
 * 用临时文件而非管道接 git 的输出。
 *
 * 走管道（`execFileSync` 默认行为）在受限环境下会
 * `spawn EPERM`，文件描述符则到处都能用。
 */
function capture(
    args: readonly string[],
    cwd: string,
): { status: number | null; stdout: string; stderr: string } {
    const workDir = mkdtempSync(join(tmpdir(), 'git-tags-'));
    const outPath = join(workDir, 'stdout.txt');
    const errPath = join(workDir, 'stderr.txt');
    const outFd = openSync(outPath, 'w');
    const errFd = openSync(errPath, 'w');
    try {
        const result = spawnSync('git', [...args], {
            cwd,
            stdio: ['ignore', outFd, errFd],
        });
        closeSync(outFd);
        closeSync(errFd);
        return {
            status: result.status,
            stdout: readFileSync(outPath, 'utf8').trim(),
            stderr: readFileSync(errPath, 'utf8').trim(),
        };
    } finally {
        try {
            closeSync(outFd);
        } catch {
            // 已关闭
        }
        try {
            closeSync(errFd);
        } catch {
            // 已关闭
        }
        rmSync(workDir, { recursive: true, force: true });
    }
}

/** 直调 git，不经 shell，避免引号与转义问题。 */
export function runGit(
    args: readonly string[],
    cwd: string = repoRoot,
): GitOutcome {
    try {
        const result = capture(args, cwd);
        return {
            ok: result.status === 0,
            stdout: result.stdout,
            stderr: result.stderr,
        };
    } catch (error) {
        return {
            ok: false,
            stdout: '',
            stderr: (error as Error).message,
        };
    }
}

function requireGit(args: readonly string[], label: string): string {
    const outcome = runGit(args);
    if (!outcome.ok) {
        throw new Error(`${label}失败：${outcome.stderr}`);
    }
    return outcome.stdout;
}

export function listLocalTags(): string[] {
    const output = requireGit(['tag', '--list'], '读取本地标签');
    return output
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
}

/** 远程标签名 -> commit。 */
export function listRemoteTags(
    remote = 'origin',
): Map<string, string> {
    const output = requireGit(
        ['ls-remote', '--tags', '--refs', remote],
        '读取远程标签',
    );
    const tags = new Map<string, string>();
    for (const line of output.split('\n')) {
        const [sha, ref] = line.split('\t');
        if (sha === undefined || ref === undefined) {
            continue;
        }
        if (!ref.startsWith('refs/tags/')) {
            continue;
        }
        tags.set(ref.slice('refs/tags/'.length), sha);
    }
    return tags;
}

export function revOf(rev: string): string {
    return requireGit(
        ['rev-list', '-n', '1', rev],
        `解析 ${rev} 的 commit`,
    );
}

/** 轻量标签：迁移只改名字，不伪造 tagger。 */
export function createTag(name: string, commit: string): GitOutcome {
    return runGit(['tag', name, commit]);
}

export function deleteLocalTag(name: string): GitOutcome {
    return runGit(['tag', '-d', name]);
}

export function pushTags(names: readonly string[]): GitOutcome {
    const refspecs = names.map(
        (name) => `refs/tags/${name}:refs/tags/${name}`,
    );
    return runGit(['push', 'origin', ...refspecs]);
}

export function deleteRemoteTags(
    names: readonly string[],
): GitOutcome {
    const refspecs = names.map((name) => `:refs/tags/${name}`);
    return runGit(['push', 'origin', ...refspecs]);
}

export function pathExistsAtCommit(
    rev: string,
    path: string,
): boolean {
    return runGit(['cat-file', '-e', `${rev}:${path}`]).ok;
}

export function commitsAhead(base: string): number | null {
    const outcome = runGit(['rev-list', '--count', `${base}..HEAD`]);
    if (!outcome.ok) {
        return null;
    }
    const count = Number.parseInt(outcome.stdout, 10);
    return Number.isNaN(count) ? null : count;
}

export function hasRef(rev: string): boolean {
    return runGit(['rev-parse', '--verify', '--quiet', rev]).ok;
}
