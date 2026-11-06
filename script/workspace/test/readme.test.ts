import { deepEqual, equal, ok } from 'node:assert/strict';
import { test } from 'node:test';
import { createReadmeContent } from '../../updateReadme/createReadmeContent.ts';
import type {
    ScriptDetail,
    ScriptInfo,
} from '../../updateReadme/types.ts';

const makeDetail = (
    overrides: Partial<ScriptDetail> = {},
): ScriptDetail => ({
    name: 'demo',
    description: '演示脚本',
    version: '1.0.0',
    private: false,
    archive: false,
    lastUpdate: Date.UTC(2026, 0, 2),
    scriptType: 'web',
    userScriptFilepath: 'backup/demo.user.js',
    downloadUrlFromGithub: '',
    downloadUrlFromScripCat: '',
    downloadUrlFromGreasyFork: '',
    autoUpdate: true,
    getLastUpdateWay: 'file',
    ...overrides,
});

test('公开 README 指向 main 分支与 src 布局', () => {
    const content = createReadmeContent({}, false);
    ok(content.includes('# Yiero'));
    ok(content.includes('## 目录结构'));
    ok(content.includes('.Global'));
    ok(content.includes('.Crontab'));
});

test('私有 README 使用私有标题', () => {
    const content = createReadmeContent({}, true);
    ok(content.includes("Yiero's Private Web Scripts"));
});

test('简介列链接指向项目 README，按位置区分相对路径', () => {
    const scriptInfo: ScriptInfo = {
        'bilibili.com': {
            demo: makeDetail(),
            legacy: makeDetail({ archive: true }),
        },
        global: {
            'global-demo': makeDetail({ name: 'Global Demo' }),
        },
        crontab: {
            'cron-demo': makeDetail({
                name: 'Cron Demo',
                scriptType: 'crontab',
            }),
        },
    };

    const publicContent = createReadmeContent(scriptInfo, false);
    ok(publicContent.includes('| 脚本名称 | 脚本描述 | 简介 |'));
    ok(
        publicContent.includes(
            '[README](src/com/bilibili/demo/README.md)',
        ),
    );
    // 归档脚本在引用块里，链接同样要指向项目 README
    ok(
        publicContent.includes(
            '[README](src/com/bilibili/legacy/README.md)',
        ),
    );
    ok(
        publicContent.includes(
            '[README](src/.Global/global-demo/README.md)',
        ),
    );
    ok(
        publicContent.includes(
            '[README](src/.Crontab/cron-demo/README.md)',
        ),
    );

    const privateContent = createReadmeContent(scriptInfo, true);
    ok(
        privateContent.includes(
            '[README](../src/com/bilibili/demo/README.md)',
        ),
    );
    ok(
        privateContent.includes(
            '[README](../src/.Global/global-demo/README.md)',
        ),
    );
    ok(
        privateContent.includes(
            '[README](../src/.Crontab/cron-demo/README.md)',
        ),
    );
});

test('表格固定 9 列，表头与分隔行对齐', () => {
    const content = createReadmeContent(
        { 'bilibili.com': { demo: makeDetail() } },
        false,
    );
    const lines = content.split('\n');
    const headerIndex = lines.findIndex((line) =>
        line.startsWith('| 脚本名称'),
    );
    ok(headerIndex >= 0);

    const headerCells = lines[headerIndex].split('|');
    // 首尾各有一个空段
    equal(headerCells.length, 11);
    equal(headerCells[3].trim(), '简介');

    const separatorCells = lines[headerIndex + 1]
        .split('|')
        .filter((cell) => cell.trim() !== '');
    deepEqual(
        separatorCells.map((cell) => cell.trim()),
        Array<string>(9).fill('---'),
    );
});
