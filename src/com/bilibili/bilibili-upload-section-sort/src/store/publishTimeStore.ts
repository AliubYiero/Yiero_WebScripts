import { GmStorage } from '@yiero/gmlib';

/**
 * {
 *     aid: pubdate (秒级时间戳)
 * }
 */
export const publishTimeStore = new GmStorage<Record<string, number>>( 'publishTime', {} );
