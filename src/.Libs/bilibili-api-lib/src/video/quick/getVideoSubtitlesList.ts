import type {
    GetVideoSubtitlesListResult,
    VideoSubtitleItemWithGetContent,
} from '@/video';
import {
    api_getPlayerInfo,
    api_getSubtitleContent,
    api_getVideoInfo,
} from '@/video';
import { getVideoId } from '@/video/getVideoId';
import type { SubtitleElement } from '../interfaces/IPlayerInfo';

/**
 * 语言优先级映射
 *
 * 根据语言显示名称判断优先级：
 * - 0: 中文（包括简体、繁体）
 * - 1: 英文
 * - 2: 其他语言
 */
function lanDocOrder(lan_doc: string): number {
    // 中文优先级最高
    if (/中文|简体|繁体|zh[-_]?/i.test(lan_doc)) return 0;
    // 英文次之
    if (/英语|英文|en[-_]?/i.test(lan_doc)) return 1;
    // 其他语言排最后
    return 2;
}

/**
 * 字幕排序比较器
 *
 * 排序规则：
 * 1. 按语言优先级：中文 > 英文 > 其他
 * 2. 同语言下：非 AI 字幕排在 AI 字幕前面
 * 3. 保持原有顺序（稳定排序）
 */
function compareSubtitleItems(
    a: VideoSubtitleItemWithGetContent,
    b: VideoSubtitleItemWithGetContent,
): number {
    // 先按语言优先级排序
    const orderA = lanDocOrder(a.lan_doc);
    const orderB = lanDocOrder(b.lan_doc);
    if (orderA !== orderB) {
        return orderA - orderB;
    }

    // 同优先级下：不含 "ai" 的排在前面
    const aIsAi = /ai/i.test(a.lan);
    const bIsAi = /ai/i.test(b.lan);
    if (aIsAi !== bIsAi) {
        return aIsAi ? 1 : -1;
    }

    // 其他情况保持原序
    return 0;
}

/**
 * 获取视频字幕列表（带快捷调用）
 *
 * 获取指定视频某分P的字幕列表，并按 "中文 > 英文 > 其它 / 不含 ai > 含 ai" 规则排序。
 * 每条字幕附带 getContent() 方法，可直接获取字幕正文内容。
 *
 * @param id - 视频 ID，支持 BV 号（字符串，以 BV 开头）或 AV 号（数字）。如果不提供，则从当前页面 URL 自动获取
 * @param part - 分P序号，默认为 1（第一P）
 * @param login - 是否携带登录信息，默认 true
 * @returns 包含视频信息和排序后字幕列表的结果
 *
 * @example
 * ```typescript
 * // 获取当前页面视频的字幕列表
 * const result = await getVideoSubtitlesList();
 * console.log(result.title);           // 视频标题
 * console.log(result.subtitles.length); // 字幕数量
 *
 * // 获取 BV 号视频的字幕列表
 * const result = await getVideoSubtitlesList('BV1xx411c7mD');
 *
 * // 获取 AV 号视频的第 2 P 字幕
 * const result2 = await getVideoSubtitlesList(123456789, 2);
 *
 * // 获取第一个字幕的内容
 * if (result.subtitles.length > 0) {
 *   const subtitleContent = await result.subtitles[0].getContent();
 *   console.log(subtitleContent.body);  // 字幕行列表
 * }
 * ```
 */
export async function getVideoSubtitlesList(
    id?: string | number,
    part: number = 1,
    login: boolean = true,
): Promise<GetVideoSubtitlesListResult> {
    // 如果没有提供 id，从当前页面 URL 获取
    if (!id) {
        const videoId = getVideoId();
        if (!videoId) {
            throw new TypeError(
                'getVideoSubtitlesList: id 参数不能为空，请提供有效的 BV 号或 AV 号',
            );
        }
        id = videoId.avId;
        part = videoId.part;
    }

    // 1) 获取视频信息（pages、title、desc）
    const videoResponse = await api_getVideoInfo(id, login);
    const videoInfo = videoResponse.data;

    const { title, desc, pages, bvid, aid, owner } = videoInfo;
    const { mid: uid, face: upFace, name: upName } = owner;

    // 校验 pages 是否存在
    if (!pages || pages.length === 0) {
        throw new Error(`视频 ${id} 没有分P信息`);
    }

    // 2) 根据 part 找到对应的分P信息
    const pageItem = pages.find((p) => p.page === part);
    if (!pageItem) {
        throw new Error(
            `分P ${part} 不存在，视频共 ${pages.length}P`,
        );
    }

    const { cid, part: partTitle } = pageItem;

    // 3) 获取播放器信息，拿到字幕列表
    const playerResponse = await api_getPlayerInfo(id, cid, login);
    const playerInfo = playerResponse.data;

    // 4) 转换字幕列表，为每条字幕添加 getContent 方法
    const subtitles: VideoSubtitleItemWithGetContent[] = (
        playerInfo.subtitle?.subtitles ?? []
    ).map((sub: SubtitleElement) => {
        const subtitleUrl = sub.subtitle_url.startsWith('https')
            ? sub.subtitle_url
            : `https:${sub.subtitle_url}`;
        return {
            id: sub.id,
            lan: sub.lan,
            lan_doc: sub.lan_doc,
            is_lock: sub.is_lock,
            subtitle_url: sub.subtitle_url,
            subtitle_url_v2: sub.subtitle_url_v2,
            type: sub.type,
            id_str: sub.id_str,
            ai_type: sub.ai_type,
            ai_status: sub.ai_status,
            // 快捷调用：获取字幕正文
            getContent: () => api_getSubtitleContent(subtitleUrl),
        };
    });

    // 5) 按规则排序
    subtitles.sort(compareSubtitleItems);

    return {
        title,
        desc,
        partTitle,
        bvid,
        avid: aid,
        cid,
        part,
        uid,
        upFace,
        upName,
        subtitles,
    };
}
