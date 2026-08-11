// API
export { getCookie } from './API/getCookie';
export { gmDownload } from './API/gmDownload';
export { gmRequest } from './API/gmRequest';
export { hookXhr } from './API/hookXhr';

// DOM
export { elementGetter } from './DOM/elementGetter';
export { elementWaiter } from './DOM/elementWaiter';
export { extractDOMInfo } from './DOM/extractDOMInfo';
export { scroll } from './DOM/scroll';
export { setValue } from './DOM/setValue';
export { simulateClick } from './DOM/simulateClick';
export { simulateKeyboard } from './DOM/simulateKeyboard';
export type {
    ExtractedResult,
    ExtractRule,
    ExtractType,
} from './DOM/types/ExtractRule';
// Env
export { environmentTest } from './Env/environmentTest';
export { isIframe } from './Env/isIframe';
// Storage
export { createUserConfigStorage } from './Storage/createUserConfigStorage';
export { GmArrayStorage } from './Storage/GmArrayStorage';
export { GmObjectStorage } from './Storage/GmObjectStorage';
export type { IGMStorageChangeDetail } from './Storage/GmStorage';
export { GmStorage } from './Storage/GmStorage';
export type {
    ScriptCatUserConfig,
    UserConfigItem,
} from './Storage/types/ScriptCatUserConfig';
// UI
export { uiImporter } from './UI/uiImporter';
// UserInteraction
export { gmMenuCommand } from './UserInteraction/gmMenuCommand';
export { Logger } from './UserInteraction/Logger';
export { Message } from './UserInteraction/Message';
export type {
    IKeydownBinding,
    IKeydownMultipleOptions,
    IKeydownOptions,
    KeydownCallback,
    Unsubscribe,
} from './UserInteraction/onKeydown';
export { onKeydown, onKeydownMultiple } from './UserInteraction/onKeydown';
export type {
    IKeyupBinding,
    IKeyupMultipleOptions,
    IKeyupOptions,
    KeyupCallback,
} from './UserInteraction/onKeyup';
export { onKeyup, onKeyupMultiple } from './UserInteraction/onKeyup';
export type {
    IRouteChangeEvent,
    NavigationType,
    RouteChangeCallback,
    Unsubscribe as RouteChangeUnsubscribe,
} from './UserInteraction/onRouteChange';
export { onRouteChange } from './UserInteraction/onRouteChange';
export type { KeyboardKey } from './UserInteraction/types/KeyboardKey';
