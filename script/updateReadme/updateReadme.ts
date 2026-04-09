/**
 * updateReadme.ts
 * 自动扫描脚本项目，更新 script.json 并生成 README 文件
 * created by 2026/4/2
 * */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createReadmeContent } from './createReadmeContent.ts';


export interface ScriptDetail {
	name: string;      // 脚本名称
	description: string;   // 脚本描述
	version: string;    // 最新版本号
	private: boolean;    // 是否私有
	archive: boolean;    // 是否归档
	lastUpdate: number; // 最后的更新时间
	scriptType: 'web' | 'background' | 'crontab';  // 脚本类型
	userScriptFilepath: string;     // 用户脚本路径
	downloadUrlFromGithub: string;   // Github 安装源
	downloadUrlFromScripCat: string;   // ScriptCat 安装源
	downloadUrlFromGreasyFork: string;   // GreasyFork 安装源
	autoUpdate: boolean;        // 是否启用自动更新
	getLastUpdateWay: 'git' | 'file';  // 获取最后的更新时间的方式
}

// Record<脚本域名 (二级域名.顶级域名), Record<脚本项目名称, ScriptDetail>>
export type ScriptInfo = Record<string, Record<string, ScriptDetail>>


/**
 * 获取文件的最后更新时间
 * @param filePath 文件绝对路径
 * @param getLastUpdateWay 获取更新时间的方式：'git' 优先使用 git log 获取提交时间，失败则回退到文件修改时间；'file' 直接使用文件修改时间
 * @returns 毫秒级时间戳
 */
function getLastUpdateTime(filePath: string, getLastUpdateWay: 'git' | 'file' = 'git'): number {
	// 如果指定使用文件修改时间，直接返回
	if (getLastUpdateWay === 'file') {
		return fs.statSync(filePath).mtimeMs;
	}

	// git 方式：优先使用 git log 获取提交时间（秒级时间戳），失败则回退到文件修改时间
	try {
		const result = spawnSync('git', [
			'log', '-1',
			'--format=%at',
			filePath
		], {
			encoding: 'utf-8',
			timeout: 5000
		});

		const output = result.stdout?.trim();

		if (output && !isNaN(Number(output))) {
			// git 返回秒级时间戳，转换为毫秒
			return Number(output) * 1000;
		}
	} catch {
		// git 命令失败，静默处理
	}

	// 降级：使用文件修改时间
	return fs.statSync(filePath).mtimeMs;
}


/**
 * 脚本文件系统类
 * 负责扫描脚本目录、读取脚本元数据、保存到 script.json
 */
class ScriptFileSystem {
	private readonly srcPath: string;
	private readonly scriptJsonPath: string;

	constructor() {
		this.srcPath = path.join(__dirname, '..', '..', 'src');
		this.scriptJsonPath = path.join(__dirname, 'script.json');
	}

	/**
	 * 读取所有脚本信息
	 * @param existingScriptInfo - 已存在的脚本信息（用于获取 userScriptFilepath 等配置）
	 */
	read(existingScriptInfo?: ScriptInfo): ScriptInfo {
		const scriptInfo: ScriptInfo = {};

		// 1. 读取 .Global 文件夹下的脚本
		this.readGlobalScripts(scriptInfo, existingScriptInfo);

		// 2. 读取顶级域名下的脚本
		this.readTopLevelDomainScripts(scriptInfo, existingScriptInfo);

		return scriptInfo;
	}

	/**
	 * 读取 .Global 文件夹下的脚本
	 */
	private readGlobalScripts(scriptInfo: ScriptInfo, existingScriptInfo?: ScriptInfo): void {
		const globalPath = path.join(this.srcPath, '.Global');
		
		if (!fs.existsSync(globalPath)) {
			return;
		}

		const domain = 'global';
		scriptInfo[domain] = {};

		const entries = fs.readdirSync(globalPath, { withFileTypes: true });
		for (const entry of entries) {
			if (entry.isDirectory()) {
				const scriptProjectName = entry.name;
				const existingDetail = existingScriptInfo?.[domain]?.[scriptProjectName];
				const scriptDetail = this.readScriptDetail(globalPath, scriptProjectName, existingDetail);
				if (scriptDetail) {
					scriptInfo[domain][scriptProjectName] = scriptDetail;
				}
			}
		}

		// 如果没有任何脚本，删除该域名
		if (Object.keys(scriptInfo[domain]).length === 0) {
			delete scriptInfo[domain];
		}
	}

	/**
	 * 读取顶级域名下的脚本
	 */
	private readTopLevelDomainScripts(scriptInfo: ScriptInfo, existingScriptInfo?: ScriptInfo): void {
		if (!fs.existsSync(this.srcPath)) {
			return;
		}

		const entries = fs.readdirSync(this.srcPath, { withFileTypes: true });
		
		for (const entry of entries) {
			// 跳过以 . 开头的目录和 .Global 目录
			if (!entry.isDirectory() || entry.name.startsWith('.') || entry.name === '.Global') {
				continue;
			}

			const topLevelDomain = entry.name;
			const topLevelPath = path.join(this.srcPath, topLevelDomain);

			this.readSecondLevelDomainScripts(scriptInfo, topLevelPath, topLevelDomain, existingScriptInfo);
		}
	}

	/**
	 * 读取二级域名下的脚本
	 */
	private readSecondLevelDomainScripts(
		scriptInfo: ScriptInfo,
		topLevelPath: string,
		topLevelDomain: string,
		existingScriptInfo?: ScriptInfo
	): void {
		if (!fs.existsSync(topLevelPath)) {
			return;
		}

		const entries = fs.readdirSync(topLevelPath, { withFileTypes: true });

		for (const entry of entries) {
			// 跳过以 . 开头的目录
			if (!entry.isDirectory() || entry.name.startsWith('.')) {
				continue;
			}

			const secondLevelDomain = entry.name;
			const secondLevelPath = path.join(topLevelPath, secondLevelDomain);
			const domain = `${secondLevelDomain}.${topLevelDomain}`;

			if (!scriptInfo[domain]) {
				scriptInfo[domain] = {};
			}

			// 读取二级域名下的所有脚本项目
			const scriptEntries = fs.readdirSync(secondLevelPath, { withFileTypes: true });
			for (const scriptEntry of scriptEntries) {
				if (scriptEntry.isDirectory()) {
					const scriptProjectName = scriptEntry.name;
					const existingDetail = existingScriptInfo?.[domain]?.[scriptProjectName];
					const scriptDetail = this.readScriptDetail(secondLevelPath, scriptProjectName, existingDetail);
					if (scriptDetail) {
						scriptInfo[domain][scriptProjectName] = scriptDetail;
					}
				}
			}

			// 如果该域名下没有任何脚本，删除该域名
			if (Object.keys(scriptInfo[domain]).length === 0) {
				delete scriptInfo[domain];
			}
		}
	}

	/**
	 * 读取单个脚本的详细信息
	 * @param parentPath - 父目录路径
	 * @param scriptProjectName - 脚本项目名称
	 * @param existingDetail - 已存在的脚本详情（用于获取 userScriptFilepath）
	 */
	private readScriptDetail(
		parentPath: string,
		scriptProjectName: string,
		existingDetail?: ScriptDetail
	): ScriptDetail | null {
		const scriptPath = path.join(parentPath, scriptProjectName);

		// 确定用户脚本路径：优先使用已有的 userScriptFilepath，否则使用默认路径
		const userScriptFilepath = existingDetail?.userScriptFilepath || `backup/${scriptProjectName}.user.js`;
		const userJsPath = path.join(scriptPath, userScriptFilepath);

		// 如果脚本文件不存在，创建空对象让用户填写
		if (!fs.existsSync(userJsPath)) {
			console.warn(`[警告] 未找到脚本文件: ${userJsPath}，将创建空对象`);
			return {
				name: '',
				description: '',
				version: '0.0.0',
				private: existingDetail?.private ?? false,
				archive: existingDetail?.archive ?? false,
				lastUpdate: Date.now(),
				scriptType: 'web',
				userScriptFilepath: userScriptFilepath,
				downloadUrlFromGithub: existingDetail?.downloadUrlFromGithub || '',
				downloadUrlFromScripCat: existingDetail?.downloadUrlFromScripCat ?? '',
				downloadUrlFromGreasyFork: existingDetail?.downloadUrlFromGreasyFork ?? '',
				autoUpdate: existingDetail?.autoUpdate ?? true,
				getLastUpdateWay: existingDetail?.getLastUpdateWay ?? 'git',
			};
		}

		try {
			const metadata = this.parseUserScriptMetadata(userJsPath);
			const getLastUpdateWay = existingDetail?.getLastUpdateWay ?? 'git';

			return {
				name: metadata.name,
				description: metadata.description,
				version: metadata.version,
				private: existingDetail?.private ?? false,
				archive: existingDetail?.archive ?? false,
				lastUpdate: getLastUpdateTime(userJsPath, getLastUpdateWay),
				scriptType: metadata.scriptType,
				userScriptFilepath: userScriptFilepath,
				downloadUrlFromGithub: existingDetail?.downloadUrlFromGithub || '',
				downloadUrlFromScripCat: existingDetail?.downloadUrlFromScripCat ?? '',
				downloadUrlFromGreasyFork: existingDetail?.downloadUrlFromGreasyFork ?? '',
				autoUpdate: existingDetail?.autoUpdate ?? true,
				getLastUpdateWay: getLastUpdateWay,
			};
		} catch (error) {
			console.error(`[错误] 读取脚本失败 ${userJsPath}:`, error);
			return null;
		}
	}

	/**
	 * 解析用户脚本元数据
	 * 使用 fs.createReadStream 以 1KB 分块读取
	 */
	private parseUserScriptMetadata(userJsPath: string): {
		name: string;
		description: string;
		version: string;
		scriptType: 'web' | 'background' | 'crontab';
	} {
		const CHUNK_SIZE = 1024; // 1KB
		const buffer = Buffer.alloc(CHUNK_SIZE);
		const fd = fs.openSync(userJsPath, 'r');
		
		let content = '';
		let bytesRead = 0;
		let totalRead = 0;

		try {
			// 读取文件内容，直到找到 ==/UserScript== 或文件结束
			while ((bytesRead = fs.readSync(fd, buffer, 0, CHUNK_SIZE, totalRead)) > 0) {
				content += buffer.toString('utf8', 0, bytesRead);
				totalRead += bytesRead;

				// 如果已经读取到 ==/UserScript==，停止读取
				if (content.includes('==/UserScript==')) {
					break;
				}
			}
		} finally {
			fs.closeSync(fd);
		}

		// 提取元数据
		const nameMatch = content.match(/@name\s+(.+)/);
		const descriptionMatch = content.match(/@description\s+(.+)/);
		const versionMatch = content.match(/@version\s+(.+)/);

		// 提取 ==/UserScript== 之前的部分来判断脚本类型
		const userScriptEndIndex = content.indexOf('==/UserScript==');
		const metadataSection = userScriptEndIndex !== -1
			? content.substring(0, userScriptEndIndex)
			: content;

		let scriptType: 'web' | 'background' | 'crontab' = 'web';
		if (/@background\b/.test(metadataSection)) {
			scriptType = 'background';
		} else if (/@crontab\b/.test(metadataSection)) {
			scriptType = 'crontab';
		}

		return {
			name: nameMatch ? nameMatch[1].trim() : 'Unknown',
			description: descriptionMatch ? descriptionMatch[1].trim() : '',
			version: versionMatch ? versionMatch[1].trim() : '0.0.0',
			scriptType,
		};
	}

	/**
	 * 将脚本信息写入 script.json
	 * 合并策略：保留已有脚本的 private、achieve、userScriptFilepath、downloadUrlFromScripCat、downloadUrlFromGreasyFork
	 */
	write(scriptInfo: ScriptInfo): void {
		// 读取现有的 script.json
		let existingScriptInfo: ScriptInfo = {};
		if (fs.existsSync(this.scriptJsonPath)) {
			try {
				const content = fs.readFileSync(this.scriptJsonPath, 'utf8');
				existingScriptInfo = JSON.parse(content);
			} catch (error) {
				console.warn('[警告] 读取现有 script.json 失败，将创建新文件:', error);
			}
		}

		// 合并数据
		const mergedScriptInfo: ScriptInfo = {};

		for (const domain in scriptInfo) {
			mergedScriptInfo[domain] = {};

			for (const scriptProjectName in scriptInfo[domain]) {
				const newDetail = scriptInfo[domain][scriptProjectName];
				const existingDetail = existingScriptInfo[domain]?.[scriptProjectName];

				// 确定 userScriptFilepath：优先保留已有的，否则使用新的
				const userScriptFilepath = existingDetail?.userScriptFilepath || newDetail.userScriptFilepath;

				if (existingDetail) {
					// 检查 autoUpdate 标志
					if (existingDetail.autoUpdate === false) {
						// autoUpdate 为 false，完全保留旧数据，不更新
						mergedScriptInfo[domain][scriptProjectName] = existingDetail;
					} else {
						// autoUpdate 为 true 或未设置，执行正常更新
						// 已有脚本：保留 private、archive、autoUpdate、userScriptFilepath、downloadUrlFromScripCat、downloadUrlFromGreasyFork、getLastUpdateWay
						mergedScriptInfo[domain][scriptProjectName] = {
							...newDetail,
							private: existingDetail.private ?? false,
							archive: existingDetail.archive ?? false,
							autoUpdate: existingDetail.autoUpdate ?? true,
							userScriptFilepath: userScriptFilepath,
							downloadUrlFromScripCat: existingDetail.downloadUrlFromScripCat ?? '',
							downloadUrlFromGreasyFork: existingDetail.downloadUrlFromGreasyFork ?? '',
							downloadUrlFromGithub: existingDetail.downloadUrlFromGithub || this.generateGithubUrl(domain, scriptProjectName, userScriptFilepath),
							getLastUpdateWay: existingDetail.getLastUpdateWay ?? 'git',
						};
					}
				} else {
					// 新脚本：设置默认值
					mergedScriptInfo[domain][scriptProjectName] = {
						...newDetail,
						private: false,
						archive: false,
						autoUpdate: true,
						userScriptFilepath: userScriptFilepath,
						downloadUrlFromScripCat: '',
						downloadUrlFromGreasyFork: '',
						downloadUrlFromGithub: this.generateGithubUrl(domain, scriptProjectName, userScriptFilepath),
						getLastUpdateWay: 'git',
					};
				}
			}
		}

		// 直接写入文件
		fs.writeFileSync(this.scriptJsonPath, JSON.stringify(mergedScriptInfo, null, '\t'), 'utf8');
		console.log(`[成功] 已更新 script.json`);
	}

	/**
	 * 生成 GitHub 下载链接
	 * @param domain - 脚本域名
	 * @param scriptProjectName - 脚本项目名称
	 * @param userScriptFilepath - 用户脚本文件路径（相对于脚本项目根目录）
	 */
	private generateGithubUrl(domain: string, scriptProjectName: string, userScriptFilepath: string): string {
		let relativePath: string;

		if (domain === 'global') {
			relativePath = `.Global/${scriptProjectName}`;
		} else {
			// 将 domain (如 bilibili.com) 转换为路径 (com/bilibili)
			const parts = domain.split('.');
			if (parts.length === 2) {
				relativePath = `${parts[1]}/${parts[0]}/${scriptProjectName}`;
			} else {
				relativePath = `${domain}/${scriptProjectName}`;
			}
		}

		return `https://github.com/AliubYiero/Yiero_WebScripts/raw/refs/heads/main/src/${relativePath}/${userScriptFilepath}`;
	}
}


/**
 * README 文件系统类
 * 负责生成 README 文件
 */
class ReadmeFileSystem {
	/**
	 * 写入 README 文件
	 */
	static write(scriptInfo: ScriptInfo, isPrivate: boolean): void {
		const readmeFilepath = isPrivate
			? path.join(__dirname, '..', '..', 'docs', 'README.md')
			: path.join(__dirname, '..', '..', 'README.md');

		// 筛选对应权限的脚本
		const filteredScriptInfo = this.filterScriptsByPrivacy(scriptInfo, isPrivate);

		const readmeContent = createReadmeContent(filteredScriptInfo, isPrivate);
		fs.writeFileSync(readmeFilepath, readmeContent, 'utf8');
		console.log(`[成功] 已生成 ${isPrivate ? '私有' : '公有'} README: ${readmeFilepath}`);
	}

	/**
	 * 根据 private 字段筛选脚本
	 */
	private static filterScriptsByPrivacy(
		scriptInfo: ScriptInfo,
		isPrivate: boolean
	): ScriptInfo {
		const filtered: ScriptInfo = {};

		for (const domain in scriptInfo) {
			const filteredScripts: Record<string, ScriptDetail> = {};

			for (const scriptProjectName in scriptInfo[domain]) {
				const script = scriptInfo[domain][scriptProjectName];
				if (script.private === isPrivate) {
					filteredScripts[scriptProjectName] = script;
				}
			}

			if (Object.keys(filteredScripts).length > 0) {
				filtered[domain] = filteredScripts;
			}
		}

		return filtered;
	}
}


/**
 * 主函数
 */
function main(): void {
	console.log('='.repeat(50));
	console.log('开始更新脚本信息...');
	console.log('='.repeat(50));

	const scriptFileSystem = new ScriptFileSystem();

	// 0. 读取现有的 script.json（用于获取 userScriptFilepath 等配置）
	const scriptJsonPath = path.join(__dirname, 'script.json');
	let existingScriptInfo: ScriptInfo = {};
	if (fs.existsSync(scriptJsonPath)) {
		try {
			const content = fs.readFileSync(scriptJsonPath, 'utf8');
			existingScriptInfo = JSON.parse(content);
			console.log('[信息] 已读取现有 script.json 配置');
		} catch (error) {
			console.warn('[警告] 读取现有 script.json 失败:', error);
		}
	}

	// 1. 读取所有脚本信息
	console.log('\n[步骤 1/3] 扫描脚本目录...');
	const scriptInfo = scriptFileSystem.read(existingScriptInfo);

	// 统计脚本数量
	let totalScripts = 0;
	for (const domain in scriptInfo) {
		totalScripts += Object.keys(scriptInfo[domain]).length;
	}
	console.log(`发现 ${totalScripts} 个脚本，分布在 ${Object.keys(scriptInfo).length} 个域名下`);

	// 2. 写入 script.json
	console.log('\n[步骤 2/3] 更新 script.json...');
	scriptFileSystem.write(scriptInfo);

	// 3. 生成 README 文件
	console.log('\n[步骤 3/3] 生成 README 文件...');

	// 重新读取 script.json 以获取完整数据（包含合并后的配置）
	const finalScriptInfo: ScriptInfo = JSON.parse(
		fs.readFileSync(scriptJsonPath, 'utf8')
	);

	ReadmeFileSystem.write(finalScriptInfo, false); // 公有脚本
	ReadmeFileSystem.write(finalScriptInfo, true);  // 私有脚本

	console.log('\n' + '='.repeat(50));
	console.log('更新完成！');
	console.log('='.repeat(50));
}

// 执行主函数
main();
