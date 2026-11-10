//  @ts-ignore 忽略直接引入 css 文本内容的类型检查
import quotaDanmakuStyle from './quotaDanmakuStyle.css?raw';

export const addQuotaDanmakuStyle = () => {
    GM_addStyle(quotaDanmakuStyle);
};
