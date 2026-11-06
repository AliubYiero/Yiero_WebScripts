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
import { resolveScope } from '../project-context';
import { discoverPackages } from '../workspace';

const parsed = parseArgs(
    process.argv.slice(2),
    ['--project'],
    ['--dry-run'],
);
const dryRun = parsed.flags.has('--dry-run');

const usage =
    '用法：pnpm commit <提交信息> [--project <项目>] [--dry-run]';

/** 判断暂存路径是否落在项目目录内。 */
function isInside(file: string, relDir: string): boolean {
    return file === relDir || file.startsWith(`${relDir}/`);
}

function main(): number {
    if (parsed.errors.length > 0) {
        return fail(parsed.errors[0]);
    }

    const message = parsed.positionals.join(' ').trim();
    if (message === '') {
        return fail(usage);
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
    const label = pkg === null ? '整个仓库' : pkg.relDir;
    console.log(`=== 提交范围：${label}`);

    if (pkg !== null && !dryRun) {
        const build = ensureArchiveBuild(pkg);
        if (!build.ok) {
            return abort(`构建失败，已中止提交：${pkg.relDir}`);
        }
    }

    const addArgs =
        pkg === null
            ? ['add', '-A']
            : ['add', '-A', '--', pkg.relDir];

    if (dryRun) {
        const statusArgs =
            pkg === null
                ? ['status', '--porcelain', '-uall']
                : [
                      'status',
                      '--porcelain',
                      '-uall',
                      '--',
                      pkg.relDir,
                  ];
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
    const files =
        pkg === null
            ? stagedAll
            : stagedAll.filter((file) => isInside(file, pkg.relDir));
    // 暂存区可能有别处预先 `git add` 的内容，提交时会被一起带走；
    // 这里只负责说清楚，不擅自替用户取消暂存。
    const outside =
        pkg === null
            ? []
            : stagedAll.filter((file) => !isInside(file, pkg.relDir));

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
}

try {
    process.exitCode = main();
} catch (error) {
    console.error(`✖ ${(error as Error).message}`);
    process.exitCode = 1;
}
