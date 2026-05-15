import { ScriptCatUserConfig } from '../types/UserConfig';

export const UserConfig: ScriptCatUserConfig = {
    点赞设置: {
        likeClickDelayMinRange: {
            title: '点赞随机时间延迟 (ms) , 最小随机时间 (无法少于500ms)',
            description: '点赞延迟 (ms)',
            type: 'number',
            default: 2000,
            min: 500,
        },
        likeClickDelayMaxRange: {
            title: '点赞随机时间延迟 (ms) , 最大随机时间',
            description: '点赞延迟 (ms)',
            type: 'number',
            default: 5000,
            min: 500,
        },
        onlyLikeFollow: {
            title: '仅点赞关注用户',
            description: '仅点赞关注用户',
            type: 'checkbox',
            default: true,
        },
        maxLikeNumber: {
            title: '每个主播每天点赞的最大数量',
            description: '点赞数量',
            type: 'number',
            min: 0,
            max: 1100,
            default: 330,
        },
    },
    样式设置: {
        showLikeAnimation: {
            title: '是否显示点赞动画',
            description: '显示点赞后的动画效果',
            type: 'checkbox',
            default: false,
        },
        showLikeCountText: {
            title: '是否显示点赞数量',
            description: '显示点赞数量',
            type: 'checkbox',
            default: true,
        },
    },
};
