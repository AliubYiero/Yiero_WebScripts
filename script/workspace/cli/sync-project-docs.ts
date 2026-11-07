import { parseArgs } from '../args';
import { syncProjectDocs } from '../project-docs';

const usage = '用法：pnpm sync:project-docs [--check]';
const { flags, positionals, errors } = parseArgs(
    process.argv.slice(2),
    [],
    ['--check'],
);

if (errors.length > 0 || positionals.length > 0) {
    for (const error of errors) {
        console.error(`错误：${error}`);
    }
    if (positionals.length > 0) {
        console.error(`多余参数：${positionals.join(' ')}`);
    }
    console.error(usage);
    process.exit(2);
}

const check = flags.has('--check');
const result = syncProjectDocs({ check });

if (check) {
    for (const relDir of result.drifted) {
        console.log(`项目文档漂移：${relDir}`);
    }
    if (result.drifted.length > 0) {
        process.exit(1);
    }
    console.log('项目文档检查通过。');
} else {
    for (const relDir of result.written) {
        console.log(`已同步：${relDir}`);
    }
    console.log(`已同步 ${result.written.length} 个项目`);
}
