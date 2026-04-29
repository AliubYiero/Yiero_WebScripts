import { IPlayerInfoResponse } from '../../interface/IPlayerInfoResponse.ts';

/**
 * 播放器基本数据
 */
export class PlayerInfo {
    private static playerInfo: IPlayerInfoResponse;

    static get() {
        return this.playerInfo;
    }

    static set(playerInfo: IPlayerInfoResponse) {
        this.playerInfo = playerInfo;
    }
}
