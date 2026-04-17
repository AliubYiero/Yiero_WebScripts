import { ScriptCatUserScript } from '../types/UserScript';

const UserScript: ScriptCatUserScript = [
    ['name', '健康浏览网页'],
    ['description', '限制网页访问时间'],
    ['version', '1.0.0'],
    ['author', 'Yiero'],
    ['match', '*://*/*'],
    ['require', ''],
    ['resource', ''],
    ['icon', ''],
    ['run-at', 'document-start'],
    ['connect', ''],
    ['tag', ''],
    ['license', 'GPL-3'],
    ['namespace', 'https://github.com/AliubYiero/Yiero_WebScripts'],
    ['noframes'],
];

export { UserScript };
