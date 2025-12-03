/**
 * handleWatchLaterPage.ts
 *
 * created by 2025/12/2
 * @file 稍后再看页面
 * */
import { baseParser, baseVideoSignLoader } from './base.ts';
import { IVideoItem } from '../types/IVideoItem.ts';
import { BindUpdatePageButton } from './bindUpdatePageButton.ts';

const watchLaterParser = (
	container: HTMLElement,
): IVideoItem | null => baseParser( container, {
	tagContainer: '.video-card__left',
	videoLink: '.bili-video-card__cover > .bili-cover-card',
}, { isWatchLater: true } );

export const handleWatchLaterPage = async () => {
	baseVideoSignLoader( {
		container: '.watchlater-list-container',
		item: '.video-card',
	}, watchLaterParser );
	
	BindUpdatePageButton.watchLaterFilter();
};
