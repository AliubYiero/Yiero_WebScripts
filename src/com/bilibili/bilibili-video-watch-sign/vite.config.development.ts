import { defineConfig } from 'vite';
import {
	parseUserScript, stringifyUserConfig,
	stringifyUserScript,
	userScript,
} from './vite.util.config';
import { UserScript } from './banner/UserScript';
import { UserConfig } from './banner/UserConfig';
import { bannerPlugin } from './vite.plugin.config';

export default defineConfig( () => {
	const outputFileName = `${ userScript.mapper.name }.dev.js`;
	
	return {
		build: {
			watch: { include: [ 'src/**', 'banner/**' ] },
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
						const userScript = parseUserScript( UserScript, true );
						// noinspection UnnecessaryLocalVariableJS
						let bannerContent = stringifyUserScript( userScript );
						if ( Object.keys( UserConfig ).length !== 0 ) {
							bannerContent += '\n' + stringifyUserConfig( UserConfig );
						}
						return bannerContent;
					} ),
				],
			},
		},
		
	};
} );
