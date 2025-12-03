import { OutputBundle } from 'rollup';
import { UserScript } from './banner/UserScript';
import type { IUserScript } from './banner/UserScript.d';
import { join } from 'path';
import { mkdirSync, writeFileSync } from 'fs';

/**
 * 插件 1: 自动提取 GM/CAT 授权函数
 */
export const extractGrantPlugin = () => {
	return {
		name: 'vite-plugin-extract-grant',
		apply: 'build',
		generateBundle( _: any, bundle: OutputBundle ) {
			// 正则: 所有可能的 GM_* / CAT_* 调用
			const gmCatRegex = /(GM_[a-zA-Z0-9_]+|CAT_[a-zA-Z0-9_]+|window.onurlchange|window.close|window.focus)/g;
			// 已经声明的 grant 函数
			const grantFunctionNameList = Object.values( UserScript )
				.filter( ( [ key ] ) => key === 'grant' )
				.map( ( [ _, value ] ) => value );
			const grantFunctionNameSet = new Set<string>( grantFunctionNameList );
			
			for ( const fileName in bundle ) {
				const chunk = bundle[ fileName ];
				if ( chunk.type !== 'chunk' ) continue;
				
				// 使用正则匹配所有可能的 GM_* / CAT_* 调用（简单高效）
				const grantMatches = new Set<string>();
				for ( let matchAllElement of chunk.code.matchAll( gmCatRegex ) ) {
					const grantFunctionName = matchAllElement[ 1 ];
					if ( grantFunctionNameSet.has( grantFunctionName ) ) {
						continue;
					}
					grantMatches.add( grantFunctionName );
				}
				
				// 将匹配到的 grant 函数添加到 UserScript
				grantMatches.forEach( grantFunctionName => {
					UserScript.push( [ 'grant', grantFunctionName ] as IUserScript );
				} );
			}
		},
	};
};


// 插件 2: 为后台脚本包裹 Promise
export const appendPromisePlugin = ( isEnabled: boolean ) => {
	if ( !isEnabled ) return { name: 'noop' };
	
	return {
		name: 'vite-plugin-append-promise',
		apply: 'build',
		generateBundle( _: any, bundle: OutputBundle ) {
			for ( const fileName in bundle ) {
				const chunk = bundle[ fileName ];
				if ( chunk.type !== 'chunk' ) continue;
				
				chunk.code = [
					'// noinspection JSAnnotator',
					'return new Promise((resolve) => {',
					chunk.code.trim(),
					'  resolve();',
					'});',
				].join( '\n' );
			}
		},
	};
};

/**
 * 插件 3: 输出 banner
 */
export const bannerPlugin = (
	content: string | ( () => string ),
) => {
	return {
		name: 'vite-plugin-banner',
		apply: 'build',
		generateBundle( _: any, bundle: OutputBundle ) {
			for ( const fileName in bundle ) {
				const chunk = bundle[ fileName ];
				if ( chunk.type !== 'chunk' ) continue;
				
				let appendContent = typeof content === 'function' ? content() : content;
				chunk.code = appendContent + '\n' + chunk.code;
			}
		},
	};
};

/**
 * 插件4: 备份生产版本文件
 */
export const backupPlugin = ( version: string ) => {
	return {
		name: 'vite-plugin-backup',
		apply: 'build',
		generateBundle( _: any, bundle: OutputBundle ) {
			for ( const fileName in bundle ) {
				const chunk = bundle[ fileName ];
				if ( chunk.type !== 'chunk' ) continue;
				
				const backupFilepath = join( __dirname, 'dist', version, chunk.fileName );
				mkdirSync( join( __dirname, 'dist', version ), { recursive: true } );
				writeFileSync( backupFilepath, chunk.code );
			}
		},
	};
};
