import { deepEqual, equal, throws } from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { checkTemplate } from '../check-template';
import { copyTemplateTo } from '../copy-template';
import { fillPlaceholders } from '../fill-tokens';
import { parseTarget } from '../target-path';
import { templateDir } from '../template';

test('生成物可以独立体检通过', () => {
    const root = mkdtempSync(join(tmpdir(), 'ws-scaffold-'));
    const target = join(root, 'demo-project');
    try {
        equal(
            copyTemplateTo(templateDir, target, 'demo-project'),
            '@webscripts/demo-project',
        );

        fillPlaceholders(target, {
            projectName: 'demo-project',
            description: '演示项目',
            version: '0.1.0',
            namespace: NAMESPACE,
            author: 'Yiero',
            match: 'https://example.com/*',
        });

        deepEqual(
            checkTemplate(target, { strictMeta: true }).errors,
            [],
        );
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});

test('目标目录已存在时拒绝生成', () => {
    const root = mkdtempSync(join(tmpdir(), 'ws-scaffold-'));
    const target = join(root, 'demo-project');
    try {
        mkdirSync(target);
        throws(() =>
            copyTemplateTo(templateDir, target, 'demo-project'),
        );
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});

const NAMESPACE = 'https://github.com/AliubYiero/Yiero_WebScripts';

test('新建参数校验', () => {
    deepEqual(parseTarget('com/bilibili/demo'), {
        parts: ['com', 'bilibili', 'demo'],
        projectName: 'demo',
    });
    deepEqual(parseTarget('.Global/demo'), {
        parts: ['.Global', 'demo'],
        projectName: 'demo',
    });
    equal(parseTarget('demo'), null);
    equal(parseTarget('com/.bilibili/demo'), null);
});
