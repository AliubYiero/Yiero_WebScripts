import { GmStorage } from '@yiero/gmlib';

const addKeyStore = new GmStorage<string>( '快捷键配置.addKey', 'C' );
const addCtrlStore = new GmStorage<boolean>( '快捷键配置.addCtrl', false );
const addShiftStore = new GmStorage<boolean>( '快捷键配置.addShift', false );
const addAltStore = new GmStorage<boolean>( '快捷键配置.addAlt', false );
export const addHotkey = {
	key: addKeyStore.get(),
	ctrl: addCtrlStore.get(),
	shift: addShiftStore.get(),
	alt: addAltStore.get(),
};


const reduceKeyStore = new GmStorage<string>( '快捷键配置.reduceKey', 'X' );
const reduceCtrlStore = new GmStorage<boolean>( '快捷键配置.reduceCtrl', false );
const reduceShiftStore = new GmStorage<boolean>( '快捷键配置.reduceShift', false );
const reduceAltStore = new GmStorage<boolean>( '快捷键配置.reduceAlt', false );
export const reduceHotkey = {
	key: reduceKeyStore.get(),
	ctrl: reduceCtrlStore.get(),
	shift: reduceShiftStore.get(),
	alt: reduceAltStore.get(),
};


const toggleKeyStore = new GmStorage<string>( '快捷键配置.toggleKey', 'Z' );
const toggleCtrlStore = new GmStorage<boolean>( '快捷键配置.toggleCtrl', false );
const toggleShiftStore = new GmStorage<boolean>( '快捷键配置.toggleShift', false );
const toggleAltStore = new GmStorage<boolean>( '快捷键配置.toggleAlt', false );
export const toggleHotkey = {
	key: toggleKeyStore.get(),
	ctrl: toggleCtrlStore.get(),
	shift: toggleShiftStore.get(),
	alt: toggleAltStore.get(),
};

/**
 * v1.0.0 -> v1.1.0 的热键设置不一致, 提供迁移判断
 */
function migrationHotkey() {
	if ( toggleHotkey.key === 'Z' && reduceHotkey.key === 'Z' && addHotkey.key === 'X' ) {
		toggleHotkey.key = 'Z';
		addKeyStore.set( 'Z' );
		reduceHotkey.key = 'X';
		reduceKeyStore.set( 'X' );
		addHotkey.key = 'C';
		addKeyStore.set( 'C' );
	}
}
migrationHotkey()
