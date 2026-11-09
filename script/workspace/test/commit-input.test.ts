import { deepEqual, equal, ok } from 'node:assert/strict';
import { test } from 'node:test';
import {
    collectCommitInput,
    parseCommitPositionals,
    preflightCommit,
} from '../commit-input';
import { forbiddenAsker, scriptedAsker } from './asker-helpers';

/** 收窄成失败结果并取出错误文案，省掉每个用例里的手写 narrow。 */
function failure(outcome: { ok: boolean; error?: string }): string {
    if (outcome.ok) {
        throw new Error('期望调用失败，但它成功了');
    }
    return outcome.error ?? '';
}

test('第一个位置参数是类型，其余拼成主题', () => {
    deepEqual(parseCommitPositionals(['feat', '修复', '点击']), {
        type: 'feat',
        subject: '修复 点击',
    });
    deepEqual(parseCommitPositionals(['fix', '  修复  点击  ']), {
        type: 'fix',
        subject: '修复 点击',
    });
    deepEqual(parseCommitPositionals([]), { type: '', subject: '' });
    deepEqual(parseCommitPositionals(['chore']), {
        type: 'chore',
        subject: '',
    });
});

test('参数给全时不提问', async () => {
    const outcome = await collectCommitInput(forbiddenAsker, [
        'feat',
        '修复点击问题',
    ]);

    ok(outcome.ok);
    equal(outcome.ok && outcome.type, 'feat');
    equal(outcome.ok && outcome.subject, '修复点击问题');
});

test('只给类型时补问主题', async () => {
    const asker = scriptedAsker(['修复点击问题']);

    const outcome = await collectCommitInput(asker, ['fix']);

    ok(outcome.ok);
    equal(outcome.ok && outcome.type, 'fix');
    equal(outcome.ok && outcome.subject, '修复点击问题');
    equal(asker.asked.length, 1);
    ok(asker.asked[0].includes('主题'), asker.asked[0]);
});

test('没有参数时依次补问类型与主题', async () => {
    const asker = scriptedAsker(['feat', '新增交互输入']);

    const outcome = await collectCommitInput(asker, []);

    ok(outcome.ok);
    equal(outcome.ok && outcome.type, 'feat');
    equal(outcome.ok && outcome.subject, '新增交互输入');
    equal(asker.asked.length, 2);
    ok(asker.asked[0].includes('类型'), asker.asked[0]);
    ok(asker.asked[1].includes('主题'), asker.asked[1]);
});

test('类型不在白名单时直接失败，不再问主题', async () => {
    const outcome = await collectCommitInput(forbiddenAsker, [
        'feta',
        '修复点击',
    ]);

    ok(failure(outcome).includes('未知提交类型'));
});

test('交互里输错类型会重新问，直到合法', async () => {
    const asker = scriptedAsker(['nope', 'docs', '同步文档']);

    const outcome = await collectCommitInput(asker, []);

    ok(outcome.ok);
    equal(outcome.ok && outcome.type, 'docs');
    equal(outcome.ok && outcome.subject, '同步文档');
    equal(asker.asked.length, 3);
    equal(asker.reports.length, 1);
    ok(asker.reports[0].includes('未知提交类型'), asker.reports[0]);
});

test('输入结束时失败，不把空值当合法', async () => {
    const asker = scriptedAsker([null]);

    const outcome = await collectCommitInput(asker, []);

    ok(failure(outcome).includes('输入已结束'));
});

test('参数给全时前置校验通过', () => {
    deepEqual(preflightCommit(['fix', '修复点击']), { ok: true });
});

test('参数不完整时前置校验报 incomplete', () => {
    for (const args of [[], ['feat']]) {
        const check = preflightCommit(args);
        equal(check.ok, false);
        equal(!check.ok && check.reason, 'incomplete');
    }
});

test('类型拼错时前置校验优先报 bad-type', () => {
    const check = preflightCommit(['feta']);

    equal(check.ok, false);
    ok(!check.ok && check.reason === 'bad-type');
    ok(
        !check.ok && check.error.includes('未知提交类型'),
        check.error,
    );
});
