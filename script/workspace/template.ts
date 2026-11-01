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
export const recommendedScriptKeys = ['match', 'author', 'namespace'];

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
