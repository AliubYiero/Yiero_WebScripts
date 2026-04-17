// src/utils/notify.ts
import { Message } from '@yiero/gmlib';
import { formatTime } from './formatTime.ts';

type MessageType = 'success' | 'warning' | 'error' | 'info';
type MessagePosition =
    | 'top'
    | 'top-left'
    | 'top-right'
    | 'left'
    | 'right'
    | 'bottom'
    | 'bottom-left'
    | 'bottom-right';
/**
 * 消息类型
 */
export interface MessageOption {
    duration?: number;
    position?: MessagePosition;
    showMessage?: boolean; // 强制显示/隐藏
    showLog?: boolean;
}

class Notify {
    constructor(private prefix?: string) {}

    info(content: string, options: MessageOption = {}) {
        this.baseInfo(content, options, 'info');
    }

    warning(content: string, options: MessageOption = {}) {
        this.baseInfo(content, options, 'warning');
    }

    error(content: string, options: MessageOption = {}) {
        this.baseInfo(content, options, 'error');
    }

    success(content: string, options: MessageOption = {}) {
        this.baseInfo(content, options, 'success');
    }

    private baseInfo(
        content: string,
        options: MessageOption = {},
        type: MessageType = 'info',
    ) {
        options.showLog ??= true;
        const formatContent = this.formatContent(content);
        if (options.showMessage) {
            Message({
                type: type,
                duration: options.duration || 3000,
                position: options.position || 'top-left',
                message: formatContent,
            });
        }
        if (options.showLog) {
            switch (type) {
                case 'warning':
                    console.warn(formatContent);
                    break;
                case 'error':
                    console.error(formatContent);
                    break;
                default:
                    console.info(formatContent);
                    break;
            }
        }
    }

    /**
     * 给文本添加上前缀
     */
    private formatContent(content: string) {
        if (!this.prefix) {
            return content;
        }
        return `${this.prefix} ${content}`;
    }
}

const notify = new Notify('[Bilibili Video Ad Ban]');
/**
 * 显示Bilibili广告屏蔽相关消息
 */
export const videoAdNotify = {
    /**
     * 屏蔽评论区广告
     */
    banCommentAd: () => {
        notify.info('已屏蔽评论区推广评论');
    },

    /**
     * 获取视频信息
     */
    getVideoInfo: () => {
        notify.info('正在获取当前视频字幕信息...', {
            showMessage: false,
        });
    },

    /**
     * 显示无字幕警告
     */
    noSubtitleWarning: () => {
        notify.warning('当前视频无字幕/弹幕, 无法识别视频广告', {
            showMessage: false,
        });
    },

    /**
     * 显示无广告信息
     */
    noAdInfo: () => {
        notify.info('当前视频不存在视频广告', { showMessage: false });
    },

    /**
     * 显示AI分析开始的消息
     */
    aiAnalysisStart: () => {
        notify.info(
            '已获取当前视频的字幕信息, 正在使用 AI 分析当前视频的广告情况...',
            { showMessage: false },
        );
    },

    /**
     * 显示AI分析完成的消息
     * @param duration AI分析用时（秒）
     * @param adTimes 广告时间段
     */
    aiAnalysisComplete: (
        adTimes: Array<{
            start: number;
            end: number;
        }>,
        duration?: string,
    ) => {
        const timeContent = adTimes
            .map(
                ({ start, end }) =>
                    `开始时间: ${formatTime(start)}\n结束时间: ${formatTime(end)}`,
            )
            .join('\n------\n');
        const durationContent = duration
            ? ` (用时 ${duration} s)`
            : '';
        notify.success(
            `已获取当前视频的广告信息${durationContent}, 正在监听视频进度条:\n${timeContent}`,
            { showMessage: false },
        );
    },

    /**
     * API KEY 未配置
     */
    apiKeyLost: () => {
        notify.error('API_KEY 未配置', {
            position: 'top',
            showMessage: true,
        });
    },

    /**
     * AI 用户提问
     */
    aiUserAsk: (content: string) => {
        console.groupCollapsed('[Bilibili Video Ad Ban] 用户提问:');
        console.info(content);
        console.groupEnd();
    },
    /**
     * AI 回答
     */
    aiAnswer: (content: string) => {
        console.groupCollapsed('[Bilibili Video Ad Ban] AI回复:');
        console.info(content);
        console.groupEnd();
    },

    /**
     * 跳转至广告结束
     */
    jumpAdEnd: (start: number, end: number) => {
        notify.success(
            `进入视频广告片段 (${formatTime(start)}~${formatTime(end)}), 开始跳转至广告结束`,
        );
    },
};
