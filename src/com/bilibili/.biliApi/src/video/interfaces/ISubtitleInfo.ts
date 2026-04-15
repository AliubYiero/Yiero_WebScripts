/**
 * 字幕信息接口
 *
 * 包含字幕文件的完整信息，包括样式配置和字幕行列表。
 */
export interface ISubtitleInfo {
  /** 字体大小（像素） */
  font_size: number;
  /** 字体颜色（十六进制格式） */
  font_color: string;
  /** 背景透明度（0-1） */
  background_alpha: number;
  /** 背景颜色（十六进制格式） */
  background_color: string;
  /** 描边样式 */
  Stroke: string;
  /** 字幕类型 */
  type: string;
  /** 语言代码 */
  lang: string;
  /** 字幕版本 */
  version: string;
  /** 字幕行列表 */
  body: ISubtitleLine[];
}

/**
 * 字幕行接口
 *
 * 表示单条字幕的时间范围和文本内容。
 */
export interface ISubtitleLine {
  /** 开始时间（秒） */
  from: number;
  /** 结束时间（秒） */
  to: number;
  /** 字幕 ID */
  sid: number;
  /** 字幕位置 */
  location: number;
  /** 字幕文本内容 */
  content: string;
  /** 是否为音乐字幕 */
  music: number;
}
