import { clickBtnHandle } from './clickBtnHandle.js';

/**
 * 创建复制按钮
 */
export const createCopyBtn = ( gameInfoContainer ) => {
	const copyBtn = document.createElement( 'li' );
	copyBtn.innerHTML = `<button><span>复制</span></button>`;
	
	copyBtn.addEventListener( 'click', e => {
		clickBtnHandle( 'copy', gameInfoContainer, e );
	} );
	
	return copyBtn;
};
