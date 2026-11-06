import {
    discoverPackages,
    type PackageInfo,
} from '../../workspace/workspace';
import { parseArgs } from '../../workspace/args';
import {
    buildPackage,
    needsArchiveBuild,
} from '../../workspace/build-project';
import {
    lookupProject,
    projectFromInitCwd,
} from '../../workspace/project-context';
import {
    commitsAhead,
    createTag,
    hasRef,
    listRemoteTags,
    pathExistsAtCommit,
    pushTags,
    revOf,
    runGit,
} from '../git-tags';
import { formatTag, isValidTagName, toTagPrefix } from '../tag-name';

const parsed = parseArgs(process.argv.slice(2), [
    '--commit',
    '--project',
]);
const dryRun = parsed.flags.has('--dry-run');
const shouldPush = parsed.flags.has('--push');
const force = parsed.flags.has('--force');
const skipBuild = parsed.flags.has('--no-build');
const commitArg = parsed.values.get('--commit') ?? null;
const projectSpec = parsed.values.get('--project') ?? null;
const targets = parsed.positionals;

function fail(message: string): number {
    console.error(`✖ ${message}`);
    return 2;
}

/** 运行期失败（构建中止等）用 1，与用法错误的 2 区分。 */
function abort(message: string): number {
    console.error(`✖ ${message}`);
    return 1;
}

const usage =
    'pnpm release:tag <项目> [--commit <rev>] [--push] ' +
    '[--dry-run] [--force] [--no-build]';

/**
 * 项目来源：`--project` > 子仓库委托（INIT_CWD）> 位置参数。
 * 子仓库里调用时会拒绝再传项目参数，避免指错目标。
 */
function resolveTargetPackage(
    packages: readonly PackageInfo[],
): PackageInfo | number {
    if (projectSpec !== null) {
        if (targets.length > 0) {
            return fail('--project 与项目参数只能二选一');
        }
        const found = lookupProject(projectSpec, packages);
        if (found.pkg === null) {
            return fail(found.error ?? `找不到项目：${projectSpec}`);
        }
        return found.pkg;
    }

    const fromCwd = projectFromInitCwd(packages);
    if (fromCwd !== null) {
        if (targets.length > 0) {
            return fail(
                `已从项目目录调用（${fromCwd.relDir}），` +
                    '不要再传项目参数',
            );
        }
        return fromCwd;
    }

    if (targets.length === 0) {
        return fail(`用法：${usage}`);
    }
    if (targets.length > 1) {
        return fail(`只接受一个项目，收到：${targets.join(' ')}`);
    }
    const found = lookupProject(targets[0], packages);
    if (found.pkg === null) {
        return fail(found.error ?? `找不到项目：${targets[0]}`);
    }
    return found.pkg;
}

function main(): number {
    const packages = discoverPackages();
    const resolved = resolveTargetPackage(packages);
    if (typeof resolved === 'number') {
        return resolved;
    }
    const pkg = resolved;

    const version = pkg.isLibrary ? pkg.version : pkg.scriptVersion;
    if (version === null) {
        return fail(`${pkg.relDir} 没有可用版本号`);
    }

    // 版本号只认 banner 的 @version；先归档再打标签，保证标签对应
    // 的 commit 里已经包含这一版产物。
    if (!skipBuild && !dryRun) {
        if (pkg.isLibrary) {
            console.log('= 链接库没有归档构建，跳过构建');
        } else if (needsArchiveBuild(pkg)) {
            console.log(`=== 构建 ${pkg.relDir}（v${version}）`);
            if (!buildPackage(pkg).ok) {
                return abort(`构建失败，已中止打标签：${pkg.relDir}`);
            }
        } else {
            console.log(`= v${version} 已归档，跳过构建`);
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
                    `加 --force 覆盖`,
            );
        }
    }

    // 告警不阻断：写错版本号或未推送的 commit 仍由人决定。
    if (!pkg.isLibrary && pkg.archived === false && !dryRun) {
        console.warn(
            `⚠ v${version} 还没有备份归档（${pkg.relDir}/backup）`,
        );
    }
    const dirty = runGit(['status', '--porcelain', '--', pkg.relDir]);
    if (dirty.ok && dirty.stdout !== '') {
        console.warn(
            `⚠ ${pkg.relDir} 有未提交的改动，` +
                '标签会指向不含这些改动的 commit',
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
        return fail(`创建标签失败：${created.stderr}`);
    }
    console.log(`+ ${tag} → ${sha.slice(0, 7)}`);

    if (!shouldPush) {
        console.log(
            `\n推送：git push origin ` +
                `'refs/tags/${tag}:refs/tags/${tag}'`,
        );
        return 0;
    }

    const pushed = pushTags([tag]);
    if (!pushed.ok) {
        return fail(`推送失败：${pushed.stderr}`);
    }
    const remote = listRemoteTags();
    if (remote.get(tag) !== sha) {
        return fail('推送后校验失败：远程指针与本地不一致');
    }
    console.log(`✔ 已推送到 origin`);
    return 0;
}

try {
    process.exitCode = main();
} catch (error) {
    console.error(`✖ ${(error as Error).message}`);
    process.exitCode = 1;
}
