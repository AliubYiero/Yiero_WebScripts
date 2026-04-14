import { addKeyStore, reduceKeyStore, toggleKeyStore } from './configStore.ts';


const parseHotkey = ( hotkey: string ) => {
	const hotkeyList = hotkey.split( '+' );
	return {
		key: hotkeyList[ hotkeyList.length - 1 ],
		ctrl: hotkeyList.includes( 'Ctrl' ),
		shift: hotkeyList.includes( 'Shift' ),
		alt: hotkeyList.includes( 'Alt' ),
	};
};

export const addHotkey = parseHotkey( addKeyStore.get() );
export const reduceHotkey = parseHotkey( reduceKeyStore.get() );
export const toggleHotkey = parseHotkey( toggleKeyStore.get() );
 
/**
 * v1.0.0 -> v1.1.0 的热键设置迁移
 * v1.0.0 默认值: toggle=Z, reduce=Z, add=X
 * v1.1.0 默认值: toggle=Z, reduce=X, add=C
 */
function migrationHotkey() {
	if ( toggleHotkey.key === 'Z' && reduceHotkey.key === 'Z' && addHotkey.key === 'X' ) {
		// 修复 reduce 键为 X
		reduceHotkey.key = 'X';
		reduceKeyStore.set( 'X' );
		
		// 修复 add 键为 C
		addHotkey.key = 'C';
		addKeyStore.set( 'C' );
		
		// toggle 保持 Z 不变
	}
}

migrationHotkey();
