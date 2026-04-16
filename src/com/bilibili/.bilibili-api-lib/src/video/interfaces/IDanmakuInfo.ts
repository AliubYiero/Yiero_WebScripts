/**
 * 单条弹幕数据
 */
export interface IDanmakuItem {
  /** 弹幕出现时间（秒） */
  startTime: number;
  /** 弹幕类型：1-3 普通弹幕，4 底部弹幕，5 顶部弹幕，6 逆向弹幕，7 高级弹幕，8 代码弹幕，9 BAS弹幕 */
  mode: number;
  /** 弹幕字号：18 小，25 标准，36 大 */
  size: number;
  /** 弹幕颜色（十进制 RGB888 值） */
  color: number;
  /** 弹幕颜色（十六进制格式，如 #FFFFFF） */
  colorHex: string;
  /** 弹幕发送时间戳 */
  date: number;
  /** 弹幕池类型：0 普通池，1 字幕池，2 特殊池（代码/BAS弹幕） */
  pool: number;
  /** 发送者 mid 的 HASH（用于屏蔽用户和查看用户发送的所有弹幕） */
  midHash: string;
  /** 弹幕 ID（唯一，可用于操作参数） */
  dmid: string;
  /** 弹幕文本内容 */
  text: string;
  /** 弹幕屏蔽等级（0-10，可选） */
  level?: number;
  /**
   * midHash 逆向后的可能 UID 列表
   * 仅在开启 reverseUid 选项时填充，可能包含多个匹配的 UID
   * 由于 CRC32 是哈希算法，结果可能有多个值
   */
  uid?: number[];
}

/**
 * 弹幕信息响应数据
 */
export type IDanmakuInfo = IDanmakuItem[];
