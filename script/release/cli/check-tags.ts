import { discoverPackages } from '../../workspace/workspace';
import { splitLegacy, validateTags } from '../check-tags';
import { listLocalTags, listRemoteTags, revOf } from '../git-tags';

const args = process.argv.slice(2);
const json = args.includes('--json');
const allowLegacy = args.includes('--allow-legacy');
const checkRemote = args.includes('--remote');

function formatViolation(
    tag: string,
    rule: string,
    message: string,
    next: string | null,
): string {
    const head = `  [${rule}] ${tag}`;
    return next === null
        ? `${head} — ${message}`
        : `${head} — ${message}\n        应改为：${next}`;
}

function collectRemoteIssues(localTags: string[]): string[] {
    const remote = listRemoteTags();
    const local = new Set(localTags);
    const issues: string[] = [];
    for (const tag of localTags) {
        if (!remote.has(tag)) {
            issues.push(`  [远程] ${tag} — 本地有、远程没有`);
            continue;
        }
        if (remote.get(tag) !== revOf(tag)) {
            issues.push(`  [远程] ${tag} — 远程指针与本地不一致`);
        }
    }
    for (const tag of remote.keys()) {
        if (!local.has(tag)) {
            issues.push(`  [远程] ${tag} — 远程有、本地没有`);
        }
    }
    return issues;
}

function main(): number {
    const tags = listLocalTags();
    const packages = discoverPackages();
    const violations = validateTags(tags, packages);
    const split = splitLegacy(violations);
    const blocking = allowLegacy ? split.blocking : violations;
    const warnings = allowLegacy ? split.legacy : [];
    const remoteIssues = checkRemote ? collectRemoteIssues(tags) : [];
    const failed = blocking.length > 0 || remoteIssues.length > 0;

    if (json) {
        console.log(
            JSON.stringify(
                {
                    total: tags.length,
                    blocking,
                    warnings,
                    remoteIssues,
                },
                null,
                4,
            ),
        );
        return failed ? 1 : 0;
    }

    for (const violation of warnings) {
        const hint =
            violation.next === null
                ? ''
                : `，应改为 ${violation.next}`;
        console.log(
            `⚠ ${violation.tag} 是旧格式（迁移过渡期放行）${hint}`,
        );
    }

    if (blocking.length > 0) {
        console.log(
            `\n✖ ${blocking.length} 个标签不符合「域/子域/项目/v版本」`,
        );
        for (const violation of blocking) {
            console.log(
                formatViolation(
                    violation.tag,
                    violation.rule,
                    violation.message,
                    violation.next,
                ),
            );
        }
        console.log(
            '\n运行 pnpm release:retag 查看迁移计划，' +
                '再加 --apply 生成新标签。',
        );
    }

    if (remoteIssues.length > 0) {
        console.log('\n✖ 远程与本地不一致');
        for (const issue of remoteIssues) {
            console.log(issue);
        }
    }

    if (!failed) {
        const extra =
            warnings.length > 0
                ? `（另有 ${warnings.length} 个旧格式待迁移）`
                : '';
        console.log(`✔ ${tags.length} 个标签全部符合规范${extra}`);
    }
    return failed ? 1 : 0;
}

try {
    process.exitCode = main();
} catch (error) {
    console.error(`✖ ${(error as Error).message}`);
    process.exitCode = 1;
}
