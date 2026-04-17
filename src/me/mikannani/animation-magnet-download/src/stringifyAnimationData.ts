import { IAnimationInfo } from './main.ts';

/**
 * 将动漫数据字符串化
 */
export const stringifyAnimationData = (
    animationInfoList: IAnimationInfo[],
) => {
    const groupByAnimationInfo = Object.groupBy(
        animationInfoList,
        (animationInfo) => {
            return `${animationInfo.language}-${animationInfo.quality}-${animationInfo.format}`;
        },
    );

    return Object.entries(groupByAnimationInfo)
        .map(([title, infoList]) => {
            return `
## ${title}

| 番剧名 | 大小 | 更新时间 | 下载链接 |
| ----- | ---- | ------ | ------- |
${infoList.map((info) => `| \`${info.fileName}\` | ${info.fileSize} | ${info.updateTime} | [#](${info.magnetLink}) |`).join('\n')}

**磁力链接列表**

\`\`\`plain
${infoList.map((info) => info.magnetLink).join('\n')}
\`\`\`
`;
        })
        .join('\n\n---\n\n');
};
