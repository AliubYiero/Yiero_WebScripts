const brace = String.fromCharCode(123);
const close = String.fromCharCode(125);

/** 生成模板占位符，形如 {{name}}。 */
export function token(name: string): string {
    return brace + brace + name + close + close;
}
