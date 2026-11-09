/**
 * 提交信息的形状：`<type>(<项目名>): <subject>`。
 *
 * 提交范围是仓库级（根目录调用）时没有项目名可选，退化为
 * `<type>: <subject>`——不编造一个假 scope。
 */
export const COMMIT_TYPES = [
    'feat',
    'fix',
    'docs',
    'style',
    'refactor',
    'perf',
    'test',
    'chore',
    'build',
    'ci',
    'revert',
] as const;

export type CommitType = (typeof COMMIT_TYPES)[number];

/** 类型是否在白名单里；用它可以收窄到 `CommitType`。 */
export function isCommitType(raw: string): raw is CommitType {
    return (COMMIT_TYPES as readonly string[]).includes(raw.trim());
}

/** 未知类型的统一文案，`validate` 与直接拒绝共用一份。 */
export function commitTypeError(raw: string): string {
    return (
        `未知提交类型：${raw.trim()}` +
        `（可选：${COMMIT_TYPES.join(' / ')}）`
    );
}

/** 取值，不在白名单里返回 null。 */
export function parseCommitType(raw: string): CommitType | null {
    const value = raw.trim();
    return isCommitType(value) ? value : null;
}

/** 类型是否在白名单里；不在时返回可直接打印的错误文案。 */
export function validateCommitType(raw: string): string | null {
    const value = raw.trim();
    if (value === '') {
        return '提交类型不能为空';
    }
    return isCommitType(value) ? null : commitTypeError(value);
}

/** 主题压成单行：折叠换行与连续空白，免得 `-m` 里混进换行。 */
export function normalizeSubject(raw: string): string {
    return raw.replace(/\s+/g, ' ').trim();
}

/** 拼提交信息；`scope` 为空时省略括号段。 */
export function formatCommitMessage(
    type: CommitType,
    subject: string,
    scope: string | null,
): string {
    const head =
        scope === null || scope === '' ? type : `${type}(${scope})`;
    return `${head}: ${normalizeSubject(subject)}`;
}
