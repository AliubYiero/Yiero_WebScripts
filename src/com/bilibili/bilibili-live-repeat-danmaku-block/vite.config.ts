import { defineConfig, mergeConfig } from 'vite';
import { getEntryFileName } from './vite.config.utils';
import extractGrantPlugin from '@yiero/vite-plugin-scriptcat-extract-grant';
import metaBannerPlugin from '@yiero/vite-plugin-scriptcat-meta-banner';
// @ts-ignore
import vitePluginRaw from 'vite-plugin-raw';
import { basename } from 'path';
import { UserScript } from './banner/UserScript';
import { UserConfig } from './banner/UserConfig';
import requireSelfPlugin from '@yiero/vite-plugin-scriptcat-require-self';
import scriptPushPlugin from '@yiero/vite-plugin-scriptcat-script-push';
import backupScriptPlugin from '@yiero/vite-plugin-scriptcat-backup';
import replace from '@rollup/plugin-replace';

enum Environment {
	Development = 'development',
	Sync = 'sync',
	Production = 'production',
	Test = 'test',
}

type ViteConfig = Parameters<typeof defineConfig>[0];

export default defineConfig( ( env ) => {
	// 项目名
	const projectName = basename( process.cwd() );
	
	const name = UserScript.find( ( [ key ] ) => key === 'name' );
	// other config
	let config: ViteConfig = {};
	if ( env.mode === Environment.Development ) {
		name && ( name[ 1 ] = `[Dev] ${ name[ 1 ] }` );
		config = {
			build: {
				rollupOptions: {
					plugins: [
						requireSelfPlugin(),
					],
				},
			},
		};
	}
	else if ( env.mode === Environment.Sync ) {
		name && ( name[ 1 ] = `[Dev] ${ name[ 1 ] }` );
		config = {
			build: {
				rollupOptions: {
					plugins: [
						scriptPushPlugin(),
					],
				},
			},
		};
	}
	else if ( env.mode === Environment.Production ) {
		config = {
			esbuild: {
				drop: [ 'debugger' ],
				charset: 'ascii',
			},
			build: {
				rollupOptions: {
					plugins: [
						backupScriptPlugin(),
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
							values: { 'console.log': '(() => {})' },
							delimiters: [ '', '' ],
						} ),
					],
				},
			},
		};
	}
	else if ( env.mode === Environment.Test ) {
		UserScript.push(
			[ 'name', `[test] ${ projectName }` ],
			[ 'description', `[test project] ${ projectName }` ],
			[ 'version', '0.1.0-alpha' ],
			[ 'author', 'test' ],
			[ 'match', '*://*.*' ],
		);
	}
	
	const baseOptions: ViteConfig = {
		esbuild: {
			minifySyntax: false,
			minifyIdentifiers: false,
			minifyWhitespace: false,
		},
		build: {
			// 不清空打包目录
			emptyOutDir: false,
			lib: {
				entry: `src/${ getEntryFileName() }`,
				name: projectName,
				// 输出文件名（不含扩展名）
				fileName: () => {
					let suffix = '';
					switch ( env.mode ) {
						case Environment.Development:
							suffix = '.dev';
							break;
						case Environment.Sync:
							suffix = '.dev';
							break;
						case Environment.Production:
							suffix = '.user';
							break;
						case Environment.Test:
							suffix = '.test';
							break;
					}
					return `${ projectName }${ suffix }.js`;
				},
				formats: [ 'iife' ],
			},
			rollupOptions: {
				output: {
					extend: true,
				},
				/*
				* 插件配置
				* */
				plugins: [
					// 直接导入 css / html 作为字符串
					vitePluginRaw( {
						match: /\.(css|html)$/,
					} ),
					// banner
					metaBannerPlugin( {
						userScript: UserScript,
						userConfig: UserConfig,
					} ),
					// 自动提取 GM/CAT 授权函数
					extractGrantPlugin(),
				],
			},
		},
	};
	return mergeConfig( baseOptions, config );
} );
