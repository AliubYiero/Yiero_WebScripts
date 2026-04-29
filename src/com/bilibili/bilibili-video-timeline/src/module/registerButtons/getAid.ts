import { elementWaiter } from '@yiero/gmlib';

/**
 * bvId 转 avId
 */
export const bvToAv = (bvid: `BV1${string}`) => {
    const codeConfig = {
        XOR_CODE: 23442827791579n,
        MASK_CODE: 2251799813685247n,
        MAX_AID: 1n << 51n,
        BASE: 58n,
        data: 'FcwAPNKTMug3GV5Lj7EJnHpWsx4tb8haYeviqBz6rkCy12mUSDQX9RdoZf',
    };

    const {
        MASK_CODE: MASK_CODE,
        XOR_CODE: XOR_CODE,
        data: data,
        BASE: BASE,
    } = codeConfig;

    const bvidArr = Array.from(bvid);
    [bvidArr[3], bvidArr[9]] = [bvidArr[9], bvidArr[3]];
    [bvidArr[4], bvidArr[7]] = [bvidArr[7], bvidArr[4]];
    bvidArr.splice(0, 3);
    const tmp = bvidArr.reduce(
        (pre, bvidChar) =>
            pre * BASE + BigInt(data.indexOf(bvidChar)),
        0n,
    );
    return Number((tmp & MASK_CODE) ^ XOR_CODE);
};

/**
 * 获取视频的 Aid
 */
export const getAid = async (): Promise<number> => {
    const urlMeta = await elementWaiter<HTMLMetaElement>(
        'meta[itemprop="url"]',
    );
    const urlPathname = new URL(urlMeta.content)
        .pathname as `/video/BV1${string}/`;
    const [_1, _2, bvId] = urlPathname.split('/');
    return bvToAv(bvId as `BV1${string}`);
};
