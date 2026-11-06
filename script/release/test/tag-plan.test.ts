import { deepEqual, equal, ok } from 'node:assert/strict';
import { test } from 'node:test';
import { createRetagPlan } from '../tag-plan';

const projects = [
    { relDir: 'src/com/bilibili/bilibili-video-timeline' },
    { relDir: 'src/com/qidian/auto-scroll' },
    { relDir: 'src/.Global/global-css-import' },
    { relDir: 'src/.Libs/bilibili-api-lib' },
];

test('旧格式标签全部进入改名计划', () => {
    const plan = createRetagPlan(
        [
            'bilibili-video-timeline/v2.0.3',
            'auto-scroll/v1.0.1',
            'global-css-import/v1.1.3',
            'bilibili-api-lib/v0.3.2',
        ],
        projects,
    );
    equal(plan.errors.length, 0);
    equal(plan.unchanged.length, 0);
    equal(plan.renames.length, 4);
    deepEqual(
        plan.renames.map((entry) => entry.next),
        [
            'com/qidian/auto-scroll/v1.0.1',
            '_Libs/bilibili-api-lib/v0.3.2',
            'com/bilibili/bilibili-video-timeline/v2.0.3',
            '_Global/global-css-import/v1.1.3',
        ],
    );
});

test('已符合规范的不动', () => {
    const plan = createRetagPlan(
        ['_Global/global-css-import/v1.1.3'],
        projects,
    );
    equal(plan.renames.length, 0);
    equal(plan.unchanged.length, 1);
    equal(plan.errors.length, 0);
});

test('找不到项目时报错而不是猜', () => {
    const plan = createRetagPlan(
        ['nonexistent-project/v1.0.0'],
        projects,
    );
    equal(plan.renames.length, 0);
    equal(plan.errors.length, 1);
    ok(plan.errors[0].reason?.includes('找不到项目目录'));
});

test('基名不唯一时报错', () => {
    const plan = createRetagPlan(
        ['dup/v1.0.0'],
        [{ relDir: 'src/com/a/dup' }, { relDir: 'src/com/b/dup' }],
    );
    equal(plan.errors.length, 1);
    ok(plan.errors[0].reason?.includes('不唯一'));
});

test('重跑时新名已存在，旧名只标记为待清理', () => {
    const plan = createRetagPlan(
        ['com/qidian/auto-scroll/v1.0.1', 'auto-scroll/v1.0.1'],
        [{ relDir: 'src/com/qidian/auto-scroll' }],
    );
    equal(plan.renames.length, 0);
    equal(plan.unchanged.length, 1);
    equal(plan.applied.length, 1);
    equal(plan.errors.length, 0);
    equal(plan.applied[0].old, 'auto-scroll/v1.0.1');
    deepEqual(
        plan.stale.map((entry) => entry.old),
        ['auto-scroll/v1.0.1'],
    );
});

test('两个旧标签撞同一个新名字时报错', () => {
    const plan = createRetagPlan(
        ['auto-scroll/v1.0.1', 'x/auto-scroll/v1.0.1'],
        [{ relDir: 'src/com/qidian/auto-scroll' }],
    );
    equal(plan.renames.length, 0);
    equal(plan.errors.length, 2);
    for (const entry of plan.errors) {
        ok(entry.reason?.includes('同一个名字'));
    }
});

test('无法解析的标签归为格式错误', () => {
    const plan = createRetagPlan(
        ['no-version', 'auto-scroll/v1'],
        [{ relDir: 'src/com/qidian/auto-scroll' }],
    );
    equal(plan.renames.length, 0);
    equal(plan.errors.length, 2);
});

test('结果按标签名排序，便于逐行核对', () => {
    const plan = createRetagPlan(
        ['auto-scroll/v1.0.1', 'auto-scroll/v0.1.0'],
        [{ relDir: 'src/com/qidian/auto-scroll' }],
    );
    deepEqual(
        plan.entries.map((entry) => entry.old),
        ['auto-scroll/v0.1.0', 'auto-scroll/v1.0.1'],
    );
});
