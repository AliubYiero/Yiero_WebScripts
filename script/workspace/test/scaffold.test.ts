import { deepEqual, equal, ok, throws } from 'node:assert/strict';
import {
    mkdirSync,
    mkdtempSync,
    readFileSync,
    rmSync,
    writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { checkTemplate } from '../check-template';
import { copyTemplateTo } from '../copy-template';
import { fillPlaceholders } from '../fill-tokens';
import { resolveTargetMeta } from '../scaffold-options';
import {
    parseLibraryDomainTarget,
    parseTarget,
} from '../target-path';
import { templateDir } from '../template';
import { SPECIAL_DOMAINS } from '../workspace';

const NAMESPACE = 'https://github.com/AliubYiero/Yiero_WebScripts';

const baseOptions = {
    projectName: 'demo-project',
    description: '演示项目',
    version: '0.1.0',
    namespace: NAMESPACE,
    author: 'Yiero',
    license: 'GPL-3',
};

function withTempProject(run: (target: string) => void): void {
    const root = mkdtempSync(join(tmpdir(), 'ws-scaffold-'));
    const target = join(root, 'demo-project');
    try {
        copyTemplateTo(templateDir, target, 'demo-project');
        run(target);
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
}

test('生成物可以独立体检通过，并默认带 GPL-3', () => {
    withTempProject((target) => {
        fillPlaceholders(target, {
            ...baseOptions,
            runMode: {
                key: 'match',
                value: 'https://*.bilibili.com/*',
            },
        });

        const banner = readFileSync(
            join(target, 'banner/UserScript.ts'),
            'utf8',
        );
        ok(banner.includes("['license', 'GPL-3']"));
        ok(banner.includes("['match', 'https://*.bilibili.com/*']"));
        ok(!banner.includes('{{'));

        deepEqual(
            checkTemplate(target, { strictMeta: true }).errors,
            [],
        );
    });
});

test('定时脚本写入 crontab 且不再带 match', () => {
    withTempProject((target) => {
        fillPlaceholders(target, {
            ...baseOptions,
            runMode: { key: 'crontab', value: '* * once * *' },
        });

        const banner = readFileSync(
            join(target, 'banner/UserScript.ts'),
            'utf8',
        );
        ok(banner.includes("['crontab', '* * once * *']"));
        ok(!banner.includes("['match'"));
        ok(!banner.includes('{{'));

        deepEqual(
            checkTemplate(target, { strictMeta: true }).errors,
            [],
        );
    });
});

test('运行方式三选一：全空与互斥都报错', () => {
    withTempProject((target) => {
        const bannerPath = join(target, 'banner/UserScript.ts');

        writeFileSync(
            bannerPath,
            `const UserScript = [
    ['name', 'demo-project'],
    ['description', '演示项目'],
    ['version', '1.0.0'],
    ['author', 'Yiero'],
    ['namespace', '${NAMESPACE}'],
    ['license', 'GPL-3'],
];

export { UserScript };
`,
            'utf8',
        );
        const missing = checkTemplate(target, { strictMeta: true });
        ok(
            missing.errors.some((error) =>
                error.includes('至少需要一个非空值'),
            ),
        );

        writeFileSync(
            bannerPath,
            `const UserScript = [
    ['name', 'demo-project'],
    ['description', '演示项目'],
    ['version', '1.0.0'],
    ['author', 'Yiero'],
    ['namespace', '${NAMESPACE}'],
    ['license', 'GPL-3'],
    ['match', 'https://example.com/*'],
    ['crontab', '* * once * *'],
];

export { UserScript };
`,
            'utf8',
        );
        const exclusive = checkTemplate(target, { strictMeta: true });
        ok(exclusive.errors.some((error) => error.includes('互斥')));
    });
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

test('库域目标被识别出来，供脚手架给出专属提示', () => {
    equal(parseLibraryDomainTarget('.Libs/gmlib'), 'src/.Libs/gmlib');
    equal(
        parseLibraryDomainTarget('src/.Libs/gmlib'),
        'src/.Libs/gmlib',
    );
    equal(parseLibraryDomainTarget('com/bilibili/demo'), null);
    equal(parseLibraryDomainTarget('.Global/demo'), null);
});

test('按目录推导运行方式', () => {
    deepEqual(resolveTargetMeta(['com', 'bilibili', 'demo']), {
        key: 'match',
        value: 'https://*.bilibili.com/*',
    });
    deepEqual(resolveTargetMeta(['.Global', 'demo']), {
        key: 'match',
        value: 'https://*/*',
    });
    deepEqual(resolveTargetMeta(['.Crontab', 'demo']), {
        key: 'crontab',
        value: '* * once * *',
    });
    throws(() => resolveTargetMeta(['com']));
});

test('每个特殊目录都有默认运行方式', () => {
    for (const entry of SPECIAL_DOMAINS) {
        ok(resolveTargetMeta([entry, 'demo']).value.length > 0);
    }
    throws(
        () => resolveTargetMeta(['.Unknown', 'demo']),
        /未知特殊目录/,
    );
});
