import { GmStorage } from '@yiero/gmlib';
import {
    defaultModel,
    defaultPrompt,
    defaultUrl,
} from '../../banner/UserConfig.ts';

interface IAiConfig {
    url: string;
    model: string;
    prompt: string;
    apiKey: string;
}

const aiConfigUrlStore = new GmStorage<string>(
    'AI配置.url',
    defaultUrl,
);
const aiConfigModelStore = new GmStorage<string>(
    'AI配置.model',
    defaultModel,
);
const aiConfigApiKeyStore = new GmStorage<string>(
    'AI配置.apiKey',
    '',
);
const aiConfigPromptKeyStore = new GmStorage<string>(
    'AI配置.prompt',
    defaultPrompt,
);

export const aiConfig: IAiConfig = {
    url: aiConfigUrlStore.get(),
    model: aiConfigModelStore.get(),
    apiKey: aiConfigApiKeyStore.get(),
    prompt: aiConfigPromptKeyStore.get(),
};
