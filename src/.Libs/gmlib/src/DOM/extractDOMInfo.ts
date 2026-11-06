import type { ExtractedResult, ExtractRule } from './types/ExtractRule';

/**
 * 表单元素标签名集合
 */
const FORM_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

/**
 * 解析单个元素的值
 *
 * @param targetEl - 目标元素
 * @param rule - 提取规则
 * @returns 解析后的值
 */
function parseValue(
    targetEl: HTMLElement | null,
    rule: ExtractRule,
): string | number | boolean | HTMLElement | null {
    // 防御：元素不存在直接返回默认值
    if (!targetEl) {
        return rule.defaultValue ?? null;
    }

    const type = rule.type || 'string';

    // type: element 直接返回元素本身
    if (type === 'element') {
        return targetEl;
    }

    let rawValue: string | null = null;
    const isFormTag = FORM_TAGS.has(targetEl.tagName);

    // ---------------- 取值阶段 ----------------
    if (rule.attribute) {
        // 策略 A: 通过 attribute 获取
        if (Array.isArray(rule.attribute)) {
            // Fallback 机制：按顺序查找第一个存在的属性
            for (const attr of rule.attribute) {
                const val = targetEl.getAttribute(attr);
                if (val !== null) {
                    rawValue = val;
                    break;
                }
            }
        } else {
            rawValue = targetEl.getAttribute(rule.attribute);
        }
    } else {
        // 策略 B: 自动推断获取
        if (isFormTag) {
            // 表单元素读取 .value
            rawValue = (targetEl as HTMLInputElement).value;
        } else if (type === 'url') {
            // URL 类型优先读取 href
            rawValue =
                (targetEl as HTMLAnchorElement).href || targetEl.textContent;
        } else {
            // 默认读取 textContent
            rawValue = targetEl.textContent;
        }
    }

    // ---------------- 转换阶段 ----------------
    switch (type) {
        case 'number': {
            if (rawValue === null) {
                return rule.defaultValue ?? null;
            }
            const trimmed = rawValue.trim();
            if (trimmed === '') {
                return rule.defaultValue ?? null;
            }
            const num = Number(trimmed);
            return Number.isNaN(num) ? (rule.defaultValue ?? null) : num;
        }

        case 'boolean': {
            if (rule.attribute) {
                // 属性存在即视为 true，除非值明确为 'false' 或 '0'
                if (rawValue === null) {
                    return rule.defaultValue ?? false;
                }
                return rawValue !== 'false' && rawValue !== '0';
            } else {
                // DOM 状态判断
                if (isFormTag && 'checked' in targetEl) {
                    return (targetEl as HTMLInputElement).checked;
                }
                const str = (rawValue || '').trim().toLowerCase();
                return str === 'true' || str === '1';
            }
        }

        default:
            return rawValue === null
                ? (rule.defaultValue ?? null)
                : rawValue.trim();
    }
}

/**
 * 从 DOM 中提取数据（选择器字符串模式）
 *
 * @param selector - CSS 选择器，用于定位目标元素
 * @param rule - 提取规则
 * @returns 键值对数据对象
 *
 * @example
 * ```typescript
 * const result = extractDOMInfo('.name', { key: 'name' });
 * // result = { name: '张三' }
 * ```
 */
export function extractDOMInfo<T extends Omit<ExtractRule, 'selector'>>(
    selector: string,
    rule: T,
    // biome-ignore lint/suspicious/noExplicitAny: 泛型结果类型需与 ExtractedResult 一致
): { [K in T['key']]: any };
/**
 * 从根节点中批量提取 DOM 数据（根元素模式）
 *
 * @param root - 查询的根元素
 * @param rules - 提取规则（单个或数组）
 * @returns 键值对数据对象
 *
 * @example
 * ```typescript
 * const userData = extractDOMInfo(document.body, [
 *   { key: 'name', selector: '.name' },
 *   { key: 'age', selector: '.age', type: 'number' },
 * ]);
 * ```
 */
export function extractDOMInfo<T extends ExtractRule>(
    root: HTMLElement,
    rules: T | T[],
): ExtractedResult<T>;
/**
 * 实现签名
 */
export function extractDOMInfo(
    selectorOrRoot: string | HTMLElement,
    // biome-ignore lint/suspicious/noExplicitAny: TypeScript 实现签名惯例
    ruleOrRules: any,
    // biome-ignore lint/suspicious/noExplicitAny: TypeScript 实现签名惯例
): any {
    // 选择器字符串模式：从 document 查询单个元素
    if (typeof selectorOrRoot === 'string') {
        const selector = selectorOrRoot;
        const rule = ruleOrRules;
        const fullRule: ExtractRule = { ...rule, selector };
        const targetEl = document.querySelector<HTMLElement>(selector);
        return { [rule.key]: parseValue(targetEl, fullRule) };
    }

    // 根元素模式：从 root 批量查询
    const root = selectorOrRoot;
    const rules = Array.isArray(ruleOrRules) ? ruleOrRules : [ruleOrRules];
    // biome-ignore lint/suspicious/noExplicitAny: 内部实现需要灵活类型
    const result: Record<string, any> = {};

    // 性能优化：选择器结果缓存池
    const elementCache: Record<string, HTMLElement | null> = {};

    for (const rule of rules) {
        // 优先读缓存，未命中则查询并存入缓存（包含 null 结果也缓存）
        if (!(rule.selector in elementCache)) {
            elementCache[rule.selector] = root.querySelector<HTMLElement>(
                rule.selector,
            );
        }

        const targetEl = elementCache[rule.selector];
        result[rule.key] = parseValue(targetEl, rule);
    }

    return result;
}
