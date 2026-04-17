// @ts-ignore 忽略 ?raw 引入
import sendTimeStyle from './sendTimeStyle.css?raw';

export const addSendTimeStyle = () => {
    sendTimeStyle && GM_addStyle(sendTimeStyle);
};
