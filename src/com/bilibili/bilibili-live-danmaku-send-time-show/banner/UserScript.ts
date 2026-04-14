import { ScriptCatUserScript } from '../types/UserScript';

const UserScript: ScriptCatUserScript = [
	[ 'name', 'Bilibili 直播弹幕发送时间显示' ],
	[ 'description', '在评论框直播弹幕的最后, 显示弹幕发送的时间' ],
	[ 'version', '1.0.0' ],
	[ 'author', 'Yiero' ],
	[ 'match', 'https://live.bilibili.com/*' ],
	[ 'require', '' ],
	[ 'resource', '' ],
	[ 'icon', 'https://www.bilibili.com/favicon.ico' ],
	[ 'run-at', 'document-idle' ],
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
