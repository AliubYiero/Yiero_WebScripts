/**
 * 下载请求配置类型
 *
 * 基于 GM_download API 的配置参数，提供进度监控和错误处理回调
 */
export type DownloadRequest = Omit<
    GMTypes.DownloadDetails<string | Blob | File>,
    'url' | 'name' | 'onerror' | 'onprogress'
> & {
    /** 下载失败时的回调函数 */
    onerror?: (error: GMTypes.DownloadError) => void;
    /** 下载进度变化的回调函数 */
    onprogress?: (
        response: {
            done: number;
            lengthComputable: boolean;
            loaded: number;
            position?: number;
            total: number;
            totalSize: number;
        },
        abortHandle: GMTypes.AbortHandle<boolean>,
    ) => void;
};

/**
 * 下载 URL 指向的文件
 *
 * 封装 GM_download API，提供 Promise 化的文件下载能力，
 * 支持进度监控、错误处理和超时控制。
 *
 * @param url 文件下载地址
 * @param filename 保存的文件名
 * @param details 下载配置项（可选）
 * @returns Promise<boolean> 下载成功时解析为 true
 *
 * @warn 需要授权函数 `GM_download`
 *
 * @example
 * ```ts
 * // 基本下载
 * await gmDownload('https://example.com/image.png', 'image.png');
 *
 * // 带进度监控的下载
 * await gmDownload('https://example.com/file.zip', 'file.zip', {
 *   onprogress: (progress, abort) => {
 *     console.log(`进度: ${progress.loaded}/${progress.total}`);
 *   }
 * });
 * ```
 */
const gmDownload = (
    url: string,
    filename: string,
    details: DownloadRequest = {},
): Promise<boolean> => {
    return new Promise((resolve, reject) => {
        const abortHandle = GM_download({
            url: url,
            name: filename,
            ...details,
            onload(event) {
                details.onload?.(event);
                resolve(true);
            },
            onerror(err) {
                details.onerror?.(err);
                reject(err.error);
            },
            ontimeout() {
                details.ontimeout?.();
                reject('time_out');
            },
            onprogress(response) {
                details.onprogress?.(response, abortHandle);
            },
        });
    });
};

/**
 * 下载 Blob 或 File 对象
 *
 * 将 Blob/File 对象转换为临时 URL 后进行下载，
 * 下载完成后自动释放临时 URL。
 *
 * @param blob 要下载的二进制对象（Blob 或 File）
 * @param filename 保存的文件名
 * @param details 下载配置项（可选）
 * @returns Promise<boolean> 下载成功时解析为 true
 *
 * @example
 * ```ts
 * // 下载 Canvas 内容
 * const canvas = document.querySelector('canvas');
 * canvas.toBlob(blob => {
 *   if (blob) {
 *     gmDownload.blob(blob, 'canvas-image.png');
 *   }
 * });
 * ```
 */
gmDownload.blob = async (
    blob: Blob | File,
    filename: string,
    details: DownloadRequest = {},
): Promise<boolean> => {
    const url = URL.createObjectURL(blob);
    return gmDownload(url, filename, details).then((res) => {
        URL.revokeObjectURL(url);
        return res;
    });
};

/**
 * 下载文本内容为文件
 *
 * 将文本内容转换为 Blob 后进行下载，
 * 支持自定义 MIME 类型。
 *
 * @param content 要下载的文本内容
 * @param filename 保存的文件名
 * @param mimeType 文件的 MIME 类型，默认为 'text/plain'
 * @param details 下载配置项（可选）
 * @returns Promise<boolean> 下载成功时解析为 true
 *
 * @example
 * ```ts
 * // 下载 JSON 数据
 * const data = { name: 'John', age: 30 };
 * await gmDownload.text(
 *   JSON.stringify(data, null, 2),
 *   'data.json',
 *   'application/json'
 * );
 *
 * // 下载 CSV 数据
 * await gmDownload.text('Name,Age\nJohn,30', 'data.csv', 'text/csv');
 * ```
 */
gmDownload.text = (
    content: string,
    filename: string,
    mimeType: string = 'text/plain',
    details: DownloadRequest = {},
): Promise<boolean> => {
    const blob = new Blob([content], { type: mimeType });
    return gmDownload.blob(blob, filename, details);
};

export { gmDownload };
