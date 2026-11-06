import type { ScriptCatUserScript } from '../types/UserScript';

const UserScript: ScriptCatUserScript = [
    ['name', '悠悠有品饰品折扣率计算'],
    [
        'description',
        '在首页访问时, 直接显示当前饰品可以倒余额的折扣率.',
    ],
    ['version', '1.0.1'],
    ['author', 'Yiero'],
    ['match', 'https://www.youpin898.com/*'],
    ['require', ''],
    ['resource', ''],
    ['icon', ''],
    ['run-at', 'document-body'],
    ['connect', ''],
    ['tag', ''],
    ['license', 'GPL-3'],
    ['namespace', 'https://github.com/AliubYiero/Yiero_WebScripts'],
    ['noframes'],
];

export { UserScript };
