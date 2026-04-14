import { createUserConfigStorage, GmArrayStorage } from '@yiero/gmlib';

interface PlaybackConfigStore {
	// 视频倍速存储
	playbackRateStore: number,
	// 视频倍速快速切换存储
	togglePlaybackRateStore: number,
}

const {
	playbackRateStore,
	togglePlaybackRateStore,
} = createUserConfigStorage<PlaybackConfigStore>( {
	'playbackConfig': {
		playbackRate: {
			title: '视频倍速',
			type: 'number',
			default: 1.0,
		},
		togglePlaybackRate: {
			title: '视频倍速快速切换',
			type: 'number',
			default: 1.0,
		},
	},
} );

const singleUpListStore = new GmArrayStorage<number>( 'singleUpList', [] );

export {
	playbackRateStore,
	togglePlaybackRateStore,
	singleUpListStore,
};
