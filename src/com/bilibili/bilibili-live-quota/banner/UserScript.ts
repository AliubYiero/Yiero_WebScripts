import type { ScriptCatUserScript } from '../types/UserScript';

const UserScript: ScriptCatUserScript = [
    ['name', 'Bilibili直播引用弹幕显示'],
    [
        'description',
        '在Bilibili直播栏中, 弹幕 @其他人 时, 显示其最后一条弹幕的发言. 可以更直观地知道弹幕在讨论什么. ',
    ],
    ['version', '0.1.0'],
    ['author', 'Yiero'],
    ['match', 'https://live.bilibili.com/*'],
    ['require', ''],
    ['resource', ''],
    ['icon', 'https://www.bilibili.com/favicon.ico'],
    ['run-at', ''],
    ['connect', ''],
    ['tag', ''],
    ['license', 'GPL-3'],
    ['namespace', 'https://github.com/AliubYiero/Yiero_WebScripts'],
];

export { UserScript };
