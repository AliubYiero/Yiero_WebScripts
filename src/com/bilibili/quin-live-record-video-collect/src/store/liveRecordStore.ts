import { GmStorage } from '@yiero/gmlib';
import { CollectInfo } from '../handlers/handleCollectVideo.ts';

export const liveRecordStore = new GmStorage<CollectInfo[]>( 'liveRecord', [] );
