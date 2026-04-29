import { ScriptCatUserConfig } from '../types/UserConfig';

export const UserConfig: ScriptCatUserConfig = {
    配置项: {
        isJumpTime: {
            title: '点击时间轴跳转视频',
            description:
                '点击某一个时间段后, 会将视频跳转到对应的时间',
            type: 'select',
            values: [
                '点击任意区域跳转',
                '只点击时间区域跳转',
                '只点击文本区域跳转',
                '不跳转',
            ],
            default: '点击任意区域跳转',
        },
        alwaysLoad: {
            title: '自动加载时间轴',
            description: '页面载入时, 自动加载时间轴到页面中',
            type: 'checkbox',
            default: false,
        },
        showEndTime: {
            title: '显示时间轴结束时间',
            description: '显示时间轴结束时间',
            type: 'checkbox',
            default: false,
        },
        showInWebScreen: {
            title: '网页全屏显示时间轴',
            description: '网页全屏显示将时间轴',
            type: 'checkbox',
            default: false,
        },
        lockHighlightPercent: {
            title: '高亮时间轴锁定位置 (百分比)',
            description: '高亮时间轴锁定位置',
            type: 'number',
            default: 30,
            min: 0,
            max: 100,
        },
        copyTime: {
            title: '自动复制时间',
            description: '点击时间的时候, 自动复制时间到粘贴板',
            type: 'checkbox',
            default: false,
        },
        copyContent: {
            title: '自动复制文本',
            description: '点击文本的时候, 自动复制文本到粘贴板',
            type: 'checkbox',
            default: false,
        },
        disableSelect: {
            title: '禁止选中文本',
            description:
                '如果勾选 [自动复制时间/文本], 对应内容将变为不可拖动选中状态. ',
            type: 'checkbox',
            default: false,
        },
    },
    网页样式: {
        showTitle: {
            title: '显示字幕标题',
            description: '显示字幕标题',
            type: 'checkbox',
            default: true,
        },
        showSubtitleId: {
            title: '显示子标题',
            description: '视频的 av 号和 bv 号',
            type: 'checkbox',
            default: true,
        },
        showSubtitleButton: {
            title: '显示容器按钮',
            description: '"时间轴锁定" 和 "跳过空白"',
            type: 'checkbox',
            default: true,
        },
        timeFontSize: {
            title: '时间字体大小 (px)',
            description: '',
            type: 'number',
            default: 12,
            min: 0,
        },
        showTimeIcon: {
            title: '在时间前面显示图标',
            description:
                '在时间前面显示图标, 便于辨认时间是开始时间还是结束时间',
            type: 'checkbox',
            default: true,
        },
        contentFontSize: {
            title: '文本内容字体大小 (px)',
            description: '',
            type: 'number',
            default: 14,
            min: 0,
        },
        activeContentFontSize: {
            title: '高亮文本内容字体大小 (px)',
            description: '',
            type: 'number',
            default: 16,
            min: 0,
        },
        normalContainerWidth: {
            title: '常规模式下的时间轴容器宽度 (px)',
            description: '',
            type: 'number',
            default: 411,
            min: 0,
        },
        normalContainerHeightPercent: {
            title: '常规模式下的时间轴容器高度 (页面高度的百分比)',
            description: '',
            type: 'number',
            default: 70,
            min: 0,
            max: 100,
        },
        webScreenContainerWidth: {
            title: '网页全屏模式下的时间轴容器宽度 (px)',
            description: '',
            type: 'number',
            default: 411,
            min: 0,
        },
    },
};
