import { join } from 'node:path';
import { repoRoot } from './workspace';

/** 仓库内模板目录：模板是「源」，不是 workspace 包。 */
export const templateDir = join(repoRoot, 'templates', 'ts-template');

export const requiredFiles = [
    '.gitignore',
    'README.md',
    'package.json',
    'tsconfig.json',
    'vite.config.ts',
    'vite.config.utils.ts',
    'banner/UserConfig.ts',
    'banner/UserScript.ts',
    'src/main.ts',
    'types/UserConfig.d.ts',
    'types/UserScript.d.ts',
    'types/scriptcat.d.ts',
];

/** 模板里不该出现的东西：复制时也用它过滤。 */
export const forbiddenEntries = [
    'pnpm-lock.yaml',
    'node_modules',
    'dist',
    '.idea',
];

/** 模板必须携带的脚本元数据键：部署前必须被替换成真实值。 */
export const requiredScriptKeys = ['name', 'description', 'version'];

/** 建议填写、但不阻塞模板本身的键。 */
export const recommendedScriptKeys = [
    'license',
    'author',
    'namespace',
];

/**
 * 脚本运行方式：三者互斥，且至少要有一个非空值。
 * 与 meta-banner 插件的 MUTUALLY_EXCLUSIVE_KEYS 保持一致。
 */
export const exclusiveScriptKeys = ['match', 'background', 'crontab'];

/**
 * 模板运行期依赖的标准值。
 *
 * 与 devDependencies 分开看守：`dependencies` 里的库会被
 * 复制进每个新项目，漂移比工具链更难被发现。
 *
 * 库域（`src/.Libs`）内的自产库一律用 `workspace:*` 引用：
 * 版本由库自己的 package.json 唯一决定，模板里不再写 semver 范围，
 * 否则新项目一落地就指向 registry 上的旧版本。
 */
export const standardDependencies: Record<string, string> = {
    '@yiero/gmlib': 'workspace:*',
    radash: '^12.1.1',
};

/**
 * 子仓库委托命令：模板里必须原样带上。
 *
 * 它们只是转发到仓库根执行，命令本身在 `script/` 下，
 * 模板里不新增任何脚本文件。
 */
export const standardScripts: Record<string, string> = {
    commit: 'pnpm -w run commit',
    'release:tag': 'pnpm -w run release:tag',
    push: 'pnpm -w run push',
};

/** 模板依赖族的标准值：模板与它漂移即视为腐烂。 */
export const standardDevDependencies: Record<string, string> = {
    '@rollup/plugin-replace': '^6.0.2',
    '@types/node': '^22.10.2',
    '@types/yamljs': '^0.2.34',
    '@vitest/coverage-v8': '^2.1.8',
    '@yiero/vite-plugin-scriptcat-auto-icon': '^1.0.0',
    '@yiero/vite-plugin-scriptcat-backup': '^1.1.0',
    '@yiero/vite-plugin-scriptcat-extract-grant': '^1.0.4',
    '@yiero/vite-plugin-scriptcat-meta-banner': '^1.1.2',
    '@yiero/vite-plugin-scriptcat-require-self': '^1.0.4',
    '@yiero/vite-plugin-scriptcat-script-push': '^1.1.1',
    jsdom: '^24.0.0',
    rollup: '4.59.0',
    terser: '^5.37.0',
    vite: '^7.3.2',
    'vite-plugin-raw': '^1.0.3',
    vitest: '^2.1.8',
    yamljs: '^0.3.0',
};
