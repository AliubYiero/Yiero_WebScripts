# api_editSeason

编辑 Bilibili 合集信息。

## 功能描述

编辑合集的标题、封面、简介等信息，以及调整小节顺序。**需要登录状态**。

## 函数签名

```typescript
async function api_editSeason(
  season: IEditSeasonBody['season'],
  sorts: IEditSeasonBody['sorts']
): Promise<XhrResponse<undefined>>
```

## 参数说明

| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| season | object | 是 | 合集信息对象 |
| season.id | number | 是 | 合集 ID |
| season.title | string | 是 | 合集标题 |
| season.cover | string | 是 | 封面图 URL |
| season.desc | string | 否 | 合集简介 |
| season.season_price | number | 否 | 合集价格 |
| season.isEnd | number | 否 | 是否完结（0/1）|
| sorts | array | 是 | 小节排序数组 |
| sorts[].id | number | 是 | 小节 ID |
| sorts[].sort | number | 是 | 排序位置（从1开始）|

## 返回值

返回 `Promise<XhrResponse<undefined>>`，成功时 data 为 undefined。

## 使用示例

```typescript
import { api_editSeason } from '@yiero/bilibili-api-lib';

const response = await api_editSeason(
  {
    id: 123456,
    title: '新合集标题',
    cover: 'https://example.com/cover.jpg',
    desc: '合集简介',
    isEnd: 1
  },
  [
    { id: 101, sort: 1 },  // 第一个小节
    { id: 102, sort: 2 },  // 第二个小节
    { id: 103, sort: 3 }   // 第三个小节
  ]
);

if (response.code === 0) {
  console.log('编辑成功');
}
```

## 注意事项

- **需要登录**：调用此接口需要用户已登录，会自动获取 CSRF Token
- **权限要求**：只能编辑自己创建的合集
- **排序规则**：sorts 数组中的 sort 字段从 1 开始计数

## 相关接口

### IEditSeasonBody

编辑合集请求体接口。

```typescript
interface IEditSeasonBody {
  season: {
    /** 合集 ID */
    id: number;
    /** 合集标题 */
    title: string;
    /** 封面图 */
    cover: string;
    /** 合集简介 */
    desc?: string;
    /** 合集价格 */
    season_price?: number;
    /** 是否完结 */
    isEnd?: number;
  };
  sorts: {
    /** 小节 ID */
    id: number;
    /** 排序位置（从1开始） */
    sort: number;
  }[];
}
```
