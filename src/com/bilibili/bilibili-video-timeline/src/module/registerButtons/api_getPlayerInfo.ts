import { IPlayerInfoResponse } from '../../interface/IPlayerInfoResponse.ts';
import { getJsonWithCredentials } from '../../util/xhrRequest.ts';

export const api_getPlayerInfo = (
    aid: number,
    cid: number,
): Promise<IPlayerInfoResponse> => {
    return getJsonWithCredentials<IPlayerInfoResponse>(
        `https://api.bilibili.com/x/player/wbi/v2?aid=${aid}&cid=${cid}`,
    );
};
