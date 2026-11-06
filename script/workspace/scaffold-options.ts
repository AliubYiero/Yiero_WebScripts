/**
 * 新建脚本时按目录推导运行方式元数据：
 * - 普通项目 `顶级域/二级域/项目名`：按域名派生 @match
 * - `.Global/项目名`：全站脚本，匹配所有网站
 * - `.Crontab/项目名`：定时脚本，不带 @match，改用 @crontab
 */

export type TargetScriptMeta =
    | { key: 'match'; value: string }
    | { key: 'crontab'; value: string };

/** .Crontab 项目的默认执行频率：每天最多一次。 */
export const DEFAULT_CRONTAB = '* * once * *';

/** .Global 项目的默认匹配：所有网站。 */
export const GLOBAL_MATCH = 'https://*/*';

/** 特殊目录的默认运行方式；与 workspace 的 SPECIAL_DOMAINS 一一对应。 */
const SPECIAL_TARGET_META: Record<string, TargetScriptMeta> = {
    '.Global': { key: 'match', value: GLOBAL_MATCH },
    '.Crontab': { key: 'crontab', value: DEFAULT_CRONTAB },
};

/** 根据 parseTarget 的分段推导 banner 里要写的运行方式。 */
export function resolveTargetMeta(parts: string[]): TargetScriptMeta {
    const [topLevelDomain, secondLevelDomain] = parts;
    const specialMeta = SPECIAL_TARGET_META[topLevelDomain ?? ''];

    if (specialMeta !== undefined) {
        return specialMeta;
    }
    if (topLevelDomain?.startsWith('.') === true) {
        throw new Error(`未知特殊目录：${topLevelDomain}`);
    }
    if (
        topLevelDomain === undefined ||
        secondLevelDomain === undefined
    ) {
        throw new Error(
            `无法从 ${parts.join('/')} 推导 @match：需要 顶级域/二级域/项目名`,
        );
    }

    return {
        key: 'match',
        value: `https://*.${secondLevelDomain}.${topLevelDomain}/*`,
    };
}
