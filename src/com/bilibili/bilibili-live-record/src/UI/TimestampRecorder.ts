import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { elementWaiter } from '@yiero/gmlib';

@customElement( 'timestamp-recorder' )
export class TimestampRecorder extends LitElement {
	static styles = css`
		
		.container {
			padding: 12px;
			position: relative;
			background-color: #F6F7F8;
			display: flex;
			align-content: center;
			justify-content: center;
			flex-direction: column;
			gap: 8px;
			border-top: 1px solid #E3E5E7;
		}
		
		.container:hover .world-time,
		.container:has(.input:focus) .world-time {
			display: none;
		}
		
		.container:hover .live-time,
		.container:has(.input:focus) .live-time {
			display: block;
		}
		
		.header {
			color: #9499A0;
			line-height: 20px;
			display: flex;
			justify-content: space-between;
		}
		
		.time-prefix {
			font-size: 15px;
			user-select: none;
		}
		
		.time {
			font-size: 12px;
		}
		
		.live-time {
			display: none;
			color: #3e4744;
		}
		
		
		.main {
			display: flex;
			font-size: 0;
			border: 1px solid #E3E5E7;
			background-color: #FFFFFF;
			border-radius: 4px;
			flex-direction: column;
		}
		
		.input {
			height: 56px;
			width: 100%;
			resize: none;
			outline: 0;
			border: 0;
			background-color: #FFFFFF;
			border-radius: 4px;
			padding: 8px;
			color: #2F3238;
			overflow: hidden;
			font-size: 12px;
			line-height: 19px;
			box-sizing: border-box;
			font-family: inherit;
		}
		
		.input:focus-visible {
			outline: 2px solid #E3E5E7;
		}
		
		.footer {
			align-self: flex-end;
			display: flex;
			justify-content: space-between;
			width: 100%;
		}
		
		.action-button {
			width: 80px;
			min-width: 80px;
			height: 24px;
			font-size: 12px;
			background-color: #23ade5;
			color: #fff;
			border-radius: 4px;
			box-sizing: border-box;
			line-height: 1;
			border: 0;
			outline: 0;
			overflow: hidden;
			cursor: pointer;
			font-family: inherit;
			transition: background-color 0.2s;
		}
		
		.query-button {
			background-color: #9499A0;
		}
		
		.query-button:hover {
			background-color: #7f8287;
		}
		
		.submit-button:hover {
			background-color: #1c9bc9;
		}
		
		.submit-button:active {
			background-color: #1787b0;
		}
		
		.submit-button:disabled {
			background-color: #ccc;
			cursor: not-allowed;
		}
	`;
	
	// ========== 组件状态 ==========
	
	/** 当前世界时间 (HH:MM:SS) */
	@state()
	private currentTime = new Date();
	
	/** 当前直播时间 (HH:MM:SS) */
	@state()
	private currentLiveTime = this.formatLiveTime();
	
	/** 输入框的值 */
	@state()
	private inputValue = '';
	
	/** 是否已连接定时器（用于避免重复连接） */
	@state()
	private isTimerConnected = false;
	
	/** 定时器ID（用于清理） */
	private intervalId: number | null = null;
	
	/** 连接计时器超时ID */
	private connectTimingId: number | null = null;
	
	/** 键盘事件监听器引用（用于清理） */
	private keyboardEventListener: ( ( e: KeyboardEvent ) => void ) | null = null;
	
	// ========== 组件属性 ==========
	
	/**
	 * 是否为直播模式
	 * @attr is-live
	 */
	@property( { type: Boolean, attribute: 'is-live' } )
	isLive = false;
	
	/**
	 * 直播开始时间戳（毫秒）
	 * 用于计算直播持续时间
	 */
	@property( { type: Number } )
	liveStartTime = 0;
	
	/**
	 * 时间前缀文本
	 */
	@property( { type: String } )
	timePrefix = '记录当前时间点: ';
	
	/**
	 * 输入框自动失焦超时时间（毫秒）
	 * 默认为30秒
	 */
	@property( { type: Number } )
	autoBlurTimeout = 30000;
	
	/**
	 * 是否启用Alt+E快捷键
	 * @attr enable-shortcut
	 */
	@property( { type: Boolean, attribute: 'enable-shortcut' } )
	enableShortcut = true;
	
	// ========== 计算属性 ==========
	
	/**
	 * 获取修剪后的输入值
	 */
	get trimmedInputValue(): string {
		return this.inputValue.trim();
	}
	
	/**
	 * 提交按钮是否可用
	 */
	get isSubmitEnabled(): boolean {
		return this.isLive && this.trimmedInputValue.length > 0;
	}
	
	// ========== 生命周期方法 ==========
	
	constructor() {
		super();
		this.handleKeyDown = this.handleKeyDown.bind( this );
	}
	
	connectedCallback(): void {
		super.connectedCallback();
		this.startTimer();
		this.setupKeyboardShortcut();
	}
	
	disconnectedCallback(): void {
		super.disconnectedCallback();
		this.cleanup();
	}
	
	/**
	 * 清理所有定时器和事件监听器
	 */
	private cleanup(): void {
		this.stopTimer();
		this.clearConnectTiming();
		this.removeKeyboardShortcut();
	}
	
	// ========== 定时器管理 ==========
	
	/**
	 * 启动时间更新定时器
	 */
	private startTimer(): void {
		if ( this.isTimerConnected || this.intervalId ) {
			return;
		}
		
		this.isTimerConnected = true;
		
		// 立即更新时间
		this.updateTimes();
		
		// 每秒更新一次
		this.intervalId = window.setInterval( () => {
			this.updateTimes();
		}, 1000 );
	}
	
	/**
	 * 停止时间更新定时器
	 */
	private stopTimer(): void {
		if ( this.intervalId ) {
			clearInterval( this.intervalId );
			this.intervalId = null;
			this.isTimerConnected = false;
		}
	}
	
	/**
	 * 更新所有时间显示
	 */
	private updateTimes(): void {
		this.currentTime = new Date();
		if ( this.isLive ) {
			this.currentLiveTime = this.formatLiveTime();
		}
	}
	
	// ========== 键盘快捷键 ==========
	
	/**
	 * 设置Alt+E键盘快捷键
	 */
	private setupKeyboardShortcut(): void {
		if ( !this.enableShortcut || this.keyboardEventListener ) {
			return;
		}
		
		this.keyboardEventListener = this.handleKeyDown.bind( this );
		window.addEventListener( 'keydown', this.keyboardEventListener );
	}
	
	/**
	 * 移除键盘快捷键监听器
	 */
	private removeKeyboardShortcut(): void {
		if ( this.keyboardEventListener ) {
			window.removeEventListener( 'keydown', this.keyboardEventListener );
			this.keyboardEventListener = null;
		}
	}
	
	/**
	 * 键盘事件处理器
	 * 支持 Alt+E 聚焦输入框
	 */
	private handleKeyDown( event: KeyboardEvent ): void {
		// 检查是否为 Alt+E
		if ( event.altKey && event.key === 'e' && !event.ctrlKey && !event.metaKey ) {
			event.preventDefault();
			if ( this.shadowRoot?.activeElement === this.textarea ) {
				this.blurInput();
			}
			else {
				this.focusInput();
			}
		}
	}
	
	/**
	 * 聚焦到输入框
	 */
	private focusInput(): void {
		const textarea = this.shadowRoot?.querySelector( 'textarea' );
		if ( textarea ) {
			textarea.focus();
			// 将光标移动到文本末尾
			const length = this.inputValue.length;
			( textarea as HTMLTextAreaElement ).setSelectionRange( length, length );
		}
	}
	
	/**
	 * 失焦输入框
	 */
	private blurInput(): void {
		const textarea = this.shadowRoot?.querySelector( 'textarea' );
		if ( textarea ) {
			textarea.blur();
		}
	}
	
	/**
	 * 按下 Ctrl + Enter 键, 触发提交
	 */
	private handleEnter( e: KeyboardEvent ) {
		if ( e.key === 'Enter' && e.ctrlKey && !e.altKey ) {
			this.handleSubmit();
		}
	};
	
	// ========== 输入框相关方法 ==========
	
	/**
	 * 获取textarea元素（用于类型安全）
	 */
	private get textarea(): HTMLTextAreaElement | null {
		return this.shadowRoot?.querySelector( 'textarea' ) || null;
	}
	
	/**
	 * 输入框聚焦事件处理器
	 * 暂停自动计时，开始连接计时
	 */
	private handleFocusInput( event: Event ): void {
		this.stopTimer();
		
		const target = event.target as HTMLTextAreaElement;
		this.startConnectTiming( target );
	}
	
	/**
	 * 输入框失焦事件处理器
	 * 恢复自动计时，清除连接计时
	 */
	private handleBlurInput(): void {
		this.startTimer();
		this.clearConnectTiming();
	}
	
	/**
	 * 开始连接计时（输入框自动失焦）
	 */
	private startConnectTiming( target: HTMLElement ): void {
		this.clearConnectTiming();
		
		this.connectTimingId = window.setTimeout( () => {
			if ( !this.trimmedInputValue && document.activeElement === target ) {
				target.blur();
			}
		}, this.autoBlurTimeout );
	}
	
	/**
	 * 清除连接计时
	 */
	private clearConnectTiming(): void {
		if ( this.connectTimingId ) {
			clearTimeout( this.connectTimingId );
			this.connectTimingId = null;
		}
	}
	
	/**
	 * 输入事件处理器
	 */
	private handleInputChange( event: Event ): void {
		const target = event.target as HTMLTextAreaElement;
		this.inputValue = target.value;
		
		// 如果用户正在输入，重新开始连接计时
		if ( document.activeElement === target ) {
			this.startConnectTiming( target );
		}
	}
	
	// ========== 时间格式化方法 ==========
	
	/**
	 * 格式化世界时间 (HH:MM:SS)
	 */
	private formatWorldTime( date: Date ): string {
		const hours = date.getHours().toString().padStart( 2, '0' );
		const minutes = date.getMinutes().toString().padStart( 2, '0' );
		const seconds = date.getSeconds().toString().padStart( 2, '0' );
		return `${ hours }:${ minutes }:${ seconds }`;
	}
	
	/**
	 * 格式化直播时间 (HH:MM:SS)
	 */
	private formatLiveTime(): string {
		const elapsed = Date.now() - this.liveStartTime;
		const totalSeconds = Math.floor( elapsed / 1000 );
		
		const hours = Math.floor( totalSeconds / 3600 ).toString().padStart( 2, '0' );
		const minutes = Math.floor( ( totalSeconds % 3600 ) / 60 ).toString().padStart( 2, '0' );
		const seconds = ( totalSeconds % 60 ).toString().padStart( 2, '0' );
		
		return `${ hours }:${ minutes }:${ seconds }`;
	}
	
	// ========== 业务逻辑方法 ==========
	
	/**
	 * 打开记录列表（待实现）
	 */
	private handleOpenRecordList(): void {
		// 触发自定义事件，由父组件处理
		this.dispatchEvent( new CustomEvent( 'open-record-list', {
			bubbles: true,
			composed: true,
		} ) );
		
		console.log( '打开记录列表' );
	}
	
	/**
	 * 提交时间记录
	 */
	private handleSubmit(): void {
		if ( !this.isSubmitEnabled ) {
			return;
		}
		
		const detail = {
			// 记录的世界时间
			timestamp: this.currentTime.getTime(),
			// 记录的直播时间
			liveTimestamp: this.currentLiveTime,
			// 记录内容
			note: this.trimmedInputValue,
			// 直播开始时间
			liveStartTime: this.liveStartTime,
		};
		
		// 触发自定义事件
		this.dispatchEvent( new CustomEvent( 'timestamp-recorded', {
			detail,
			bubbles: true,
			composed: true,
		} ) );
		
		console.log( '记录时间点:', detail );
		
		// 重置输入并聚焦
		this.inputValue = '';
		this.focusInput();
	}
	
	// ========== 渲染方法 ==========
	
	render() {
		return html`
			<section class="container">
				<header class="header">
					<span class="time-prefix">${ this.timePrefix }</span>
					<span
						class="time world-time">${ this.formatWorldTime( this.currentTime ) }</span>
					<span
						class="time live-time">${ this.currentLiveTime }</span>
				</header>
				<main class="main">
                <textarea
	                class="input"
	                .value=${ this.inputValue }
	                @input=${ this.handleInputChange }
	                @focus=${ this.handleFocusInput }
	                @blur=${ this.handleBlurInput }
	                @keydown=${ this.handleEnter }
	                placeholder="输入时间点备注..."
	                rows="3"
                ></textarea>
				</main>
				<footer class="footer">
					<button
						class="action-button query-button"
						@click=${ this.handleOpenRecordList }
					>
						查询记录
					</button>
					<button
						class="action-button submit-button"
						@click=${ this.handleSubmit }
						?disabled=${ !( this.isLive && this.inputValue.trim() ) }
					>
						记录
					</button>
				</footer>
			</section>
		`;
	}
}

/**
 * 初始化 TimestampRecorder 组件
 */
export const initTimestampRecorder = async (
	liveStartTime: number = 0,
	isLive: boolean = true,
) => {
	const timestampRecorder = document.createElement( 'timestamp-recorder' );
	timestampRecorder.isLive = isLive;
	timestampRecorder.liveStartTime = liveStartTime;
	const container = await elementWaiter( '.aside-area' );
	// const container = document.body;
	container.append( timestampRecorder );
	return timestampRecorder;
};


declare global {
	interface HTMLElementTagNameMap {
		'timestamp-recorder': TimestampRecorder;
	}
	
	interface HTMLElementEventMap {
		'timestamp-recorded': CustomEvent<{
			timestamp: number;
			liveTimestamp: string;
			liveStartTime: number;
			note: string;
		}>;
		'open-record-list': CustomEvent;
	}
}
