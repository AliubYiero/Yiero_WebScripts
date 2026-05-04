export interface TooltipOptions {
    content: string;
    placement?: 'top' | 'bottom' | 'left' | 'right';
    offset?: number;
    delay?: number; // 显示延迟(ms)
    zIndex?: number;
}

export class Tooltip {
    private tooltipEl: HTMLDivElement | null = null;
    private targetEl: HTMLElement | null = null;
    private options: Required<TooltipOptions>;
    private showTimer: number | null = null;
    private hideTimer: number | null = null;

    // 绑定事件处理函数，方便移除
    private handleMouseEnter: () => void;
    private handleMouseLeave: () => void;

    constructor(target: HTMLElement, options: TooltipOptions) {
        this.targetEl = target;
        this.options = {
            placement: 'top',
            offset: 8,
            delay: 200,
            zIndex: 999999,
            ...options,
        };

        // 预绑定事件，避免内存泄漏
        this.handleMouseEnter = () => this.scheduleShow();
        this.handleMouseLeave = () => this.scheduleHide();

        this.init();
    }

    private init() {
        if (!this.targetEl) return;

        // 创建 Tooltip DOM
        this.createTooltipElement();

        // 绑定事件
        this.targetEl.addEventListener(
            'mouseenter',
            this.handleMouseEnter,
        );
        this.targetEl.addEventListener(
            'mouseleave',
            this.handleMouseLeave,
        );
        // 可选：支持焦点访问
        this.targetEl.addEventListener(
            'focus',
            this.handleMouseEnter,
        );
        this.targetEl.addEventListener('blur', this.handleMouseLeave);
    }

    private createTooltipElement() {
        const div = document.createElement('div');
        div.className = 'tm-tooltip-box'; // 使用特定类名方便样式隔离
        div.textContent = this.options.content;

        // 基础样式注入 (也可以提取到单独的 CSS 文件通过 GM_addStyle 注入)
        Object.assign(div.style, {
            position: 'fixed', // 关键：使用 fixed 脱离所有父级 overflow 限制
            padding: '6px 10px',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: '#fff',
            borderRadius: '4px',
            fontSize: '12px',
            lineHeight: '1.5',
            whiteSpace: 'nowrap',
            pointerEvents: 'none', // 防止遮挡鼠标事件
            opacity: '0',
            visibility: 'hidden',
            transition: 'opacity 0.2s, visibility 0.2s',
            zIndex: String(this.options.zIndex),
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        });

        document.body.appendChild(div);
        this.tooltipEl = div;
    }

    private scheduleShow() {
        if (this.hideTimer) {
            clearTimeout(this.hideTimer);
            this.hideTimer = null;
        }

        // 如果已经显示，直接更新位置即可，不重复计时
        if (this.tooltipEl?.style.visibility === 'visible') {
            this.updatePosition();
            return;
        }

        this.showTimer = window.setTimeout(() => {
            this.show();
        }, this.options.delay);
    }

    private scheduleHide() {
        if (this.showTimer) {
            clearTimeout(this.showTimer);
            this.showTimer = null;
        }

        this.hideTimer = window.setTimeout(() => {
            this.hide();
        }, 100); // 隐藏稍微快一点
    }

    private show() {
        if (!this.tooltipEl || !this.targetEl) return;

        this.updatePosition();

        // 强制重绘后显示，触发 transition
        requestAnimationFrame(() => {
            if (this.tooltipEl) {
                this.tooltipEl.style.visibility = 'visible';
                this.tooltipEl.style.opacity = '1';
            }
        });
    }

    private hide() {
        if (!this.tooltipEl) return;

        this.tooltipEl.style.opacity = '0';
        this.tooltipEl.style.visibility = 'hidden';
    }

    /**
     * 核心逻辑：计算位置并处理边界碰撞
     */
    private updatePosition() {
        if (!this.tooltipEl || !this.targetEl) return;

        const targetRect = this.targetEl.getBoundingClientRect();
        const tooltipRect = this.tooltipEl.getBoundingClientRect();
        const { placement, offset } = this.options;

        let top = 0;
        let left = 0;

        // 1. 初步计算位置
        switch (placement) {
            case 'top':
                top = targetRect.top - tooltipRect.height - offset;
                left =
                    targetRect.left +
                    (targetRect.width - tooltipRect.width) / 2;
                break;
            case 'bottom':
                top = targetRect.bottom + offset;
                left =
                    targetRect.left +
                    (targetRect.width - tooltipRect.width) / 2;
                break;
            case 'left':
                top =
                    targetRect.top +
                    (targetRect.height - tooltipRect.height) / 2;
                left = targetRect.left - tooltipRect.width - offset;
                break;
            case 'right':
                top =
                    targetRect.top +
                    (targetRect.height - tooltipRect.height) / 2;
                left = targetRect.right + offset;
                break;
        }

        // 2. 边界检测与自动调整 (简单的防溢出逻辑)
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // 左右溢出调整
        if (left < 0) left = 0;
        if (left + tooltipRect.width > viewportWidth) {
            left = viewportWidth - tooltipRect.width;
        }

        // 上下溢出调整 (如果指定方向放不下，尝试翻转到对面)
        if (placement === 'top' && top < 0) {
            // 翻转到下面
            top = targetRect.bottom + offset;
        } else if (
            placement === 'bottom' &&
            top + tooltipRect.height > viewportHeight
        ) {
            // 翻转到上面
            top = targetRect.top - tooltipRect.height - offset;
        }

        // 垂直居中时的上下边界保护
        if (placement === 'left' || placement === 'right') {
            if (top < 0) top = 0;
            if (top + tooltipRect.height > viewportHeight)
                top = viewportHeight - tooltipRect.height;
        }

        // 3. 应用样式
        this.tooltipEl.style.top = `${top}px`;
        this.tooltipEl.style.left = `${left}px`;
    }

    /**
     * 更新内容
     */
    public setContent(content: string) {
        this.options.content = content;
        if (this.tooltipEl) {
            this.tooltipEl.textContent = content;
            // 内容改变可能导致尺寸变化，如果当前正在显示，需要重新计算位置
            if (this.tooltipEl.style.visibility === 'visible') {
                this.updatePosition();
            }
        }
    }

    /**
     * 销毁实例，清理事件和 DOM
     */
    public destroy() {
        if (this.showTimer) clearTimeout(this.showTimer);
        if (this.hideTimer) clearTimeout(this.hideTimer);

        if (this.targetEl) {
            this.targetEl.removeEventListener(
                'mouseenter',
                this.handleMouseEnter,
            );
            this.targetEl.removeEventListener(
                'mouseleave',
                this.handleMouseLeave,
            );
            this.targetEl.removeEventListener(
                'focus',
                this.handleMouseEnter,
            );
            this.targetEl.removeEventListener(
                'blur',
                this.handleMouseLeave,
            );
        }

        if (this.tooltipEl && this.tooltipEl.parentNode) {
            this.tooltipEl.parentNode.removeChild(this.tooltipEl);
        }

        this.tooltipEl = null;
        this.targetEl = null;
    }
}
