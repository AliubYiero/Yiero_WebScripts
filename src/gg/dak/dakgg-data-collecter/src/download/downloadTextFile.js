import { downloadFile } from './downloadFile.js';

/**
 * 下载当前网页的快捷链接文件
 */
export const downloadTextFile = ( text, filename ) => {
	// 创建 Blob
	const blob = new File(
		[ text ],
		filename,
		{ type: 'text/plain' },
	);
	
	// 下载文件
	downloadFile( blob, filename );
};
