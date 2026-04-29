import { IPlayInfo } from './IPlayInfo.ts';

/**
 * window 对象
 */
export type IBiliWindow = Window & {
    __playinfo__: IPlayInfo;
};
