import { GmStorage } from '@yiero/gmlib';

const addKeyStore = new GmStorage<string>('快捷键配置.addKey', 'X')
const addCtrlStore = new GmStorage<boolean>('快捷键配置.addCtrl', false)
const addShiftStore = new GmStorage<boolean>('快捷键配置.addShift', false)
const addAltStore = new GmStorage<boolean>('快捷键配置.addAlt', false)
export const addHotkey = {
	key: addKeyStore.get(),
	ctrl: addCtrlStore.get(),
	shift: addShiftStore.get(),
	alt: addAltStore.get()
}


const reduceKeyStore = new GmStorage<string>('快捷键配置.reduceKey', 'Z')
const reduceCtrlStore = new GmStorage<boolean>('快捷键配置.reduceCtrl', false)
const reduceShiftStore = new GmStorage<boolean>('快捷键配置.reduceShift', false)
const reduceAltStore = new GmStorage<boolean>('快捷键配置.reduceAlt', false)
export const reduceHotkey = {
	key: reduceKeyStore.get(),
	ctrl: reduceCtrlStore.get(),
	shift: reduceShiftStore.get(),
	alt: reduceAltStore.get()
}
