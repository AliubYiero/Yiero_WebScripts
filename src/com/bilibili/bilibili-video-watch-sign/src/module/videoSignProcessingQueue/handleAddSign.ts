import { IVideoItem } from '../videoSignHandler/types/IVideoItem.ts';

export type WatchStatus =
	'watched'
	| 'unwatched'
	| 'watching'
	| 'same-watch'
	| 'ep';
/**
 * 添加给容器添加标记
 */
export const handleAddSign = (
	videoItem: IVideoItem,
	watchStatus: WatchStatus = 'unwatched',
	position: 'left' | 'right' = 'left',
) => {
	if ( videoItem.tagContainer.classList.contains( 'watch-mark' ) ) return;
	videoItem.tagContainer.classList.add( 'watch-mark', position, watchStatus );
	videoItem.tagContainer.dataset.key = videoItem.videoId;
};
