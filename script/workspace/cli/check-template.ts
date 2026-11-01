import { checkTemplate } from '../check-template';
import { templateDir } from '../template';

const result = checkTemplate(templateDir, {
    allowPlaceholders: true,
});

for (const warning of result.warnings) {
    console.warn('警告：' + warning);
}
for (const error of result.errors) {
    console.error('错误：' + error);
}

if (result.errors.length > 0) {
    console.error(
        '模板体检失败：' + result.errors.length + ' 个错误。',
    );
    process.exit(1);
}

console.log('模板体检通过。');
