import * as path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    // Configure Vitest (https://vitest.dev/config/)
    test: {
        // 使用 happy-dom 提供 DOM API 支持
        environment: 'happy-dom',
        // 全局测试超时 10 秒
        testTimeout: 10000,
        // 覆盖率配置
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html', 'json'],
            exclude: [
                'node_modules/',
                'dist/',
                'tests/',
                '**/*.d.ts',
                '**/*.config.*',
            ],
        },
        // 模拟全局对象
        globals: true,
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
});
