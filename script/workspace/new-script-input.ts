import { type Asker, askUntilValid } from './prompt';
import {
    type NewScriptTarget,
    parseLibraryDomainTarget,
    parseTarget,
} from './target-path';

export type NewScriptTargetOutcome =
    | { ok: true; target: NewScriptTarget }
    | { ok: false; error: string };

const TARGET_QUESTION =
    '项目路径（顶级域/二级域/项目名，特殊目录用 .Global/项目名）：';

export const TARGET_USAGE =
    '用法：pnpm new:script 顶级域/二级域/项目名' +
    '（特殊目录用 .Global/项目名 或 .Crontab/项目名）';

/** 只做识别与报错，不读终端——交互与直接传参共用这一份判断。 */
function describeTarget(raw: string): NewScriptTargetOutcome {
    const value = raw.trim();
    if (value === '') {
        return { ok: false, error: TARGET_USAGE };
    }

    const libraryTarget = parseLibraryDomainTarget(value);
    if (libraryTarget !== null) {
        return {
            ok: false,
            error:
                `库域不能放脚本项目：${libraryTarget}` +
                '（库请直接放到 src/.Libs/<库名>/）',
        };
    }

    const target = parseTarget(value);
    if (target === null) {
        return { ok: false, error: TARGET_USAGE };
    }

    return { ok: true, target };
}

/**
 * 取新建项目的目标路径。
 *
 * 命令行给了路径就只解析（打错了直接报用法，不拿交互掩盖）；
 * 没给才问一次，输错重问。
 */
export async function collectNewScriptTarget(
    asker: Asker,
    raw: string,
): Promise<NewScriptTargetOutcome> {
    if (raw.trim() !== '') {
        return describeTarget(raw);
    }

    const answer = await askUntilValid(
        asker,
        TARGET_QUESTION,
        (value) => {
            const check = describeTarget(value);
            return check.ok ? null : check.error;
        },
    );
    if (!answer.ok) {
        return answer;
    }

    return describeTarget(answer.value);
}
