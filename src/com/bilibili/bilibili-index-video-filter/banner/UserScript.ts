import { ScriptCatUserScript } from '../types/UserScript';

const UserScript: ScriptCatUserScript = [
    ['name', 'Bilibili首页过滤'],
    [
        'description',
        '过滤首页已推荐视频, 指定UP主/关键词/营销号屏蔽.',
    ],
    ['version', '0.1.3'],
    ['author', 'Yiero'],
    ['match', 'https://www.bilibili.com/'],
    ['require', ''],
    ['resource', ''],
    ['icon', ''],
    ['run-at', ''],
    ['connect', ''],
    ['tag', ''],
    ['license', 'GPL-3'],
    ['namespace', 'https://github.com/AliubYiero/Yiero_WebScripts'],
    ['noframes'],
];

export { UserScript };
