import type {
    IRouteChangeEvent,
    NavigationType,
    RouteChangeCallback,
    Unsubscribe,
} from './types/RouteChange';

export type {
    IRouteChangeEvent,
    NavigationType,
    RouteChangeCallback,
    Unsubscribe,
} from './types/RouteChange';

// ============================================================================
// 全局状态（单例模式）
// ============================================================================

/** 当前回调函数 */
let currentCallback: RouteChangeCallback | null = null;

/** 原始 history.pushState 方法 */
let originalPushState: typeof history.pushState | null = null;

/** 原始 history.replaceState 方法 */
let originalReplaceState: typeof history.replaceState | null = null;

/** 是否已初始化降级方案 */
let isFallbackInitialized = false;

/** popstate 事件处理器 */
let popstateHandler: ((event: PopStateEvent) => void) | null = null;

/** hashchange 事件处理器 */
let hashchangeHandler: ((event: HashChangeEvent) => void) | null = null;

// ============================================================================
// Navigation API 检测
// ============================================================================

/**
 * 检测浏览器是否支持 Navigation API
 *
 * @returns 是否支持 Navigation API
 */
function isNavigationSupported(): boolean {
    return (
        'navigation' in window &&
        window.navigation instanceof
            (window as unknown as { Navigation: typeof Navigation }).Navigation
    );
}

// ============================================================================
// 路由事件触发
// ============================================================================

/**
 * 触发路由变化回调
 *
 * @param to 目标 URL
 * @param type 导航类型
 * @param info 导航信息（可选）
 * @param intercept 拦截函数（可选）
 * @param from 来源 URL（可选，默认为当前 location.href）
 */
function triggerCallback(
    to: string,
    type: NavigationType,
    info?: unknown,
    intercept?: (handler: () => Promise<void> | void) => void,
    from?: string,
): void {
    if (!currentCallback) {
        return;
    }

    const event: IRouteChangeEvent = {
        to,
        from: from ?? window.location.href,
        type,
        info,
        intercept,
    };

    currentCallback(event);
}

// ============================================================================
// Navigation API 方案
// ============================================================================

/**
 * 使用 Navigation API 监听路由变化
 *
 * @param callback 路由变化回调
 * @returns 取消监听函数
 */
function setupNavigationApi(callback: RouteChangeCallback): Unsubscribe {
    currentCallback = callback;

    const handleNavigate = (event: NavigateEvent): void => {
        triggerCallback(
            event.destination.url,
            event.navigationType as NavigationType,
            event.info,
            event.canIntercept
                ? (handler: () => Promise<void> | void) => {
                      event.intercept({ handler });
                  }
                : undefined,
        );
    };

    window.navigation.addEventListener('navigate', handleNavigate);

    return () => {
        window.navigation.removeEventListener('navigate', handleNavigate);
        currentCallback = null;
    };
}

// ============================================================================
// 降级方案
// ============================================================================

/**
 * 初始化降级方案
 *
 * 重写 history.pushState 和 history.replaceState，
 * 并添加 popstate 和 hashchange 事件监听
 */
function initFallback(): void {
    // 保存原始方法
    originalPushState = history.pushState;
    originalReplaceState = history.replaceState;

    // 重写 pushState
    history.pushState = function (
        data: unknown,
        unused: string,
        url?: string | URL | null,
    ): void {
        // 先记录 from URL（在 URL 改变之前）
        const fromUrl = window.location.href;

        // 执行原始方法
        originalPushState?.call(this, data, unused, url);

        // 构建完整 URL
        const fullUrl = url ? new URL(url, fromUrl).href : window.location.href;

        triggerCallback(fullUrl, 'push', undefined, undefined, fromUrl);
    };

    // 重写 replaceState
    history.replaceState = function (
        data: unknown,
        unused: string,
        url?: string | URL | null,
    ): void {
        // 先记录 from URL（在 URL 改变之前）
        const fromUrl = window.location.href;

        // 执行原始方法
        originalReplaceState?.call(this, data, unused, url);

        // 构建完整 URL
        const fullUrl = url ? new URL(url, fromUrl).href : window.location.href;

        triggerCallback(fullUrl, 'replace', undefined, undefined, fromUrl);
    };

    // 监听 popstate（前进/后退）
    popstateHandler = (): void => {
        triggerCallback(window.location.href, 'traverse');
    };
    window.addEventListener('popstate', popstateHandler);

    // 监听 hashchange
    hashchangeHandler = (): void => {
        triggerCallback(window.location.href, 'hash');
    };
    window.addEventListener('hashchange', hashchangeHandler);

    isFallbackInitialized = true;
}

/**
 * 清理降级方案
 *
 * 恢复原始 history 方法，移除事件监听
 */
function cleanupFallback(): void {
    // 恢复原始 history 方法
    if (originalPushState) {
        history.pushState = originalPushState;
        originalPushState = null;
    }
    if (originalReplaceState) {
        history.replaceState = originalReplaceState;
        originalReplaceState = null;
    }

    // 移除事件监听
    if (popstateHandler) {
        window.removeEventListener('popstate', popstateHandler);
        popstateHandler = null;
    }
    if (hashchangeHandler) {
        window.removeEventListener('hashchange', hashchangeHandler);
        hashchangeHandler = null;
    }

    isFallbackInitialized = false;
}

/**
 * 使用降级方案监听路由变化
 *
 * @param callback 路由变化回调
 * @returns 取消监听函数
 */
function setupFallback(callback: RouteChangeCallback): Unsubscribe {
    // 更新回调（单例模式：替换之前的）
    currentCallback = callback;

    // 首次调用时初始化
    if (!isFallbackInitialized) {
        initFallback();
    }

    return () => {
        currentCallback = null;
        cleanupFallback();
    };
}

// ============================================================================
// 主函数
// ============================================================================

/**
 * 监听页面路由变化
 *
 * 统一监听页面路由变化，支持：
 * - `history.pushState` 调用
 * - `history.replaceState` 调用
 * - 浏览器前进/后退（popstate）
 * - hash 变化（hashchange）
 *
 * **浏览器兼容性**：
 * - 现代浏览器使用 Navigation API（Chrome 102+）
 * - 降级方案：重写 history 方法 + 事件监听
 *
 * **单例模式**：只允许一个监听器存在，新调用会替换之前的监听器。
 *
 * **恢复机制**：调用 Unsubscribe 会恢复原始的 history 方法。
 *
 * @param callback 路由变化时的回调函数
 * @returns 取消监听并恢复原始方法的函数
 *
 * @example
 * // 基本用法
 * const unsubscribe = onRouteChange((event) => {
 *   console.log('路由变化:', event.type);
 *   console.log('从:', event.from);
 *   console.log('到:', event.to);
 * });
 *
 * @example
 * // 根据导航类型处理
 * const unsubscribe = onRouteChange((event) => {
 *   switch (event.type) {
 *     case 'push':
 *       console.log('pushState 导航');
 *       break;
 *     case 'replace':
 *       console.log('replaceState 导航');
 *       break;
 *     case 'traverse':
 *       console.log('前进/后退');
 *       break;
 *     case 'hash':
 *       console.log('hash 变化');
 *       break;
 *   }
 * });
 *
 * @example
 * // 拦截导航（仅 Navigation API 支持）
 * const unsubscribe = onRouteChange((event) => {
 *   if (event.intercept) {
 *     event.intercept(async () => {
 *       // 自定义导航处理
 *       await loadPage(event.to);
 *     });
 *   }
 * });
 *
 * @example
 * // 取消监听
 * const unsubscribe = onRouteChange((event) => {
 *   handleRouteChange(event);
 * });
 *
 * // 之后取消监听
 * unsubscribe();
 */
export function onRouteChange(callback: RouteChangeCallback): Unsubscribe {
    // Navigation API 方案
    if (isNavigationSupported()) {
        return setupNavigationApi(callback);
    }

    // 降级方案
    return setupFallback(callback);
}
