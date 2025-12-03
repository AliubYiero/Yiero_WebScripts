import { IUserScript } from './UserScript.d';

const UserScript: IUserScript[] = [
	[ 'name', 'Bilibili视频观看状态标记' ],
	[ 'description', '基于收藏夹内容, 自动标记Bilibili视频的观看状态(已看/未看)' ],
	[ 'version', '1.0.0' ],
	[ 'author', 'Yiero' ],
	[ 'match', 'https://*.bilibili.com/*' ],
	[ 'require', '' ],
	[ 'resource', '' ],
	[ 'icon', 'https://www.bilibili.com/favicon.ico' ],
	[ 'run-at', '' ],
	[ 'connect', 'api.bilibili.com' ],
	[ 'license', 'GPL-3' ],
	[ 'namespace', 'https://github.com/AliubYiero/Yiero_WebScripts' ],
	[ 'noframes', '' ],
];

export {
	UserScript,
};
