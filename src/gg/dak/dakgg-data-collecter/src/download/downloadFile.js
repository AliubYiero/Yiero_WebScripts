/**
 * 下载文件
 */
export const downloadFile = ( blob, filename ) => {
	const node = document.createElement( 'a' );
	node.download = filename;
	node.href = URL.createObjectURL( blob );
	node.click();
};
