import { deepEqual, ok } from 'node:assert/strict';
import {
    cpSync,
    mkdtempSync,
    readFileSync,
    rmSync,
    writeFileSync,
} from 'node:fs';
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

test('生成物的空元数据在严格模式下报错', () => {
    const root = mkdtempSync(join(tmpdir(), 'ws-check-'));
    const target = join(root, 'demo');
    try {
        cpSync(templateDir, target, { recursive: true });
        const bannerPath = join(target, 'banner/UserScript.ts');
        const banner = readFileSync(bannerPath, 'utf8')
            .replace("'{{match}}'", "''")
            .replace("'{{author}}'", "''");
        writeFileSync(bannerPath, banner, 'utf8');

        const result = checkTemplate(target, { strictMeta: true });
        ok(
            result.errors.some((error) =>
                error.includes('match 为空'),
            ),
        );
        ok(
            result.errors.some((error) =>
                error.includes('author 为空'),
            ),
        );
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});

test('依赖族漂移会被报告', () => {
    const root = mkdtempSync(join(tmpdir(), 'ws-check-'));
    const target = join(root, 'demo');
    try {
        cpSync(templateDir, target, { recursive: true });
        const manifestPath = join(target, 'package.json');
        const manifest = JSON.parse(
            readFileSync(manifestPath, 'utf8'),
        ) as {
            devDependencies: Record<string, string>;
        };
        manifest.devDependencies.vite = '^5.1.4';
        writeFileSync(manifestPath, JSON.stringify(manifest), 'utf8');

        const result = checkTemplate(target);
        ok(
            result.errors.some((error) =>
                error.includes('模板依赖族漂移'),
            ),
        );
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});
