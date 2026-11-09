import { deepEqual, equal, ok } from 'node:assert/strict';
import { PassThrough } from 'node:stream';
import { test } from 'node:test';
import {
    type Asker,
    askUntilValid,
    createPrompter,
    isInteractive,
} from '../prompt';

function collectOutput(): {
    stream: PassThrough;
    text: () => string;
} {
    const stream = new PassThrough();
    let buffer = '';
    stream.on('data', (chunk: Buffer) => {
        buffer += chunk.toString('utf8');
    });
    return { stream, text: () => buffer };
}

test('读入一行文本，提示词写进输出流', async () => {
    const input = new PassThrough();
    const output = collectOutput();
    const prompter = createPrompter({
        input,
        output: output.stream,
    });

    try {
        const pending = prompter.ask('项目路径：');
        input.write('com/bilibili/demo\n');
        equal(await pending, 'com/bilibili/demo');
        ok(output.text().includes('项目路径：'), output.text());
    } finally {
        prompter.close();
    }
});

test('输入结束时提问返回 null，不会挂住', async () => {
    const input = new PassThrough();
    const output = collectOutput();
    const prompter = createPrompter({
        input,
        output: output.stream,
    });

    try {
        const pending = prompter.ask('提交主题：');
        input.end();
        equal(await pending, null);
    } finally {
        prompter.close();
    }
});

test('一次粘贴两行时第二行不丢', async () => {
    const input = new PassThrough();
    const output = collectOutput();
    const prompter = createPrompter({
        input,
        output: output.stream,
    });

    try {
        // 两行在同一帧到达：第二次 ask 还没发出，第二行必须先存住
        input.write('feat\n修复点击\n');
        equal(await prompter.ask('提交类型：'), 'feat');
        equal(await prompter.ask('提交主题：'), '修复点击');
    } finally {
        prompter.close();
    }
});

test('只有 TTY 输入才算可交互', () => {
    equal(isInteractive(new PassThrough()), false);
    equal(
        isInteractive(
            Object.assign(new PassThrough(), {
                isTTY: true,
            }),
        ),
        true,
    );
});

test('校验失败时重新提问，直到取到合法值', async () => {
    const reports: string[] = [];
    const asked: string[] = [];
    const answers = ['nope', 'feat'];
    const asker: Asker = {
        ask(question) {
            asked.push(question);
            return Promise.resolve(answers.shift() ?? null);
        },
        report(message) {
            reports.push(message);
        },
    };

    const outcome = await askUntilValid(
        asker,
        '提交类型：',
        (value) => (value === 'feat' ? null : `不接受：${value}`),
    );

    equal(outcome.ok, true);
    equal(outcome.ok && outcome.value, 'feat');
    equal(asked.length, 2);
    deepEqual(reports, ['✖ 不接受：nope']);
});

test('往返值去掉首尾空白', async () => {
    const outcome = await askUntilValid(
        {
            ask: () => Promise.resolve('  修复 点击  '),
            report: () => {},
        },
        '提交主题：',
        (value) => (value === '' ? '不能为空' : null),
    );

    equal(outcome.ok, true);
    equal(outcome.ok && outcome.value, '修复 点击');
});

test('重试次数用尽时返回错误并说明问题', async () => {
    const reports: string[] = [];
    const exhausted = await askUntilValid(
        {
            ask: () => Promise.resolve('nope'),
            report: (message) => {
                reports.push(message);
            },
        },
        '提交类型：',
        () => '不接受',
        2,
    );

    equal(exhausted.ok, false);
    ok(!exhausted.ok && exhausted.error.includes('提交类型'));
    equal(reports.length, 2);
});

test('输入结束时不重试，直接返回错误', async () => {
    const outcome = await askUntilValid(
        {
            ask: () => Promise.resolve(null),
            report: () => {},
        },
        '提交类型：',
        () => null,
    );

    if (outcome.ok) {
        throw new Error('输入结束时不应成功');
    }
    ok(outcome.error.includes('输入已结束'), outcome.error);
});
