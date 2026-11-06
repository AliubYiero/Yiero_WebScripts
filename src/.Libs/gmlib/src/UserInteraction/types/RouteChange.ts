/**
 * 导航类型
 *
 * 标识触发路由变化的来源
 */
export type NavigationType =
    /** history.pushState 调用 */
    | 'push'
    /** history.replaceState 调用 */
    | 'replace'
    /** 浏览器前进/后退 (popstate) */
    | 'traverse'
    /** hash 变化 (hashchange) */
    | 'hash';

/**
 * 路由变化事件信息
 */
export interface IRouteChangeEvent {
    /** 目标 URL */
    to: string;
    /** 来源 URL */
    from: string;
    /** 导航类型 */
    type: NavigationType;
    /** 导航信息 (Navigation API 专属，需浏览器支持) */
    info?: unknown;
    /**
     * 拦截导航 (Navigation API 专属，需浏览器支持)
     *
     * 调用此函数可以拦截导航，执行自定义处理逻辑
     */
    intercept?: (handler: () => Promise<void> | void) => void;
}

/**
 * 路由变化回调函数类型
 *
 * @param event 路由变化事件信息
 */
export type RouteChangeCallback = (event: IRouteChangeEvent) => void;

/**
 * 取消监听函数类型
 *
 * 调用此函数会取消路由监听，并恢复原始的 history 方法
 */
export type Unsubscribe = () => void;
