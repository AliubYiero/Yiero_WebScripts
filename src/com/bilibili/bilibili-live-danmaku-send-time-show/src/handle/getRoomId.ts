/**
 * 获取直播间号
 */
export const getRoomId = (): string | undefined => {
    const [roomId] =
        window.location.pathname.match(/(?<=\/)\d+/) || [];
    return roomId;
};
