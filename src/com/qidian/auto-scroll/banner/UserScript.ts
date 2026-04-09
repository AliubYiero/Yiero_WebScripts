import { ScriptCatUserScript } from '../types/UserScript';

const UserScript: ScriptCatUserScript = [
	[ 'name', '小说自动滚动' ],
	[ 'description', '自动滚动脚本. 通过快捷键 PageDown 控制页面平滑滚动, 通过快捷键 PageUp 暂停滚动. ' ],
	[ 'version', '0.3.0' ],
	[ 'author', 'Yiero' ],
	[ 'match', 'https://www.qidian.com/chapter/*' ],
	[ 'match', 'http://192.168.5.136:1122/*' ],
	[ 'match', 'http://192.168.5.137:1122/*' ],
	[ 'match', 'http://192.168.5.138:1122/*' ],
	[ 'require', '' ],
	[ 'resource', '' ],
	[ 'icon', '' ],
	[ 'run-at', '' ],
	[ 'connect', '' ],
	[ 'tag', 'novel' ],
	[ 'tag', 'scroll' ],
	[ 'license', 'GPL-3' ],
	[ 'namespace', 'https://github.com/AliubYiero/Yiero_WebScripts' ],
	[ 'noframes' ],
];

export {
	UserScript,
};
