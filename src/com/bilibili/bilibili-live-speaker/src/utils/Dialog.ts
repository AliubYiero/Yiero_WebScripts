// types.ts - 类型定义
export interface UnicycleConfig {
    text: string;
    interval: {
        min: number;
        max: number;
    };
    repeatCount: {
        min: number;
        max: number;
    };
}

export interface DialogOptions {
    defaultText?: string;
    defaultMin?: number;
    defaultMax?: number;
    defaultRepeatMin?: number;
    defaultRepeatMax?: number;
    onSave?: (config: UnicycleConfig) => void;
    onCancel?: () => void;
}

// UnicycleConfigDialog.ts - 主类
export class UnicycleConfigDialog {
    private host: HTMLElement | null = null;
    private shadow: ShadowRoot | null = null;
    private isOpen = false;
    private options: Required<DialogOptions>;

    constructor(options: DialogOptions = {}) {
        this.options = {
            defaultText: '',
            defaultRepeatMin: 1,
            defaultRepeatMax: 1,
            defaultMin: 500,
            defaultMax: 1000,
            onSave: () => {},
            onCancel: () => {},
            ...options,
        };
        this.init();
    }

    private init(): void {
        this.host = document.createElement('div');
        this.host.id = 'unicycle-dialog-host';
        this.host.style.all = 'initial';
        this.host.style.display = 'contents';
        document.body.appendChild(this.host);
        this.shadow = this.host.attachShadow({ mode: 'open' });
        this.render();
        this.bindEvents();
    }

    private render(): void {
        if (!this.shadow) return;

        this.shadow.innerHTML = `
      <style>
        :host { all: initial; display: block; }
        :host * { box-sizing: border-box; }
        :host {
          --background: 0 0% 100%;
          --foreground: 240 10% 3.9%;
          --card: 0 0% 100%;
          --card-foreground: 240 10% 3.9%;
          --primary: 240 5.9% 10%;
          --primary-foreground: 0 0% 98%;
          --secondary: 240 4.8% 95.9%;
          --secondary-foreground: 240 5.9% 10%;
          --muted: 240 4.8% 95.9%;
          --muted-foreground: 240 3.8% 46.1%;
          --accent: 240 4.8% 95.9%;
          --border: 240 5.9% 90%;
          --input: 240 5.9% 90%;
          --ring: 240 5.9% 10%;
          --destructive: 0 84.2% 60.2%;
          --destructive-foreground: 0 0% 98%;
          --radius: 0.5rem;
        }
        .dialog-container {
          display: none;
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 9999;
        }
        .dialog-container.open { display: block; }
        .dialog-content {
          background-color: hsl(var(--card));
          color: hsl(var(--card-foreground));
          border: 1px solid hsl(var(--border));
          border-radius: var(--radius);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          width: 400px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        .dialog-header {
          padding: 1.5rem;
          border-bottom: 1px solid hsl(var(--border));
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .dialog-title {
          font-size: 1.125rem;
          font-weight: 600;
          line-height: 1.5rem;
          letter-spacing: -0.025em;
          margin: 0;
        }
        .btn-close {
          height: 2rem;
          width: 2rem;
          padding: 0;
          background: transparent;
          border: none;
          color: hsl(var(--muted-foreground));
          cursor: pointer;
          border-radius: var(--radius);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        .btn-close:hover {
          background-color: hsl(var(--accent));
          color: hsl(var(--foreground));
        }
        .dialog-body {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .form-item {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .form-label {
          font-size: 0.875rem;
          font-weight: 500;
          color: hsl(var(--foreground));
        }
        .input {
          display: flex;
          height: 2.5rem;
          width: 100%;
          border-radius: var(--radius);
          border: 1px solid hsl(var(--input));
          background-color: transparent;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          transition: all 0.2s;
          outline: none;
          color: hsl(var(--foreground));
          font-family: inherit;
        }
        .input:focus {
          border-color: hsl(var(--ring));
        }
        .input.error {
          border-color: hsl(var(--destructive));
          box-shadow: 0 0 0 2px hsl(var(--background)), 0 0 0 4px hsl(var(--destructive));
        }
        .input::placeholder {
          color: hsl(var(--muted-foreground));
        }
        .interval-group {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .interval-separator {
          color: hsl(var(--muted-foreground));
          font-size: 0.875rem;
        }
        .char-counter {
          text-align: right;
          color: hsl(var(--muted-foreground));
          font-size: 0.75rem;
          margin-top: 0.25rem;
        }
        .error-message {
          color: hsl(var(--destructive));
          font-size: 0.75rem;
          font-weight: 500;
          min-height: 1rem;
          margin-top: 0.25rem;
          display: none;
        }
        .error-message.visible {
          display: block;
        }
        .dialog-footer {
          padding: 1.5rem;
          border-top: 1px solid hsl(var(--border));
          display: flex;
          justify-content: flex-end;
          gap: 0.5rem;
        }
        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius);
          font-size: 0.875rem;
          font-weight: 500;
          height: 2.5rem;
          padding: 0 1rem;
          transition: all 0.2s;
          cursor: pointer;
          border: 1px solid transparent;
          font-family: inherit;
        }
        .btn-primary {
          background-color: hsl(var(--primary));
          color: hsl(var(--primary-foreground));
        }
        .btn-primary:hover { opacity: 0.9; }
        .btn-ghost {
          background-color: transparent;
          color: hsl(var(--foreground));
        }
        .btn-ghost:hover { background-color: hsl(var(--accent)); }
      </style>

      <div class="dialog-container" id="dialog-container">
        <div class="dialog-content">
          <div class="dialog-header">
            <h2 class="dialog-title">独轮车配置</h2>
            <button class="btn-close" id="btn-close" aria-label="关闭">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
              </svg>
            </button>
          </div>

          <div class="dialog-body">
            <!-- 文本输入 -->
            <div class="form-item">
              <label class="form-label" for="config-text">文本</label>
              <input type="text" id="config-text" class="input" maxlength="40" placeholder="请输入文本内容">
              <div class="char-counter" id="char-count">0/40</div>
              <div class="error-message" id="text-error"></div>
            </div>

            <!-- 文本重复字数 -->
            <div class="form-item">
              <label class="form-label">文本重复字数</label>
              <div class="interval-group">
                <input type="number" id="config-repeat-min" class="input" placeholder="最小" min="1">
                <span class="interval-separator">~</span>
                <input type="number" id="config-repeat-max" class="input" placeholder="最大" min="1">
                <span class="text-sm" style="color: hsl(var(--muted-foreground)); font-size: 0.875rem;">次</span>
              </div>
              <div class="error-message" id="repeat-error"></div>
            </div>

            <!-- 间隔输入 -->
            <div class="form-item">
              <label class="form-label">间隔</label>
              <div class="interval-group">
                <input type="number" id="config-min" class="input" placeholder="最小" min="500">
                <span class="interval-separator">~</span>
                <input type="number" id="config-max" class="input" placeholder="最大" min="500">
                <span class="text-sm" style="color: hsl(var(--muted-foreground)); font-size: 0.875rem;">ms</span>
              </div>
              <div class="error-message" id="interval-error"></div>
            </div>
          </div>

          <div class="dialog-footer">
            <button class="btn btn-ghost" id="btn-cancel">取消</button>
            <button class="btn btn-primary" id="btn-save">保存</button>
          </div>
        </div>
      </div>
    `;
    }

    /**
     * 显示错误信息并标红输入框
     */
    private showError(
        input: HTMLElement | null,
        errorEl: HTMLElement | null,
        message: string,
    ): void {
        if (input) input.classList.add('error');
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.classList.add('visible');
        }
    }

    /**
     * 清除单个输入框的错误状态
     */
    private clearError(
        input: HTMLElement | null,
        errorEl: HTMLElement | null,
    ): void {
        if (input) input.classList.remove('error');
        if (errorEl) {
            errorEl.textContent = '';
            errorEl.classList.remove('visible');
        }
    }

    /**
     * 清除所有错误状态
     */
    private clearAllErrors(): void {
        if (!this.shadow) return;

        const inputs = this.shadow.querySelectorAll('.input');
        const errors = this.shadow.querySelectorAll('.error-message');

        inputs.forEach((input) => input.classList.remove('error'));
        errors.forEach((error) => {
            error.textContent = '';
            error.classList.remove('visible');
        });
    }

    private bindEvents(): void {
        if (!this.shadow) return;

        const btnClose = this.shadow.getElementById('btn-close');
        const btnCancel = this.shadow.getElementById('btn-cancel');
        const btnSave = this.shadow.getElementById('btn-save');
        const textInput = this.shadow.getElementById(
            'config-text',
        ) as HTMLInputElement;
        const charCountDisplay =
            this.shadow.getElementById('char-count');
        const repeatMinInput = this.shadow.getElementById(
            'config-repeat-min',
        ) as HTMLInputElement;
        const repeatMaxInput = this.shadow.getElementById(
            'config-repeat-max',
        ) as HTMLInputElement;
        const minInput = this.shadow.getElementById(
            'config-min',
        ) as HTMLInputElement;
        const maxInput = this.shadow.getElementById(
            'config-max',
        ) as HTMLInputElement;

        const textError = this.shadow.getElementById('text-error');
        const repeatError =
            this.shadow.getElementById('repeat-error');
        const intervalError =
            this.shadow.getElementById('interval-error');

        // 字符计数
        const updateCharCount = () => {
            if (charCountDisplay && textInput) {
                charCountDisplay.textContent = `${textInput.value.length}/40`;
            }
        };
        textInput?.addEventListener('input', () => {
            updateCharCount();
            this.clearError(textInput, textError);
        });

        // 输入时自动清除对应错误（提升用户体验）
        repeatMinInput?.addEventListener('input', () =>
            this.clearError(repeatMinInput, repeatError),
        );
        repeatMaxInput?.addEventListener('input', () =>
            this.clearError(repeatMaxInput, repeatError),
        );
        minInput?.addEventListener('input', () =>
            this.clearError(minInput, intervalError),
        );
        maxInput?.addEventListener('input', () =>
            this.clearError(maxInput, intervalError),
        );

        // 关闭按钮
        const handleClose = () => {
            this.options.onCancel();
            this.close();
        };
        btnClose?.addEventListener('click', handleClose);
        btnCancel?.addEventListener('click', handleClose);

        // 保存按钮
        btnSave?.addEventListener('click', () => {
            // 先清除所有错误
            this.clearAllErrors();

            const text = textInput?.value.trim() || '';
            const repeatMin = parseInt(repeatMinInput?.value || '1');
            const repeatMax = parseInt(repeatMaxInput?.value || '1');
            const minVal = parseInt(minInput?.value || '0');
            const maxVal = parseInt(maxInput?.value || '0');

            let hasError = false;
            let firstErrorInput: HTMLElement | null = null;

            // 验证文本
            if (!text) {
                this.showError(
                    textInput,
                    textError,
                    '文本内容不能为空',
                );
                hasError = true;
                firstErrorInput = firstErrorInput || textInput;
            }

            // 验证重复次数
            if (!hasError && (isNaN(repeatMin) || repeatMin < 1)) {
                this.showError(
                    repeatMinInput,
                    repeatError,
                    '最小重复次数不能小于 1',
                );
                hasError = true;
                firstErrorInput = firstErrorInput || repeatMinInput;
            }
            if (
                !hasError &&
                (isNaN(repeatMax) || repeatMax < repeatMin)
            ) {
                this.showError(
                    repeatMaxInput,
                    repeatError,
                    '最大重复次数不能小于最小值',
                );
                hasError = true;
                firstErrorInput = firstErrorInput || repeatMaxInput;
            }

            // 验证间隔
            if (!hasError && (isNaN(minVal) || minVal < 500)) {
                this.showError(
                    minInput,
                    intervalError,
                    '最小间隔不能小于 500ms',
                );
                hasError = true;
                firstErrorInput = firstErrorInput || minInput;
            }
            if (!hasError && (isNaN(maxVal) || maxVal < minVal)) {
                this.showError(
                    maxInput,
                    intervalError,
                    '最大间隔不能小于最小值',
                );
                hasError = true;
                firstErrorInput = firstErrorInput || maxInput;
            }

            // 如果有错误，聚焦第一个错误输入框并返回
            if (hasError) {
                firstErrorInput?.focus();
                return;
            }

            // 验证通过，返回配置
            const configData: UnicycleConfig = {
                text,
                repeatCount: { min: repeatMin, max: repeatMax },
                interval: { min: minVal, max: maxVal },
            };

            console.log('保存配置:', configData);
            this.options.onSave(configData);
            this.close();
        });

        // 重置默认值
        if (repeatMinInput)
            repeatMinInput.value = String(
                this.options.defaultRepeatMin,
            );
        if (repeatMaxInput)
            repeatMaxInput.value = String(
                this.options.defaultRepeatMax,
            );
        if (minInput)
            minInput.value = String(this.options.defaultMin);
        if (maxInput)
            maxInput.value = String(this.options.defaultMax);
        if (textInput) {
            textInput.value = this.options.defaultText;
            updateCharCount();
        }
    }

    public open(): void {
        if (!this.shadow || this.isOpen) return;

        const container = this.shadow.getElementById(
            'dialog-container',
        );
        container?.classList.add('open');
        this.isOpen = true;

        // 重置表单并清除错误
        this.resetForm();
        this.clearAllErrors();

        // 聚焦输入框
        setTimeout(() => {
            const textInput = this.shadow?.getElementById(
                'config-text',
            ) as HTMLInputElement;
            textInput?.focus();
        }, 100);
    }

    public close(): void {
        if (!this.shadow) return;
        const container = this.shadow.getElementById(
            'dialog-container',
        );
        container?.classList.remove('open');
        this.isOpen = false;
    }

    private resetForm(): void {
        if (!this.shadow) return;

        const textInput = this.shadow.getElementById(
            'config-text',
        ) as HTMLInputElement;
        const repeatMinInput = this.shadow.getElementById(
            'config-repeat-min',
        ) as HTMLInputElement;
        const repeatMaxInput = this.shadow.getElementById(
            'config-repeat-max',
        ) as HTMLInputElement;
        const minInput = this.shadow.getElementById(
            'config-min',
        ) as HTMLInputElement;
        const maxInput = this.shadow.getElementById(
            'config-max',
        ) as HTMLInputElement;
        const charCountDisplay =
            this.shadow.getElementById('char-count');

        if (textInput) textInput.value = this.options.defaultText;
        if (repeatMinInput)
            repeatMinInput.value = String(
                this.options.defaultRepeatMin,
            );
        if (repeatMaxInput)
            repeatMaxInput.value = String(
                this.options.defaultRepeatMax,
            );
        if (minInput)
            minInput.value = String(this.options.defaultMin);
        if (maxInput)
            maxInput.value = String(this.options.defaultMax);
        if (charCountDisplay && textInput) {
            charCountDisplay.textContent = `${textInput.value.length}/40`;
        }
    }

    public updateOptions(options: DialogOptions): void {
        this.options = { ...this.options, ...options };
    }

    public destroy(): void {
        this.close();
        if (this.host?.parentNode) {
            this.host.parentNode.removeChild(this.host);
        }
        this.host = null;
        this.shadow = null;
    }

    public get isDialogOpen(): boolean {
        return this.isOpen;
    }
}
