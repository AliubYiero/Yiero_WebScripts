/**
 * 危险属性列表，用于 XSS 防护
 */
const DANGEROUS_ATTRIBUTES = [
    'onabort',
    'onblur',
    'onchange',
    'onclick',
    'ondblclick',
    'onerror',
    'onfocus',
    'onkeydown',
    'onkeypress',
    'onkeyup',
    'onload',
    'onmousedown',
    'onmousemove',
    'onmouseout',
    'onmouseover',
    'onmouseup',
    'onreset',
    'onresize',
    'onselect',
    'onsubmit',
    'onunload',
    'oncontextmenu',
    'oninput',
    'oninvalid',
    'ondrag',
    'ondrop',
    'onscroll',
];

/**
 * 净化 HTML 元素，移除危险属性
 */
const sanitizeElement = (element: Element): void => {
    // 移除所有危险事件属性
    DANGEROUS_ATTRIBUTES.forEach((attr) => {
        if (element.hasAttribute(attr)) {
            element.removeAttribute(attr);
        }
    });

    // 递归处理子元素
    Array.from(element.children).forEach((child) => {
        sanitizeElement(child);
    });
};

/**
 * 创建 UI
 */
export const uiCreator = (
    htmlContent: string,
    cssContent?: string,
): HTMLElement[] => {
    // 添加 CSS 到页面中
    if (cssContent) {
        GM_addStyle(cssContent);
    }

    // 解析Dom内容, 添加到页面中
    const domParser = new DOMParser();
    const uiDoc = domParser.parseFromString(htmlContent, 'text/html');
    const documentFragment = new DocumentFragment();
    const filterScriptNodeList = Array.from(
        uiDoc.body.children,
    ).filter((node) => node.nodeName !== 'SCRIPT');

    // 净化所有节点，移除危险属性
    filterScriptNodeList.forEach((node) => {
        sanitizeElement(node);
    });

    documentFragment.append(...filterScriptNodeList);
    window.document.body.append(documentFragment);

    return filterScriptNodeList as HTMLElement[];
};
