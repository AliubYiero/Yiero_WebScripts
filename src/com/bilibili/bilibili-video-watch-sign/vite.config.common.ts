import { defineConfig } from 'vite';
// @ts-ignore
import vitePluginRaw from 'vite-plugin-raw';
import { appendPromisePlugin, extractGrantPlugin } from './vite.plugin.config';
import {
	userScript,
} from './vite.util.config';
import { readdirSync } from 'fs';

export default defineConfig( () => {
	// 自动获取项目入口
	const fileList = readdirSync( 'src' );
	const entryFile = fileList.find( file => file.startsWith( 'main' ) || file.startsWith( 'index' ) );
	if ( !entryFile ) {
		throw new Error( '未找到入口文件' );
	}
	
	return {
		esbuild: {
			minifySyntax: false,
			minifyIdentifiers: false,
			minifyWhitespace: false,
		},
		build: {
			// 不清空打包目录
			emptyOutDir: false,
			
			// rollup打包配置
			rollupOptions: {
				/*
				* 项目 io 配置
				* */
				input: `src/${ entryFile }`,
				
				/*
				* 插件配置
				* */
				plugins: [
					// 自动提取 GM/CAT 授权函数
					extractGrantPlugin(),
					vitePluginRaw( {
						match: /\.(css|html)$/,
					} ),
					// 添加后台脚本 Promise 块
					appendPromisePlugin( Boolean( userScript.mapper.background || userScript.mapper.crontab ) ),
				],
			},
		},
		
	};
} );
