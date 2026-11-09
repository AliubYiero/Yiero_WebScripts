import { runGit } from '../../release/git-tags';
import { parseArgs } from '../args';
import { ensureArchiveBuild } from '../build-project';
import {
    abort,
    fail,
    parseStatusLines,
    previewFiles,
    splitLines,
} from '../cli-common';
import { collectCommitInput, preflightCommit } from '../commit-input';
import { COMMIT_TYPES, formatCommitMessage } from '../commit-message';
import { baseName, resolveScope } from '../project-context';
import { createPrompter, isInteractive } from '../prompt';
import { discoverPackages } from '../workspace';

const parsed = parseArgs(
    process.argv.slice(2),
    ['--project'],
    ['--dry-run'],
);
const dryRun = parsed.flags.has('--dry-run');

const usage =
    '用法：pnpm commit <type> <主题> [--project <项目>] [--dry-run]' +
    `\n类型：${COMMIT_TYPES.join(' / ')}`;

/** 判断暂存路径是否落在项目目录内。 */
function isInside(file: string, relDir: string): boolean {
    return file === relDir || file.startsWith(`${relDir}/`);
}

/** 把路径限定参数接到 git 子命令后面；整仓时保持原样。 */
function scoped(args: string[], relDir: string | null): string[] {
    return relDir === null ? args : [...args, '--', relDir];
}

/** 按范围把文件清单切成「范围内的」与「范围外的」两堆。 */
function splitByScope(
    files: string[],
    relDir: string | null,
): { inside: string[]; outside: string[] } {
    if (relDir === null) {
        return { inside: files, outside: [] };
    }
    return {
        inside: files.filter((file) => isInside(file, relDir)),
        outside: files.filter((file) => !isInside(file, relDir)),
    };
}

async function main(): Promise<number> {
    if (parsed.errors.length > 0) {
        return fail(parsed.errors[0]);
    }

    const interactive = isInteractive(process.stdin);
    // 管道 / CI 里没有终端可问：参数没给全就直接报用法，不要干等 stdin。
    // 给了类型但拼错时仍然报「未知提交类型」，别让用法错误盖住真正的原因。
    if (!interactive) {
        const preflight = preflightCommit(parsed.positionals);
        if (!preflight.ok) {
            return fail(
                preflight.reason === 'bad-type'
                    ? preflight.error
                    : usage,
            );
        }
    }

    const prompter = createPrompter({
        input: process.stdin,
        output: process.stdout,
    });

    try {
        const input = await collectCommitInput(
            prompter,
            parsed.positionals,
        );
        if (!input.ok) {
            return fail(input.error);
        }

        const packages = discoverPackages();
        const scope = resolveScope(
            parsed.values.get('--project') ?? null,
            packages,
        );
        if (scope.error !== undefined) {
            return fail(scope.error);
        }

        const pkg = scope.pkg;
        const relDir = pkg === null ? null : pkg.relDir;
        const label = relDir === null ? '整个仓库' : relDir;
        const message = formatCommitMessage(
            input.type,
            input.subject,
            relDir === null ? null : baseName(relDir),
        );
        console.log(`=== 提交范围：${label}`);
        console.log(`=== 提交信息：${message}`);

        if (pkg !== null && !dryRun) {
            const build = ensureArchiveBuild(pkg, packages);
            if (!build.ok) {
                return abort(`构建失败，已中止提交：${pkg.relDir}`);
            }
        }

        const addArgs = scoped(['add', '-A'], relDir);

        if (dryRun) {
            const statusArgs = scoped(
                ['status', '--porcelain', '-uall'],
                relDir,
            );
            const status = runGit(statusArgs);
            if (!status.ok) {
                return abort(`读取工作区状态失败：${status.stderr}`);
            }
            const files = parseStatusLines(status.stdout);
            if (files.length === 0) {
                console.log('= 没有可提交的变更');
                return 0;
            }
            console.log(`待提交 ${files.length} 个文件：`);
            console.log(previewFiles(files));
            console.log(`[dry-run] git ${addArgs.join(' ')}`);
            console.log(`[dry-run] git commit -m "${message}"`);
            return 0;
        }

        const added = runGit(addArgs);
        if (!added.ok) {
            return abort(`暂存失败：${added.stderr}`);
        }

        const staged = runGit(['diff', '--cached', '--name-only']);
        if (!staged.ok) {
            return abort(`读取暂存区失败：${staged.stderr}`);
        }
        const stagedAll = splitLines(staged.stdout);
        // 暂存区可能有别处预先 `git add` 的内容，提交时会被一起带走；
        // 这里只负责说清楚，不擅自替用户取消暂存。
        const { inside: files, outside } = splitByScope(
            stagedAll,
            relDir,
        );

        if (files.length === 0) {
            console.log('= 没有可提交的变更');
            if (outside.length > 0) {
                console.warn(
                    '⚠ 暂存区里还有本次范围之外的改动，未提交：\n' +
                        previewFiles(outside),
                );
            }
            return 0;
        }

        console.log(`暂存 ${files.length} 个文件：`);
        console.log(previewFiles(files));
        if (outside.length > 0) {
            console.warn(
                '⚠ 暂存区里还有本次范围之外的改动，会一并提交：\n' +
                    previewFiles(outside),
            );
        }

        const committed = runGit(['commit', '-m', message]);
        if (!committed.ok) {
            return abort(committed.stderr || committed.stdout);
        }
        if (committed.stdout !== '') {
            console.log(committed.stdout);
        }
        if (committed.stderr !== '') {
            console.warn(committed.stderr);
        }
        return 0;
    } finally {
        prompter.close();
    }
}

main()
    .then((code) => {
        process.exitCode = code;
    })
    .catch((error: unknown) => {
        console.error(`✖ ${(error as Error).message}`);
        process.exitCode = 1;
    });
