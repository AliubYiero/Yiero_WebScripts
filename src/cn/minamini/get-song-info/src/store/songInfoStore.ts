import { GmStorage } from '@yiero/gmlib';
import { SongInfo } from '../utils/getSongInfo.ts';

/**
 * 歌曲信息列表存储
 */
export const songInfoStore = new GmStorage<Record<string, SongInfo>>(
    'songInfo',
    {},
);
