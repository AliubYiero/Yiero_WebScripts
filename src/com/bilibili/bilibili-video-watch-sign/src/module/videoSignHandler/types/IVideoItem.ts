/**
 * 通用视频信息接口
 */
export interface IVideoItem {
	videoId: string;
	container: HTMLElement;
	tagContainer: HTMLElement;
	position?: 'left' | 'right';
}
