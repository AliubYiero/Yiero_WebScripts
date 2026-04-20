import { ScriptCatUserScript } from '../types/UserScript';

const UserScript: ScriptCatUserScript = [
    ['name', '小说自动滚动'],
    [
        'description',
        '小说自动滚动脚本, 支持自动翻页/无限滚动模式.\\n支持网站: 起点, 微信阅读, QQ阅读, 阅读 \\nSpace 开启/关闭滚动, 长按 Space 临时暂停, Shift+PageUp/PageDown 调节速度.',
    ],
    ['version', '1.0.1'],
    ['author', 'Yiero'],
    ['match', 'https://www.qidian.com/chapter/*'],
    ['match', 'https://book.qq.com/book-read/*'],
    ['match', 'https://weread.qq.com/*'],
    ['match', 'http://192.168.5.136:1122/*'],
    ['match', 'http://192.168.5.137:1122/*'],
    ['match', 'http://192.168.5.138:1122/*'],
    ['require', ''],
    ['resource', ''],
    ['icon', ''],
    ['run-at', ''],
    ['connect', ''],
    ['tag', 'novel'],
    ['tag', 'scroll'],
    ['license', 'GPL-3'],
    ['namespace', 'https://github.com/AliubYiero/Yiero_WebScripts'],
    ['noframes'],
];

export { UserScript };
