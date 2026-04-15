import { LocalStorage } from './LocalStorage.ts';

export const ExtraCSSConfigStorage = new LocalStorage<string>( 'ExtraCSSConfig', '' );
