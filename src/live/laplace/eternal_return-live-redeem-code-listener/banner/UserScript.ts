import { ScriptCatUserScript } from '../types/UserScript';

const UserScript: ScriptCatUserScript = [
    ['name', '永恒轮回兑换码监听'],
    [
        'description',
        '监听永恒轮回直播间发放的兑换码, 发送桌面通知并且记录兑换码',
    ],
    ['version', '0.1.0'],
    ['author', 'Yiero'],
    ['match', 'https://chat.laplace.live/dashboard/21456983*'],
    ['match', 'https://live.bilibili.com/21456983*'],
    ['require', ''],
    ['resource', ''],
    ['run-at', ''],
    ['connect', ''],
    ['tag', ''],
    [
        'icon',
        'https://cdn.playeternalreturn.com/images/favicon/favicon-32x32.png',
    ],
    ['license', 'GPL-3'],
    ['namespace', 'https://github.com/AliubYiero/Yiero_WebScripts'],
    ['noframes'],
];

export { UserScript };
