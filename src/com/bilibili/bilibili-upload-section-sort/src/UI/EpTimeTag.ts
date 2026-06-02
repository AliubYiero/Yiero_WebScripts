import { formatDate } from '../util/formatDate.ts';
// @ts-ignore 忽略 ?raw 文本载入报错
import EP_TIME_TAG_STYLE from './EpTimeTagStyle.css?raw';

export const addEpTimeTagStyle = () => {
    GM_addStyle(EP_TIME_TAG_STYLE);
};

export const createEpTimeTag = (publishTime: number): HTMLElement => {
    const timeTag = document.createElement('div');
    timeTag.classList.add('ep-tag', 'ep-time-tag');
    timeTag.textContent = formatDate(publishTime);
    return timeTag;
};
