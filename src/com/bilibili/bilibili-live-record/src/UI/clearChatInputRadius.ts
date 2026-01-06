/**
 * 清除原页面中的聊天输入框圆角
 */
export const clearChatInputRadius = () => {
	GM_addStyle( `#chat-control-panel-vm {border-radius: 0 !important;}` );
};
