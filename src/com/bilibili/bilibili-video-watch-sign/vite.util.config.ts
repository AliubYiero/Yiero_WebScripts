import { IUserScript, IUserScriptKey } from './banner/UserScript.d';
import { IUserConfig } from './banner/UserConfig.d';
import { pathToFileURL } from 'url';
import { resolve } from 'path';
import YAML from 'yamljs';
import { existsSync } from 'fs';
import { UserScript } from './banner/UserScript';

export interface ParseUserScript {
	info: IUserScript[];
	prevLength: number;
	mapper: Record<IUserScriptKey, string>;
	original: IUserScript[];
}

/**
 * 将 Entry 数组形式的 UserScript 转换成对象, 过滤掉空属性
 */
export const parseUserScript = (
	userScript: IUserScript[],
	isDevelopment: boolean = false,
): ParseUserScript => {
	// 获取所有 key 中的最大长度
	const userScriptKeyMaxLength: number = userScript.reduce<number>(
		( maxLength, item ) => Math.max( item[ 0 ].length, maxLength ), 0,
	);
	
	// 记录只需要 key 值的属性
	const booleanKeySet: Set<IUserScriptKey> = new Set( [ 'background', 'early-start', 'noframes' ] );
	// 过滤掉空属性
	const filterUserScript = userScript.filter( ( [ key, value ] ) =>
		booleanKeySet.has( <IUserScriptKey> key ) || value,
	);
	
	// 将 Entry 数组形式的 UserScript 转换成对象
	const userScriptObject: Record<string, string> = Object.fromEntries( filterUserScript );
	
	// 如果是 开发环境, 在 UserScript 中加入 require 自我引用
	const outputFileName = userScriptObject.name + '.dev.js';
	isDevelopment && filterUserScript.push( [ 'require', pathToFileURL( resolve( __dirname, 'dist', outputFileName ) ).href ] as IUserScript );
	
	return {
		info: filterUserScript,
		mapper: userScriptObject,
		original: userScript,
		prevLength: userScriptKeyMaxLength,
	};
};
export const userScript = parseUserScript( UserScript );

/**
 * 字符串化 UserScript
 */
export const stringifyUserScript = ( userScript: ParseUserScript ) => {
	return [
		'// ==UserScript==',
		...userScript.info.map( ( [ key, value ] ) => {
			const formatKey = key.padEnd( userScript.prevLength, ' ' );
			return `// @${ formatKey }    ${ value }`;
		} ),
		'// ==/UserScript==',
	].join( '\n' );
};

/**
 * 字符串化 UserConfig
 */
export const stringifyUserConfig = ( userConfig: IUserConfig ) => {
	// 如果 userConfig 为空, 直接返回空字符串
	if ( userConfig == void 0 || Object.keys( userConfig ).length === 0 ) {
		return '';
	}
	
	// 读取 UserConfig.ts 字符串
	const userConfigContent = YAML.stringify( userConfig, 4, 4 ).trim();
	return [
		'/* ==UserConfig==',
		userConfigContent,
		'==/UserConfig== */',
	].join( '\n' );
};


/**
 * 输入校验
 */
export const validateUserScript = (
	userScript: ParseUserScript,
	isProduction: boolean,
) => {
	const { mapper } = userScript;
	if ( typeof mapper !== 'object' ) {
		throw new Error( '缺失脚本信息: name, version, description, author' );
	}
	
	if ( !( mapper.match || mapper.crontab || mapper.background ) ) {
		if ( !mapper.match ) {
			throw new Error( '缺失脚本信息: match' );
		}
		throw new Error( '缺失脚本信息: crontab 或者 background' );
	}
	
	( <IUserScriptKey[]> [ 'name', 'version', 'description', 'author' ] ).forEach( key => {
		if ( !mapper[ key ] ) {
			throw new Error( `缺失脚本信息: ${ key }` );
		}
	} );
	
	/**
	 * 判断是否存在开发文件
	 */
	const outputFileName = `${ mapper.name }.js`;
	const backupProductionFilepath = resolve( __dirname, 'dist', mapper.version, outputFileName );
	if ( isProduction && existsSync( backupProductionFilepath ) ) {
		throw new Error( `已存在版本号为 ${ mapper.version } 的生产文件, 禁止覆盖版本备份文件...\n    at ${ pathToFileURL(backupProductionFilepath) }` );
	}
};
