import type { Asker } from '../prompt';

/**
 * 一问就炸的 asker：用在「这条路径不该碰终端」的用例里，
 * 一旦多问一句，测试就会以异常而不是断言失败的形式暴露出来。
 */
export const forbiddenAsker: Asker = {
    ask() {
        throw new Error('不应该提问');
    },
    report() {
        throw new Error('不应该输出反馈');
    },
};

export interface ScriptedAsker extends Asker {
    asked: string[];
    reports: string[];
}

/** 按顺序吐出预设答案的 asker；答案用尽时返回 null（模拟 EOF）。 */
export function scriptedAsker(
    answers: (string | null)[],
): ScriptedAsker {
    const asked: string[] = [];
    const reports: string[] = [];
    return {
        asked,
        reports,
        ask(question) {
            asked.push(question);
            const next = answers.shift();
            return Promise.resolve(next === undefined ? null : next);
        },
        report(message) {
            reports.push(message);
        },
    };
}
