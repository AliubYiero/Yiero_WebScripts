import { equal, ok, throws } from 'node:assert/strict';
import { test } from 'node:test';
import {
    formatTag,
    isLegacyTag,
    isValidTagName,
    isValidVersion,
    parseTag,
    toTagPrefix,
} from '../tag-name';

test('普通域名目录原样映射', () => {
    equal(
        toTagPrefix('src/com/bilibili/bilibili-video-timeline'),
        'com/bilibili/bilibili-video-timeline',
    );
    equal(
        toTagPrefix('src/qq/weread/wechat-reader-auto-scroll'),
        'qq/weread/wechat-reader-auto-scroll',
    );
});

test('段首点号换成下划线', () => {
    equal(
        toTagPrefix('src/.Global/global-css-import'),
        '_Global/global-css-import',
    );
    equal(
        toTagPrefix('src/.Crontab/daily-check'),
        '_Crontab/daily-check',
    );
    equal(
        toTagPrefix('src/com/bilibili/.bilibili-api-lib'),
        'com/bilibili/_bilibili-api-lib',
    );
});

test('反斜杠与多余斜杠也能处理', () => {
    equal(
        toTagPrefix('src\\com\\qidian\\auto-scroll\\'),
        'com/qidian/auto-scroll',
    );
});

test('非项目目录直接报错', () => {
    throws(() => toTagPrefix('src/com'));
    throws(() => toTagPrefix('script/release/tag-name'));
    throws(() => toTagPrefix('src/.Global'));
});

test('版本号必须是 semver', () => {
    ok(isValidVersion('1.0.0'));
    ok(isValidVersion('0.3.2'));
    ok(isValidVersion('2.0.3-beta.1'));
    ok(!isValidVersion('1.0'));
    ok(!isValidVersion('v1.0.0'));
    ok(!isValidVersion('1.0.0.0'));
});

test('新格式标签可解析', () => {
    const parsed = parseTag(
        'com/bilibili/bilibili-video-timeline/v2.0.3',
    );
    ok(parsed !== null);
    equal(parsed.version, '2.0.3');
    equal(
        parsed.segments.join('/'),
        'com/bilibili/bilibili-video-timeline',
    );
});

test('旧格式标签可解析', () => {
    const parsed = parseTag('auto-scroll/v1.0.1');
    ok(parsed !== null);
    equal(parsed.version, '1.0.1');
    equal(parsed.segments.length, 1);
    ok(isLegacyTag('auto-scroll/v1.0.1'));
    ok(!isLegacyTag('com/qidian/auto-scroll/v1.0.1'));
});

test('缺版本段或版本非法时解析失败', () => {
    equal(parseTag('auto-scroll'), null);
    equal(parseTag('auto-scroll/v1.0'), null);
    equal(parseTag('auto-scroll/latest'), null);
    equal(parseTag('a//b/v1.0.0'), null);
});

test('formatTag 拼出规范名字', () => {
    equal(
        formatTag('_Global/limit-web-view-time', '1.0.0'),
        '_Global/limit-web-view-time/v1.0.0',
    );
});

test('段首点号的标签名非法', () => {
    ok(isValidTagName('_Global/global-css-import/v1.1.3'));
    ok(isValidTagName('com/bilibili/_bilibili-api-lib/v0.3.2'));
    ok(!isValidTagName('.Global/global-css-import/v1.1.3'));
    ok(!isValidTagName('com/bilibili/.bilibili-api-lib/v0.3.2'));
    ok(!isValidTagName('com/a/b/v1.0.0.'));
    ok(!isValidTagName('com/a/b/v1.0.0 '));
    ok(!isValidTagName('com/a/b/v1.0.0~x'));
    ok(!isValidTagName('com/a/b/v1.0.0@{x}'));
});
