import { getJson } from '../../util/xhrRequest.ts';
import { IPPlayerPageListResponse } from '../../interface/IPPlayerPageListResponse.ts';
import { elementWaiter } from '@yiero/gmlib';

const api_getPlayerPageList = (aid: number) => {
    return getJson<IPPlayerPageListResponse>(
        `https://api.bilibili.com/x/player/pagelist?aid=${aid}`,
    );
};

/**
 * 获取视频的 Cid
 */
export const getCid = async (aid: number): Promise<number> => {
    // 获取当前视频的分P级数
    const linkUrlNode = await elementWaiter<HTMLLinkElement>(
        'link[rel="canonical"]',
    );
    const page =
        Number(new URL(linkUrlNode.href).searchParams.get('p') || 1) -
        1;

    // 获取当前视频的分P cid编号
    const playerPageListResponse = await api_getPlayerPageList(aid);
    const currentPageInfo = playerPageListResponse.data[page];
    if (!currentPageInfo) return 0;
    return currentPageInfo.cid;
};
