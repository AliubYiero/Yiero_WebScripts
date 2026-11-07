import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        // 使用 jsdom 提供 DOM API 支持
        environment: 'jsdom',
        // 只收集 test/ 目录下的单测
        include: ['test/**/*.test.ts'],
        // 允许 describe / it / expect 全局使用
        globals: true,
    },
});
