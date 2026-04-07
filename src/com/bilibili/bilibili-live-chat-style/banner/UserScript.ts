import { ScriptCatUserScript } from '../types/UserScript';

const UserScript: ScriptCatUserScript = [
	[ 'name', 'Bilibili直播评论样式修改' ],
	[ 'description', '修改Bilibili直播间的评论样式弹幕, 使其按固定格式显示. 即上面是用户信息, 下面是弹幕. ' ],
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
