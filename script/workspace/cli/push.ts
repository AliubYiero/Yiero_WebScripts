import {
    listLocalTags,
    listRemoteTags,
    pushTags,
    revOf,
    runGit,
} from '../../release/git-tags';
import { toTagPrefix } from '../../release/tag-name';
import { parseArgs } from '../args';
import { resolveScope } from '../project-context';
import { discoverPackages } from '../workspace';

const parsed = parseArgs(process.argv.slice(2), ['--project']);
const dryRun = parsed.flags.has('--dry-run');

function fail(message: string): number {
    console.error(`✖ ${message}`);
    return 1;
}

function main(): number {
    const packages = discoverPackages();
    const scope = resolveScope(
        parsed.values.get('--project') ?? null,
        packages,
    );
    if (scope.error !== undefined) {
        return fail(scope.error);
    }

    const pkg = scope.pkg;
    const prefix = pkg === null ? null : toTagPrefix(pkg.relDir);
    console.log(
        `=== 推送范围：${prefix === null ? '整个仓库' : `${prefix}（项目 + 该前缀下的标签）`}`,
    );

    const branch = runGit(['rev-parse', '--abbrev-ref', 'HEAD']);
    if (!branch.ok) {
        return fail(`读取当前分支失败：${branch.stderr}`);
    }

    if (dryRun) {
        console.log(
            `[dry-run] git push origin HEAD（${branch.stdout}）`,
        );
    } else {
        const pushedBranch = runGit(['push', 'origin', 'HEAD']);
        if (!pushedBranch.ok) {
            return fail(`推送分支失败：${pushedBranch.stderr}`);
        }
        console.log(`✔ 已推送分支：${branch.stdout}`);
    }

    const allTags = listLocalTags();
    const tags =
        prefix === null
            ? allTags
            : allTags.filter((tag) => tag.startsWith(`${prefix}/`));

    if (tags.length === 0) {
        console.log(
            prefix === null
                ? '= 没有标签可推送'
                : `= ${prefix} 下没有标签`,
        );
        return 0;
    }

    if (dryRun) {
        console.log(`[dry-run] 将推送 ${tags.length} 个标签：`);
        for (const tag of tags) {
            console.log(`  ${tag}`);
        }
        return 0;
    }

    const pushedTags = pushTags(tags);
    if (!pushedTags.ok) {
        return fail(`推送标签失败：${pushedTags.stderr}`);
    }

    // 推送命令成功不代表每条 ref 都到位，逐条比对远程指针。
    const remote = listRemoteTags();
    const mismatched = tags.filter((tag) => {
        try {
            return remote.get(tag) !== revOf(tag);
        } catch {
            return true;
        }
    });
    if (mismatched.length > 0) {
        return fail(
            `推送后校验失败，远程指针与本地不一致：\n  ${mismatched.join('\n  ')}`,
        );
    }

    console.log(`✔ 已推送 ${tags.length} 个标签`);
    return 0;
}

try {
    process.exitCode = main();
} catch (error) {
    console.error(`✖ ${(error as Error).message}`);
    process.exitCode = 1;
}
