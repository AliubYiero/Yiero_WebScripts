import { ScriptCatUserScript } from '../types/UserScript';

const UserScript: ScriptCatUserScript = [
    ['name', '流放之路2网页市集快速跳转'],
    [
        'description',
        '按下空格, 自动点击搜索栏的第一个可跳转的商品藏身处',
    ],
    ['version', '1.0.1'],
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
