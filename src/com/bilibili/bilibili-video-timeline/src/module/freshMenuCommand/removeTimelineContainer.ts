/**
 * 删除加入到页面中的时间线容器
 */
export const removeTimelineContainer = () => {
    const timelineContainerList =
        document.querySelectorAll<HTMLElement>('.timeline-container');
    timelineContainerList.forEach((timelineContainer) =>
        timelineContainer.remove(),
    );
};
