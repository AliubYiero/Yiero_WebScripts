import { ScriptCatUserScript } from '../types/UserScript';

const UserScript: ScriptCatUserScript = [
	[ 'name', 'Bilibili直播隐藏重复弹幕' ],
	[ 'description', 'Bilibili直播隐藏重复弹幕.' ],
	[ 'version', '1.0.0' ],
	[ 'author', 'Yiero' ],
	[ 'match', 'https://live.bilibili.com/*' ],
	[ 'require', '' ],
	[ 'resource', '' ],
	[ 'icon', '' ],
	[ 'run-at', '' ],
	[ 'connect', '' ],
	[ 'tag', 'bilibili' ],
	[ 'tag', 'live' ],
	[ 'tag', 'style' ],
	[ 'license', 'GPL-3' ],
	[ 'namespace', 'https://github.com/AliubYiero/Yiero_WebScripts' ],
];

export {
	UserScript,
};
