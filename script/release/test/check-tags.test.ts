import { deepEqual, equal, ok } from 'node:assert/strict';
import { test } from 'node:test';
import type { PackageInfo } from '../../workspace/workspace';
import {
    discoverPackages,
    repoRoot,
} from '../../workspace/workspace';
import { splitLegacy, validateTags } from '../check-tags';
import { toTagPrefix } from '../tag-name';

function pkg(relDir: string): PackageInfo {
    return {
        dir: relDir,
        relDir,
        name: `@webscripts/${relDir.split('/').pop()}`,
        version: '0.0.0',
        scriptVersion: '1.0.0',
        archived: true,
        backupDir: null,
        isLibrary: false,
        isException: false,
        buildScript: null,
        hasTypecheck: false,
        testScript: null,
        workspaceDependencies: [],
    };
}

const packages = [
    pkg('src/.Global/global-css-import'),
    pkg('src/com/bilibili/bilibili-video-timeline'),
    pkg('src/com/qidian/auto-scroll'),
    pkg('src/.Libs/bilibili-api-lib'),
];

test('合规集合零违规', () => {
    const violations = validateTags(
        [
            '_Global/global-css-import/v1.1.3',
            'com/bilibili/bilibili-video-timeline/v2.0.3',
            '_Libs/bilibili-api-lib/v0.3.2',
            'com/qidian/auto-scroll/v1.0.1',
        ],
        packages,
    );
    equal(violations.length, 0);
});

test('旧格式标签被点名并给出新名', () => {
    const violations = validateTags(['auto-scroll/v1.0.1'], packages);
    equal(violations.length, 1);
    equal(violations[0].rule, '路径');
    equal(violations[0].next, 'com/qidian/auto-scroll/v1.0.1');
});

test('段首点号写成点号时给出下划线建议', () => {
    const violations = validateTags(
        ['.Global/global-css-import/v1.1.3'],
        packages,
    );
    equal(violations.length, 1);
    equal(violations[0].rule, '格式');
    equal(violations[0].next, null);
});

test('未知项目被点名', () => {
    const violations = validateTags(
        ['com/nope/whatever/v1.0.0'],
        packages,
    );
    equal(violations.length, 1);
    equal(violations[0].rule, '未知项目');
});

test('缺少版本段的标签是格式错误', () => {
    const violations = validateTags(['auto-scroll'], packages);
    equal(violations.length, 1);
    equal(violations[0].rule, '格式');
});

test('项目名歧义被点名', () => {
    const violations = validateTags(
        ['dup/v1.0.0'],
        [pkg('src/com/a/dup'), pkg('src/com/b/dup')],
    );
    equal(violations.length, 1);
    equal(violations[0].rule, '项目名歧义');
});

test('真实仓库里的 bilibili 库已迁入库域，标签前缀同构', () => {
    const packages = discoverPackages(repoRoot);
    const lib = packages.find(
        (item) => item.name === '@yiero/bilibili-api-lib',
    );
    ok(lib !== undefined);
    equal(lib.relDir, 'src/.Libs/bilibili-api-lib');
    equal(lib.isLibrary, true);
    equal(toTagPrefix(lib.relDir), '_Libs/bilibili-api-lib');
    deepEqual(
        validateTags(['_Libs/bilibili-api-lib/v0.3.2'], packages),
        [],
    );
});

test('--allow-legacy 只放行旧格式', () => {
    const violations = validateTags(
        ['auto-scroll/v1.0.1', 'com/nope/x/v1.0.0'],
        packages,
    );
    const split = splitLegacy(violations);
    equal(split.legacy.length, 1);
    equal(split.blocking.length, 1);
    deepEqual(
        split.blocking.map((item) => item.rule),
        ['未知项目'],
    );
    ok(split.legacy[0].tag === 'auto-scroll/v1.0.1');
});
