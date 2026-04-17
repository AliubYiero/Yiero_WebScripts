import { ScriptCatUserScript } from '../types/UserScript';

const UserScript: ScriptCatUserScript = [
    ['name', 'Bilibili跳过视频广告'],
    [
        'description',
        '通过 AI 将 Bilibili 视频中的推广广告移除, 同时移除评论区的广告跳转评论. ',
    ],
    ['version', '0.1.0'],
    ['author', 'Yiero'],
    ['match', 'https://www.bilibili.com/video/*'],
    ['require', ''],
    ['resource', ''],
    ['icon', ''],
    ['run-at', ''],
    ['connect', ''],
    ['tag', 'bilibili'],
    ['tag', 'ai'],
    ['tag', 'ad-block'],
    ['license', 'GPL-3'],
    ['namespace', 'https://github.com/AliubYiero/Yiero_WebScripts'],
    ['noframes'],
];

export { UserScript };
