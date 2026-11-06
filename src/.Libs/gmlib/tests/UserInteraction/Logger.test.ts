import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Logger } from '../../src/UserInteraction/Logger';

type LoggerMethod = 'log' | 'info' | 'warn' | 'error';

describe('Logger', () => {
    // 保存各 console 方法的原始引用
    const originalMethods: Record<
        LoggerMethod,
        (...args: unknown[]) => void
    > = {
        log: console.log,
        info: console.info,
        warn: console.warn,
        error: console.error,
    };

    // 各方法的调用记录
    const calls: Record<LoggerMethod, unknown[][]> = {
        log: [],
        info: [],
        warn: [],
        error: [],
    };

    beforeEach(() => {
        // 重置调用记录
        (Object.keys(calls) as LoggerMethod[]).forEach((method) => {
            calls[method] = [];
        });

        // 替换 console 方法，记录调用参数
        (Object.keys(originalMethods) as LoggerMethod[]).forEach(
            (method) => {
                console[method] = (...args: unknown[]) => {
                    calls[method].push(args);
                };
            },
        );
    });

    afterEach(() => {
        // 恢复原始 console 方法
        (Object.keys(originalMethods) as LoggerMethod[]).forEach(
            (method) => {
                console[method] = originalMethods[method];
            },
        );
    });

    describe('constructor', () => {
        it('应该创建带前缀的 Logger 实例', () => {
            const logger = new Logger('GmLib');
            expect(logger).toBeInstanceOf(Logger);
        });
    });

    describe.each<LoggerMethod>([
        'log',
        'info',
        'warn',
        'error',
    ])('%s 方法', (method) => {
        it('应该调用对应的 console 方法并传入带样式的格式化前缀', () => {
            const logger = new Logger('GmLib');
            logger[method]('hello');

            expect(calls[method]).toHaveLength(1);
            expect(calls[method][0][0]).toBe('%cGmLib');
            expect(calls[method][0][1]).toContain(
                'background: #f98aad',
            );
            expect(calls[method][0][1]).toContain('color: #ffffff');
            expect(calls[method][0]).toContain('hello');
        });

        it('应该透传多个日志参数', () => {
            const logger = new Logger('GmLib');
            logger[method]('msg', 42, { key: 'value' });

            expect(calls[method][0].slice(2)).toEqual([
                'msg',
                42,
                { key: 'value' },
            ]);
        });

        it('应该使用实例的前缀生成格式化串', () => {
            const logger = new Logger('API');
            logger[method]();

            expect(calls[method][0][0]).toBe('%cAPI');
        });
    });
});
