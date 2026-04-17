import { ScriptCatUserScript } from '../types/UserScript';

const UserScript: ScriptCatUserScript = [
    ['name', '仓库跳转下载链接'],
    [
        'description',
        '在标签栏添加 跳转下载 按钮, 点击后可快速跳转至下载链接区域',
    ],
    ['version', '1.0.0'],
    ['author', 'Yiero'],
    ['match', 'https://cangku.moe/*'],
    ['require', ''],
    ['resource', ''],
    ['icon', 'https://cangku.moe/favicon.ico'],
    ['run-at', ''],
    ['connect', ''],
    ['tag', ''],
    ['license', 'GPL-3'],
    ['namespace', 'https://github.com/AliubYiero/Yiero_WebScripts'],
    ['noframes'],
];

export { UserScript };
