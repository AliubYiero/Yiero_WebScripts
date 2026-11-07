import { deepEqual, equal, ok } from 'node:assert/strict';
import {
    existsSync,
    mkdirSync,
    mkdtempSync,
    readFileSync,
    rmSync,
    statSync,
    utimesSync,
    writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { test } from 'node:test';
import { syncProjectDocs } from '../project-docs';

/** 每个用例一个临时仓库根，用完即删。 */
function createRoot(): string {
    return mkdtempSync(join(tmpdir(), 'ws-sync-docs-'));
}

/** 最小模板：只保留仓库根指针，方便断言相对路径。 */
function writeTemplate(root: string): void {
    const dir = join(root, 'templates', 'ts-template');
    mkdirSync(dir, { recursive: true });
    writeFileSync(
        join(dir, 'CLAUDE.md'),
        [
            '# 项目指南',
            '',
            '[仓库根 CLAUDE.md]({{repoRootPath}}/CLAUDE.md)',
            '',
        ].join('\n'),
        'utf8',
    );
}

/** 脚本项目：package.json + 带 version 的 banner。 */
function writeScript(root: string, relDir: string): void {
    const dir = join(root, relDir);
    mkdirSync(join(dir, 'banner'), { recursive: true });
    writeFileSync(
        join(dir, 'package.json'),
        JSON.stringify({
            name: `@webscripts/${basename(relDir)}`,
            version: '0.0.0',
        }),
        'utf8',
    );
    writeFileSync(
        join(dir, 'banner/UserScript.ts'),
        "const UserScript = [['version', '0.1.0']];\n\nexport { UserScript };\n",
        'utf8',
    );
}

/** 链接库：只有 package.json，没有 banner。 */
function writeLibrary(root: string, relDir: string): void {
    const dir = join(root, relDir);
    mkdirSync(dir, { recursive: true });
    writeFileSync(
        join(dir, 'package.json'),
        JSON.stringify({
            name: `@yiero/${basename(relDir)}`,
            version: '0.0.1',
        }),
        'utf8',
    );
}

test('只回填非库包，并按目录深度渲染仓库根指针', () => {
    const root = createRoot();
    try {
        writeTemplate(root);
        writeScript(root, 'src/.Global/global-css-import');
        writeScript(root, 'src/com/a/b');
        writeLibrary(root, 'src/.Libs/lib-x');

        const result = syncProjectDocs({ rootDir: root });

        deepEqual(result.written, [
            'src/.Global/global-css-import',
            'src/com/a/b',
        ]);
        deepEqual(result.drifted, result.written);

        const globalDoc = readFileSync(
            join(root, 'src/.Global/global-css-import/CLAUDE.md'),
            'utf8',
        );
        ok(globalDoc.includes('(../../..'));
        ok(!globalDoc.includes('{{'));

        const comDoc = readFileSync(
            join(root, 'src/com/a/b/CLAUDE.md'),
            'utf8',
        );
        ok(comDoc.includes('(../../../..'));
        ok(!comDoc.includes('{{'));

        ok(!existsSync(join(root, 'src/.Libs/lib-x/CLAUDE.md')));
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});

test('内容不符或文件缺失都算漂移，check 模式不写文件', () => {
    const root = createRoot();
    try {
        writeTemplate(root);
        writeScript(root, 'src/com/a/b');
        writeScript(root, 'src/com/c/d');
        // 内容不符
        writeFileSync(
            join(root, 'src/com/a/b/CLAUDE.md'),
            '# 过期指南\n',
            'utf8',
        );
        // 文件缺失：不写 src/com/c/d/CLAUDE.md

        const result = syncProjectDocs({
            rootDir: root,
            check: true,
        });

        deepEqual(result.drifted, ['src/com/a/b', 'src/com/c/d']);
        deepEqual(result.written, []);
        equal(
            readFileSync(join(root, 'src/com/a/b/CLAUDE.md'), 'utf8'),
            '# 过期指南\n',
        );
        ok(!existsSync(join(root, 'src/com/c/d/CLAUDE.md')));
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});

test('写模式幂等：内容一致时不重写文件', () => {
    const root = createRoot();
    try {
        writeTemplate(root);
        writeScript(root, 'src/com/a/b');

        const first = syncProjectDocs({ rootDir: root });
        deepEqual(first.written, ['src/com/a/b']);

        // 把 mtime 拨回过去，第二次若重写就会被看见。
        const docPath = join(root, 'src/com/a/b/CLAUDE.md');
        const oldTime = new Date(2000, 0, 1);
        utimesSync(docPath, oldTime, oldTime);

        const second = syncProjectDocs({ rootDir: root });

        deepEqual(second.written, []);
        deepEqual(second.drifted, []);
        equal(statSync(docPath).mtimeMs, oldTime.getTime());
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});
