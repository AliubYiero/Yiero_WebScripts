# api_getUserCard

获取 Bilibili 用户名片信息。

## 功能描述

根据用户 mid 获取用户的名片信息，包括用户基本信息、粉丝数、关注数、等级、认证状态、大会员状态等。可选是否请求用户主页头图。

## 函数签名

```typescript
function api_getUserCard(
  mid: number,
  photo?: boolean,
  login?: boolean
): Promise<XhrResponse<IUserCard>>
```

## 参数说明

| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| mid | number | 是 | 目标用户 mid |
| photo | boolean | 否 | 是否请求用户主页头图，默认 false |
| login | boolean | 否 | 是否携带登录信息，默认 false |

## 返回值

返回 `Promise<XhrResponse<IUserCard>>`，包含用户名片详细信息。

## 使用示例

```typescript
import { api_getUserCard } from '@yiero/bilibili-api-lib';

// 获取用户名片信息（基础信息）
const response = await api_getUserCard(2);

// 获取用户名片信息（包含头图）
const response2 = await api_getUserCard(2, true);

// 获取用户名片信息（携带登录态，获取关注状态）
const response3 = await api_getUserCard(2, false, true);

if (response.code === 0) {
  console.log('用户名:', response.data.card.name);
  console.log('签名:', response.data.card.sign);
  console.log('粉丝数:', response.data.follower);
  console.log('等级:', response.data.card.level_info.current_level);
  console.log('是否关注:', response.data.following);
}
```

## 相关接口

### IUserCard

用户名片信息响应数据。

```typescript
interface IUserCard {
  /** 卡片信息 */
  card: ICard;
  /** 是否关注此用户 */
  following: boolean;
  /** 用户稿件数 */
  archive_count: number;
  /** 文章数 */
  article_count: number;
  /** 粉丝数 */
  follower: number;
  /** 点赞数 */
  like_num: number;
}
```

### ICard

用户卡片信息。

```typescript
interface ICard {
  /** 用户 mid */
  mid: string;
  /** 用户昵称 */
  name: string;
  /** 用户性别 */
  sex: string;
  /** 用户头像链接 */
  face: string;
  /** 用户状态 0：正常 -2：被封禁 */
  spacesta: number;
  /** 粉丝数 */
  fans: number;
  /** 关注数 */
  friend: number;
  /** 关注数 */
  attention: number;
  /** 签名 */
  sign: string;
  /** 等级信息 */
  level_info: ILevelInfo;
  /** 挂件信息 */
  pendant: IPendant;
  /** 勋章信息 */
  nameplate: INameplate;
  /** 认证信息 */
  Official: IOfficial;
  /** 认证信息2 */
  official_verify: IOfficialVerify;
  /** 大会员状态 */
  vip: IVip;
  /** 主页头图 */
  space?: ISpace;
}
```

### ILevelInfo

用户等级信息。

```typescript
interface ILevelInfo {
  /** 当前等级 0-6级 */
  current_level: number;
  current_min: number;
  current_exp: number;
  next_exp: number;
}
```

### IPendant

用户挂件信息。

```typescript
interface IPendant {
  /** 挂件 id */
  pid: number;
  /** 挂件名称 */
  name: string;
  /** 挂件图片 url */
  image: string;
  expire: number;
  image_enhance?: string;
  image_enhance_frame?: string;
}
```

### INameplate

用户勋章信息。

```typescript
interface INameplate {
  /** 勋章 id */
  nid: number;
  /** 勋章名称 */
  name: string;
  /** 勋章图片 url 正常 */
  image: string;
  /** 勋章图片 url 小 */
  image_small: string;
  /** 勋章等级 */
  level: string;
  /** 勋章条件 */
  condition: string;
}
```

### IOfficial

用户认证信息。

```typescript
interface IOfficial {
  /** 认证类型 */
  role: number;
  /** 认证信息 */
  title: string;
  /** 认证备注 */
  desc: string;
  /** 是否认证 -1：无 0：UP主认证 1：机构认证 */
  type: number;
}
```

### IOfficialVerify

用户认证信息2。

```typescript
interface IOfficialVerify {
  /** 是否认证 -1：无 0：UP主认证 1：机构认证 */
  type: number;
  /** 认证信息 */
  desc: string;
}
```

### IVip

大会员状态信息。

```typescript
interface IVip {
  /** 大会员类型 0：无 1：月度大会员 2：年度及以上大会员 */
  vipType: number;
  dueRemark: string;
  accessStatus: number;
  /** 大会员状态 0：无 1：有 */
  vipStatus: number;
  vipStatusWarn: string;
  theme_type: number;
  type?: number;
  status?: number;
  due_date?: number;
  vip_pay_type?: number;
  label?: IVipLabel;
  avatar_subscript?: number;
  nickname_color?: string;
  role?: number;
  avatar_subscript_url?: string;
}
```

### IVipLabel

大会员标签信息。

```typescript
interface IVipLabel {
  path: string;
  text: string;
  label_theme: string;
  text_color: string;
  bg_style: number;
  bg_color: string;
  border_color: string;
}
```

### ISpace

主页头图信息。

```typescript
interface ISpace {
  /** 主页头图 url 小图 */
  s_img: string;
  /** 主页头图 url 正常 */
  l_img: string;
}
```
