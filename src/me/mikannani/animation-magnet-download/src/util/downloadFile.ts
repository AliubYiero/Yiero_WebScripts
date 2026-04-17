/**
 * 将文本内容下载为文件
 */
export const downloadTextFile = (
    fileName: string,
    fileContent: string,
    mimeType: string = 'plain/text',
) => {
    const textBlob = new Blob([fileContent], { type: mimeType });
    const textUrl = URL.createObjectURL(textBlob);
    GM_download({
        url: textUrl,
        name: fileName,
        onload() {
            URL.revokeObjectURL(textUrl);
        },
    });
};
