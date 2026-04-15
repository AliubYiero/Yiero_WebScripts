# getRoomId

从当前页面 URL 中获取 Bilibili 直播间 ID。

## 功能描述

该工具函数用于从浏览器当前页面的 URL 中提取直播间 ID。适用于在直播间页面直接调用，无需手动传入房间号。

支持以下 URL 格式：
- `https://live.bilibili.com/12345`
- `https://live.bilibili.com/blanc/67890`

## 函数签名

```typescript
function getRoomId(): number | undefined
```

## 参数说明

无参数。

## 返回值

| 类型 | 说明 |
|------|------|
| `number` | 成功提取到的直播间 ID |
| `undefined` | 当前页面 URL 中未找到直播间 ID |

## 使用示例

### 基础用法

```typescript
import { getRoomId } from '@yiero/biliapi';

// 当前页面: https://live.bilibili.com/12345
const roomId = getRoomId();
console.log(roomId); // 12345
```

### 结合 api_getRoomInfo 使用

```typescript
import { getRoomId, api_getRoomInfo } from '@yiero/biliapi';

const roomId = getRoomId();
if (roomId) {
  const response = await api_getRoomInfo(roomId);
  if (response.code === 0) {
    console.log('直播间标题:', response.data.title);
    console.log('直播状态:', response.data.live_status);
  }
} else {
  console.log('未在直播间页面');
}
```

### 错误处理

```typescript
import { getRoomId } from '@yiero/biliapi';

const roomId = getRoomId();
if (roomId === undefined) {
  console.warn('无法获取直播间ID，请确认当前在直播间页面');
  return;
}

// 继续处理...
```

## 注意事项

1. 该函数必须在浏览器环境中使用，依赖于 `document.URL`
2. 如果当前页面不在 Bilibili 直播间域名下，会返回 `undefined`
3. 返回的直播间 ID 是数字类型，可直接用于其他 API 调用

## 适用场景

- 在直播间页面开发用户脚本
- 需要自动获取当前直播间信息的插件
- 与 `api_getRoomInfo` 配合使用获取直播间详情
