/** 单个脚本项目的描述信息，由扫描脚本生成。 */
export interface ScriptDetail {
    name: string; // 脚本名称
    description: string; // 脚本描述
    version: string; // 最新版本号
    private: boolean; // 是否私有
    archive: boolean; // 是否归档
    lastUpdate: number; // 最后的更新时间
    scriptType: 'web' | 'background' | 'crontab'; // 脚本类型
    userScriptFilepath: string; // 用户脚本路径
    downloadUrlFromGithub: string; // Github 安装源
    downloadUrlFromScripCat: string; // ScriptCat 安装源
    downloadUrlFromGreasyFork: string; // GreasyFork 安装源
    autoUpdate: boolean; // 是否启用自动更新
    getLastUpdateWay: 'git' | 'file'; // 获取最后的更新时间的方式
}

// Record<脚本域名 (二级域名.顶级域名), Record<脚本项目名称, ScriptDetail>>
export type ScriptInfo = Record<string, Record<string, ScriptDetail>>;
