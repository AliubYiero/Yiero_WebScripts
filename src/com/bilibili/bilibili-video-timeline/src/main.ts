import { handleGetSubtitle } from './module/registerButtons/handleGetSubtitle.ts';
import { isIframe } from '@yiero/gmlib';
import { freshListenerPushState } from './util/freshListenerPushState.ts';

(async () => {
    if (isIframe()) {
        return;
    }
    // 劫持播放器基本数据
    handleGetSubtitle();
    freshListenerPushState(handleGetSubtitle, 1);
})();
