import { sleep } from 'radash';

export interface DelayedQueueOptions<T> {
    /** 正常间隔，毫秒 */
    delay?: number;
    /**
     * 退避基数，毫秒；默认等于 `delay`。
     *
     * 第 n 次连续失败后的间隔为
     * `backoffBase * 2 ** (n - 1)`，再夹到 `maxDelay`。
     */
    backoffBase?: number;
    /** 退避间隔上限，毫秒 */
    maxDelay?: number;
    /** 连续失败多少次后熔断；默认 Infinity 即不熔断 */
    breakerThreshold?: number;
    /** 取任务去重键；提供后同键任务不会重复入队 */
    keyOf?: (item: T) => string;
    /** 熔断打开时回调一次 */
    onBreakerOpen?: (failures: number) => void;
}

export class DelayedQueue<T> {
    private queue: T[] = [];
    private queuedKeys: Set<string> = new Set();
    private inFlightKeys: Set<string> = new Set();
    private isProcessing: boolean = false;
    private failures: number = 0;
    private isBreakerOpen: boolean = false;

    private readonly delay: number;
    private readonly backoffBase: number;
    private readonly maxDelay: number;
    private readonly breakerThreshold: number;
    private readonly keyOf: ((item: T) => string) | undefined;
    private readonly onBreakerOpen:
        | ((failures: number) => void)
        | undefined;

    constructor(
        private processor: (item: T) => Promise<number | void>,
        options: DelayedQueueOptions<T> = {},
    ) {
        this.delay = options.delay ?? 500;
        this.backoffBase = options.backoffBase ?? this.delay;
        this.maxDelay = options.maxDelay ?? 30_000;
        this.breakerThreshold = options.breakerThreshold ?? Infinity;
        this.keyOf = options.keyOf;
        this.onBreakerOpen = options.onBreakerOpen;
    }

    push(...items: T[]): void {
        // 熔断打开后不再接收新任务
        if (this.isBreakerOpen) {
            return;
        }

        for (const item of items) {
            const key = this.keyOf?.(item);
            if (key !== undefined) {
                // 已排队或在途的同键任务直接丢弃
                if (
                    this.queuedKeys.has(key) ||
                    this.inFlightKeys.has(key)
                ) {
                    continue;
                }
                this.queuedKeys.add(key);
            }
            this.queue.push(item);
        }

        this.process();
    }

    /**
     * 立即清空队列中所有**尚未开始处理**的任务，
     * 并复位失败计数与熔断状态。
     * 注意：当前正在处理的任务会继续完成，不会被中断。
     */
    reset(): void {
        this.queue = [];
        this.queuedKeys.clear();
        this.inFlightKeys.clear();
        this.failures = 0;
        this.isBreakerOpen = false;
    }

    private async process(): Promise<void> {
        if (this.isProcessing || this.queue.length === 0) {
            return;
        }

        this.isProcessing = true;

        try {
            while (this.queue.length > 0) {
                if (this.isBreakerOpen) {
                    break;
                }

                const item = this.queue.shift()!;
                this.beginKey(item);

                let nextDelay = this.delay;
                try {
                    const result = await this.processor(item);
                    if (result === 0) {
                        // 跳过：立即继续，不计失败也不复位
                        nextDelay = 0;
                    } else {
                        typeof result === 'number' &&
                            (nextDelay = result);
                        this.failures = 0;
                    }
                } catch (err) {
                    console.error('Queue task error:', err);
                    this.failures += 1;
                    nextDelay = this.getBackoffDelay();
                    if (this.failures >= this.breakerThreshold) {
                        this.openBreaker();
                    }
                } finally {
                    this.endKey(item);
                }

                if (this.isBreakerOpen) {
                    break;
                }

                await sleep(nextDelay);
            }
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * 退避：min(backoffBase * 2^(failures - 1), maxDelay)
     * ± 20% 抖动
     */
    private getBackoffDelay(): number {
        const base = Math.min(
            this.backoffBase * 2 ** (this.failures - 1),
            this.maxDelay,
        );
        return base * (0.8 + Math.random() * 0.4);
    }

    private openBreaker(): void {
        this.isBreakerOpen = true;
        this.queue = [];
        this.queuedKeys.clear();
        this.onBreakerOpen?.(this.failures);
    }

    private beginKey(item: T): void {
        const key = this.keyOf?.(item);
        if (key === undefined) {
            return;
        }
        this.queuedKeys.delete(key);
        this.inFlightKeys.add(key);
    }

    private endKey(item: T): void {
        const key = this.keyOf?.(item);
        if (key === undefined) {
            return;
        }
        this.inFlightKeys.delete(key);
    }
}
