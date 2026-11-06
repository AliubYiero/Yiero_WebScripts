import { deepEqual, equal } from 'node:assert/strict';
import { test } from 'node:test';
import { parseArgs } from '../args';

test('位置参数原样保留，开关与带值选项分别收集', () => {
    const parsed = parseArgs(
        ['修复', '点击', '问题', '--dry-run'],
        ['--project'],
    );

    deepEqual(parsed.positionals, ['修复', '点击', '问题']);
    equal(parsed.flags.has('--dry-run'), true);
    equal(parsed.values.size, 0);
});

test('带值选项吃掉紧跟的一个参数', () => {
    const parsed = parseArgs(
        ['--project', 'src/com/bilibili/demo', '--force'],
        ['--project'],
    );

    equal(parsed.values.get('--project'), 'src/com/bilibili/demo');
    equal(parsed.flags.has('--force'), true);
    deepEqual(parsed.positionals, []);
});

test('带值选项缺值时被忽略而不是吞掉下一个开关', () => {
    const parsed = parseArgs(
        ['--project', '--dry-run'],
        ['--project'],
    );

    equal(parsed.values.has('--project'), false);
    equal(parsed.flags.has('--dry-run'), true);
});

test('-- 之后的参数全是位置参数', () => {
    const parsed = parseArgs(['--dry-run', '--', '--force', '-m']);

    equal(parsed.flags.has('--dry-run'), true);
    equal(parsed.flags.has('--force'), false);
    deepEqual(parsed.positionals, ['--force', '-m']);
});
