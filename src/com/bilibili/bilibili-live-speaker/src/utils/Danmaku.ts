/**
 * 发送弹幕
 */
class Danmaku {
	private chatInput: HTMLTextAreaElement | null = null;
	private submitButton: HTMLButtonElement | null = null;
	
	private focusEvent = new Event( 'focus' );
	private inputEvent = new Event( 'input' );
	private changeEvent = new Event( 'change' );
	private blurEvent = new Event( 'blur' );
	
	init() {
		this.chatInput = document.querySelector<HTMLTextAreaElement>( 'textarea.chat-input.border-box' );
		this.submitButton = document.querySelector<HTMLButtonElement>( '.bl-button.live-skin-highlight-button-bg.live-skin-button-text' );
	}
	
	send( content: string ) {
		if ( !( this.chatInput && this.submitButton ) ) {
			this.init();
			return;
		}
		
		this.chatInput.dispatchEvent( this.focusEvent );
		this.chatInput.value = content;
		this.chatInput.dispatchEvent( this.inputEvent );
		this.chatInput.dispatchEvent( this.changeEvent );
		this.chatInput.dispatchEvent( this.blurEvent );
		this.submitButton.click();
	}
}

const danmaku = new Danmaku();
export { danmaku };
