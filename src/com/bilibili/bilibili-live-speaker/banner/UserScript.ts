import { ScriptCatUserScript } from '../types/UserScript';

const UserScript: ScriptCatUserScript = [
    ['name', 'Bilibili独轮车'],
    ['description', 'Bilibili独轮车, 按照指定间隔发布弹幕'],
    ['version', '1.0.0'],
    ['author', 'Yiero'],
    ['match', 'https://live.bilibili.com/*'],
    ['require', ''],
    ['resource', ''],
    ['icon', ''],
    ['run-at', ''],
    ['connect', ''],
    ['tag', 'bilibili'],
    ['tag', 'live'],
    ['tag', 'speak'],
    ['license', 'GPL-3'],
    ['namespace', 'https://github.com/AliubYiero/Yiero_WebScripts'],
    ['noframes'],
];

export { UserScript };
