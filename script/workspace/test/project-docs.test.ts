import { equal, ok } from 'node:assert/strict';
import {
    mkdirSync,
    mkdtempSync,
    rmSync,
    writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { checkTemplate } from '../check-template';
import {
    computeRepoRootPath,
    projectDocFile,
    renderProjectDoc,
} from '../project-docs';
import { token } from '../tokens';

/** 在临时仓库根里造一份模板文档：本次 ticket 不依赖真实模板文件。 */
function writeProjectDocTemplate(root: string): string {
    const templatePath = join(
        root,
        'templates',
        'ts-template',
        projectDocFile,
    );
    mkdirSync(join(root, 'templates', 'ts-template'), {
        recursive: true,
    });
    writeFileSync(
        templatePath,
        [
            '# 项目指南',
            '',
            `[仓库根 CLAUDE.md](${token('repoRootPath')}/CLAUDE.md)`,
            '',
        ].join('\n'),
        'utf8',
    );
    return templatePath;
}

test('仓库根相对路径由目录深度决定', () => {
    const root = mkdtempSync(join(tmpdir(), 'ws-project-docs-'));
    try {
        equal(
            computeRepoRootPath(
                join(root, 'src', '.Global', 'x'),
                root,
            ),
            '../../..',
        );
        equal(
            computeRepoRootPath(
                join(root, 'src', 'com', 'a', 'b'),
                root,
            ),
            '../../../..',
        );
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});

test('渲染后的文档不含占位符，且链接指向仓库根', () => {
    const root = mkdtempSync(join(tmpdir(), 'ws-project-docs-'));
    try {
        const templatePath = writeProjectDocTemplate(root);
        const projectDir = join(root, 'src', 'com', 'a', 'b');

        const text = renderProjectDoc(projectDir, root, templatePath);

        ok(!text.includes('{{'));
        ok(
            text.includes(
                '[仓库根 CLAUDE.md](../../../../CLAUDE.md)',
            ),
        );
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});

test('生成物残留占位符时体检报错，模板自身不报错', () => {
    const root = mkdtempSync(join(tmpdir(), 'ws-project-docs-'));
    try {
        writeFileSync(
            join(root, projectDocFile),
            `[仓库根 CLAUDE.md](${token('repoRootPath')}/CLAUDE.md)`,
            'utf8',
        );

        const generated = checkTemplate(root, {
            allowPlaceholders: false,
        });
        ok(
            generated.errors.includes(
                `CLAUDE.md 的仓库根指针未替换：${token(
                    'repoRootPath',
                )}`,
            ),
        );

        const template = checkTemplate(root, {
            allowPlaceholders: true,
        });
        ok(
            !template.errors.some((error) =>
                error.includes('仓库根指针'),
            ),
        );
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});

test('没有 CLAUDE.md 时不由仓库根指针规则报错', () => {
    const root = mkdtempSync(join(tmpdir(), 'ws-project-docs-'));
    try {
        const result = checkTemplate(root);
        ok(
            !result.errors.some((error) =>
                error.includes('仓库根指针'),
            ),
        );
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});
