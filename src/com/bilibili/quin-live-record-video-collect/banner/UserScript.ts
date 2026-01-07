import { ScriptCatUserScript } from '../types/UserScript';

const UserScript: ScriptCatUserScript = [
	[ 'name', 'Mr.Quin 录播抓取程序' ],
	[ 'description', 'Mr.Quin 录播抓取, 并生成日志' ],
	[ 'version', '0.1.1' ],
	[ 'author', 'Yiero' ],
	[ 'match', 'https://space.bilibili.com/245335*' ],
	[ 'match', 'https://space.bilibili.com/15810*' ],
	[ 'match', 'https://space.bilibili.com/1400350754*' ],
	[ 'require', '' ],
	[ 'resource', '' ],
	[ 'icon', '' ],
	[ 'run-at', '' ],
	[ 'connect', '' ],
	[ 'tag', '' ],
	[ 'license', 'GPL-3' ],
	[ 'namespace', 'https://github.com/AliubYiero/Yiero_WebScripts' ],
	[ 'noframes' ],
];

export {
	UserScript,
};
