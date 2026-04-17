import { gmMenuCommand } from '@yiero/gmlib';
import {
    UnicycleConfig,
    UnicycleConfigDialog,
} from './utils/Dialog.ts';
import { configStore } from './store/configStore.ts';
import { getRandomInt } from './utils/getRandomInt.ts';
import { danmaku } from './utils/Danmaku.ts';

/**
 * 主函数
 */
const main = async () => {
    const config = configStore.get();
    const dialog = new UnicycleConfigDialog({
        defaultText: config.text,
        defaultMin: config.interval.min,
        defaultMax: config.interval.max,
        defaultRepeatMin: config.repeatCount.min,
        defaultRepeatMax: config.repeatCount.max,
        onSave: (config) => {
            // 处理保存逻辑...
            configStore.set(config);
            dialog.updateOptions({
                defaultText: config.text,
                defaultMin: config.interval.min,
                defaultMax: config.interval.max,
                defaultRepeatMin: config.repeatCount.min,
                defaultRepeatMax: config.repeatCount.max,
            });
        },
        onCancel: () => {},
    });
    danmaku.init();

    let timer = 0;
    const sendDanmaku = (
        config: UnicycleConfig,
        maxContentLength: number = 40,
    ) => {
        danmaku.send(
            config.text
                .repeat(
                    getRandomInt(
                        config.repeatCount.min,
                        config.repeatCount.max,
                    ),
                )
                .slice(0, maxContentLength),
        );
        const nextSendTime = getRandomInt(
            config.interval.min,
            config.interval.max,
        );
        console.log('下次发送弹幕的时间', nextSendTime);
        timer = window.setTimeout(
            () => sendDanmaku(config, maxContentLength),
            nextSendTime,
        );
    };
    gmMenuCommand
        .createToggle({
            active: {
                title: '开启独轮车',
                onClick() {
                    const config = configStore.get();
                    console.log('配置: ', config);

                    let maxContentLength = 40;
                    const contentLengthElement =
                        document.querySelector<HTMLElement>(
                            '.input-limit-hint.p-absolute',
                        );
                    if (contentLengthElement) {
                        const matches =
                            contentLengthElement.innerText.match(
                                /(?<=\/)\d+/,
                            );
                        if (Array.isArray(matches) && matches[0]) {
                            maxContentLength = Number(matches[0]);
                        }
                    }

                    timer = window.setTimeout(
                        () => sendDanmaku(config, maxContentLength),
                        getRandomInt(
                            config.interval.min,
                            config.interval.max,
                        ),
                    );
                },
            },
            inactive: {
                title: '关闭独轮车',
                onClick() {
                    clearTimeout(timer);
                },
            },
        })
        .create('独轮车配置', () => {
            dialog.open();
        })
        .render();
};

main().catch((error) => {
    console.error(error);
});
