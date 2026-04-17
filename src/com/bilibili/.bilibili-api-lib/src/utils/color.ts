/**
 * 将十进制 RGB888 整数值转换为十六进制颜色格式 (#RRGGBB)
 * @param rgb - 十进制 RGB888 值 (0 ~ 16777215)
 * @returns 十六进制颜色字符串，如 "#FFFFFF"
 */
export function decimalRgb888ToHex(rgb: number): string {
    // 安全处理：截断小数 + 限制在 24 位有效范围内
    const val = Math.max(0, Math.min(16777215, Math.trunc(rgb)));

    // 位运算提取通道 (标准 RRGGBB 顺序)
    const r = (val >> 16) & 0xff;
    const g = (val >> 8) & 0xff;
    const b = val & 0xff;

    // 转为两位十六进制并补齐
    const toHex = (n: number) =>
        n.toString(16).padStart(2, '0').toUpperCase();

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
