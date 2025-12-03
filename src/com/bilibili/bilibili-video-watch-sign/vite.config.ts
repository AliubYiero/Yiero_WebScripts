/// <reference types="vitest" />
import { defineConfig, mergeConfig } from 'vite';
import commonConfig from './vite.config.common';
import developmentConfig from './vite.config.development';
import productionConfig from './vite.config.production';
import { resolve } from 'path';
import { userScript, validateUserScript } from './vite.util.config';
import { pathToFileURL } from 'url';

export default defineConfig( ( env ) => {
	/*
	* 获取当前的构建环境
	* */
	const isProduction = env.mode === 'production';
	
	// 输入校验
	validateUserScript( userScript, isProduction );
	
	// 打印文件打包信息
	const filepath = resolve( __dirname, 'dist', `${ userScript.mapper.name }${ isProduction ? '' : '.dev' }.js` );
	console.info( `文件即将打包: \n  at ${ pathToFileURL( filepath ) }` );
	
	// 配置项合并, 返回配置信息
	if ( isProduction ) {
		return mergeConfig( commonConfig( env ), productionConfig( env ) );
	}
	else {
		return mergeConfig( commonConfig( env ), developmentConfig( env ) );
	}
} );
