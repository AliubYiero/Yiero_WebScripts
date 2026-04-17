import { GmStorage } from '@yiero/gmlib';
import { UnicycleConfig } from '../utils/Dialog.ts';

export const configStore = new GmStorage<UnicycleConfig>('config', {
    text: '',
    interval: {
        min: 5000,
        max: 6000,
    },
    repeatCount: {
        min: 1,
        max: 3,
    },
});
