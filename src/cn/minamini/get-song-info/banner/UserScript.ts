import { ScriptCatUserScript } from '../types/UserScript';

const UserScript: ScriptCatUserScript = [
    ['name', '获取歌单信息'],
    ['description', '自动从页面表格中提取歌曲名称和歌手名称'],
    ['version', '0.1.0'],
    ['author', 'Yiero'],
    ['match', '*://www.minamini.cn/*'],
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
