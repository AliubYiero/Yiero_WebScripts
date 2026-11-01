import { ok } from 'node:assert/strict';
import { test } from 'node:test';
import { createReadmeContent } from '../../updateReadme/createReadmeContent.ts';

test('公开 README 指向 main 分支与 src 布局', () => {
    const content = createReadmeContent({}, false);
    ok(content.includes('# Yiero'));
    ok(content.includes('## 目录结构'));
    ok(content.includes('.Global'));
});

test('私有 README 使用私有标题', () => {
    const content = createReadmeContent({}, true);
    ok(content.includes("Yiero's Private Web Scripts"));
});
