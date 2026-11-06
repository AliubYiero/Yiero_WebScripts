import {
    formatTag,
    matchKeys,
    parseTag,
    toTagPrefix,
} from './tag-name';

export type RetagStatus =
    | 'rename'
    | 'unchanged'
    | 'applied'
    | 'error';

export interface RetagEntry {
    /** 现有标签名 */
    old: string;
    /** 解析出的项目目录；解析失败为 null */
    relDir: string | null;
    version: string | null;
    /** 迁移后的标签名；解析失败为 null */
    next: string | null;
    status: RetagStatus;
    /** 非 rename 的原因；正常为 null */
    reason: string | null;
}

export interface RetagPlan {
    entries: RetagEntry[];
    /** 旧名要改成新名 */
    renames: RetagEntry[];
    /** 已经是规范名 */
    unchanged: RetagEntry[];
    /** 新名已就位，只剩旧名待清理（重跑时的状态） */
    applied: RetagEntry[];
    errors: RetagEntry[];
    /** 需要删除的旧名（renames + applied） */
    stale: RetagEntry[];
}

/** 只需要目录，方便测试里构造最小对象。 */
export interface TagProject {
    relDir: string;
}

export function createRetagPlan(
    tags: readonly string[],
    projects: readonly TagProject[],
): RetagPlan {
    const byKey = new Map<string, string[]>();
    for (const project of projects) {
        for (const key of matchKeys(project.relDir)) {
            const list = byKey.get(key) ?? [];
            if (!list.includes(project.relDir)) {
                list.push(project.relDir);
            }
            byKey.set(key, list);
        }
    }

    const existing = new Set(tags);
    const entries: RetagEntry[] = tags
        .slice()
        .sort()
        .map((tag) => {
            const fail = (reason: string): RetagEntry => ({
                old: tag,
                relDir: null,
                version: null,
                next: null,
                status: 'error',
                reason,
            });

            const parsed = parseTag(tag);
            if (parsed === null) {
                return fail('无法解析成 <路径>/v<版本> 形式');
            }
            const name = parsed.segments[parsed.segments.length - 1];
            const candidates = byKey.get(name) ?? [];
            if (candidates.length === 0) {
                return fail(`找不到项目目录，标签基名：${name}`);
            }
            if (candidates.length > 1) {
                return fail(
                    `标签基名不唯一：${candidates.join('、')}`,
                );
            }
            const relDir = candidates[0];
            const next = formatTag(
                toTagPrefix(relDir),
                parsed.version,
            );
            return {
                old: tag,
                relDir,
                version: parsed.version,
                next,
                status: next === tag ? 'unchanged' : 'rename',
                reason: null,
            };
        });

    // 目标名撞车：多个旧标签映射到同一个新名字，
    // 或者新名字已经被别的现有标签占着。
    // 已经叫这个名字的那个标签本身是对的，不算错；
    // 如果它正好是这个项目的同一个版本，说明迁移跑过了，
    // 旧名只需要清理（applied），不该报冲突。
    const nextUsage = new Map<string, RetagEntry[]>();
    for (const entry of entries) {
        if (entry.next === null) {
            continue;
        }
        const list = nextUsage.get(entry.next) ?? [];
        list.push(entry);
        nextUsage.set(entry.next, list);
    }
    for (const [next, users] of nextUsage) {
        const keeper = users.find(
            (entry) =>
                entry.old === next && entry.status === 'unchanged',
        );
        if (users.length === 1 && keeper === undefined) {
            const only = users[0];
            if (existing.has(next)) {
                only.status = 'error';
                only.reason = `目标标签已被占用：${next}`;
            }
            continue;
        }
        const sameProject = (entry: RetagEntry): boolean =>
            keeper !== undefined &&
            entry.relDir === keeper.relDir &&
            entry.version === keeper.version;
        for (const entry of users) {
            if (entry === keeper) {
                continue;
            }
            if (sameProject(entry)) {
                entry.status = 'applied';
                entry.reason = `新名已存在：${next}`;
                continue;
            }
            entry.status = 'error';
            entry.reason =
                keeper === undefined
                    ? `多个标签映射到同一个名字：${next}`
                    : `与已符合规范的 ${keeper.old} 冲突`;
        }
    }

    const renames = entries.filter(
        (entry) => entry.status === 'rename',
    );
    const applied = entries.filter(
        (entry) => entry.status === 'applied',
    );
    return {
        entries,
        renames,
        unchanged: entries.filter(
            (entry) => entry.status === 'unchanged',
        ),
        applied,
        errors: entries.filter((entry) => entry.status === 'error'),
        stale: [...renames, ...applied],
    };
}
