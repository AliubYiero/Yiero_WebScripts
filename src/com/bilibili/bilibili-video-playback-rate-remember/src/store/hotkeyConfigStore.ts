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

migrationHotkey();
