import { ScriptCatUserScript } from '../types/UserScript';

const UserScript: ScriptCatUserScript = [
	[ 'name', 'Bilibili直播弹幕刷屏屏蔽' ],
	[ 'description', '用于B站直播间的弹幕净化脚本. 屏蔽独轮车, 屏蔽重复弹幕, 屏蔽刷屏用户.' ],
	[ 'version', '1.0.2' ],
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
