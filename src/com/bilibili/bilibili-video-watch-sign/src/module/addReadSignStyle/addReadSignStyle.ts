import styleContent from './readSignStyle.css?raw';

/**
 * 添加已看标记样式到页面中
 */
export const addReadSignStyle = () => {
    return GM_addStyle(styleContent);
};
