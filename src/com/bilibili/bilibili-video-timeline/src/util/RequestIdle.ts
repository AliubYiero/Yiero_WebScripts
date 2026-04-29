export class RequestIdle {
    private requestIdleId: number = 0;

    constructor(private callback: () => void) {}

    /**
     * 在浏览器空闲时, 执行回调函数
     */
    static run(callback: () => void) {
        window.requestIdleCallback((deadline) => {
            if (deadline.timeRemaining() >= 0) {
                callback();
            }
        });
    }

    /**
     * 在浏览器空闲时, 执行回调函数
     */
    run() {
        this.requestIdleId = window.requestIdleCallback(
            (deadline) => {
                if (deadline.timeRemaining() >= 0) {
                    this.callback();
                }
            },
        );
    }

    /**
     * 结束执行
     */
    cancel() {
        window.cancelIdleCallback(this.requestIdleId);
    }
}
