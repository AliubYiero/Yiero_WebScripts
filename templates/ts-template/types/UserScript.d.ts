export type ScriptCatUserScript = ScriptCatUserScriptItem[]

export type ScriptCatUserScriptItem =
	[ UserScriptSingleDescription ] |
	[ 'run-at', UserScriptRunAt ] |
	[ 'run-in', UserScriptRunIn ] |
	[ 'inject-into', UserScriptInjectInto ] |
	[ 'grant', UserScriptGrant ] |
	[ 'resource', string, string ] |
	[ 'antifeature', UserScriptAntifeature, string ] |
	[ UserScriptKey, string ] |
	[ string, string ]

type UserScriptSingleDescription =
	'background' | 'noframes' | 'early-start'

export type UserScriptKey =
	| 'name'
	| 'namespace'
	| 'version'
	| 'description'
	| 'author'
	| 'storageName'
	| 'crontab'
	| 'match'
	| 'include'
	| 'exclude'
	| 'connect'
	| 'require'
	| 'require-css'
	| 'definition'
	| 'license'
	| 'updateURL'
	| 'downloadURL'
	| 'supportURL'
	| 'homepage'
	| 'homepageURL'
	| 'website'
	| 'source'
	| 'icon'
	| 'iconURL'
	| 'defaulticon'
	| 'icon64'
	| 'icon64URL'
	| 'tag';

/**
 * 脚本的运行时间
 */
type UserScriptRunAt = 'document-start'
	| 'document-idle'
	| 'document-end'
	| 'document-body'
	| 'context-menu'

type UserScriptGrant = 'GM_addStyle'
	| 'GM_addElement'
	| 'GM_getResourceText'
	| 'GM_getResourceURL'
	| 'GM_registerMenuCommand'
	| 'GM_unregisterMenuCommand'
	| 'GM_info'
	| 'GM_log'
	| 'GM_notification'
	| 'GM_setClipboard'
	| 'GM_getTab'
	| 'GM_saveTab'
	| 'GM_getTabs'
	| 'GM_setValue'
	| 'GM_getValue'
	| 'GM_deleteValue'
	| 'GM_listValues'
	| 'GM_addValueChangeListener'
	| 'GM_removeValueChangeListener'
	| 'GM_openInTab'
	| 'GM_download'
	| 'GM_xmlhttpRequest'
	| 'GM_webRequest'
	| 'GM_cookie'
	| 'GM.cookie'
	| 'window.onurlchange'
	| 'window.close'
	| 'window.focus'
	| 'CAT_userConfig'
	| 'CAT_fileStorage'
	| 'none'
	| 'unsafeWindow'

/**
 * 指定脚本注入的环境
 */
type UserScriptRunIn = 'normal-tabs' | 'incognito-tabs'

/**
 * 指定脚本注入的位置
 */
type UserScriptInjectInto = 'page' | 'content'

/**
 * 与脚本市场有关的，不受欢迎的功能需要加上此描述值
 */
type UserScriptAntifeature =
	'ads'
	| 'referral-link'
	| 'tracking'
	| 'miner'
	| string
