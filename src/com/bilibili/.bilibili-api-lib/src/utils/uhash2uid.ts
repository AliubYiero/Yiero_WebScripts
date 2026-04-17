/**
 * CRC32 爆破核心算法工厂函数
 * 内部构建彩虹表并实现基于高位截断的快速碰撞查找
 * @returns 包含 crack 方法的对象
 */
function make_crc32_cracker() {
    const POLY = 0xedb88320;
    const crc32_table = new Uint32Array(256);

    // 生成标准的 CRC32 查表
    function make_table() {
        for (let i = 0; i < 256; i++) {
            let crc = i;
            for (let _ = 0; _ < 8; _++) {
                if (crc & 1) {
                    crc = ((crc >>> 1) ^ POLY) >>> 0;
                } else {
                    crc = crc >>> 1;
                }
            }
            crc32_table[i] = crc;
        }
    }
    make_table();

    // 计算单字节的 CRC
    function update_crc(by: number, crc: number): number {
        return ((crc >>> 8) ^ crc32_table[(crc & 0xff) ^ by]) >>> 0;
    }

    // 计算数组的 CRC
    function compute(arr: number[], init?: number): number {
        let crc = init || 0;
        for (let i = 0; i < arr.length; i++) {
            crc = update_crc(arr[i], crc);
        }
        return crc;
    }

    // 预计算 0-99999 的 CRC32 彩虹表
    function make_rainbow(N: number): Uint32Array {
        const rainbow = new Uint32Array(N);
        for (let i = 0; i < N; i++) {
            const arr = i
                .toString()
                .split('')
                .map((c) => c.charCodeAt(0));
            rainbow[i] = compute(arr);
        }
        return rainbow;
    }
    const rainbow_0 = make_rainbow(100000);

    // 预计算 0-99999 加上五个 '0' (ASCII 0x30) 后的 CRC 值
    const five_zeros = Array(5).fill(0x30);
    const rainbow_1 = rainbow_0.map((crc) => {
        return compute(five_zeros, crc);
    });

    // 构建基于高 16 位的哈希索引，用于加速后缀匹配
    const rainbow_pos = new Uint32Array(65537);
    const rainbow_hash = new Uint32Array(200000);

    function make_hash() {
        for (let i = 0; i < rainbow_0.length; i++) {
            rainbow_pos[rainbow_0[i] >>> 16]++;
        }
        for (let i = 1; i <= 65536; i++) {
            rainbow_pos[i] += rainbow_pos[i - 1];
        }
        for (let i = 0; i < rainbow_0.length; i++) {
            const po = --rainbow_pos[rainbow_0[i] >>> 16];
            rainbow_hash[po << 1] = rainbow_0[i];
            rainbow_hash[(po << 1) | 1] = i;
        }
    }

    // 根据残差查找可能的后 5 位数字
    function lookup(crc: number): number[] {
        const results: number[] = [];
        const first = rainbow_pos[crc >>> 16];
        const last = rainbow_pos[1 + (crc >>> 16)];
        for (let i = first; i < last; i++) {
            if (rainbow_hash[i << 1] === crc)
                results.push(rainbow_hash[(i << 1) | 1]);
        }
        return results;
    }
    make_hash();

    // 核心爆破逻辑
    function crack(maincrc: number, max_digit: number): number[] {
        const results: number[] = [];
        maincrc = ~maincrc >>> 0;
        let basecrc = 0xffffffff;

        // 按位数递增爆破
        for (let ndigits = 1; ndigits <= max_digit; ndigits++) {
            basecrc = update_crc(0x30, basecrc); // 模拟每次增加一位 '0'

            if (ndigits < 6) {
                // 1-5位：直接遍历彩虹表比对
                const first_uid = 10 ** (ndigits - 1);
                const last_uid = 10 ** ndigits;
                for (let uid = first_uid; uid < last_uid; uid++) {
                    if (
                        maincrc ===
                        (basecrc ^ rainbow_0[uid]) >>> 0
                    ) {
                        results.push(uid);
                    }
                }
            } else {
                // 6-10位：前缀与后缀分离查找
                const first_prefix = 10 ** (ndigits - 6);
                const last_prefix = 10 ** (ndigits - 5);
                for (
                    let prefix = first_prefix;
                    prefix < last_prefix;
                    prefix++
                ) {
                    const rem =
                        (maincrc ^ basecrc ^ rainbow_1[prefix]) >>> 0;
                    const items = lookup(rem);
                    items.forEach((z) => {
                        results.push(prefix * 100000 + z); // 拼接前缀和后缀
                    });
                }
            }
        }
        return results;
    }

    return { crack };
}

// CRC32 cracker 单例
let crc32_cracker: ReturnType<typeof make_crc32_cracker> | null =
    null;

/**
 * 将 B站 midHash 逆向为可能的 UID 列表
 *
 * **⚠️ 注意：此操作会显著增加执行时间，建议在必要时才开启**
 *
 * @param uidhash - B站返回的十六进制 midHash 字符串
 * @param max_digit - 允许破解的最大 UID 位数，默认为 10 位
 * @returns 匹配到的可能的真实 UID 数组
 *
 * @example
 * ```typescript
 * const uids = uhash2uid('a16fe0dd');
 * console.log('可能的 UID:', uids);
 * ```
 */
export function uhash2uid(
    uidhash: string,
    max_digit: number = 10,
): number[] {
    // 延迟初始化单例，避免页面加载时阻塞
    if (!crc32_cracker) {
        crc32_cracker = make_crc32_cracker();
    }
    // 将十六进制转为十进制整数，并交由核心算法破解
    return crc32_cracker.crack(parseInt(uidhash, 16), max_digit);
}
