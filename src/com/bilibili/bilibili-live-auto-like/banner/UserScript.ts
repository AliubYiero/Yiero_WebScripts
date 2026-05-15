import { ScriptCatUserScript } from '../types/UserScript';

const UserScript: ScriptCatUserScript = [
    ['name', 'Bilibili直播自动点赞'],
    ['description', 'Bilibili进入直播间后自动点赞.'],
    ['version', '1.3.0'],
    ['author', 'Yiero'],
    ['run-at', 'document-body'],
    ['match', 'https://live.bilibili.com/*'],
    ['require', ''],
    ['resource', ''],
    ['icon', 'https://www.bilibili.com/favicon.ico'],
    ['run-at', ''],
    ['connect', ''],
    ['tag', 'bilibili'],
    ['tag', 'live'],
    ['license', 'GPL-3'],
    ['namespace', 'https://github.com/AliubYiero/Yiero_WebScripts'],
];

export { UserScript };
