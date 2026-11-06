/**
 * Navigation API 类型声明
 *
 * Navigation API 是现代浏览器提供的路由导航 API
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Navigation_API
 */

interface NavigationDestination {
    /** 目标 URL */
    readonly url: string;
    /** 导航的 key */
    readonly key: string;
    /** 导航的 id */
    readonly id: string;
    /** 索引 */
    readonly index: number;
    /** 是否为当前条目 */
    readonly sameDocument: boolean;
}

interface NavigateEvent extends Event {
    /** 导航类型 */
    readonly navigationType: 'push' | 'replace' | 'traverse' | 'reload';
    /** 目标 */
    readonly destination: NavigationDestination;
    /** 是否可以拦截 */
    readonly canIntercept: boolean;
    /** 用户是否发起的导航 */
    readonly userInitiated: boolean;
    /** hash 变化 */
    readonly hashChange: boolean;
    /** 导航信息 */
    readonly info: unknown;
    /** 信号 */
    readonly signal: AbortSignal;
    /** 下载请求 */
    readonly downloadRequest: string | null;
    /** 拦截导航 */
    intercept(options?: { handler?: () => Promise<void> | void }): void;
    /** 滚动 */
    scroll(options?: { key?: string }): void;
}

interface NavigationHistoryEntry extends EventTarget {
    /** URL */
    readonly url: string | null;
    /** key */
    readonly key: string;
    /** id */
    readonly id: string;
    /** 索引 */
    readonly index: number;
    /** 是否为同一文档 */
    readonly sameDocument: boolean;
}

interface Navigation extends EventTarget {
    /** 当前条目 */
    readonly currentEntry: NavigationHistoryEntry | null;
    /** 转换计数 */
    readonly transition: {
        readonly navigationType: 'push' | 'replace' | 'traverse' | 'reload';
        readonly from: NavigationHistoryEntry;
        readonly finished: Promise<void>;
    } | null;
    /** 是否可以前进 */
    readonly canGoForward: boolean;
    /** 是否可以后退 */
    readonly canGoBack: boolean;
    /** 获取条目 */
    entries(): NavigationHistoryEntry[];
    /** 前进 */
    forward(options?: { info?: unknown }): Promise<NavigationHistoryEntry>;
    /** 后退 */
    back(options?: { info?: unknown }): Promise<NavigationHistoryEntry>;
    /** 导航 */
    navigate(
        url: string,
        options?: { info?: unknown; history?: 'push' | 'replace' },
    ): Promise<NavigationHistoryEntry>;
    /** 重新加载 */
    reload(options?: { info?: unknown }): Promise<NavigationHistoryEntry>;
    /** 更新当前条目 */
    updateCurrentEntry(options: { state: unknown }): void;
    /** 监听 navigate 事件 */
    addEventListener(
        type: 'navigate',
        listener: (event: NavigateEvent) => void,
        options?: boolean | AddEventListenerOptions,
    ): void;
    /** 监听 currententrychange 事件 */
    addEventListener(
        type: 'currententrychange',
        listener: (event: Event) => void,
        options?: boolean | AddEventListenerOptions,
    ): void;
    /** 移除 navigate 事件监听 */
    removeEventListener(
        type: 'navigate',
        listener: (event: NavigateEvent) => void,
        options?: boolean | EventListenerOptions,
    ): void;
    /** 移除 currententrychange 事件监听 */
    removeEventListener(
        type: 'currententrychange',
        listener: (event: Event) => void,
        options?: boolean | EventListenerOptions,
    ): void;
}

declare var Navigation: {
    prototype: Navigation;
    new (): Navigation;
};

interface Window {
    /** Navigation API */
    navigation: Navigation;
}
