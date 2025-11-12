/// <reference types="vitest" />
import { defineConfig, ResolvedConfig } from 'vite';
import banner from 'vite-plugin-banner';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';
import { IUserScript, IUserScriptKey } from './banner/UserScript.d';
import { UserScript } from './banner/UserScript';
import { UserConfig } from './banner/UserConfig';
// @ts-ignore
import YAML from 'yamljs';
import { pathToFileURL } from 'url';
// @ts-ignore
import vitePluginRaw from 'vite-plugin-raw';
import replace from '@rollup/plugin-replace';
// @ts-ignore
import { OutputOptions } from 'rollup';

/**
 * 提取脚本中的授权函数, 添加到配置文件中
 */
const ExtractUserScriptGrantFunctionPlugin = () => {
	let viteConfig: ResolvedConfig;
	return {
		name: 'vite-plugin-extract-user-script-grant-function',
		apply: 'build',
		configResolved( resolvedConfig: ResolvedConfig ) {
			viteConfig = resolvedConfig;
		},
		async writeBundle( _: any, bundle: Record<string, Object> ) {
			for ( const file of Object.entries( bundle ) ) {
				// Get the full path of file
				const root = viteConfig.root;
				const outDir = viteConfig.build.outDir;
				
				const fileName = file[ 0 ].endsWith( '.js-lean' )
					? file[ 0 ].replace( /\.js-lean/, '.lean.js' )
					: file[ 0 ];
				
				const filePath = resolve( root, outDir, fileName );
				
				// Only handle matching files
				try {
					// Read the content from target file
					let data: string = readFileSync( filePath, {
						encoding: 'utf8',
					} );
					const GrantFunctionList: string[] = [ 'GM_addStyle', 'GM_addElement', 'GM_getResourceText', 'GM_getResourceURL', 'GM_registerMenuCommand', 'GM_unregisterMenuCommand', 'GM_info', 'GM_log', 'GM_notification', 'GM_setClipboard', 'GM_getTab', 'GM_saveTab', 'GM_getTabs', 'GM_setValue', 'GM_getValue', 'GM_deleteValue', 'GM_listValues', 'GM_addValueChangeListener', 'GM_removeValueChangeListener', 'GM_openInTab', 'GM_download', 'GM_xmlhttpRequest', 'GM_webRequest', 'GM_cookie', 'GM_cookie.list', 'GM_cookie.set', 'GM_cookie.delete', 'window.onurlchange', 'window.close', 'window.focus', 'CAT_userConfig', 'CAT_fileStorage' ];
					GrantFunctionList.forEach( ( grantFunctionName ) => {
						if ( data.includes( grantFunctionName )
							&& !UserScript.find(
								( [ key, grantFunction ] ) => key === 'grant'
									&& grantFunction === grantFunctionName,
							)
						) {
							UserScript.push( [ 'grant', grantFunctionName ] as IUserScript );
						}
					} );
				}
				catch ( e ) {
					console.error( e );
				}
			}
		},
	};
};

/**
 * 顶部信息字符串化
 */
const stringifyBannerContent = ( isProduction: boolean, outputFileName: string ): string => {
	const bannerContentList: string[] = [];
	
	/*
	* UserScript
	* */
	// 去除空属性 (除了 background)
	const userScript = UserScript.filter( info => info[ 1 ].trim() || info[ 0 ] === 'background' );
	
	// 获取所有 key 中的最大长度
	const UserScriptKeyMaxLength: number = userScript.reduce<number>( ( maxLength, item ) => Math.max( item[ 0 ].length, maxLength ), 0 );
	// 如果是 开发环境, 在 UserScript 中加入 require 自我引用
	const selfRequire = [ 'require', pathToFileURL( resolve( __dirname, 'dist', outputFileName ) ).href ] as IUserScript;
	!isProduction && userScript.push( selfRequire );
	// 字符串化 UserScript
	bannerContentList.push( ...[
		'// ==UserScript==',
		userScript.map( ( [ key, value ] ) => {
			const formatKey = key.padEnd( UserScriptKeyMaxLength, ' ' );
			// 如果是开发环境, 给版本号添加 -beta 后缀
			const formatValue = ( <IUserScriptKey[]> [ 'version', 'name', 'name:en' ] ).includes( key ) && !isProduction
				? `${ value }-beta`
				: value;
			return `// @${ formatKey }    ${ formatValue }`;
		} ).join( '\n' ),
		'// ==/UserScript==',
	] );
	
	/*
	* UserConfig
	* */
	// 读取 UserConfig.ts 字符串
	const userConfig = YAML.stringify( UserConfig, 4, 4 ).trim();
	// 字符串化 UserScript
	userConfig !== '{}' && bannerContentList.push( ...[
		'/* ==UserConfig==',
		userConfig,
		'==/UserConfig== */',
	] );
	return bannerContentList.filter( item => item ).join( '\n' );
};

/**
 * 后台脚本添加 Promise 函数文本
 */
const AppendPromiseBodyPlugin = ( options: {
	padStartContent?: string,
	padEndContent?: string,
	backgroundScript?: boolean
} = {} ) => {
	const {
		padStartContent = '',
		padEndContent = '',
		backgroundScript = false,
	} = options;
	let viteConfig: ResolvedConfig;
	// Handle files
	return {
		name: 'vite-plugin-append-promise-body',
		apply: 'build',
		configResolved( resolvedConfig: ResolvedConfig ) {
			viteConfig = resolvedConfig;
		},
		async writeBundle( _: any, bundle: Record<string, Object> ) {
			// 判断: 如果不是后台脚本, 不处理
			if ( !backgroundScript ) {
				return;
			}
			for ( const file of Object.entries( bundle ) ) {
				// Get the full path of file
				const root = viteConfig.root;
				const outDir = viteConfig.build.outDir;
				
				const fileName = file[ 0 ].endsWith( '.js-lean' )
					? file[ 0 ].replace( /\.js-lean/, '.lean.js' )
					: file[ 0 ];
				
				const filePath = resolve( root, outDir, fileName );
				
				
				// Only handle matching files
				try {
					// Read the content from target file
					let data: string = readFileSync( filePath, {
						encoding: 'utf8',
					} );
					
					data = [
						'// noinspection JSAnnotator',
						'return new Promise((resolve, reject) => {',
						padStartContent,
						data.trim(),
						padEndContent,
						'});',
					].filter( item => item ).join( '\n' );
					// Save
					writeFileSync( filePath, data );
				}
				catch ( e ) {
					console.error( e );
				}
			}
		},
	};
};

export default defineConfig( ( { mode } ) => {
	/*
	* 获取当前的构建环境
	* */
	const isProduction = mode === 'production';
	
	/**
	 * 将 UserScript 转换成对象
	 */
	const userScript: Record<IUserScriptKey, string> = UserScript.reduce( ( userScript, [ key, value ] ) => {
		// 去除空属性, 或者是 background
		if ( !value || key === 'background' ) {
			return userScript;
		}
		userScript[ key ] = value;
		return userScript;
	}, {} as Record<IUserScriptKey, string> );
	
	/*
	* 在开发环境中监听代码更新
	* */
	const watchOptions = isProduction
		? { include: [ 'src/**', 'banner/**' ] }
		: void 0;
	
	/*
	* 输出文件名
	* */
	const fileName = userScript.name;
	const outputFileName = isProduction
		? `${ fileName }.js`
		: `${ fileName }.dev.js`;
	
	/**
	 * 输出配置
	 */
	const outputOptions: OutputOptions[] = [];
	outputOptions.push( {
		entryFileNames: outputFileName,
		format: 'es',
		manualChunks() {
			// 把项目文件夹里面的文件都打包到一个文件中
			return outputFileName;
		},
	} );
	isProduction && outputOptions.push( {
		entryFileNames: join( userScript.version, outputFileName ),
		format: 'es',
		manualChunks() {
			// 把项目文件夹里面的文件都打包到一个文件中
			return join( userScript.version, outputFileName );
		},
	} );
	
	/**
	 * 判断是否存在必要信息
	 */
	( <IUserScriptKey[]> [ 'name', 'version', 'description', 'author' ] ).forEach( key => {
		if ( !userScript[ key ] ) {
			throw new Error( `缺失脚本信息: ${ key }` );
		}
	} );
	// 如果是前台脚本, 需要存在 match
	// 如果是后台脚本, 需要存在 crontab 或者 background
	if ( !( userScript.match || userScript.crontab || userScript.background ) ) {
		throw new Error( `缺失脚本信息: match, crontab 或者 background` );
	}
	
	/**
	 * 判断是否存在开发文件
	 */
	const filepath = resolve( __dirname, 'dist', outputFileName );
	const backupProductionFilepath = resolve( __dirname, 'dist', userScript.version, outputFileName );
	if ( isProduction && existsSync( backupProductionFilepath ) ) {
		throw new Error( `存在文件 [${ backupProductionFilepath }], 禁止覆盖版本备份文件...` );
	}
	
	console.info( `文件即将打包: \n  at ${ pathToFileURL( filepath ) }` );
	if ( isProduction ) {
		console.info( `  at ${ pathToFileURL( backupProductionFilepath ) }` );
	}
	/*
	* 返回
	* */
	return {
		esbuild: {
			drop: isProduction ? [
				'debugger',
				// 'console',
			] : void 0,
			charset: 'ascii',
			minifySyntax: false,
			minifyIdentifiers: false,
			minifyWhitespace: false,
		},
		build: {
			// 使用混淆代码, 具体配置为 terserOptions
			// minify: 'esbuild',
			// 压缩代码
			// terserOptions: terserOptions,
			// 不清空打包目录
			emptyOutDir: false,
			
			// 在开发环境中热更新代码
			watch: watchOptions,
			
			// rollup打包配置
			rollupOptions: {
				/*
				* 项目 io 配置
				* */
				input: 'src/main.ts',
				output: outputOptions,
				
				/*
				* 插件配置
				* */
				plugins: [
					ExtractUserScriptGrantFunctionPlugin(),
					vitePluginRaw( {
						match: /css$/,
					} ),
					AppendPromiseBodyPlugin( {
						padEndContent: 'resolve();',
						backgroundScript: Boolean( userScript.background || userScript.crontab ),
					} ),
					/*
					* 添加顶部信息
					* */
					banner( {
						content: () => {
							// noinspection UnnecessaryLocalVariableJS
							const bannerContent = stringifyBannerContent( isProduction, outputFileName );
							return bannerContent;
						},
						// 关闭注释合法性校验
						verify: false,
					} ),
					/*
					* 自定义替换代码
					* */
					replace( {
						preventAssignment: true,
						/**
						 * 在这里写要替换的代码/字符串
						 * key: 要捕获的字符串
						 * value: 捕获后要替换掉的字符串
						 * @example {'console.log': '(() => {})'} 代码中所有的 console.log 就都会被替换成一个匿名箭头函数
						 * */
						values: isProduction ? { 'console.log': '(() => {})' } : {},
						delimiters: [ '', '' ],
					} ),
				],
			},
		},
	};
} );
