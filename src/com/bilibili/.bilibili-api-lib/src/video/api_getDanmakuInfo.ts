import { decimalRgb888ToHex } from '../utils/color.ts';
import { uhash2uid } from '../utils/uhash2uid.ts';
import type { XhrResponse } from '../xhrRequest.ts';
import { xhrRequest } from '../xhrRequest.ts';
import type {
    IDanmakuInfo,
    IDanmakuItem,
} from './interfaces/IDanmakuInfo.ts';

/**
 * 解析 B 站原始 XML 弹幕数据
 *
 * @param xmlString - XML 字符串
 * @param reverseUid - 是否将 midHash 逆向为 UID（默认为 false）
 * @returns 弹幕数组（按 startTime 升序排序）
 */
function parseDanmakuXml(
    xmlString: string,
    reverseUid: boolean = false,
): IDanmakuItem[] {
    // 移除 XML 中的非法控制字符
    const cleanedXml = xmlString.replace(
        // biome-ignore lint/suspicious/noControlCharactersInRegex: 移除 XML 中的非法控制字符
        /[\x00-\x08\x0b-\x0c\x0e-\x1f\x7f]/g,
        '',
    );

    const xmlDoc = new DOMParser().parseFromString(
        cleanedXml,
        'text/xml',
    );

    // 检测是否有解析错误
    const parseError = xmlDoc.querySelector('parsererror');
    if (parseError) {
        throw new Error(`XML 解析失败: ${parseError.textContent}`);
    }

    const danmakuList: IDanmakuItem[] = [];
    const elements = xmlDoc.getElementsByTagName('d');

    // 颜色缓存映射表，避免重复计算相同的颜色值
    const colorCache = new Map<number, string>();

    for (let i = 0; i < elements.length; i++) {
        const item = elements[i];
        const pAttr = item.getAttribute('p');
        if (!pAttr) continue;

        // p 属性格式：startTime,mode,size,color,date,pool,midHash,dmid[,level]
        const parts = pAttr.split(',');
        if (parts.length < 8) continue;

        const text = item.textContent || '';
        const colorValue = parseInt(parts[3], 10);

        // 使用缓存获取或计算颜色十六进制值
        let colorHex = colorCache.get(colorValue);
        if (!colorHex) {
            colorHex = decimalRgb888ToHex(colorValue);
            colorCache.set(colorValue, colorHex);
        }

        const danmakuItem: IDanmakuItem = {
            startTime: parseFloat(parts[0]),
            mode: parseInt(parts[1], 10),
            size: parseInt(parts[2], 10),
            color: colorValue,
            colorHex: colorHex,
            date: parseInt(parts[4], 10),
            pool: parseInt(parts[5], 10),
            midHash: parts[6],
            dmid: parts[7],
            text,
        };

        // 第9项：弹幕屏蔽等级（可选）
        if (parts.length >= 9) {
            danmakuItem.level = parseInt(parts[8], 10);
        }

        // 如果需要逆向 midHash 为 UID
        if (reverseUid) {
            danmakuItem.uid = uhash2uid(parts[6]);
        }

        danmakuList.push(danmakuItem);
    }

    // 按 startTime 升序排序
    danmakuList.sort((a, b) => a.startTime - b.startTime);

    return danmakuList;
}

/**
 * 获取视频弹幕数据
 *
 * 根据视频 CID 获取弹幕列表。弹幕数据以 XML 格式返回，本函数会自动解析为结构化数据并按出现时间排序。
 *
 * @param cid - 视频 CID（可通过 api_getVideoInfo 获取）
 * @param reverseUid - 是否将 midHash 逆向为 UID（默认为 false）。**⚠️ 警告：开启此选项会显著增加函数执行时间（可能增加几秒甚至更多），仅在必要时使用**
 * @returns 弹幕列表数据（按 startTime 升序排序）
 *
 * @example
 * ```typescript
 * // 获取视频 CID 后获取弹幕
 * const video = await api_getVideoInfo('BV1xx411c7mD');
 * const cid = video.data.cid;
 *
 * // 普通模式（推荐）
 * const danmaku = await api_getDanmakuInfo(cid);
 * console.log('弹幕数量:', danmaku.data.length);
 *
 * // 遍历弹幕
 * danmaku.data.forEach((item) => {
 *   console.log(`[${item.startTime}s] ${item.text}`);
 * });
 *
 * // 逆向 UID 模式（较慢）
 * const danmakuWithUid = await api_getDanmakuInfo(cid, true);
 * danmakuWithUid.data.forEach((item) => {
 *   console.log(`发送者 UID: ${item.uid?.join(' 或 ')}`);
 * });
 * ```
 *
 * @see [获取弹幕](https://socialsisteryi.github.io/bilibili-API-collect/docs/danmaku/danmaku_xml.html)
 */
export async function api_getDanmakuInfo(
    cid: number,
    reverseUid: boolean = false,
): Promise<XhrResponse<IDanmakuInfo>> {
    // 参数校验
    if (cid === undefined || cid === null) {
        throw new TypeError(
            'api_getDanmakuInfo: cid 参数不能为空，请提供有效的视频 CID',
        );
    }

    const url = `https://api.bilibili.com/x/v1/dm/list.so`;

    // 弹幕 API 返回 XML 格式，使用 text 响应类型
    const xmlString = await xhrRequest.getWithCredentials<string>(
        url,
        {
            params: {
                oid: String(cid),
            },
            responseType: 'text',
        },
    );

    // 解析 XML 为弹幕数组
    const danmakuList = parseDanmakuXml(
        xmlString as unknown as string,
        reverseUid,
    );

    // 包装为标准响应格式
    return {
        code: 0,
        message: 'success',
        ttl: 1,
        data: danmakuList,
    };
}

export type { IDanmakuInfo, IDanmakuItem };
