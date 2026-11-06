# api_editSeasonSection

编辑 Bilibili 合集小节。

## 功能描述

编辑合集小节的标题，以及调整小节内视频的顺序。**需要登录状态**。

## 函数签名

```typescript
async function api_editSeasonSection(
  section: IEditSeasonSectionBody['section'],
  sorts: IEditSeasonSectionBody['sorts']
): Promise<XhrResponse<undefined>>
```

## 参数说明

| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| section | object | 是 | 小节信息对象 |
| section.id | number | 是 | 小节 ID |
| section.seasonId | number | 是 | 所属合集 ID |
| section.title | string | 否 | 小节标题（默认"正片"）|
| section.type | number | 是 | 类型，固定值为 1 |
| sorts | array | 是 | 视频排序数组 |
| sorts[].id | number | 是 | 合集内视频 ID |
| sorts[].sort | number | 是 | 排序位置（从1开始）|

## 返回值

返回 `Promise<XhrResponse<undefined>>`，成功时 data 为 undefined。

## 使用示例

```typescript
import { api_editSeasonSection } from '@yiero/bilibili-api-lib';

const response = await api_editSeasonSection(
  {
    id: 789012,
    seasonId: 123456,
    title: '第一集',
    type: 1
  },
  [
    { id: 1001, sort: 1 },  // 第一个视频
    { id: 1002, sort: 2 },  // 第二个视频
    { id: 1003, sort: 3 }   // 第三个视频
  ]
);

if (response.code === 0) {
  console.log('编辑成功');
}
```

## 注意事项

- **需要登录**：调用此接口需要用户已登录，会自动获取 CSRF Token
- **权限要求**：只能编辑自己创建的合集小节
- **type 固定值**：section.type 必须设置为 1
- **排序规则**：sorts 数组中的 sort 字段从 1 开始计数

## 相关接口

### IEditSeasonSectionBody

编辑合集小节请求体接口。

```typescript
interface IEditSeasonSectionBody {
  section: {
    /** 小节 ID */
    id: number;
    /** 所属合集 ID */
    seasonId: number;
    /** 小节标题（默认"正片"） */
    title?: string;
    /** 类型，固定值为 1 */
    type: 1;
  };
  sorts: {
    /** 合集内视频 ID */
    id: number;
    /** 排序位置（从1开始） */
    sort: number;
  }[];
}
```
