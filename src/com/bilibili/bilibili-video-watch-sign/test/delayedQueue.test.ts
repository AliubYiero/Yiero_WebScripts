import {
    DelayedQueue,
    type DelayedQueueOptions,
} from '../src/util/DelayedQueue';
import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';

interface IItem {
    id: string;
}

const DEFAULT_OPTIONS = {
    delay: 100,
    maxDelay: 10_000,
    keyOf: (item: IItem) => item.id,
};

function createQueue(
    processor: (item: IItem) => Promise<number | void>,
    options: Partial<DelayedQueueOptions<IItem>> = {},
): DelayedQueue<IItem> {
    return new DelayedQueue<IItem>(processor, {
        ...DEFAULT_OPTIONS,
        ...options,
    });
}

describe('DelayedQueue', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        // 抖动因子固定为 1，退避间隔即
        // min(backoffBase * 2^(n-1), maxDelay)
        vi.spyOn(Math, 'random').mockReturnValue(0.5);
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('同 key 连推 3 次只跑 1 次', async () => {
        const processor = vi.fn(async () => {});
        const queue = createQueue(processor);

        queue.push({ id: 'BV1a' }, { id: 'BV1a' }, { id: 'BV1a' });
        await vi.advanceTimersByTimeAsync(0);

        expect(processor).toHaveBeenCalledTimes(1);
    });

    it('任务完成后同 key 可以再次入队', async () => {
        const processor = vi.fn(async () => {});
        const queue = createQueue(processor);

        queue.push({ id: 'BV1a' });
        await vi.advanceTimersByTimeAsync(100);
        expect(processor).toHaveBeenCalledTimes(1);

        queue.push({ id: 'BV1a' });
        await vi.advanceTimersByTimeAsync(0);
        expect(processor).toHaveBeenCalledTimes(2);
    });

    it('连续失败时按 backoffBase 的 2 的幂增长', async () => {
        const processor = vi
            .fn()
            .mockRejectedValue(new Error('boom'));
        const queue = createQueue(processor, { backoffBase: 200 });

        queue.push(
            { id: 'a' },
            { id: 'b' },
            { id: 'c' },
            { id: 'd' },
        );
        await vi.advanceTimersByTimeAsync(0);
        expect(processor).toHaveBeenCalledTimes(1);

        // 第 1 次失败：200 * 2^0 = 200
        await vi.advanceTimersByTimeAsync(199);
        expect(processor).toHaveBeenCalledTimes(1);
        await vi.advanceTimersByTimeAsync(1);
        expect(processor).toHaveBeenCalledTimes(2);

        // 第 2 次失败：200 * 2^1 = 400
        await vi.advanceTimersByTimeAsync(399);
        expect(processor).toHaveBeenCalledTimes(2);
        await vi.advanceTimersByTimeAsync(1);
        expect(processor).toHaveBeenCalledTimes(3);

        // 第 3 次失败：200 * 2^2 = 800
        await vi.advanceTimersByTimeAsync(799);
        expect(processor).toHaveBeenCalledTimes(3);
        await vi.advanceTimersByTimeAsync(1);
        expect(processor).toHaveBeenCalledTimes(4);
    });

    it('backoffBase 缺省时等于 delay', async () => {
        const processor = vi
            .fn()
            .mockRejectedValue(new Error('boom'));
        const queue = createQueue(processor);

        queue.push(
            { id: 'a' },
            { id: 'b' },
            { id: 'c' },
            { id: 'd' },
        );
        await vi.advanceTimersByTimeAsync(0);
        expect(processor).toHaveBeenCalledTimes(1);

        // 第 1 次失败：100ms（delay）* 2^0 = 100
        await vi.advanceTimersByTimeAsync(99);
        expect(processor).toHaveBeenCalledTimes(1);
        await vi.advanceTimersByTimeAsync(1);
        expect(processor).toHaveBeenCalledTimes(2);

        // 第 2 次失败：100 * 2^1 = 200
        await vi.advanceTimersByTimeAsync(199);
        expect(processor).toHaveBeenCalledTimes(2);
        await vi.advanceTimersByTimeAsync(1);
        expect(processor).toHaveBeenCalledTimes(3);

        // 第 3 次失败：100 * 2^2 = 400
        await vi.advanceTimersByTimeAsync(399);
        expect(processor).toHaveBeenCalledTimes(3);
        await vi.advanceTimersByTimeAsync(1);
        expect(processor).toHaveBeenCalledTimes(4);
    });

    it('连续失败达到阈值后熔断并清空队列', async () => {
        const onBreakerOpen = vi.fn();
        const processor = vi
            .fn()
            .mockRejectedValue(new Error('boom'));
        const queue = createQueue(processor, {
            maxDelay: 1000,
            breakerThreshold: 5,
            onBreakerOpen,
        });

        queue.push(
            { id: '1' },
            { id: '2' },
            { id: '3' },
            { id: '4' },
            { id: '5' },
            { id: '6' },
            { id: '7' },
        );
        await vi.advanceTimersByTimeAsync(5000);

        expect(processor).toHaveBeenCalledTimes(5);
        expect(onBreakerOpen).toHaveBeenCalledTimes(1);
        expect(onBreakerOpen).toHaveBeenCalledWith(5);

        // 熔断后入队直接丢弃，不再触达 processor
        queue.push({ id: '8' });
        await vi.advanceTimersByTimeAsync(5000);
        expect(processor).toHaveBeenCalledTimes(5);
        expect(onBreakerOpen).toHaveBeenCalledTimes(1);
    });

    it('返回 0 的跳过任务既不计失败也不复位计数', async () => {
        const onBreakerOpen = vi.fn();
        const processor = vi.fn(async (item: IItem) => {
            if (item.id === 'skip') {
                return 0;
            }
            throw new Error('boom');
        });
        const queue = createQueue(processor, {
            breakerThreshold: 5,
            onBreakerOpen,
        });

        queue.push(
            { id: 'a' },
            { id: 'b' },
            { id: 'c' },
            { id: 'd' },
            { id: 'skip' },
            { id: 'e' },
        );
        // 4 次失败：100 + 200 + 400 + 800 = 1500
        await vi.advanceTimersByTimeAsync(1499);
        expect(processor).toHaveBeenCalledTimes(4);
        expect(onBreakerOpen).not.toHaveBeenCalled();

        // 跳过任务返回 0 → 间隔 0，推进 1ms 就执行下一个
        await vi.advanceTimersByTimeAsync(1);
        await vi.advanceTimersByTimeAsync(1);

        // 第 5 次「失败」才熔断，说明跳过没有计入也没有复位
        expect(processor).toHaveBeenCalledTimes(6);
        expect(onBreakerOpen).toHaveBeenCalledTimes(1);
        expect(onBreakerOpen).toHaveBeenCalledWith(5);
    });

    it('reset() 清空尚未开始的任务', async () => {
        const processor = vi.fn(async () => {});
        const queue = createQueue(processor);

        queue.push({ id: 'a' }, { id: 'b' }, { id: 'c' });
        await vi.advanceTimersByTimeAsync(0);
        expect(processor).toHaveBeenCalledTimes(1);

        queue.reset();
        await vi.advanceTimersByTimeAsync(1000);
        expect(processor).toHaveBeenCalledTimes(1);
    });

    it('reset() 后在途任务的 key 可以重新入队', async () => {
        let release: (() => void) | undefined;
        const gate = new Promise<void>((resolve) => {
            release = resolve;
        });
        const processor = vi.fn(() => gate);
        const queue = createQueue(processor);

        queue.push({ id: 'BV1a' });
        await vi.advanceTimersByTimeAsync(0);
        expect(processor).toHaveBeenCalledTimes(1);

        queue.reset();
        queue.push({ id: 'BV1a' });
        release?.();
        await vi.advanceTimersByTimeAsync(100);

        expect(processor).toHaveBeenCalledTimes(2);
    });

    it('reset() 后失败计数与熔断状态归零', async () => {
        const onBreakerOpen = vi.fn();
        const processor = vi
            .fn()
            .mockRejectedValue(new Error('boom'));
        const queue = createQueue(processor, {
            maxDelay: 1000,
            breakerThreshold: 5,
            onBreakerOpen,
        });

        queue.push(
            { id: 'a' },
            { id: 'b' },
            { id: 'c' },
            { id: 'd' },
        );
        await vi.advanceTimersByTimeAsync(3000);
        expect(processor).toHaveBeenCalledTimes(4);
        expect(onBreakerOpen).not.toHaveBeenCalled();

        queue.reset();
        queue.push({ id: 'e' });
        await vi.advanceTimersByTimeAsync(200);

        // 若计数未归零，这一次失败会凑满 5 次触发熔断
        expect(processor).toHaveBeenCalledTimes(5);
        expect(onBreakerOpen).not.toHaveBeenCalled();
    });

    it('processor 同步抛出不会卡住队列', async () => {
        const processor = vi.fn((item: IItem) => {
            if (item.id === 'bad') {
                throw new Error('sync boom');
            }
            return Promise.resolve();
        });
        const queue = createQueue(processor);

        queue.push({ id: 'bad' }, { id: 'good' });
        await vi.advanceTimersByTimeAsync(0);
        expect(processor).toHaveBeenCalledTimes(1);

        // 同步抛出同样计入一次失败，退避 100ms 后继续
        await vi.advanceTimersByTimeAsync(100);
        expect(processor).toHaveBeenCalledTimes(2);
        expect(processor).toHaveBeenLastCalledWith({
            id: 'good',
        });
    });
});
