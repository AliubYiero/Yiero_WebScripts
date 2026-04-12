import { ScriptCatUserScript } from '../types/UserScript';

const UserScript: ScriptCatUserScript = [
	[ 'name', 'Bilibili直播评论样式修改' ],
	[ 'description', '修改Bilibili直播间的评论样式弹幕显示样式, 使其按卡片式固定格式显示. 即上面是用户信息, 下面是弹幕.\\n优化弹幕框顶部的房间观众和大航海显示, 不再固定显示.' ],
	[ 'version', '1.0.2' ],
	[ 'author', 'Yiero' ],
	[ 'match', 'https://live.bilibili.com/*' ],
	[ 'require', '' ],
	[ 'resource', '' ],
	[ 'icon', 'https://www.bilibili.com/favicon.ico' ],
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
