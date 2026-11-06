/**
 * 安装环境
 */
export type IEnvironment = 'ScriptCat' | 'Tampermonkey';

/**
 * 输出脚本安装环境
 *
 * @warn 需要授权函数 `GM_info`
 */
export const environmentTest = (): IEnvironment => {
    return GM_info.scriptHandler as IEnvironment;
};
