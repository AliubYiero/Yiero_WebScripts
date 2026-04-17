/**
 * 兑换码事件发送事件监听
 */
export class RedeemCodeGrantEvent {
    // 事件名
    private static eventName = 'redeemCodeGrant';

    /**
     * 创建一个虚拟元素, 用于接收和发送事件
     * 避免污染全局事件域, 和其它脚本冲突
     */
    private static virtualDocument = document.createElement('div');

    /**
     * 兑换码发送事件
     */
    static send(redeemCode: string, index: number) {
        const event = new CustomEvent(this.eventName, {
            detail: {
                redeemCode,
                index,
            },
        });
        this.virtualDocument.dispatchEvent(event);
    }

    /**
     * 接收兑换码发送事件
     */
    static receive(
        callback: (redeemCode: string, index: number) => void,
    ) {
        this.virtualDocument.addEventListener(
            this.eventName,
            (event) => {
                const { redeemCode, index } = (event as CustomEvent)
                    .detail as {
                    redeemCode: string;
                    index: number;
                };
                callback(redeemCode, index);
            },
        );
    }
}
