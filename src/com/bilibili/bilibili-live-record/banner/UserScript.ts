import { ScriptCatUserScript } from '../types/UserScript';

const UserScript: ScriptCatUserScript = [
	[ 'name', 'Bilibili直播时间点标记' ],
	[ 'description', '在Bilibili直播中标记时间, 方便用户查阅' ],
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
	[ 'tag', 'mark' ],
	[ 'license', 'GPL-3' ],
	[ 'namespace', 'https://github.com/AliubYiero/Yiero_WebScripts' ],
];

export {
	UserScript,
};
