---
name: biliapi-function-development
description: Use when adding new API functions to the @yiero/bilibili-api-lib library
---

# BiliAPI 函数开发

## 开发流程

### 1. 定义接口类型
位置: `src/{module}/interfaces/I{功能名称}.ts`

```typescript
export interface IVideoInfo {
  /** BV号 */
  bvid: string;
  /** 标题 */
  title: string;
}
```
- 命名: `I{功能名称}`
- 每个字段添加 JSDoc 注释

### 2. 实现 API 函数
位置: `src/{module}/api_{操作}{资源}.ts`

```typescript
import { xhrRequest } from '../xhrRequest.ts';
import type { IVideoInfo } from './interfaces/IVideoInfo.ts';

export function api_getVideoInfo(id: string | number, login: boolean = false) {
  const params: Record<string, string> = {};
  if (typeof id === 'string' && id.startsWith('BV')) {
    params.bvid = id;
  } else {
    params.aid = id.toString();
  }

  if (login) {
    return xhrRequest.getWithCredentials<IVideoInfo>(url, { params });
  }
  return xhrRequest.get<IVideoInfo>('https://api.bilibili.com/x/web-interface/view', { params });
}
```

**请求方法选择:**

| 场景 | 方法 |
|------|------|
| GET 无需登录 | `xhrRequest.get<T>()` |
| GET 需要登录 | `xhrRequest.getWithCredentials<T>()` |
| POST 无需登录 | `xhrRequest.post<T>()` |
| POST 需要登录 | `xhrRequest.postWithCredentials<T>()` |

### 3. 导出函数
模块入口: `src/{module}/index.ts`
```typescript
export * from './api_getVideoInfo';
```

### 4. 编写测试
位置: `tests/{module}/api_{函数名}.test.ts`

```typescript
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { api_getVideoInfo } from '@/video/api_getVideoInfo';
import { xhrRequest } from '@/xhrRequest';

vi.mock('@/xhrRequest', () => ({
  xhrRequest: { get: vi.fn(), getWithCredentials: vi.fn() },
}));

describe('api_getVideoInfo', () => {
  beforeEach(() => vi.clearAllMocks());

  test('发送正确的 GET 请求', async () => {
    vi.mocked(xhrRequest.get).mockResolvedValue({
      code: 0, message: 'success', ttl: 1, data: { bvid: 'BV1xx411c7mD', title: '测试' }
    });
    await api_getVideoInfo('BV1xx411c7mD');
    expect(xhrRequest.get).toHaveBeenCalledWith(
      'https://api.bilibili.com/x/web-interface/view',
      { params: { bvid: 'BV1xx411c7mD' } }
    );
  });
});
```

### 5. 更新 README
1. 根目录 `README.md` API 列表中添加新函数
2. `docs/{module}/api_{函数名}.md` 编写接口文档

## 命名规范

| 类型 | 规则 | 示例 |
|------|------|------|
| API 函数 | `api_{操作}{资源}` | `api_getVideoInfo` |
| 接口类型 | `I{名称}` | `IVideoInfo` |
| 请求体 | `I{操作}{资源}Body` | `IEditSeasonBody` |
| 工具函数 | 驼峰 | `getCsrf` |

## 提交前检查

- [ ] 接口类型定义完整并有 JSDoc 注释
- [ ] API 函数有完整文档注释
- [ ] 在模块 `index.ts` 中导出
- [ ] 编写了测试用例
- [ ] 更新了根目录 `README.md` API 列表
- [ ] 编写了 `docs/{module}/api_{函数名}.md` 接口文档
- [ ] 运行 `pnpm check` 无错误
- [ ] 运行 `pnpm test` 测试通过

## 常用命令

```bash
pnpm check    # 代码检查与自动修复
pnpm test     # 运行测试
pnpm build    # 构建项目
pnpm dev      # 开发模式
```
