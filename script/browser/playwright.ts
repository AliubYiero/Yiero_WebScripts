/**
 * Playwright 接入层。
 *
 * playwright-core 通过 sctl 暴露的 CDP 端点连上「独立配置」的浏览器：
 * 不用 Playwright 自带 Chromium，也不启动第二个浏览器。
 *
 * 该依赖在 devDependencies 里，但本仓库可能还没装（受网络/沙箱影响），
 * 所以这里用动态 import + 本地最小接口，没装时给出可执行的修复提示，
 * 而不是让整个 CLI 起不来。
 */

/** 动态 import 用的模块名（宽化类型，避免 tsc 在未安装时解析失败）。 */
const MODULE_NAME: string = 'playwright-core';

/** 浏览器对象（只声明用到的部分）。 */
export interface PlaywrightBrowser {
    contexts(): PlaywrightContext[];
    close(): Promise<void>;
}

/** 浏览器上下文。 */
export interface PlaywrightContext {
    pages(): PlaywrightPage[];
    newPage(): Promise<PlaywrightPage>;
}

/** 页面。 */
export interface PlaywrightPage {
    goto(
        url: string,
        options?: { waitUntil?: string; timeout?: number },
    ): Promise<unknown>;
    url(): string;
    title(): Promise<string>;
    screenshot(options: { path: string }): Promise<unknown>;
    close(): Promise<void>;
}

/** chromium 入口。 */
export interface PlaywrightChromium {
    connectOverCDP(
        url: string,
        options?: unknown,
    ): Promise<PlaywrightBrowser>;
}

/** 接入结果。 */
export interface PlaywrightAttachment {
    browser: PlaywrightBrowser;
    context: PlaywrightContext;
}

/** playwright-core 没装时抛这个，便于上层给出统一提示。 */
export class PlaywrightMissingError extends Error {
    constructor(cause: unknown) {
        super(
            [
                '没有加载到 playwright-core。',
                '在仓库根目录执行 pnpm install 后重试。',
                `（原始错误：${cause instanceof Error ? cause.message : String(cause)}）`,
            ].join('\n'),
        );
        this.name = 'PlaywrightMissingError';
    }
}

/** 加载 playwright-core 的 chromium。 */
export async function loadChromium(): Promise<PlaywrightChromium> {
    let loaded: unknown;
    try {
        loaded = await import(MODULE_NAME);
    } catch (error) {
        throw new PlaywrightMissingError(error);
    }

    const module = loaded as {
        chromium?: PlaywrightChromium;
        default?: { chromium?: PlaywrightChromium };
    };
    const chromium = module.chromium ?? module.default?.chromium;
    if (!chromium) {
        throw new PlaywrightMissingError(
            '模块里没有找到 chromium 导出',
        );
    }
    return chromium;
}

/** 连上 sctl 的 CDP 端点，并取第一个浏览器上下文。 */
export async function attach(
    cdpUrl: string,
): Promise<PlaywrightAttachment> {
    const chromium = await loadChromium();
    const browser = await chromium.connectOverCDP(cdpUrl);
    const context = browser.contexts()[0];
    if (!context) {
        throw new Error(
            '已连上浏览器，但拿不到任何浏览器上下文（context）。',
        );
    }
    return { browser, context };
}

/**
 * 接管时的目标页面。
 *
 * 带 `url` 时新开一页；不带时取最近打开的页面。Playwright 没有
 * 公开「最近打开」的 API，`context.pages()` 也不保证顺序，这里
 * 只能取数组最后一项作最佳近似。
 * 没有页面时返回 null。
 */
export async function resolveAttachPage(
    context: PlaywrightContext,
    url: string | undefined,
): Promise<PlaywrightPage | null> {
    if (url !== undefined) {
        return context.newPage();
    }

    return context.pages().at(-1) ?? null;
}

/** 汇总当前上下文里的页面，供 CLI 打印。 */
export function describeContext(context: PlaywrightContext): {
    pages: number;
    urls: string[];
} {
    const pages = context.pages();
    return {
        pages: pages.length,
        urls: pages.map((page) => page.url()),
    };
}
