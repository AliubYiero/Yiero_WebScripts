import { discoverPackages } from '../../workspace/workspace';
import {
    createTag,
    deleteLocalTag,
    deleteRemoteTags,
    hasRef,
    listLocalTags,
    listRemoteTags,
    pushTags,
    revOf,
} from '../git-tags';
import {
    createRetagPlan,
    type RetagEntry,
    type RetagPlan,
} from '../tag-plan';

const args = process.argv.slice(2);
const has = (flag: string): boolean => args.includes(flag);

const asJson = has('--json');
const apply = has('--apply');
const push = has('--push');
const deleteLocal = has('--delete-old-local');
const deleteRemote = has('--delete-old-remote');
const confirmed = has('--confirm');
const force = has('--force');

const batchSize = 40;

function requireNext(entry: RetagEntry): string {
    if (entry.next === null) {
        throw new Error(`缺少目标标签名：${entry.old}`);
    }
    return entry.next;
}

function printPlan(plan: RetagPlan): void {
    const { renames, unchanged, applied, errors } = plan;
    console.log(
        `共 ${plan.entries.length} 个标签：` +
            `改 ${renames.length} / ` +
            `不变 ${unchanged.length} / ` +
            `待清理 ${applied.length} / ` +
            `错误 ${errors.length}`,
    );
    if (renames.length > 0) {
        console.log('\n将改名：');
        const width = Math.max(
            ...renames.map((entry) => entry.old.length),
        );
        for (const entry of renames) {
            console.log(
                `  ${entry.old.padEnd(width)}  →  ${requireNext(entry)}`,
            );
        }
    }
    if (unchanged.length > 0) {
        console.log('\n已符合规范：');
        for (const entry of unchanged) {
            console.log(`  ${entry.old}`);
        }
    }
    if (applied.length > 0) {
        console.log('\n新名已就位，还剩旧名：');
        for (const entry of applied) {
            console.log(`  ${entry.old}  →  ${requireNext(entry)}`);
        }
    }
    if (errors.length > 0) {
        console.log('\n无法处理：');
        for (const entry of errors) {
            console.log(`  ${entry.old} — ${entry.reason}`);
        }
    }
}

function printRollback(entries: readonly RetagEntry[]): void {
    if (entries.length === 0) {
        return;
    }
    console.log('\n如需回滚（旧名重建 + 新名删除）：');
    for (const entry of entries) {
        const sha = revOf(entry.old);
        const next = requireNext(entry);
        console.log(`  git tag '${entry.old}' ${sha}`);
        console.log(
            `  git push origin ` +
                `'refs/tags/${entry.old}:refs/tags/${entry.old}'`,
        );
        console.log(`  git tag -d '${next}'`);
        console.log(`  git push origin ':refs/tags/${next}'`);
    }
}

function applyTags(plan: RetagPlan): boolean {
    for (const entry of plan.renames) {
        const sha = revOf(entry.old);
        const next = requireNext(entry);
        if (hasRef(`refs/tags/${next}`)) {
            const current = revOf(next);
            if (current === sha) {
                console.log(`= ${next} 已存在，指向同一 commit`);
                continue;
            }
            if (!force) {
                console.error(
                    `✖ ${next} 已存在且指向 ${current.slice(0, 7)}` +
                        `（应为 ${sha.slice(0, 7)}），加 --force 覆盖`,
                );
                return false;
            }
            deleteLocalTag(next);
        }
        const outcome = createTag(next, sha);
        if (!outcome.ok) {
            console.error(`✖ 创建 ${next} 失败：${outcome.stderr}`);
            return false;
        }
        console.log(`+ ${next} → ${sha.slice(0, 7)}`);
    }
    return true;
}

function verifyRemote(entries: readonly RetagEntry[]): string[] {
    const remote = listRemoteTags();
    const missing: string[] = [];
    for (const entry of entries) {
        const next = requireNext(entry);
        const sha = revOf(entry.old);
        if (!remote.has(next)) {
            missing.push(`${next} — 远程没有`);
        } else if (remote.get(next) !== sha) {
            missing.push(`${next} — 远程指针不一致`);
        }
    }
    return missing;
}

function pushNewTags(plan: RetagPlan): boolean {
    const names = plan.stale.map(requireNext);
    for (let index = 0; index < names.length; index += batchSize) {
        const batch = names.slice(index, index + batchSize);
        const outcome = pushTags(batch);
        if (!outcome.ok) {
            console.error(`✖ 推送失败：${outcome.stderr}`);
            return false;
        }
        console.log(`↑ 已推送 ${batch.length} 个标签`);
    }
    const missing = verifyRemote(plan.stale);
    if (missing.length > 0) {
        console.error('✖ 推送后校验未通过：');
        for (const line of missing) {
            console.error(`  ${line}`);
        }
        return false;
    }
    console.log(`✔ 远程已确认 ${plan.stale.length} 个新标签`);
    return true;
}

function deleteOldTags(
    plan: RetagPlan,
    removeRemote: boolean,
    removeLocal: boolean,
): boolean {
    if (!confirmed) {
        console.error('✖ 删除旧标签必须显式加 --confirm');
        return false;
    }
    const remote = listRemoteTags();
    const unsafe: string[] = [];
    for (const entry of plan.stale) {
        const next = requireNext(entry);
        const sha = revOf(entry.old);
        if (!remote.has(next)) {
            unsafe.push(`${next} — 远程没有`);
        } else if (remote.get(next) !== sha) {
            unsafe.push(`${next} — 远程指针不一致`);
        }
    }
    if (unsafe.length > 0) {
        console.error('✖ 新标签尚未全部在远程就位，拒绝删除旧标签：');
        for (const line of unsafe) {
            console.error(`  ${line}`);
        }
        return false;
    }

    const localOlds = plan.stale.map((entry) => entry.old);
    // 只删远程真的存在的旧名，避免 push 报 ref 不存在。
    const remoteOlds = localOlds.filter((old) => remote.has(old));
    console.log(
        `\n将删除旧标签：远程 ${removeRemote ? remoteOlds.length : 0} 个 / ` +
            `本地 ${removeLocal ? localOlds.length : 0} 个`,
    );
    printRollback(plan.stale);

    if (removeRemote) {
        for (
            let index = 0;
            index < remoteOlds.length;
            index += batchSize
        ) {
            const batch = remoteOlds.slice(index, index + batchSize);
            const outcome = deleteRemoteTags(batch);
            if (!outcome.ok) {
                console.error(
                    `✖ 删除远程标签失败：${outcome.stderr}`,
                );
                return false;
            }
            console.log(`- 已删除 ${batch.length} 个远程标签`);
        }
    }
    if (removeLocal) {
        for (const old of localOlds) {
            const outcome = deleteLocalTag(old);
            if (!outcome.ok) {
                console.error(
                    `✖ 删除本地标签 ${old} 失败：${outcome.stderr}`,
                );
                return false;
            }
        }
        console.log(`- 已删除 ${localOlds.length} 个本地标签`);
    }
    return true;
}

function main(): number {
    const tags = listLocalTags();
    const plan = createRetagPlan(tags, discoverPackages());

    if (asJson) {
        console.log(JSON.stringify(plan, null, 4));
    } else {
        printPlan(plan);
    }

    const wantsAction = apply || push || deleteLocal || deleteRemote;
    if (!wantsAction) {
        return plan.errors.length > 0 ? 2 : 0;
    }
    if (plan.errors.length > 0) {
        console.error('\n✖ 计划里有无法处理的标签，已放弃全部动作。');
        return 2;
    }

    if (apply) {
        console.log('\n== 创建新标签 ==');
        if (!applyTags(plan)) {
            return 1;
        }
    }
    if (push) {
        console.log('\n== 推送新标签 ==');
        if (!pushNewTags(plan)) {
            return 1;
        }
    }
    if (deleteLocal || deleteRemote) {
        console.log('\n== 删除旧标签 ==');
        if (!deleteOldTags(plan, deleteRemote, deleteLocal)) {
            return 2;
        }
    }

    if (push) {
        printRollback(plan.stale);
    }
    console.log('\n✔ 完成');
    return 0;
}

try {
    process.exitCode = main();
} catch (error) {
    console.error(`✖ ${(error as Error).message}`);
    process.exitCode = 1;
}
