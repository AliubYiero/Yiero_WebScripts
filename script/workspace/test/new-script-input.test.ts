import { deepEqual, equal, ok } from 'node:assert/strict';
import { test } from 'node:test';
import { collectNewScriptTarget } from '../new-script-input';
import { forbiddenAsker, scriptedAsker } from './asker-helpers';

/** 收窄成失败结果并取出错误文案，省掉每个用例里的手写 narrow。 */
function failure(outcome: { ok: boolean; error?: string }): string {
    if (outcome.ok) {
        throw new Error('期望调用失败，但它成功了');
    }
    return outcome.error ?? '';
}

test('给了路径就不再提问', async () => {
    const outcome = await collectNewScriptTarget(
        forbiddenAsker,
        'com/bilibili/demo',
    );

    ok(outcome.ok);
    deepEqual(outcome.ok && outcome.target.parts, [
        'com',
        'bilibili',
        'demo',
    ]);
    equal(outcome.ok && outcome.target.projectName, 'demo');
});

test('没给路径时问一次并解析', async () => {
    const asker = scriptedAsker(['.Global/toolbar']);

    const outcome = await collectNewScriptTarget(asker, '');

    ok(outcome.ok);
    deepEqual(outcome.ok && outcome.target.parts, [
        '.Global',
        'toolbar',
    ]);
    equal(asker.asked.length, 1);
    ok(asker.asked[0].includes('路径'), asker.asked[0]);
});

test('库域目标给出专属提示', async () => {
    const outcome = await collectNewScriptTarget(
        forbiddenAsker,
        '.Libs/gmlib',
    );

    const error = failure(outcome);
    ok(error.includes('库域不能放脚本项目'), error);
    ok(error.includes('src/.Libs/gmlib'), error);
});

test('交互里输错路径会重新问', async () => {
    const asker = scriptedAsker(['not-a-path', 'com/me/x']);

    const outcome = await collectNewScriptTarget(asker, '');

    ok(outcome.ok);
    equal(outcome.ok && outcome.target.projectName, 'x');
    equal(asker.asked.length, 2);
    equal(asker.reports.length, 1);
});

test('输入结束时失败', async () => {
    const outcome = await collectNewScriptTarget(
        scriptedAsker([null]),
        '',
    );

    ok(failure(outcome).includes('输入已结束'));
});
