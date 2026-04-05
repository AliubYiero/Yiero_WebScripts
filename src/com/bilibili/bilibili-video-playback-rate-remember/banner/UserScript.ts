import { ScriptCatUserScript } from '../types/UserScript';

const UserScript: ScriptCatUserScript = [
	[ 'name', 'Bilibili视频倍速记忆' ],
	[ 'description', '自动记忆视频播放倍速设置，并提供快捷键快速调整播放速度。' ],
	[ 'version', '1.1.0' ],
	[ 'author', 'Yiero' ],
	[ 'match', 'https://www.bilibili.com/video/*' ],
	[ 'require', '' ],
	[ 'resource', '' ],
	[ 'icon', '' ],
	[ 'run-at', '' ],
	[ 'connect', '' ],
	[ 'tag', 'bilibili' ],
	[ 'tag', 'video' ],
	[ 'tag', 'playbackRate' ],
	[ 'license', 'GPL-3' ],
	[ 'namespace', 'https://github.com/AliubYiero/Yiero_WebScripts' ],
	[ 'noframes' ],
];

export {
	UserScript,
};
