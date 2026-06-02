const STYLE = `
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
`;

class SortButton extends HTMLElement {
    static get observedAttributes(): string[] {
        return ['status', 'countdown'];
    }

    private _status: 'loading' | 'loaded' = 'loading';
    private _countdown = 5;

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.render();
    }

    connectedCallback(): void {
        this.addEventListeners();
        this.updateDisplay();
    }

    disconnectedCallback(): void {
        this.removeEventListeners();
    }

    attributeChangedCallback(
        name: string,
        oldValue: string,
        newValue: string,
    ): void {
        if (oldValue === newValue) return;

        switch (name) {
            case 'status':
                this._status = newValue as 'loading' | 'loaded';
                this.updateStatusDisplay();
                break;
            case 'countdown':
                this._countdown = Number(newValue) || 0;
                this.updateCountdownDisplay();
                break;
        }
    }

    get status(): 'loading' | 'loaded' {
        return this._status;
    }

    set status(value: 'loading' | 'loaded') {
        this.setAttribute('status', value);
    }

    get countdown(): number {
        return this._countdown;
    }

    set countdown(value: number) {
        this.setAttribute('countdown', value.toFixed(1));
    }

    // 绑定为实例属性，确保 add/remove 引用一致
    private handleAscendClick = (event: Event): void => {
        event.stopPropagation();
        this.dispatchEvent(
            new CustomEvent('ascend-sort', {
                bubbles: true,
                composed: true,
            }),
        );
    };

    private handleDescendClick = (event: Event): void => {
        event.stopPropagation();
        this.dispatchEvent(
            new CustomEvent('descend-sort', {
                bubbles: true,
                composed: true,
            }),
        );
    };

    private render(): void {
        if (!this.shadowRoot) return;

        this.shadowRoot.innerHTML = `
            <style>${STYLE}</style>
            <div class="sort-button-group ${this._status}">
                <section class="loading-button">加载数据中...剩余${this._countdown.toFixed(1)}s</section>
                <section class="ascend-sort-button">升序排序</section>
                <section class="descend-sort-button">降序排序</section>
            </div>
        `;
    }

    private updateStatusDisplay(): void {
        const container = this.shadowRoot?.querySelector(
            '.sort-button-group',
        );
        if (container) {
            container.className = `sort-button-group ${this._status}`;
        }
    }

    private updateCountdownDisplay(): void {
        const el = this.shadowRoot?.querySelector('.loading-button');
        if (el) {
            el.textContent = `加载数据中...剩余${this._countdown.toFixed(1)}s`;
        }
    }

    private updateDisplay(): void {
        this.updateStatusDisplay();
        this.updateCountdownDisplay();
    }

    private addEventListeners(): void {
        this.shadowRoot
            ?.querySelector('.ascend-sort-button')
            ?.addEventListener('click', this.handleAscendClick);
        this.shadowRoot
            ?.querySelector('.descend-sort-button')
            ?.addEventListener('click', this.handleDescendClick);
    }

    private removeEventListeners(): void {
        this.shadowRoot
            ?.querySelector('.ascend-sort-button')
            ?.removeEventListener('click', this.handleAscendClick);
        this.shadowRoot
            ?.querySelector('.descend-sort-button')
            ?.removeEventListener('click', this.handleDescendClick);
    }
}

// 导出类型声明
declare global {
    interface HTMLElementTagNameMap {
        'sort-button': SortButton;
    }
}

/**
 * 初始化排序按钮 Web Component 并挂载到容器中。
 */
export const initSortButton = (
    container: HTMLElement,
): SortButton => {
    if (!customElements.get('sort-button')) {
        customElements.define('sort-button', SortButton);
    }
    const sortButton = document.createElement('sort-button');
    container.appendChild(sortButton);
    return sortButton;
};

/**
 * 修改小节页面的按钮位置
 */
export const addSortButtonStyle = () => {
    GM_addStyle(`.ep-section-edit-video-list-nav {
    justify-content: flex-start !important;
    gap: 24px;
}`);
};
