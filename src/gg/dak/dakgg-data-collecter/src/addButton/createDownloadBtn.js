import { clickBtnHandle } from './clickBtnHandle.js';

/**
 * 创建下载按钮
 */
export const createDownloadBtn = ( gameInfoContainer ) => {
	const downloadBtn = document.createElement( 'li' );
	downloadBtn.innerHTML = `<button><span>下载</span></button>`;
	
	downloadBtn.addEventListener( 'click', ( e ) => {
		clickBtnHandle( 'download', gameInfoContainer, e );
	} );
	
	return downloadBtn;
};
