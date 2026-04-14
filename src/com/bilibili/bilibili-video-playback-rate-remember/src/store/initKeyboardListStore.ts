import { GmStorage } from '@yiero/gmlib';

/**
 * 初始化键盘快捷键选择列表
 */
export const initKeyboardListStore = () => {
	const keyboardList = [
		'A', 'Ctrl+A', 'Shift+A', 'Alt+A', 'Ctrl+Shift+A', 'Ctrl+Alt+A', 'Shift+Alt+A', 'Ctrl+Shift+Alt+A',
		'B', 'Ctrl+B', 'Shift+B', 'Alt+B', 'Ctrl+Shift+B', 'Ctrl+Alt+B', 'Shift+Alt+B', 'Ctrl+Shift+Alt+B',
		'C', 'Ctrl+C', 'Shift+C', 'Alt+C', 'Ctrl+Shift+C', 'Ctrl+Alt+C', 'Shift+Alt+C', 'Ctrl+Shift+Alt+C',
		'D', 'Ctrl+D', 'Shift+D', 'Alt+D', 'Ctrl+Shift+D', 'Ctrl+Alt+D', 'Shift+Alt+D', 'Ctrl+Shift+Alt+D',
		'E', 'Ctrl+E', 'Shift+E', 'Alt+E', 'Ctrl+Shift+E', 'Ctrl+Alt+E', 'Shift+Alt+E', 'Ctrl+Shift+Alt+E',
		'F', 'Ctrl+F', 'Shift+F', 'Alt+F', 'Ctrl+Shift+F', 'Ctrl+Alt+F', 'Shift+Alt+F', 'Ctrl+Shift+Alt+F',
		'G', 'Ctrl+G', 'Shift+G', 'Alt+G', 'Ctrl+Shift+G', 'Ctrl+Alt+G', 'Shift+Alt+G', 'Ctrl+Shift+Alt+G',
		'H', 'Ctrl+H', 'Shift+H', 'Alt+H', 'Ctrl+Shift+H', 'Ctrl+Alt+H', 'Shift+Alt+H', 'Ctrl+Shift+Alt+H',
		'I', 'Ctrl+I', 'Shift+I', 'Alt+I', 'Ctrl+Shift+I', 'Ctrl+Alt+I', 'Shift+Alt+I', 'Ctrl+Shift+Alt+I',
		'J', 'Ctrl+J', 'Shift+J', 'Alt+J', 'Ctrl+Shift+J', 'Ctrl+Alt+J', 'Shift+Alt+J', 'Ctrl+Shift+Alt+J',
		'K', 'Ctrl+K', 'Shift+K', 'Alt+K', 'Ctrl+Shift+K', 'Ctrl+Alt+K', 'Shift+Alt+K', 'Ctrl+Shift+Alt+K',
		'L', 'Ctrl+L', 'Shift+L', 'Alt+L', 'Ctrl+Shift+L', 'Ctrl+Alt+L', 'Shift+Alt+L', 'Ctrl+Shift+Alt+L',
		'M', 'Ctrl+M', 'Shift+M', 'Alt+M', 'Ctrl+Shift+M', 'Ctrl+Alt+M', 'Shift+Alt+M', 'Ctrl+Shift+Alt+M',
		'N', 'Ctrl+N', 'Shift+N', 'Alt+N', 'Ctrl+Shift+N', 'Ctrl+Alt+N', 'Shift+Alt+N', 'Ctrl+Shift+Alt+N',
		'O', 'Ctrl+O', 'Shift+O', 'Alt+O', 'Ctrl+Shift+O', 'Ctrl+Alt+O', 'Shift+Alt+O', 'Ctrl+Shift+Alt+O',
		'P', 'Ctrl+P', 'Shift+P', 'Alt+P', 'Ctrl+Shift+P', 'Ctrl+Alt+P', 'Shift+Alt+P', 'Ctrl+Shift+Alt+P',
		'Q', 'Ctrl+Q', 'Shift+Q', 'Alt+Q', 'Ctrl+Shift+Q', 'Ctrl+Alt+Q', 'Shift+Alt+Q', 'Ctrl+Shift+Alt+Q',
		'R', 'Ctrl+R', 'Shift+R', 'Alt+R', 'Ctrl+Shift+R', 'Ctrl+Alt+R', 'Shift+Alt+R', 'Ctrl+Shift+Alt+R',
		'S', 'Ctrl+S', 'Shift+S', 'Alt+S', 'Ctrl+Shift+S', 'Ctrl+Alt+S', 'Shift+Alt+S', 'Ctrl+Shift+Alt+S',
		'T', 'Ctrl+T', 'Shift+T', 'Alt+T', 'Ctrl+Shift+T', 'Ctrl+Alt+T', 'Shift+Alt+T', 'Ctrl+Shift+Alt+T',
		'U', 'Ctrl+U', 'Shift+U', 'Alt+U', 'Ctrl+Shift+U', 'Ctrl+Alt+U', 'Shift+Alt+U', 'Ctrl+Shift+Alt+U',
		'V', 'Ctrl+V', 'Shift+V', 'Alt+V', 'Ctrl+Shift+V', 'Ctrl+Alt+V', 'Shift+Alt+V', 'Ctrl+Shift+Alt+V',
		'W', 'Ctrl+W', 'Shift+W', 'Alt+W', 'Ctrl+Shift+W', 'Ctrl+Alt+W', 'Shift+Alt+W', 'Ctrl+Shift+Alt+W',
		'X', 'Ctrl+X', 'Shift+X', 'Alt+X', 'Ctrl+Shift+X', 'Ctrl+Alt+X', 'Shift+Alt+X', 'Ctrl+Shift+Alt+X',
		'Y', 'Ctrl+Y', 'Shift+Y', 'Alt+Y', 'Ctrl+Shift+Y', 'Ctrl+Alt+Y', 'Shift+Alt+Y', 'Ctrl+Shift+Alt+Y',
		'Z', 'Ctrl+Z', 'Shift+Z', 'Alt+Z', 'Ctrl+Shift+Z', 'Ctrl+Alt+Z', 'Shift+Alt+Z', 'Ctrl+Shift+Alt+Z',
		'F1', 'Ctrl+F1', 'Shift+F1', 'Alt+F1', 'Ctrl+Shift+F1', 'Ctrl+Alt+F1', 'Shift+Alt+F1', 'Ctrl+Shift+Alt+F1',
		'F2', 'Ctrl+F2', 'Shift+F2', 'Alt+F2', 'Ctrl+Shift+F2', 'Ctrl+Alt+F2', 'Shift+Alt+F2', 'Ctrl+Shift+Alt+F2',
		'F3', 'Ctrl+F3', 'Shift+F3', 'Alt+F3', 'Ctrl+Shift+F3', 'Ctrl+Alt+F3', 'Shift+Alt+F3', 'Ctrl+Shift+Alt+F3',
		'F4', 'Ctrl+F4', 'Shift+F4', 'Alt+F4', 'Ctrl+Shift+F4', 'Ctrl+Alt+F4', 'Shift+Alt+F4', 'Ctrl+Shift+Alt+F4',
		'F5', 'Ctrl+F5', 'Shift+F5', 'Alt+F5', 'Ctrl+Shift+F5', 'Ctrl+Alt+F5', 'Shift+Alt+F5', 'Ctrl+Shift+Alt+F5',
		'F6', 'Ctrl+F6', 'Shift+F6', 'Alt+F6', 'Ctrl+Shift+F6', 'Ctrl+Alt+F6', 'Shift+Alt+F6', 'Ctrl+Shift+Alt+F6',
		'F7', 'Ctrl+F7', 'Shift+F7', 'Alt+F7', 'Ctrl+Shift+F7', 'Ctrl+Alt+F7', 'Shift+Alt+F7', 'Ctrl+Shift+Alt+F7',
		'F8', 'Ctrl+F8', 'Shift+F8', 'Alt+F8', 'Ctrl+Shift+F8', 'Ctrl+Alt+F8', 'Shift+Alt+F8', 'Ctrl+Shift+Alt+F8',
		'F9', 'Ctrl+F9', 'Shift+F9', 'Alt+F9', 'Ctrl+Shift+F9', 'Ctrl+Alt+F9', 'Shift+Alt+F9', 'Ctrl+Shift+Alt+F9',
		'F10', 'Ctrl+F10', 'Shift+F10', 'Alt+F10', 'Ctrl+Shift+F10', 'Ctrl+Alt+F10', 'Shift+Alt+F10', 'Ctrl+Shift+Alt+F10',
		'F11', 'Ctrl+F11', 'Shift+F11', 'Alt+F11', 'Ctrl+Shift+F11', 'Ctrl+Alt+F11', 'Shift+Alt+F11', 'Ctrl+Shift+Alt+F11',
		'F12', 'Ctrl+F12', 'Shift+F12', 'Alt+F12', 'Ctrl+Shift+F12', 'Ctrl+Alt+F12', 'Shift+Alt+F12', 'Ctrl+Shift+Alt+F12',
	];
	const keyboardListStore = new GmStorage( 'keyboardList', keyboardList );
	keyboardListStore.set( keyboardList );
};
