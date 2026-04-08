# Animation Magnet Download

蜜柑计划批量复制磁链，并保存为 Markdown 文件。

> 自用脚本，不打算做兼容

## 功能

- 自动解析番剧页面中的磁力链接信息
- 为每个字幕组添加「导出磁链为 MD」按钮
- 批量提取磁力链接，按语言、画质、格式、更新时间排序
- 导出为格式化的 Markdown 文件

## 数据结构

```typescript
interface IAnimationInfo {
  fileName: string;      // 文件名
  magnetLink: string;    // 磁力链接
  language: ILanguage;   // 语言: '简体' | '繁体' | '双语' | 'UNKNOWN'
  quality: IQuality;     // 画质: '720P' | '1080P' | 'UNKNOWN'
  format: IFormat;       // 格式: 'MKV' | 'MP4' | 'UNKNOWN'
  fileSize: string;      // 文件大小
  updateTime: string;    // 更新时间
}
```

## 排序规则

导出的磁力链接按以下优先级排序：
1. 语言 (简体 > 繁体 > 双语 > UNKNOWN)
2. 画质 (1080P > 720P > UNKNOWN)
3. 更新时间 (越新越靠前)

## 使用方式

1. 访问 `https://mikanani.me/Home/Bangumi/*` 番剧页面
2. 点击字幕组标题旁的「导出磁链为 MD」按钮
3. 自动下载 Markdown 文件

## 输出示例

```markdown
# 加油吧！中村君!!
> - 字幕组: LoliHouse
> - 番剧链接: https://mikanani.me/Home/Bangumi/3917

## 简体-1080P-MKV

| 番剧名 | 大小 | 更新时间 | 下载链接 |
| ----- | ---- | ------ | ------- |
| `[LoliHouse] 加油！中村同学！！ - 02 [WebRip 1080p HEVC-10bit AAC]` | 515.3MB | 2026/04/06 17:42 | [#](magnet:...) |

## 磁力链接列表

magnet:?xt=urn:btih:...
```
