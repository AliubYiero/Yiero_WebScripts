// 占位符是双花括号；用码点拼出，避免本文件里的字面量被驼峰/注释规则误伤。
const openBrace = String.fromCharCode(123);
const closeBrace = String.fromCharCode(125);
const doubled = openBrace + openBrace;

/** 生成模板占位符，形如 {{name}}。 */
export function token(name: string): string {
    return doubled + name + closeBrace + closeBrace;
}
