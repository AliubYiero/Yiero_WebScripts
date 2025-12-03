export declare type IUserScript = [ IUserScriptKey, string ]
	| [ 'run-at', IUserScriptRunAt ]
	| [ 'grant', GrantFunctionInterface ];

/**
 * 键值
 */
export declare type IUserScriptKey =
	'name'
	| 'namespace'
	| 'version'
	| 'description'
	| 'author'
	| 'run-at'
	| 'run-in'
	| 'early-start'
	| 'inject-into'
	| 'storageNam'
	| 'background'
	| 'crontab'
	| 'match'
	| 'include'
	| 'exclude'
	| 'grant'
	| 'connect'
	| 'resource'
	| 'require'
	| 'require-css'
	| 'noframes'
	| 'definition'
	| 'antifeature'
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

/**
 * 脚本运行时机
 * */
export declare type IUserScriptRunAt =
	'document-start'
	| 'document-idle'
	| 'document-end'
	| 'document-body'
	| 'context-menu';

/**
 * 授权函数名数组
 * */
export declare type GrantFunctionInterface =
	'GM_addStyle'
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
	| 'GM_cookie.list'
	| 'GM_cookie.set'
	| 'GM_cookie.delete'
	| 'window.onurlchange'
	| 'window.close'
	| 'window.focus'
	| 'CAT_userConfig'
	| 'CAT_fileStorage';
