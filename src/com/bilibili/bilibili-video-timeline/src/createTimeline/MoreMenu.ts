export interface MoreMenuItem {
    label: string;
    onClick?: () => void;
}

export interface HTMLMoreMenuButtonElement extends HTMLButtonElement {
    __moreMenu?: MoreMenu;
}

export class MoreMenu {
    private menuEl: HTMLElement;
    private isOpen: boolean = false;
    private scrollContainer: HTMLElement | null;

    constructor(
        private button: HTMLElement,
        private items: MoreMenuItem[],
        scrollContainer?: HTMLElement,
    ) {
        this.scrollContainer = scrollContainer ?? null;
        this.menuEl = this.render();
        this.menuEl.style.position = 'fixed';
        document.body.appendChild(this.menuEl);
        this.button.addEventListener('click', this.onButtonClick);
        document.addEventListener('click', this.onDocumentClick);
        if (this.scrollContainer) {
            this.scrollContainer.addEventListener(
                'scroll',
                this.onScroll,
                { passive: true },
            );
        }
        (button as HTMLMoreMenuButtonElement).__moreMenu = this;
    }

    toggle(): void {
        this.isOpen ? this.close() : this.open();
    }

    open(): void {
        this.isOpen = true;
        this.updatePosition();
        this.menuEl.classList.add('open');
    }

    close(): void {
        this.isOpen = false;
        this.menuEl.classList.remove('open');
    }

    private updatePosition(): void {
        const rect = this.button.getBoundingClientRect();
        this.menuEl.style.top = `${rect.bottom + 4}px`;
        this.menuEl.style.right = `${window.innerWidth - rect.right - 75}px`;
    }

    destroy(): void {
        this.close();
        this.button.removeEventListener('click', this.onButtonClick);
        document.removeEventListener('click', this.onDocumentClick);
        if (this.scrollContainer) {
            this.scrollContainer.removeEventListener(
                'scroll',
                this.onScroll,
            );
        }
        this.menuEl.remove();
        delete (this.button as HTMLMoreMenuButtonElement).__moreMenu;
    }

    private onButtonClick = (e: MouseEvent) => {
        e.stopPropagation();
        this.toggle();
    };
    private onDocumentClick = () => {
        if (this.isOpen) this.close();
    };
    private onScroll = () => {
        if (this.isOpen) this.close();
    };

    private render(): HTMLElement {
        const el = document.createElement('div');
        el.className = 'more-menu';
        el.addEventListener('click', (e) => e.stopPropagation());
        this.items.forEach((item) => {
            const itemEl = document.createElement('div');
            itemEl.className = 'more-menu-item';
            itemEl.textContent = item.label;
            if (item.onClick) {
                itemEl.addEventListener('click', (e) => {
                    e.stopPropagation();
                    item.onClick!();
                    this.close();
                });
            }
            el.appendChild(itemEl);
        });
        return el;
    }
}
