// 关闭网页
export const closeWeb = ( isCloseWeb: boolean ): void => {
	if ( isCloseWeb ) {
		window.close();
	}
};
