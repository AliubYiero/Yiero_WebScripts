import { IPlayerInfoResponseDataSubtitleSubtitles } from '../../interface/IPlayerInfoResponse.ts';
import { ISubtitleData } from '../../interface/ISubtitleData.ts';

/**
 * 获取视频字幕数据
 */
export const getVideoSubtitleData = async (
    subtitle: IPlayerInfoResponseDataSubtitleSubtitles,
) => {
    const subtitleDate: ISubtitleData = await fetch(
        subtitle.subtitle_url,
    ).then((r) => r.json());
    return subtitleDate.body;
};
