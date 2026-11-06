import { parseArgs } from '../../workspace/args';
import { ensureArchiveBuild } from '../../workspace/build-project';
import {
    abort,
    fail,
    parseStatusLines,
    previewFiles,
} from '../../workspace/cli-common';
import {
    lookupProject,
    projectFromInitCwd,
} from '../../workspace/project-context';
import {
    discoverPackages,
    type PackageInfo,
} from '../../workspace/workspace';
import {
    commitsAhead,
    createTag,
    hasRef,
    pathExistsAtCommit,
    revOf,
    runGit,
} from '../git-tags';
import { pushTagsAndVerify } from '../push-tags';
import { formatTag, isValidTagName, toTagPrefix } from '../tag-name';

const parsed = parseArgs(
    process.argv.slice(2),
    ['--commit', '--project'],
    ['--dry-run', '--push', '--force'],
);
const dryRun = parsed.flags.has('--dry-run');
const shouldPush = parsed.flags.has('--push');
const force = parsed.flags.has('--force');
const commitArg = parsed.values.get('--commit') ?? null;
const projectSpec = parsed.values.get('--project') ?? null;
const targets = parsed.positionals;

const usage =
    'pnpm release:tag [项目] [--commit <rev>] [--push] ' +
    '[--dry-run] [--force]';

interface TagTarget {
    pkg: PackageInfo;
    /** 来自子仓库目录（`INIT_CWD`）；只有这种调用才自动构建归档。 */
    delegated: boolean;
}

/** 解析结果：要么拿到目标项目，要么带着用法错误的说明。 */
type TargetResolution =
    | { target: TagTarget; error?: undefined }
    | { target?: undefined; error: string };

/**
 * 项目来源：`--project` > 位置参数 > 子仓库委托（`INIT_CWD`）。
 * 位置参数优先于调用目录，保证 `pnpm release:tag <项目>` 在任何
 * 目录下都能指到想指的项目。
 */
function resolveTargetPackage(
    packages: readonly PackageInfo[],
): TargetResolution {
    if (projectSpec !== null) {
        if (targets.length > 0) {
            return { error: '--project 与项目参数只能二选一' };
        }
        const found = lookupProject(projectSpec, packages);
        if (found.pkg === null) {
            return {
                error: found.error ?? `找不到项目：${projectSpec}`,
            };
        }
        return { target: { pkg: found.pkg, delegated: false } };
    }

    if (targets.length > 1) {
        return {
            error: `只接受一个项目，收到：${targets.join(' ')}`,
        };
    }
    if (targets.length === 1) {
        const found = lookupProject(targets[0], packages);
        if (found.pkg === null) {
            return {
                error: found.error ?? `找不到项目：${targets[0]}`,
            };
        }
        return { target: { pkg: found.pkg, delegated: false } };
    }

    const fromCwd = projectFromInitCwd(packages);
    if (fromCwd === null) {
        return { error: `用法：${usage}` };
    }
    return { target: { pkg: fromCwd, delegated: true } };
}

/** 项目目录下未提交的改动（路径相对仓库根）。 */
function projectDirtyFiles(pkg: PackageInfo): string[] {
    const status = runGit([
        'status',
        '--porcelain',
        '--',
        pkg.relDir,
    ]);
    return status.ok ? parseStatusLines(status.stdout) : [];
}

function main(): number {
    if (parsed.errors.length > 0) {
        return fail(parsed.errors[0]);
    }

    const packages = discoverPackages();
    const resolved = resolveTargetPackage(packages);
    if (resolved.target === undefined) {
        return fail(resolved.error);
    }
    const { pkg, delegated } = resolved.target;

    const version = pkg.isLibrary ? pkg.version : pkg.scriptVersion;
    if (version === null) {
        return fail(`${pkg.relDir} 没有可用版本号`);
    }

    // 版本号只认 banner 的 @version。标签只能指向已有 commit，
    // 所以归档产物必须先由 `pnpm commit` 落进 HEAD，这里只补构建。
    const dirtyBefore = projectDirtyFiles(pkg);
    if (dirtyBefore.length > 0) {
        console.warn(
            `⚠ ${pkg.relDir} 有未提交的改动，` +
                '标签会指向不含这些改动的 commit：\n' +
                previewFiles(dirtyBefore),
        );
    }

    let built = false;
    if (!dryRun && commitArg === null) {
        if (!delegated) {
            console.log(
                '= 根目录调用，跳过构建（进项目目录可用委托命令）',
            );
        } else {
            const build = ensureArchiveBuild(pkg);
            if (!build.ok) {
                return abort(`构建失败，已中止打标签：${pkg.relDir}`);
            }
            built = build.built;
            if (built) {
                const produced = projectDirtyFiles(pkg).filter(
                    (file) => !dirtyBefore.includes(file),
                );
                if (produced.length > 0) {
                    console.warn(
                        '⚠ 构建归档产生了新的改动，尚未提交：\n' +
                            `${previewFiles(produced)}\n` +
                            '  先 pnpm commit 再打标签，' +
                            '否则标签指向的 HEAD 不含这些产物',
                    );
                }
            }
        }
    }

    let tag: string;
    try {
        tag = formatTag(toTagPrefix(pkg.relDir), version);
    } catch (error) {
        return fail((error as Error).message);
    }
    if (!isValidTagName(tag)) {
        return fail(`生成的标签名不合法：${tag}`);
    }

    const commit = commitArg ?? 'HEAD';
    let sha: string;
    try {
        sha = revOf(commit);
    } catch (error) {
        return fail((error as Error).message);
    }
    if (!pathExistsAtCommit(sha, `${pkg.relDir}/package.json`)) {
        return fail(`commit ${sha.slice(0, 7)} 里没有 ${pkg.relDir}`);
    }

    if (hasRef(`refs/tags/${tag}`)) {
        const current = revOf(tag);
        if (current === sha) {
            console.log(`= ${tag} 已存在，指向 ${sha.slice(0, 7)}`);
            return 0;
        }
        if (!force) {
            return fail(
                `${tag} 已存在且指向 ${current.slice(0, 7)}，` +
                    '加 --force 覆盖',
            );
        }
    }

    // 告警不阻断：写错版本号或未推送的 commit 仍由人决定。
    if (
        !pkg.isLibrary &&
        !built &&
        pkg.archived === false &&
        !dryRun
    ) {
        console.warn(
            `⚠ v${version} 还没有备份归档（${pkg.relDir}/backup）`,
        );
    }
    if (commit === 'HEAD') {
        const ahead = commitsAhead('origin/main');
        if (ahead !== null && ahead > 0) {
            console.warn(
                `⚠ 本地领先 origin/main ${ahead} 个提交，` +
                    '推标签会把这些提交一并带上远程',
            );
        }
    }

    if (dryRun) {
        console.log(`[dry-run] ${tag} → ${sha.slice(0, 7)}`);
        return 0;
    }

    if (hasRef(`refs/tags/${tag}`) && force) {
        console.log(`! 覆盖已有标签 ${tag}`);
    }
    const created = createTag(tag, sha);
    if (!created.ok) {
        return abort(`创建标签失败：${created.stderr}`);
    }
    console.log(`+ ${tag} → ${sha.slice(0, 7)}`);

    if (!shouldPush) {
        console.log(
            `\n推送：git push origin ` +
                `'refs/tags/${tag}:refs/tags/${tag}'`,
        );
        return 0;
    }

    const pushed = pushTagsAndVerify([tag]);
    if (!pushed.ok) {
        return abort(pushed.message ?? '推送标签失败');
    }
    console.log('✔ 已推送到 origin');
    return 0;
}

try {
    process.exitCode = main();
} catch (error) {
    console.error(`✖ ${(error as Error).message}`);
    process.exitCode = 1;
}
