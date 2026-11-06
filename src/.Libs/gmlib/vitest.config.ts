import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        // 使用 happy-dom 提供 DOM API 支持
        environment: 'happy-dom',
        // 全局测试 API（describe / it / expect / vi），与迁入前的测试写法一致
        globals: true,
        // 全局测试超时 10 秒
        testTimeout: 10000,
    },
});
