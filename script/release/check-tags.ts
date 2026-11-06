import type { PackageInfo } from '../workspace/workspace';
import {
    formatTag,
    isLegacyTag,
    isValidTagName,
    matchKeys,
    parseTag,
    toTagPrefix,
} from './tag-name';

export interface TagViolation {
    tag: string;
    /** 规则名：格式 / 未知项目 / 项目名歧义 / 路径 */
    rule: string;
    message: string;
    /** 建议改成什么；给不出建议为 null */
    next: string | null;
}

function indexByKey(
    packages: readonly PackageInfo[],
): Map<string, string[]> {
    const byKey = new Map<string, string[]>();
    for (const pkg of packages) {
        for (const key of matchKeys(pkg.relDir)) {
            const list = byKey.get(key) ?? [];
            if (!list.includes(pkg.relDir)) {
                list.push(pkg.relDir);
            }
            byKey.set(key, list);
        }
    }
    return byKey;
}

/**
 * 校验标签集合是否符合「域/子域/项目/v版本」，
 * 只用纯字符串与包清单，不碰 git。
 */
export function validateTags(
    tags: readonly string[],
    packages: readonly PackageInfo[],
): TagViolation[] {
    const byKey = indexByKey(packages);

    const violations: TagViolation[] = [];
    for (const tag of tags.slice().sort()) {
        if (!isValidTagName(tag)) {
            violations.push({
                tag,
                rule: '格式',
                message: '不是合法的 git ref 名',
                next: null,
            });
            continue;
        }
        const parsed = parseTag(tag);
        if (parsed === null) {
            violations.push({
                tag,
                rule: '格式',
                message: '不是 <路径>/v<版本> 形式',
                next: null,
            });
            continue;
        }
        const name = parsed.segments[parsed.segments.length - 1];
        const candidates = byKey.get(name) ?? [];
        if (candidates.length === 0) {
            // 历史标签把库的旧前缀写成 `_bilibili-api-lib`：项目名
            // 本身对得上，只是路径段错了，改判路径不符并给出建议。
            const stripped = name.startsWith('_')
                ? name.slice(1)
                : null;
            const legacy =
                stripped === null ? [] : (byKey.get(stripped) ?? []);
            if (legacy.length === 1) {
                const expected = toTagPrefix(legacy[0]);
                violations.push({
                    tag,
                    rule: '路径',
                    message: `应为 ${expected}（目录 ${legacy[0]}）`,
                    next: formatTag(expected, parsed.version),
                });
                continue;
            }
            violations.push({
                tag,
                rule: '未知项目',
                message: `workspace 里没有名为 ${name} 的项目`,
                next: null,
            });
            continue;
        }
        if (candidates.length > 1) {
            violations.push({
                tag,
                rule: '项目名歧义',
                message: `项目名不唯一：${candidates.join('、')}`,
                next: null,
            });
            continue;
        }
        const expected = toTagPrefix(candidates[0]);
        const actual = parsed.segments.join('/');
        if (actual !== expected) {
            violations.push({
                tag,
                rule: '路径',
                message: `应为 ${expected}（目录 ${candidates[0]}）`,
                next: formatTag(expected, parsed.version),
            });
        }
    }
    return violations;
}

/** 过渡期用：旧格式（只有项目名一段）的违规降级。 */
export function splitLegacy(violations: readonly TagViolation[]): {
    legacy: TagViolation[];
    blocking: TagViolation[];
} {
    const legacy: TagViolation[] = [];
    const blocking: TagViolation[] = [];
    for (const violation of violations) {
        if (isLegacyTag(violation.tag)) {
            legacy.push(violation);
        } else {
            blocking.push(violation);
        }
    }
    return { legacy, blocking };
}
