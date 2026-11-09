import { deepEqual, equal, ok } from 'node:assert/strict';
import { test } from 'node:test';
import {
    COMMIT_TYPES,
    formatCommitMessage,
    normalizeSubject,
    validateCommitType,
} from '../commit-message';

test('提交类型白名单与约定一致', () => {
    deepEqual(COMMIT_TYPES, [
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
    ]);
});

test('项目级提交信息带项目名，仓库级省略括号段', () => {
    equal(
        formatCommitMessage(
            'feat',
            '修复点击问题',
            'bilibili-video-timeline',
        ),
        'feat(bilibili-video-timeline): 修复点击问题',
    );
    equal(
        formatCommitMessage('docs', '更新日志', null),
        'docs: 更新日志',
    );
    equal(formatCommitMessage('chore', '归档', ''), 'chore: 归档');
});

test('主题折叠换行与连续空白，便于单行 -m', () => {
    equal(normalizeSubject('  修复   点击\n问题 '), '修复 点击 问题');
    equal(normalizeSubject('\n\t '), '');
});

test('类型校验给出可展示的文案', () => {
    equal(validateCommitType('feat'), null);
    equal(validateCommitType('revert'), null);

    const unknown = validateCommitType('feta');
    ok(unknown !== null);
    ok(unknown.includes('未知提交类型：feta'), unknown);
    ok(unknown.includes('feat'), unknown);

    const empty = validateCommitType('');
    ok(empty !== null);
    ok(empty.includes('提交类型不能为空'), empty);
});
