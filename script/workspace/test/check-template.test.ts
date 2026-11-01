import { deepEqual, ok } from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { checkTemplate } from '../check-template';
import { templateDir } from '../template';

test('模板本身没有错误', () => {
    const result = checkTemplate(templateDir, {
        allowPlaceholders: true,
    });
    deepEqual(result.errors, []);
});

test('缺文件缺依赖的目录会被报告', () => {
    const root = mkdtempSync(join(tmpdir(), 'ws-check-'));
    try {
        writeFileSync(
            join(root, 'package.json'),
            JSON.stringify({ name: 'demo', devDependencies: {} }),
            'utf8',
        );
        const result = checkTemplate(root);

        ok(
            result.errors.some((error) =>
                error.startsWith('缺少必备文件'),
            ),
        );
        ok(
            result.errors.some((error) =>
                error.startsWith('模板缺少标准依赖'),
            ),
        );
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});
