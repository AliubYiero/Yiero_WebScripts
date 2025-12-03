import { defineConfig } from 'vite';
import {
	parseUserScript, stringifyUserConfig,
	stringifyUserScript,
	userScript,
} from './vite.util.config';
import replace from '@rollup/plugin-replace';
import { UserScript } from './banner/UserScript';
import { UserConfig } from './banner/UserConfig';
import { backupPlugin, bannerPlugin } from './vite.plugin.config';

export default defineConfig( () => {
	const outputFileName = `${ userScript.mapper.name }.js`;
	
	return {
		esbuild: {
			drop: [ 'debugger' ],
			charset: 'ascii',
		},
		build: {
			rollupOptions: {
				output: {
					entryFileNames: outputFileName,
					format: 'es',
					manualChunks() {
						// 把项目文件夹里面的文件都打包到一个文件中
						return outputFileName;
					},
				},
				plugins: [
					/*
					* 添加顶部信息
					* */
					bannerPlugin( () => {
						const userScript = parseUserScript( UserScript, false );
						// noinspection UnnecessaryLocalVariableJS
						let bannerContent = stringifyUserScript( userScript );
						if ( Object.keys( UserConfig ).length !== 0 ) {
							bannerContent += '\n' + stringifyUserConfig( UserConfig );
						}
						return bannerContent;
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
						values: { 'console.log': '(() => {})' },
						delimiters: [ '', '' ],
					} ),
					backupPlugin( userScript.mapper.version ),
				],
			},
		},
		
	};
} );
