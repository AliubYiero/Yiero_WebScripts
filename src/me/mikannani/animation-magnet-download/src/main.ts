import { elementWaiter } from '@yiero/gmlib';
import { registerButton } from './registerButton.ts';
import { downloadTextFile } from './util/downloadFile.ts';
import { parseAnimationData } from './parseAnimationData.ts';
import { stringifyAnimationData } from './stringifyAnimationData.ts';

export interface IAnimationInfo {
	fileName: string,
	magnetLink: string,
	language: ILanguage,
	quality: IQuality,
	format: IFormat,
	fileSize: string,
	updateTime: string,
}

export type ILanguage = '简体' | '繁体' | '双语' | 'UNKNOWN';
export type IQuality = '720P' | '1080P' | 'UNKNOWN';
export type IFormat = 'MKV' | 'MP4' | 'UNKNOWN';

;( async () => {
	// 等待页面载入
	await elementWaiter( 'footer.footer' );

	// 获取当前番剧名
	const animationName = document.querySelector( '.bangumi-title' )?.textContent;
	if ( !animationName ) return;

	// 展开所有的链接
	document.querySelectorAll<HTMLElement>( 'a.episode-expand.js-expand-episode:not([style="display: none;"])' ).forEach( item => item.click() );

	// 注册下载按钮到页面中
	registerButton( ( subGroupNode ) => {
		const subGroupNameNode = subGroupNode.firstElementChild;
		if ( !subGroupNameNode ) return;
		const subGroupName = subGroupNameNode.classList.contains( 'dropdown' )
			? ( subGroupNameNode.querySelector( '.dropdown-toggle' )?.textContent || '' ).trim()
			: ( subGroupNameNode.textContent || '' ).trim();

		if ( !subGroupName ) return;

		const magnetContainer = subGroupNode.nextElementSibling as HTMLTableElement;
		if ( !magnetContainer ) {
			return;
		}
		const tableContainer: HTMLTableElement | null = magnetContainer.tagName !== 'TABLE'
			? magnetContainer.querySelector( 'table' )
			: magnetContainer;
		if ( !tableContainer ) {
			return
		}
		const animationInfoList = parseAnimationData( tableContainer );
		console.log( 'animationInfoList', animationInfoList );

		const animationDataHeader = `# ${ animationName }
> - 字幕组: ${ subGroupName }
> - 番剧链接: ${ document.URL }`;
		const animationDataContent = stringifyAnimationData( animationInfoList );
		console.log( 'animationDataContent', animationDataContent );

		downloadTextFile( `${ animationName.trim() }-${ subGroupName.trim() }.md`, `${ animationDataHeader }\n\n${ animationDataContent }`, 'text/markdown' );
	} );
} )();
