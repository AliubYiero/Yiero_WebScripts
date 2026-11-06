import { LIBRARY_DOMAIN, SPECIAL_DOMAINS } from './workspace';

export interface NewScriptTarget {
    /** src 下的相对路径分段，如 ['com', 'bilibili', 'demo'] */
    parts: string[];
    /** 项目目录名，即元数据里的 name 初值 */
    projectName: string;
}

function isSpecialDomain(part: string): boolean {
    return SPECIAL_DOMAINS.includes(part);
}

/**
 * 解析新建项目参数：
 * - 普通项目：域/子域/项目名
 * - 特殊目录：.Global/项目名 或 .Crontab/项目名
 * 不合法时返回 null。
 */
export function parseTarget(raw: string): NewScriptTarget | null {
    const parts = raw.split('/').filter((part) => part.length > 0);
    if (parts.length === 0) {
        return null;
    }

    const isPlainName = (part: string): boolean =>
        !part.startsWith('.');

    if (parts.length === 2 && isSpecialDomain(parts[0])) {
        return isPlainName(parts[1])
            ? { parts, projectName: parts[1] }
            : null;
    }

    if (parts.length === 3 && parts.every(isPlainName)) {
        return { parts, projectName: parts[2] };
    }

    return null;
}

/**
 * 识别「把脚本建进库域」的目标：`.Libs/<名>` 或 `src/.Libs/<名>`。
 * 命中时返回规范化后的 `src/.Libs/<名>` 路径，供脚手架给出
 * 专属提示；不是库域时返回 null。
 */
export function parseLibraryDomainTarget(raw: string): string | null {
    const parts = raw.split('/').filter((part) => part.length > 0);
    const segments = parts[0] === 'src' ? parts.slice(1) : parts;
    if (segments.length < 2 || segments[0] !== LIBRARY_DOMAIN) {
        return null;
    }
    return ['src', ...segments].join('/');
}
