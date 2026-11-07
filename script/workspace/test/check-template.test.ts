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
import { token } from '../tokens';

/** 复制模板到临时目录：删文件、改内容都不碰真模板。 */
function withCopiedTemplate(run: (target: string) => void): void {
    const root = mkdtempSync(join(tmpdir(), 'ws-check-'));
    const target = join(root, 'demo');
    try {
        cpSync(templateDir, target, { recursive: true });
        run(target);
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
}

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
        // 运行方式三选一：match 清空后整组都为空
        ok(
            result.errors.some((error) =>
                error.includes('至少需要一个非空值'),
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

test('运行期库依赖用 semver 范围算漂移', () => {
    const root = mkdtempSync(join(tmpdir(), 'ws-check-'));
    const target = join(root, 'demo');
    try {
        cpSync(templateDir, target, { recursive: true });
        const manifestPath = join(target, 'package.json');
        const manifest = JSON.parse(
            readFileSync(manifestPath, 'utf8'),
        ) as {
            dependencies: Record<string, string>;
        };
        manifest.dependencies['@yiero/gmlib'] = '^0.4.7';
        writeFileSync(manifestPath, JSON.stringify(manifest), 'utf8');

        const result = checkTemplate(target);
        ok(
            result.errors.some(
                (error) =>
                    error.startsWith('模板运行期依赖漂移') &&
                    error.includes('workspace:*'),
            ),
        );
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});

test('非法 UTF-8 源码会被报告', () => {
    const root = mkdtempSync(join(tmpdir(), 'ws-check-'));
    try {
        cpSync(templateDir, root, { recursive: true });
        writeFileSync(
            join(root, 'vite.config.ts'),
            Buffer.from([0x63, 0x6f, 0x6e, 0x73, 0x74, 0xff, 0x3b]),
        );

        const result = checkTemplate(root, {
            allowPlaceholders: true,
        });
        ok(
            result.errors.some((error) =>
                error.startsWith('源码不是合法 UTF-8'),
            ),
        );
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});

test('TypeScript 语法错误会被报告', () => {
    const root = mkdtempSync(join(tmpdir(), 'ws-check-'));
    try {
        cpSync(templateDir, root, { recursive: true });
        writeFileSync(
            join(root, 'src/main.ts'),
            'const a = ;',
            'utf8',
        );

        const result = checkTemplate(root, {
            allowPlaceholders: true,
        });
        ok(
            result.errors.some((error) =>
                error.startsWith('源码有语法错误'),
            ),
        );
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});

test('缺项目级 CLAUDE.md 会被报告', () => {
    withCopiedTemplate((target) => {
        rmSync(join(target, 'CLAUDE.md'), { force: true });

        const result = checkTemplate(target, {
            allowPlaceholders: true,
        });
        ok(result.errors.includes('缺少必备文件：CLAUDE.md'));
    });
});

test('缺浏览器验证骨架会被报告', () => {
    withCopiedTemplate((target) => {
        rmSync(join(target, 'test/browser-verify.mjs'), {
            force: true,
        });

        const result = checkTemplate(target, {
            allowPlaceholders: true,
        });
        ok(
            result.errors.includes(
                '缺少必备文件：test/browser-verify.mjs',
            ),
        );
    });
});

test('缺 test:browser 委托命令会被报告', () => {
    withCopiedTemplate((target) => {
        const manifestPath = join(target, 'package.json');
        const manifest = JSON.parse(
            readFileSync(manifestPath, 'utf8'),
        ) as { scripts?: Record<string, string> };
        delete manifest.scripts?.['test:browser'];
        writeFileSync(manifestPath, JSON.stringify(manifest), 'utf8');

        const result = checkTemplate(target, {
            allowPlaceholders: true,
        });
        ok(result.errors.includes('模板缺少委托命令：test:browser'));
    });
});

test('生成物残留仓库根指针会被报告', () => {
    withCopiedTemplate((target) => {
        const result = checkTemplate(target);
        ok(
            result.errors.includes(
                `CLAUDE.md 的仓库根指针未替换：${token(
                    'repoRootPath',
                )}`,
            ),
        );
    });
});

test('模板自身允许保留仓库根指针占位符', () => {
    withCopiedTemplate((target) => {
        const result = checkTemplate(target, {
            allowPlaceholders: true,
        });
        ok(
            !result.errors.some((error) =>
                error.startsWith('CLAUDE.md 的仓库根指针未替换'),
            ),
        );
    });
});

test('骨架 mjs 的非法 UTF-8 会被报告', () => {
    withCopiedTemplate((target) => {
        writeFileSync(
            join(target, 'test/browser-verify.mjs'),
            Buffer.from([0x63, 0x6f, 0x6e, 0x73, 0x74, 0xff, 0x3b]),
        );

        const result = checkTemplate(target, {
            allowPlaceholders: true,
        });
        ok(
            result.errors.includes(
                '源码不是合法 UTF-8：test/browser-verify.mjs',
            ),
        );
    });
});
