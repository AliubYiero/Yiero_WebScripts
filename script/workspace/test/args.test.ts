import { deepEqual, equal } from 'node:assert/strict';
import { test } from 'node:test';
import { parseArgs } from '../args';

test('位置参数原样保留，开关与带值选项分别收集', () => {
    const parsed = parseArgs(
        ['修复', '点击', '问题', '--dry-run'],
        ['--project'],
        ['--dry-run'],
    );

    deepEqual(parsed.positionals, ['修复', '点击', '问题']);
    equal(parsed.flags.has('--dry-run'), true);
    equal(parsed.values.size, 0);
    deepEqual(parsed.errors, []);
});

test('带值选项吃掉紧跟的一个参数', () => {
    const parsed = parseArgs(
        ['--project', 'src/com/bilibili/demo', '--force'],
        ['--project'],
        ['--force'],
    );

    equal(parsed.values.get('--project'), 'src/com/bilibili/demo');
    equal(parsed.flags.has('--force'), true);
    deepEqual(parsed.positionals, []);
    deepEqual(parsed.errors, []);
});

test('带值选项缺值时记错误，而不是吞掉下一个开关', () => {
    const parsed = parseArgs(
        ['--project', '--dry-run'],
        ['--project'],
        ['--dry-run'],
    );

    equal(parsed.values.has('--project'), false);
    equal(parsed.flags.has('--dry-run'), true);
    deepEqual(parsed.errors, ['选项 --project 缺少取值']);
});

test('未知选项记错误，避免拼错的开关被静默忽略', () => {
    const parsed = parseArgs(
        ['--dry-runn', '提交'],
        [],
        ['--dry-run'],
    );

    deepEqual(parsed.errors, ['未知选项：--dry-runn']);
    deepEqual(parsed.positionals, ['提交']);
});

test('不传开关白名单时不校验未知选项', () => {
    const parsed = parseArgs(['--whatever']);

    deepEqual(parsed.errors, []);
    equal(parsed.flags.has('--whatever'), true);
});

test('-- 之后的参数全是位置参数', () => {
    const parsed = parseArgs(['--dry-run', '--', '--force', '-m']);

    equal(parsed.flags.has('--dry-run'), true);
    equal(parsed.flags.has('--force'), false);
    deepEqual(parsed.positionals, ['--force', '-m']);
});
