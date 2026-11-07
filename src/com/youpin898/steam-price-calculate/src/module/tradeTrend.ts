import { getCookie, gmRequest } from '@yiero/gmlib';

/**
 * 价格走势接口地址
 */
const TREND_API_URL =
    'https://pc-api.youpin898.com/api/youpin/price/trend/data';

/**
 * 趋势接口的 orderType: 成交点
 */
const TREND_ORDER_TYPE = '13';

/**
 * 价格走势接口响应
 *
 * 只声明实际读取的字段: `tradeDataList` 仅用于取长度, 元素结构
 * 不参与计算, 因此用 `unknown[]`.
 *
 * 用 `type` 而非 `interface`: 请求封装要求泛型参数满足可索引的
 * 记录类型, `interface` 没有隐式索引签名, 会编译不过.
 */
export type TradeTrendResponse = {
    code: number;
    data: {
        tradeDataList: unknown[];
    };
};

/**
 * 近 7 日 / 近 30 日的成交点数量
 *
 * 近 7 日取不到时 `getTradeCount` 整体返回 `null`, 因此这里一定
 * 有值; 近 30 日取不到时为 `null`, 只少渲染 30 日那一行.
 */
export type TradeCount = {
    sevenDay: number;
    thirtyDay: number | null;
};

/**
 * 会话级缓存: 按 templateId 去重, 只保留两天都拿到的结果
 *
 * 详情页在售 / 租赁 / 走势之间切换会重复触发详情接口,
 * 缓存把重复请求压掉, 降低限流风险.
 */
const tradeCountCache = new Map<number, Promise<TradeCount | null>>();

/**
 * 从页面 Cookie 读取登录票据 `uu_token`
 *
 * 未登录时 `getCookie` 会 reject, 这里统一降级为 `null`,
 * 不把异常抛给调用方.
 *
 * @returns 登录票据, 未登录时为 `null`
 */
const readLoginToken = async (): Promise<string | null> => {
    // 空 cookie 会被 gmlib 当成域名去查 GM_cookie, 先挡掉
    const cookie = document.cookie;
    if (!cookie) {
        return null;
    }

    try {
        return await getCookie(cookie, 'uu_token');
    } catch {
        // key 不存在 / 空 cookie / 非 ScriptCat 环境
        return null;
    }
};

/**
 * 请求某个时间窗口的成交点数量
 *
 * @param templateId 饰品模板 id
 * @param day 时间窗口天数
 * @param token 登录票据
 *
 * @returns 成交点数量, 请求失败或响应异常时为 `null`
 */
const requestTradeCount = async (
    templateId: number,
    day: 7 | 30,
    token: string,
): Promise<number | null> => {
    try {
        const response = await gmRequest<TradeTrendResponse, unknown>(
            TREND_API_URL,
            'POST',
            {
                filterTemplateTypeNames: [],
                templateId: String(templateId),
                orderType: TREND_ORDER_TYPE,
                day,
                templateTypeName: '',
                customizeDay: false,
            },
            {
                // gmRequest 对配置是浅展开, 传了 headers 会整体
                // 替换默认头, 因此这里必须显式写出 Content-Type
                headers: {
                    'Content-Type': 'application/json',
                    authorization: token,
                },
            },
        );

        if (!response || response.code !== 0) {
            return null;
        }

        const tradeDataList = response.data?.tradeDataList;
        return Array.isArray(tradeDataList)
            ? tradeDataList.length
            : null;
    } catch {
        // 网络异常 / 超时 / 非 JSON 响应一律降级
        return null;
    }
};

/**
 * 获取近 7 日与近 30 日的成交点数量
 *
 * 未登录时不发请求; 7 日取不到时整体返回 `null`.
 * 只有两天都拿到的结果才进缓存, 任一天失败都留给下次进页面重试.
 *
 * @param templateId 饰品模板 id
 */
export const getTradeCount = (
    templateId: number,
): Promise<TradeCount | null> => {
    const cached = tradeCountCache.get(templateId);
    if (cached) {
        return cached;
    }

    const pendingFn = async (): Promise<TradeCount | null> => {
        const token = await readLoginToken();
        if (!token) {
            return null;
        }

        const [sevenDay, thirtyDay] = await Promise.all([
            requestTradeCount(templateId, 7, token),
            requestTradeCount(templateId, 30, token),
        ]);

        if (sevenDay === null) {
            return null;
        }

        return { sevenDay, thirtyDay };
    };
    const pending = pendingFn();

    const result = pending.then(
        (count) => {
            // 只缓存两天都拿到的结果: 30 日缺失同样视为失败,
            // 否则这次「部分成功」会让 30 日那行在整个 SPA
            // 会话里永久缺失, 切 tab 也不会重试.
            if (count === null || count.thirtyDay === null) {
                tradeCountCache.delete(templateId);
            }
            return count;
        },
        () => {
            // 意料之外的异常同样不入缓存
            tradeCountCache.delete(templateId);
            return null;
        },
    );

    tradeCountCache.set(templateId, result);
    return result;
};
