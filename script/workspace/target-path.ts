const SPECIAL_DOMAINS = ['.Global', '.Crontab'];

/**
 * 解析新建项目参数：
 * - 普通项目：域/子域/项目名
 * - 特殊目录：.Global/项目名 或 .Crontab/项目名
 * 不合法时返回 null。
 */
export function parseTarget(raw: string): string[] | null {
    const parts = raw.split('/').filter((part) => part.length > 0);
    if (parts.length === 0) {
        return null;
    }
    if (parts.length === 2 && SPECIAL_DOMAINS.includes(parts[0])) {
        return parts[1].startsWith('.') ? null : parts;
    }
    if (
        parts.length === 3 &&
        !parts.some((part) => part.startsWith('.'))
    ) {
        return parts;
    }
    return null;
}
