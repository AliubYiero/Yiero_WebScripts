/**
 * 接口: uiImporter 选项
 */
export interface IUiImporterOption {
    /**
     * 是否默认将解析的 Css 添加到页面中
     *
     * @default true
     */
    isAppendCssToDocument: boolean;

    /**
     * 是否默认将解析的 html Dom 树添加到页面中
     *
     * @default true
     */
    isAppendHtmlToDocument: boolean;
    /**
     * 解析的 html Dom 树加载到页面中的容器.
     *
     * 该属性只有在 `isAppendHtmlToDocument = true` 时才会生效.
     *
     * @default document.body
     */
    appendHtmlContainer: HTMLElement;

    /**
     * 是否过滤解析到的  script 标签元素
     *
     * @default true
     */
    isFilterScriptNode: boolean;
}

/**
 * 接口: uiImporter 返回值
 */
export interface IUiImporterResult {
    styleNode?: HTMLStyleElement;
    appendNodeList: HTMLElement[];
}

/**
 * 解析 html 字符串, 返回 DocumentFragment
 *
 * @param htmlContent html文本内容
 * @param [cssContent] css文本内容
 * @param [options] 选项
 *
 * @warn 需要授权函数 `GM_addStyle`
 */
export const uiImporter = (
    htmlContent: string,
    cssContent?: string,
    options?: Partial<IUiImporterOption>,
): IUiImporterResult => {
    // 解析参数
    const {
        isAppendCssToDocument = true,
        isAppendHtmlToDocument = true,
        appendHtmlContainer = window.document.body,
        isFilterScriptNode = true,
    } = options || {};

    // 判断: 添加 CSS 到页面中
    const styleNode =
        (cssContent && isAppendCssToDocument && GM_addStyle(cssContent)) ||
        void 0;

    // 解析Dom内容
    const domParser = new DOMParser();
    const uiDoc = domParser.parseFromString(htmlContent, 'text/html');
    const documentFragment = new DocumentFragment();
    let nodeList: HTMLElement[] = Array.from(
        uiDoc.body.children,
    ) as HTMLElement[];
    // 判断: 是否过滤 Script 节点
    if (isFilterScriptNode) {
        nodeList = nodeList.filter((node) => node.nodeName !== 'SCRIPT');
    }
    documentFragment.append(...nodeList);

    // 判断: 添加 Dom 节点到页面中
    isAppendHtmlToDocument && appendHtmlContainer.append(documentFragment);

    return {
        styleNode: styleNode,
        appendNodeList: nodeList,
    };
};
