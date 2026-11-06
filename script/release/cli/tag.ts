import {
    discoverPackages,
    type PackageInfo,
} from '../../workspace/workspace';
import {
    commitsAhead,
    createTag,
    hasRef,
    listRemoteTags,
    pathExistsAtCommit,
    pushTags,
    revOf,
} from '../git-tags';
import { formatTag, isValidTagName, toTagPrefix } from '../tag-name';

const args = process.argv.slice(2);

function takeFlagValue(flag: string): string | null {
    const index = args.indexOf(flag);
    if (index === -1) {
        return null;
    }
    const value = args[index + 1];
    if (value === undefined || value.startsWith('--')) {
        return null;
    }
    return value;
}

function positionalArgs(): string[] {
    const consumed = new Set<number>();
    for (const flag of ['--commit']) {
        const index = args.indexOf(flag);
        if (index !== -1) {
            consumed.add(index);
            consumed.add(index + 1);
        }
    }
    return args.filter(
        (arg, index) => !arg.startsWith('--') && !consumed.has(index),
    );
}

const has = (flag: string): boolean => args.includes(flag);
const dryRun = has('--dry-run');
const shouldPush = has('--push');
const force = has('--force');
const commitArg = takeFlagValue('--commit');
const targets = positionalArgs();

function basename(relDir: string): string {
    const index = relDir.lastIndexOf('/');
    return index === -1 ? relDir : relDir.slice(index + 1);
}

function resolveProjects(
    target: string,
    packages: readonly PackageInfo[],
): PackageInfo[] {
    const normalized = target
        .replaceAll('\\', '/')
        .replace(/\/+$/, '')
        .replace(/^\.\//, '');
    return packages.filter((pkg) => {
        const relDir = pkg.relDir;
        if (normalized === relDir || normalized === pkg.name) {
            return true;
        }
        if (normalized === basename(relDir)) {
            return true;
        }
        return normalized === relDir.replace(/^src\//, '');
    });
}

function fail(message: string): number {
    console.error(`✖ ${message}`);
    return 2;
}

function main(): number {
    if (targets.length === 0) {
        return fail(
            '用法：pnpm release:tag <项目> ' +
                '[--commit <rev>] [--push] [--dry-run] [--force]',
        );
    }
    if (targets.length > 1) {
        return fail(`只接受一个项目，收到：${targets.join(' ')}`);
    }

    const packages = discoverPackages();
    const matches = resolveProjects(targets[0], packages);
    if (matches.length === 0) {
        return fail(`找不到项目：${targets[0]}`);
    }
    if (matches.length > 1) {
        const list = matches
            .map((pkg) => `  ${pkg.relDir}`)
            .join('\n');
        return fail(`项目名不唯一，请用完整路径：\n${list}`);
    }

    const pkg = matches[0];
    const version = pkg.isLibrary ? pkg.version : pkg.scriptVersion;
    if (version === null) {
        return fail(`${pkg.relDir} 没有可用版本号`);
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
    if (!pkg.isLibrary && pkg.archived === false) {
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
