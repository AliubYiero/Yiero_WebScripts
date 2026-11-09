import { createInterface } from 'node:readline';
import type { Readable, Writable } from 'node:stream';

/**
 * 简易终端交互：只读一行文本，不依赖任何 TUI 库。
 *
 * 交互只在 stdin 是 TTY 时启用；管道 / CI 里拿不到输入，
 * 调用方必须退回「参数给全或报用法错误」。
 */
export interface Prompter {
    /** 打印提示并等待一行输入；输入流结束时返回 null。 */
    ask(question: string): Promise<string | null>;
    /** 打印一行反馈（校验失败、说明性提示）。 */
    report(message: string): void;
    /** 释放 stdin 监听，避免进程被挂住。 */
    close(): void;
}

export interface PrompterStreams {
    input: Readable;
    output: Writable;
}

/** 校验通过返回 null，否则返回要展示给用户的错误文案。 */
export type Validator = (value: string) => string | null;

export interface Asker {
    ask(question: string): Promise<string | null>;
    report(message: string): void;
}

export type AskOutcome =
    | { ok: true; value: string }
    | { ok: false; error: string };

/** stdin 是 TTY 才算可交互。 */
export function isInteractive(
    input: { isTTY?: boolean } | Readable,
): boolean {
    return (input as { isTTY?: boolean }).isTTY === true;
}

/**
 * 基于 `node:readline` 的最小实现。
 *
 * `terminal: false`：不做行编辑、不重绘提示，输一行就交一行；
 * 测试里塞 PassThrough 也走同一条路径。
 */
export function createPrompter(streams: PrompterStreams): Prompter {
    const rl = createInterface({
        input: streams.input,
        output: streams.output,
        terminal: false,
    });
    const pending: ((value: string | null) => void)[] = [];
    // 提前到达的行先存着：粘贴两条或预输入两行时，第二行不能丢。
    const buffered: string[] = [];
    let closed = false;

    const settle = (value: string | null): void => {
        const resolve = pending.shift();
        if (resolve === undefined) {
            if (value !== null) {
                buffered.push(value);
            }
            return;
        }
        resolve(value);
    };

    rl.on('line', (line) => settle(line.replace(/\r$/, '')));
    rl.on('close', () => {
        closed = true;
        // 输入结束时把排队中的提问全部放掉，否则调用方会永久等待。
        while (pending.length > 0) {
            settle(null);
        }
    });

    return {
        ask(question) {
            streams.output.write(question);
            const ready = buffered.shift();
            if (ready !== undefined) {
                return Promise.resolve(ready);
            }
            if (closed) {
                return Promise.resolve(null);
            }
            return new Promise((resolve) => {
                pending.push(resolve);
            });
        },
        report(message) {
            streams.output.write(`${message}\n`);
        },
        close() {
            rl.close();
        },
    };
}

/**
 * 反复提问直到取到合法值。
 *
 * 输入结束（null）立刻失败，不当作「空值重试」；连续
 * `maxAttempts` 次不合法也失败，避免在终端里无限循环。
 */
export async function askUntilValid(
    asker: Asker,
    question: string,
    validate: Validator,
    maxAttempts = 3,
): Promise<AskOutcome> {
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        const answer = await asker.ask(question);
        if (answer === null) {
            return { ok: false, error: `${question}输入已结束` };
        }

        const value = answer.trim();
        const problem = validate(value);
        if (problem === null) {
            return { ok: true, value };
        }
        asker.report(`✖ ${problem}`);
    }

    return {
        ok: false,
        error: `${question}连续 ${maxAttempts} 次输入不合法`,
    };
}
