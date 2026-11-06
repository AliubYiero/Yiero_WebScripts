import { runGit } from '../../release/git-tags';
import { parseArgs } from '../args';
import { buildPackage, needsArchiveBuild } from '../build-project';
import { resolveScope } from '../project-context';
import { discoverPackages } from '../workspace';

const parsed = parseArgs(process.argv.slice(2), ['--project']);
const dryRun = parsed.flags.has('--dry-run');
const skipBuild = parsed.flags.has('--no-build');

function fail(message: string): number {
    console.error(`✖ ${message}`);
    return 2;
}

/** 运行期失败（构建中止等）用 1，与用法错误的 2 区分。 */
function abort(message: string): number {
    console.error(`✖ ${message}`);
    return 1;
}

/** 只打印前若干行，避免一次列几十个文件。 */
function previewFiles(files: string[]): string {
    const shown = files.slice(0, 20).map((file) => `  ${file}`);
    if (files.length > shown.length) {
        shown.push(`  …另有 ${files.length - shown.length} 个文件`);
    }
    return shown.join('\n');
}

/** 把输出按行拆成路径列表。 */
function splitLines(stdout: string): string[] {
    return stdout
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
}

/** 解析 `git status --porcelain`：重命名取新路径，带引号的路径去掉引号。 */
function parseStatusLines(stdout: string): string[] {
    return stdout
        .split('\n')
        .map((line) => line.replace(/\r$/, ''))
        .filter((line) => line.length > 3)
        .map((line) => {
            const rest = line.slice(3);
            const arrow = rest.indexOf(' -> ');
            const path =
                arrow === -1
                    ? rest
                    : rest.slice(arrow + ' -> '.length);
            return path.startsWith('"') && path.endsWith('"')
                ? path.slice(1, -1)
                : path;
        });
}

function main(): number {
    const message = parsed.positionals.join(' ').trim();
    if (message === '') {
        return fail(
            '用法：pnpm commit <提交信息> ' +
                '[--project <项目>] [--no-build] [--dry-run]',
        );
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

    if (pkg !== null && !skipBuild && !dryRun) {
        if (pkg.isLibrary) {
            console.log('= 链接库没有归档构建，跳过构建');
        } else if (needsArchiveBuild(pkg)) {
            console.log(
                `=== 构建 ${pkg.relDir}（v${pkg.scriptVersion}）`,
            );
            if (!buildPackage(pkg).ok) {
                return abort(`构建失败，已中止提交：${pkg.relDir}`);
            }
        } else {
            console.log(`= v${pkg.scriptVersion} 已归档，跳过构建`);
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
            return fail(`读取工作区状态失败：${status.stderr}`);
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
        return fail(`暂存失败：${added.stderr}`);
    }

    const staged = runGit(['diff', '--cached', '--name-only']);
    if (!staged.ok) {
        return fail(`读取暂存区失败：${staged.stderr}`);
    }
    const files = splitLines(staged.stdout);

    if (files.length === 0) {
        console.log('= 没有可提交的变更');
        return 0;
    }

    console.log(`暂存 ${files.length} 个文件：`);
    console.log(previewFiles(files));

    const committed = runGit(['commit', '-m', message]);
    if (!committed.ok) {
        return fail(committed.stderr || committed.stdout);
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
