import { ScriptCatUserScript } from '../types/UserScript';

const UserScript: ScriptCatUserScript = [
    ['name', 'Bilibili 视频时间轴'],
    ['description', '根据视频字幕, 生成视频时间轴. '],
    ['version', '1.5.2'],
    ['author', 'Yiero'],
    ['match', 'https://www.bilibili.com/video/*'],
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
