import { ScriptCatUserConfig } from '../types/UserConfig';

export const keyboardKeyList = [
	'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
	'0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
	'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12',
	'Enter', 'Escape', 'Tab', 'Space', 'Backspace', 'Delete', 'Insert', 'Home', 'End', 'PageUp', 'PageDown',
	'CapsLock', 'NumLock', 'ScrollLock', 'Pause',
	'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
	'Shift', 'Control', 'Alt', 'Meta',
	'`', '-', '=', '[', ']', '\\', ';', "'", ',', '.', '/',
	'~', '!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '_', '+', '{', '}', '|', ':', '"', '<', '>', '?',
	'Numpad0', 'Numpad1', 'Numpad2', 'Numpad3', 'Numpad4', 'Numpad5', 'Numpad6', 'Numpad7', 'Numpad8', 'Numpad9',
	'NumpadMultiply', 'NumpadAdd', 'NumpadSubtract', 'NumpadDecimal', 'NumpadDivide', 'NumpadEnter'
] as const

export const UserConfig: ScriptCatUserConfig = {
	'倍速配置': {
		step: {
			title: '倍速跳转步长',
			description: '每次倍速跳转的值',
			type: 'number',
			default: 0.25,
			min: 0.1,
		},
		sync: {
			title: '页面倍速同步',
			description: '修改当前页面的倍速时, 是否同步修改其它页面的倍速',
			type: 'checkbox',
			default: false,
		},
	},
	'快捷键配置': {
		addKey: {
			title: '增加倍速键位',
			description: '',
			type: 'select',
			values: keyboardKeyList as unknown as unknown[],
			default: 'X'
		},
		addCtrl:{
			title: 'Ctrl',
			description: '增加倍速键位, 启用 Ctrl',
			type: 'checkbox',
			default: false
		},
		addShift:{
			title: 'Shift',
			description: '增加倍速键位, 启用 Shift',
			type: 'checkbox',
			default: false
		},
		addAlt:{
			title: 'Alt',
			description: '增加倍速键位, 启用 Alt',
			type: 'checkbox',
			default: false
		},
		reduceKey: {
			title: '减少倍速键位',
			description: '',
			type: 'select',
			values: keyboardKeyList as unknown as unknown[],
			default: 'Z'
		},
		reduceCtrl:{
			title: 'Ctrl',
			description: '减少倍速键位, 启用 Ctrl',
			type: 'checkbox',
			default: false
		},
		reduceShift:{
			title: 'Shift',
			description: '减少倍速键位, 启用 Shift',
			type: 'checkbox',
			default: false
		},
		reduceAlt:{
			title: 'Alt',
			description: '减少倍速键位, 启用 Alt',
			type: 'checkbox',
			default: false
		},
	},
};
