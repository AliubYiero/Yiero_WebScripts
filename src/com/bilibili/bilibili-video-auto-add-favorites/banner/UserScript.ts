import { IUserScript } from './UserScript.d';

const UserScript: IUserScript[] = [
	[ 'name', 'BiliBili自动添加视频收藏' ],
	[ 'description', '进入视频页面后, 自动添加视频到收藏夹中. ' ],
	[ 'version', '0.6.1' ],
	[ 'author', 'Yiero' ],
	[ 'match', 'https://www.bilibili.com/video/*' ],
	[ 'match', 'https://www.bilibili.com/s/video/*' ],
	[ 'match', 'https://www.bilibili.com/bangumi/play/*' ],
	[ 'require', '' ],
	[ 'resource', '' ],
	[ 'run-at', 'document-start' ],
	[ 'license', 'GPL-3' ],
	[ 'connect', 'api.bilibili.com' ],
	[ 'icon', 'https://www.bilibili.com/favicon.ico' ],
	[ 'namespace', 'https://github.com/AliubYiero/Yiero_WebScripts' ],
];

export {
	UserScript,
};
