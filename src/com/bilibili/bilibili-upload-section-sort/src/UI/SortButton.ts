class SortButton extends HTMLElement {
	// 观察的属性
	static get observedAttributes(): string[] {
		return [ 'status', 'countdown' ];
	}
	
	// 私有属性
	private _status: 'loading' | 'loaded' = 'loading';
	private _countdown: number = 5;
	
	constructor() {
		super();
		this.attachShadow( { mode: 'open' } );
		this.render();
	}
	
	connectedCallback(): void {
		this.addEventListeners();
		this.updateDisplay();
	}
	
	disconnectedCallback(): void {
		this.removeEventListeners();
	}
	
	attributeChangedCallback( name: string, oldValue: string, newValue: string ): void {
		if ( oldValue === newValue ) return;
		
		switch ( name ) {
			case 'status':
				this._status = newValue as 'loading' | 'loaded';
				this.updateStatusDisplay();
				break;
			case 'countdown':
				const countdownValue = Number( newValue );
				if ( !isNaN( countdownValue ) ) {
					this._countdown = countdownValue;
					this.updateCountdownDisplay();
				}
				break;
		}
	}
	
	// 属性访问器
	get status(): 'loading' | 'loaded' {
		return this._status;
	}
	
	set status( value: 'loading' | 'loaded' ) {
		this.setAttribute( 'status', value );
	}
	
	get countdown(): number {
		return this._countdown;
	}
	
	set countdown( value: number ) {
		this.setAttribute( 'countdown', value.toString() );
	}
	
	// 渲染组件
	private render(): void {
		if ( !this.shadowRoot ) return;
		
		this.shadowRoot.innerHTML = `
            <style>
                .sort-button-group {
                    text-align: center;
                    width: 154px;
                    height: 34px;
                    line-height: 34px;
                    border-radius: 4px;
                    font-size: 14px;
                    user-select: none;
                    overflow: hidden;
                    box-sizing: border-box !important;
                    background-color: #00a1d6;
                    color: #fff;
                    display: flex;
                    justify-content: space-around;
                    cursor: pointer;
                }
                
                .sort-button-group.loading > .ascend-sort-button,
                .sort-button-group.loading > .descend-sort-button,
                .sort-button-group.loaded > .loading-button {
                    display: none;
                }
                
                .sort-button-group.loaded > .ascend-sort-button,
                .sort-button-group.loaded > .descend-sort-button,
                .sort-button-group.loading > .loading-button {
                    display: inline-block;
                }
                
                .ascend-sort-button {
                    border-right: 1px solid #fff;
                }
                
                .ascend-sort-button,
                .descend-sort-button {
                    flex: 1;
                    cursor: pointer;
                }
                
                .ascend-sort-button:hover,
                .descend-sort-button:hover {
                    background-color: #008bb8;
                }
                
                .loading-button {
                    flex: 1;
                }
            </style>
            
            <div class="sort-button-group ${ this._status }">
                <section class="loading-button">加载数据中...剩余${ this._countdown.toFixed( 1 ) }s</section>
                <section class="ascend-sort-button">升序排序</section>
                <section class="descend-sort-button">降序排序</section>
            </div>
        `;
	}
	
	// 更新状态显示
	private updateStatusDisplay(): void {
		const container = this.shadowRoot?.querySelector( '.sort-button-group' );
		if ( container ) {
			container.className = `sort-button-group ${ this._status }`;
		}
	}
	
	// 更新倒计时显示
	private updateCountdownDisplay(): void {
		const loadingButton = this.shadowRoot?.querySelector( '.loading-button' );
		if ( loadingButton ) {
			loadingButton.textContent = `加载数据中...剩余${ this._countdown.toFixed( 1 ) }s`;
		}
	}
	
	// 更新显示
	private updateDisplay(): void {
		this.updateStatusDisplay();
		this.updateCountdownDisplay();
	}
	
	// 添加事件监听器
	private addEventListeners(): void {
		const ascendButton = this.shadowRoot?.querySelector( '.ascend-sort-button' );
		const descendButton = this.shadowRoot?.querySelector( '.descend-sort-button' );
		
		if ( ascendButton ) {
			ascendButton.addEventListener( 'click', this.handleAscendSort.bind( this ) );
		}
		
		if ( descendButton ) {
			descendButton.addEventListener( 'click', this.handleDescendSort.bind( this ) );
		}
	}
	
	// 移除事件监听器
	private removeEventListeners(): void {
		const ascendButton = this.shadowRoot?.querySelector( '.ascend-sort-button' );
		const descendButton = this.shadowRoot?.querySelector( '.descend-sort-button' );
		
		if ( ascendButton ) {
			ascendButton.removeEventListener( 'click', this.handleAscendSort.bind( this ) );
		}
		
		if ( descendButton ) {
			descendButton.removeEventListener( 'click', this.handleDescendSort.bind( this ) );
		}
	}
	
	// 处理升序排序点击
	private handleAscendSort( event: Event ): void {
		event.stopPropagation();
		this.dispatchEvent( new CustomEvent( 'ascend-sort', {
			bubbles: true,
			composed: true,
			detail: { type: 'ascend', timestamp: Date.now() },
		} ) );
	}
	
	// 处理降序排序点击
	private handleDescendSort( event: Event ): void {
		event.stopPropagation();
		this.dispatchEvent( new CustomEvent( 'descend-sort', {
			bubbles: true,
			composed: true,
			detail: { type: 'descend', timestamp: Date.now() },
		} ) );
	}
	
	// 公共方法
	public setLoading(): void {
		this.status = 'loading';
	}
	
	public setLoaded(): void {
		this.status = 'loaded';
	}
	
	public setCountdown( value: number ): void {
		this.countdown = value;
	}
	
	public reset(): void {
		this.status = 'loading';
		this.dispatchEvent( new CustomEvent( 'reset', {
			bubbles: true,
			composed: true,
		} ) );
	}
}


// 导出类型声明
declare global {
	interface HTMLElementTagNameMap {
		'sort-button': SortButton;
	}
	
	interface SortButtonEventMap {
		'ascend-sort': CustomEvent<{ type: 'ascend'; }>;
		'descend-sort': CustomEvent<{ type: 'descend'; }>;
		'reset': CustomEvent;
	}
}

/**
 * 初始化 SortButton
 */
export const initSortButton = (
	container: HTMLElement,
) => {
	// 注册 WebComponent
	if ( !customElements.get( 'sort-button' ) ) {
		customElements.define( 'sort-button', SortButton );
	}
	const sortButton = document.createElement( 'sort-button' );
	container.appendChild( sortButton );
	return sortButton;
};
