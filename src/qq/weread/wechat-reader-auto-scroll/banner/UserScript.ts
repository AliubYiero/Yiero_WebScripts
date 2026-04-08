import { ScriptCatUserScript } from '../types/UserScript';

const UserScript: ScriptCatUserScript = [
	[ 'name', '微信读书自动阅读助手' ],
	[ 'description', '微信读书自动滚动, 自动翻页. ' ],
	[ 'version', '1.0.0' ],
	[ 'author', 'Yiero' ],
	[ 'match', 'https://weread.qq.com/*' ],
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
