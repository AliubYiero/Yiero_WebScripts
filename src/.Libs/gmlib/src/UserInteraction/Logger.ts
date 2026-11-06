/**
 * 控制台日志输出器
 *
 * 创建带前缀的日志实例，输出时前缀带有背景色样式，
 * 便于在控制台中区分不同模块的日志。
 *
 * @example
 * ```ts
 * const logger = new Logger('GmLib');
 * logger.log('初始化完成');
 * logger.error('加载失败', error);
 * ```
 */
export class Logger {
    /**
     * 日志前缀，显示时会带有背景色
     */
    private readonly prefix: string;

    /**
     * 应用于前缀的 CSS 样式字符串
     */
    private readonly style =
        'background: #f98aad;color: #ffffff;padding: 2px 4px;border-radius: 4px;font-weight: 500;';

    /**
     * @param prefix 日志前缀，显示时会带有背景色
     */
    constructor(prefix: string) {
        this.prefix = prefix;
    }

    /**
     * 普通日志（console.log）
     *
     * @param args 日志内容，支持任意数量的参数
     */
    log(...args: unknown[]): void {
        console.log(`%c${this.prefix}`, this.style, ...args);
    }

    /**
     * 信息日志（console.info）
     *
     * @param args 日志内容，支持任意数量的参数
     */
    info(...args: unknown[]): void {
        console.info(`%c${this.prefix}`, this.style, ...args);
    }

    /**
     * 警告日志（console.warn）
     *
     * @param args 日志内容，支持任意数量的参数
     */
    warn(...args: unknown[]): void {
        console.warn(`%c${this.prefix}`, this.style, ...args);
    }

    /**
     * 错误日志（console.error）
     *
     * @param args 日志内容，支持任意数量的参数
     */
    error(...args: unknown[]): void {
        console.error(`%c${this.prefix}`, this.style, ...args);
    }
}
