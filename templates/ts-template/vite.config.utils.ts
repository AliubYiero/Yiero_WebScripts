import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * 获取入口文件 (兼容 js 模板)
 *
 * @returns {string} 入口文件名
 */
export const getEntryFileName = () => {
	const fileList = readdirSync( resolve( __dirname, 'src' ) );
	const entryFileName = fileList.find( file => file.startsWith( 'main' )
		|| file.startsWith( 'index' ) );
	if ( !entryFileName ) {
		throw new Error( '未找到入口文件' );
	}
	
	return entryFileName;
};
