import {
    KeyboardKey,
    simulateClick,
    simulateKeyboard,
} from '@yiero/gmlib';

/** 点击翻页配置 */
interface ClickAction {
    type: 'click';
    /** CSS 选择器 */
    selector: string;
}

/** 键盘翻页配置 */
interface KeyboardAction {
    type: 'keyboard';
    /** 按键名称 */
    key: KeyboardKey;
}

/** 翻页动作配置 */
type PageTurnerAction = ClickAction | KeyboardAction;

/** 翻页器配置 */
interface PageTurnerConfig {
    /** 匹配规则: 精确 host / 通配符 / 正则 */
    match: string | RegExp;
    /** 翻页动作 */
    action: PageTurnerAction;
}

/** 内置翻页配置 */
const defaultConfigs: PageTurnerConfig[] = [
    // 可在此处继续扩展更多网站...
];

/** 用户注册的翻页配置 */
const customConfigs: PageTurnerConfig[] = [];

/**
 * 判断 host 是否匹配规则
 * @param rule 匹配规则
 * @param host 当前页面 host
 * @returns 是否匹配
 */
const isMatch = (rule: string | RegExp, host: string): boolean => {
    if (rule instanceof RegExp) {
        return rule.test(host);
    }

    // 通配符匹配: *.example.com
    if (rule.startsWith('*.')) {
        const domain = rule.slice(2); // 移除 '*.'
        return host === domain || host.endsWith('.' + domain);
    }

    // 精确匹配
    return host === rule;
};

/**
 * 查找当前页面的翻页配置
 * @returns 匹配的翻页配置，无匹配返回 null
 */
const findConfig = (): PageTurnerConfig | null => {
    const host = window.location.host;

    // 优先查找用户注册的配置
    const customMatch = customConfigs.find((config) =>
        isMatch(config.match, host),
    );
    if (customMatch) {
        return customMatch;
    }

    // 再查找内置配置
    return (
        defaultConfigs.find((config) =>
            isMatch(config.match, host),
        ) ?? null
    );
};

/**
 * 执行翻页
 * 根据当前页面 host 匹配配置，执行对应的翻页动作
 * @returns 是否成功执行翻页
 */
export const turnPage = (): boolean => {
    const config = findConfig();

    // 无匹配配置，使用默认键盘翻页
    if (!config) {
        simulateKeyboard({
            key: 'ArrowRight',
            code: 'ArrowRight',
            keyCode: 39,
            bubbles: true,
            cancelable: true,
        });
        return true;
    }

    // 执行翻页动作
    if (config.action.type === 'click') {
        const button = document.querySelector<HTMLElement>(
            config.action.selector,
        );
        if (button) {
            simulateClick(button, {
                bubbles: true,
                cancelable: true,
            });
            return true;
        }
        return false; // 元素不存在
    }

    if (config.action.type === 'keyboard') {
        simulateKeyboard({
            key: config.action.key,
            bubbles: true,
            cancelable: true,
        });
        return true;
    }

    return false;
};

/**
 * 检查当前页面是否有翻页配置
 * @returns 是否有匹配的配置
 */
export const hasPageTurnerConfig = (): boolean => {
    return findConfig() !== null;
};
