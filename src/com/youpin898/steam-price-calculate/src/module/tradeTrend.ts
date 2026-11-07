import { gmRequest } from '@yiero/gmlib';

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
 * 趋势接口返回的单个成交点
 */
export type TradeTrendItem = {
    time: string;
    price: number;
    localDate: string;
    proportion: number;
    sourceType: number;
};

/**
 * 价格走势接口响应
 *
 * 用 `type` 而非 `interface`: 请求封装要求泛型参数满足可索引的
 * 记录类型, `interface` 没有隐式索引签名, 会编译不过.
 */
export type TradeTrendResponse = {
    code: number;
    msg: string;
    data: {
        tradeDataList: TradeTrendItem[];
        tradePriceList: string[];
        blockNum: number;
    };
};

/**
 * 近 7 日 / 近 30 日的成交点数量, `null` 表示该窗口取不到数据
 */
export type TradeCount = {
    sevenDay: number | null;
    thirtyDay: number | null;
};

/**
 * 把成交数量格式化为待渲染的文本行
 *
 * @param count 近 7 日与近 30 日的成交数量
 */
export const formatTradeCount = (count: TradeCount): string[] => {
    // 7 日缺失时整块不渲染, 调用方据空数组判断
    if (count.sevenDay === null) {
        return [];
    }

    const lines = [`近7日 ${count.sevenDay} 次交易`];

    if (count.thirtyDay !== null) {
        lines.push(`近30日 ${count.thirtyDay} 次交易`);
    }

    return lines;
};

/**
 * 会话级缓存: 按 templateId 去重, 只保留成功结果
 *
 * 详情页在售 / 租赁 / 走势之间切换会重复触发详情接口,
 * 缓存把重复请求压掉, 降低限流风险.
 */
const tradeCountCache = new Map<number, Promise<TradeCount | null>>();

/**
 * 从页面 Cookie 读取登录票据 `uu_token`
 *
 * @returns 登录票据, 未登录时为 `null`
 */
const readLoginToken = (): string | null => {
    const cookieItem = document.cookie
        .split(';')
        .map((item) => item.trim())
        .find((item) => item.startsWith('uu_token='));

    if (!cookieItem) {
        return null;
    }

    const token = cookieItem.slice('uu_token='.length);
    return token || null;
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
 * 未登录时不发请求; 7 日取不到时整体返回 `null`;
 * 结果按 templateId 在会话内缓存, 失败结果不缓存, 下次可重试.
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

    const pending = (async (): Promise<TradeCount | null> => {
        const token = readLoginToken();
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
    })();

    const result = pending.then(
        (count) => {
            // 只缓存成功结果, 失败留给下次请求重试
            if (count === null) {
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
