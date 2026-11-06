/**
 * 标签命名的唯一事实来源。
 *
 * 规则：`src/` 之后的工作区路径 + `/v版本`；
 * 段首的点号换成下划线（git 不允许 ref 段以点开头）。
 */

const versionPattern = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;

/** ref 段里 git 明令禁止的字符（`.`,`..`,`@{`,控制字符另判）。 */
const forbiddenCharacters = /[~^:?*[\\]/;

export interface ParsedTag {
    /** 版本段之前的路径段，如 `['com','bilibili','xxx']` */
    segments: string[];
    version: string;
}

export function isValidVersion(version: string): boolean {
    return versionPattern.test(version);
}

function isValidSegment(segment: string): boolean {
    if (segment.length === 0) {
        return false;
    }
    if (segment.startsWith('.') || segment.endsWith('.lock')) {
        return false;
    }
    for (const char of segment) {
        const code = char.codePointAt(0) ?? 0;
        if (code <= 0x20 || code === 0x7f) {
            return false;
        }
    }
    return !forbiddenCharacters.test(segment);
}

export function isValidPrefix(prefix: string): boolean {
    const segments = prefix.split('/');
    return segments.length >= 2 && segments.every(isValidSegment);
}

/** `src/com/bilibili/xxx` -> `com/bilibili/xxx`。 */
export function toTagPrefix(relDir: string): string {
    const segments = relDir
        .replaceAll('\\', '/')
        .replace(/^\.\//, '')
        .replace(/\/+$/, '')
        .split('/');
    if (segments[0] !== 'src' || segments.length < 3) {
        throw new Error(`不是脚本项目目录：${relDir}`);
    }
    const prefix = segments
        .slice(1)
        .map((segment) => {
            if (segment.startsWith('.')) {
                return `_${segment.slice(1)}`;
            }
            return segment;
        })
        .join('/');
    if (!isValidPrefix(prefix)) {
        throw new Error(`目录无法映射成合法标签前缀：${relDir}`);
    }
    return prefix;
}

export function formatTag(prefix: string, version: string): string {
    return `${prefix}/v${version}`;
}

/**
 * 解析标签，新旧格式都认：
 * `com/a/b/v1.0.0` 与旧格式 `b/v1.0.0`。
 */
export function parseTag(tag: string): ParsedTag | null {
    if (!isValidTagName(tag)) {
        return null;
    }
    const segments = tag.split('/');
    if (segments.length < 2) {
        return null;
    }
    const last = segments[segments.length - 1];
    if (!last.startsWith('v')) {
        return null;
    }
    const version = last.slice(1);
    if (!isValidVersion(version)) {
        return null;
    }
    return { segments: segments.slice(0, -1), version };
}

/** 旧格式：只有项目名一段，没有域/子域。 */
export function isLegacyTag(tag: string): boolean {
    const parsed = parseTag(tag);
    return parsed !== null && parsed.segments.length === 1;
}

/**
 * 项目目录可能对应的标签基名。
 *
 * 带点目录（`.Global/xxx`）在旧标签里常被写成
 * `xxx/v1.0.0` 或 `_xxx/v1.0.0`，这里把去点与下划线形式
 * 一并列出；库域 `src/.Libs/<名>` 的基名就是 `<名>`，标签
 * 前缀 `_Libs/<名>` 由 toTagPrefix 生成。
 */
export function matchKeys(relDir: string): string[] {
    const index = relDir.lastIndexOf('/');
    const base = index === -1 ? relDir : relDir.slice(index + 1);
    const keys = new Set<string>([base]);
    if (base.startsWith('.')) {
        const stripped = base.slice(1);
        keys.add(stripped);
        keys.add(`_${stripped}`);
    }
    return [...keys];
}

/** 与 `git check-ref-format` 对 ref 名的约束等价。 */
export function isValidTagName(tag: string): boolean {
    if (tag.length === 0 || tag === '@') {
        return false;
    }
    if (
        tag.startsWith('/') ||
        tag.endsWith('/') ||
        tag.endsWith('.') ||
        tag.includes('//') ||
        tag.includes('..') ||
        tag.includes('@{')
    ) {
        return false;
    }
    return tag.split('/').every(isValidSegment);
}
