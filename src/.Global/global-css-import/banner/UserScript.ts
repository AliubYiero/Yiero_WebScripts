import { ScriptCatUserScript } from '../types/UserScript';

const UserScript: ScriptCatUserScript = [
    ['name', '全局CSS导入'],
    [
        'description',
        '将自定义的 CSS 导入进页面中, 实现易用可控的页面样式控制. ',
    ],
    ['version', '1.1.3'],
    ['author', 'Yiero'],
    ['match', 'https://*/*'],
    [
        'require',
        'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.6.0/highlight.min.js',
    ],
    [
        'resource',
        'highlight    https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.6.0/styles/default.min.css',
    ],
    ['resource', ''],
    ['icon', ''],
    ['run-at', 'document-body'],
    ['connect', ''],
    ['tag', ''],
    ['license', 'GPL-3'],
    ['namespace', 'https://github.com/AliubYiero/Yiero_WebScripts'],
];

export { UserScript };
