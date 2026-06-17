import { ScriptCatUserScript } from '../types/UserScript';

const UserScript: ScriptCatUserScript = [
    ['name', '流放之路2批量读取道具信息'],
    ['description', '读取道具的名称, 词缀, 价格. 目前仅支持深渊石板'],
    ['version', '0.1.0'],
    ['author', 'Yiero'],
    ['match', 'https://poe.game.qq.com/trade2/*'],
    ['require', ''],
    ['resource', ''],
    ['icon', 'https://poe.game.qq.com/favicon.ico'],
    ['run-at', ''],
    ['connect', ''],
    ['tag', ''],
    ['license', 'GPL-3'],
    ['namespace', 'https://github.com/AliubYiero/Yiero_WebScripts'],
    ['noframes'],
];

export { UserScript };
