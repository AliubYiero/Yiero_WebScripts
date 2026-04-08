import { ScriptInfo, ScriptDetail } from './updateReadme';

/**
 * 将时间戳转换为北京时间 yyyy-mm-dd 格式
 * @param {number} timestamp - 时间戳（默认毫秒）
 * @param {boolean} isSeconds - 是否为秒级时间戳，默认 false（毫秒）
 * @returns {string} yyyy-mm-dd 格式的日期字符串
 */
function timestampToBeijingDate( timestamp: number, isSeconds: boolean = false ): string {
	if ( typeof timestamp !== 'number' || isNaN( timestamp ) ) {
		throw new TypeError( '时间戳必须是有效数字' );
	}
	
	// 统一转为毫秒
	const ms = isSeconds ? timestamp * 1000 : timestamp;
	
	// 北京时间 = UTC + 8小时。将时间戳偏移后，其 UTC 时间即等于北京时间
	const beijingDate = new Date( ms + 8 * 60 * 60 * 1000 );
	
	const year = beijingDate.getUTCFullYear();
	const month = String( beijingDate.getUTCMonth() + 1 ).padStart( 2, '0' );
	const day = String( beijingDate.getUTCDate() ).padStart( 2, '0' );
	
	return `${ year }-${ month }-${ day }`;
}

/**
 * 创建脚本表格行
 */
const createScriptTableRow = ( scriptDetail: ScriptDetail ): string => {
	const scriptType = {
		web: '前台脚本',
		background: '后台脚本',
		crontab: '定时脚本',
	};
	const downloadFromGithub = scriptDetail.downloadUrlFromGithub ? `[Github 源](${ scriptDetail.downloadUrlFromGithub })` : '';
	const downloadFromScriptCat = scriptDetail.downloadUrlFromScripCat ? `[ScriptCat 源](${ scriptDetail.downloadUrlFromScripCat })` : '';
	const downloadUrlFromGreasyFork = scriptDetail.downloadUrlFromGreasyFork ? `[GreasyFork 源](${ scriptDetail.downloadUrlFromGreasyFork })` : '';
	return `| ${ [
		scriptDetail.name,
		scriptDetail.description,
		scriptType[ scriptDetail.scriptType ] || 'unknown',
		scriptDetail.version,
		timestampToBeijingDate( scriptDetail.lastUpdate ),
		downloadFromGithub,
		downloadFromScriptCat,
		downloadUrlFromGreasyFork,
	].join( ' | ' ) } |`;
};

/**
 * 创建脚本表格头
 */
const createScriptTableHeader = (): string => {
	return `| 脚本名称 | 脚本描述 | 脚本类型 | 版本号 | 最后更新 | 安装#1 | 安装#2 | 安装#3 |
| --- | --- | --- | --- | --- | --- | --- | --- |`;
};

/**
 * 创建 脚本列表内容
 */
const createScriptListContent = ( scriptInfo: ScriptInfo ) => {
	const scriptList: string[] = [];
	for ( let domain in scriptInfo ) {
		const scriptDetailMap = scriptInfo[ domain ];
		
		// 按 lastUpdate 降序排序脚本
		const sortedScripts = Object.entries( scriptDetailMap )
			.sort( ( [, a], [, b] ) => b.lastUpdate - a.lastUpdate );
		
		// 分离普通脚本和归档脚本
		const normalScripts = sortedScripts.filter( ([, detail]) => !detail.archive );
		const archivedScripts = sortedScripts.filter( ([, detail]) => detail.archive );
		
		// 添加域名标题
		scriptList.push( `### ${ domain }` );
		
		// 生成普通脚本表格
		if ( normalScripts.length > 0 ) {
			scriptList.push( createScriptTableHeader() );
			for ( const [, scriptDetail] of normalScripts ) {
				scriptList.push( createScriptTableRow( scriptDetail ) );
			}
		}
		
		// 生成归档脚本表格（引用块格式）
		if ( archivedScripts.length > 0 ) {
			scriptList.push( '\n> **归档脚本**\n>' );
			scriptList.push( '>\n> ' + createScriptTableHeader() );
			for ( const [, scriptDetail] of archivedScripts ) {
				scriptList.push( '> ' + createScriptTableRow( scriptDetail ) );
			}
		}
		
		scriptList.push( '\n' );
	}
	return `
## 脚本列表

${ scriptList.join( '\n' ) }
`.trim();
};

/**
 * 创建 私有 README 内容
 * */
const createPrivateReadmeContent = ( scriptInfo: ScriptInfo ) => {
	return `# Yiero's Private Web Scripts

> 也不是那么 Private, 不发布到脚本网站而已. 发现了就能用.
>
> ---
>
> 版本号小于 1.0.0 的脚本为实验性脚本, 不保证更新, 不保证问题修复.

${ createScriptListContent( scriptInfo ) }`;
};

/**
 * 创建 公有 README 内容
 */
const createPublicReadmeContent = ( scriptInfo: ScriptInfo ) => {
	return `# Yiero's Web Scripts

> 版本号小于 1.0.0 的脚本为实验性脚本, 不保证更新, 不保证问题修复.

${ createScriptListContent( scriptInfo ) }


## 目录结构

本脚本库的所有项目都储存在 \`/src\` 目录下, 目录的文件格式以 \`@match\` 捕获的域名为目录, 一共有两种存储方式:

1. 以 \`/src/<顶级域名>/<二级域名>/<项目>\` 为命名格式的项目.
2. 以 \`/src/.<特殊功能>/<项目>\` 为命名格式的项目:
\t- \`/src/.global/<项目>\`: 所有网站匹配的脚本

**示例**

\`\`\`
.
└─src\t
\t└─.global\t
\t|\t└─global-css-import
\t|
    └─com\t
        └─bilibili
            └─bilibili-video-timeline
\`\`\`


### Build

> 下载当前仓库文件

\`\`\`bash
git clone git@github.com:AliubYiero/TamperMonkeyScripts.git
\`\`\`

> 进入对应的脚本项目, 以 \`./src/com/bilibili/bilibili-video-timeline\` 举例:

\`\`\`bash
cd ./src/com/bilibili/bilibili-video-timeline
\`\`\`

> 安装依赖

\`\`\`bash
npm install
# or
yarn install
# or
pnpm install
\`\`\`

> 修改脚本内容

项目模板的使用见 [WebScriptProjectTemplate](https://github.com/AliubYiero/WebScriptProjectTemplate/blob/master/README.md) .

> 打包开发版本进行测试

\`\`\`bash
npm run dev
\`\`\`

> 打包生产环境脚本

\`\`\`bash
npm run build
\`\`\`



## 问题反馈 / Issue

> 1. 发送邮件至 aluibyiero@qq.com , 最迟隔天就能收到回复
> 2. 提 [Issue](https://github.com/AliubYiero/Yiero_WebScripts/issues), 不保证能及时看到回复, 我的 Github 的 Issue 邮箱推送有点问题不一定会给我推送

**功能增加模板**

\`\`\`
脚本名称: [脚本名称]
脚本版本: [如 0.6.0]
需要的新功能:
[...]
\`\`\`



**Bug提交模板**

\`\`\`
脚本名称: [脚本名称]
脚本版本: [如 0.6.0]
使用的浏览器及其版本: [如 Google Chrome 版本 142.0.7444.61（正式版本） （64 位）]

出现的问题:
[...]

重现步骤:
1.
2.
3.

补充(如报错截图):
\`\`\``;
};

/**
 * 创建 README 内容
 */
export const createReadmeContent = ( scriptInfo: ScriptInfo, isPrivate: boolean ) => {
	return isPrivate
		? createPrivateReadmeContent( scriptInfo )
		: createPublicReadmeContent( scriptInfo );
};
