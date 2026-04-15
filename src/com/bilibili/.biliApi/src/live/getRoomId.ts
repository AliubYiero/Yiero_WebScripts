/**
 * 获取B站直播间ID
 *
 * 从当前页面URL中提取直播间ID。
 * 适用于在直播间页面直接调用。
 *
 * @returns 直播间ID（数字类型），如果未找到则返回 undefined
 *
 * @example
 * ```typescript
 * // 当前URL: https://live.bilibili.com/12345
 * const roomId = getRoomId();
 * console.log(roomId); // 12345
 *
 * // 当前URL: https://live.bilibili.com/blanc/67890
 * const roomId = getRoomId();
 * console.log(roomId); // 67890
 * ```
 */
export const getRoomId = (): number | undefined => {
  const roomId = new URL(document.URL).pathname
    .split('/')
    .find((item) => /^\d+$/.test(item));
  if (!roomId) {
    return undefined;
  }

  return Number(roomId);
};
