import { afterEach, beforeEach, describe, expect, it } from '@rstest/core';
import { extractDOMInfo } from '../../src/DOM/extractDOMInfo';

describe('extractDOMInfo', () => {
    let container: HTMLDivElement;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
    });

    afterEach(() => {
        document.body.removeChild(container);
    });

    describe('基础文本提取', () => {
        it('应提取元素的 textContent', () => {
            container.innerHTML = '<span id="test">Hello World</span>';

            const result = extractDOMInfo('#test', { key: 'text' });

            expect(result).toEqual({ text: 'Hello World' });
        });

        it('应自动 trim 文本内容', () => {
            container.innerHTML = '<span id="test">  Hello World  </span>';

            const result = extractDOMInfo('#test', { key: 'text' });

            expect(result).toEqual({ text: 'Hello World' });
        });
    });

    describe('元素不存在处理', () => {
        it('元素不存在时应返回 null', () => {
            const result = extractDOMInfo('#non-existent', { key: 'text' });

            expect(result).toEqual({ text: null });
        });

        it('元素不存在时应返回 defaultValue', () => {
            const result = extractDOMInfo('#non-existent', {
                key: 'text',
                defaultValue: '默认值',
            });

            expect(result).toEqual({ text: '默认值' });
        });
    });

    describe('type: number', () => {
        it('应将文本转换为数字', () => {
            container.innerHTML = '<span id="test">42</span>';

            const result = extractDOMInfo('#test', {
                key: 'count',
                type: 'number',
            });

            expect(result).toEqual({ count: 42 });
        });

        it('空字符串应返回 null', () => {
            container.innerHTML = '<span id="test"></span>';

            const result = extractDOMInfo('#test', {
                key: 'count',
                type: 'number',
            });

            expect(result).toEqual({ count: null });
        });

        it('非数字应返回 null', () => {
            container.innerHTML = '<span id="test">abc</span>';

            const result = extractDOMInfo('#test', {
                key: 'count',
                type: 'number',
            });

            expect(result).toEqual({ count: null });
        });

        it('非数字时应返回 defaultValue', () => {
            container.innerHTML = '<span id="test">abc</span>';

            const result = extractDOMInfo('#test', {
                key: 'count',
                type: 'number',
                defaultValue: 0,
            });

            expect(result).toEqual({ count: 0 });
        });
    });

    describe('type: boolean', () => {
        it('"true" 字符串应返回 true', () => {
            container.innerHTML = '<span id="test">true</span>';

            const result = extractDOMInfo('#test', {
                key: 'flag',
                type: 'boolean',
            });

            expect(result).toEqual({ flag: true });
        });

        it('"false" 字符串应返回 false', () => {
            container.innerHTML = '<span id="test">false</span>';

            const result = extractDOMInfo('#test', {
                key: 'flag',
                type: 'boolean',
            });

            expect(result).toEqual({ flag: false });
        });

        it('checkbox 应返回 checked 状态', () => {
            container.innerHTML = '<input type="checkbox" id="test" checked>';

            const result = extractDOMInfo('#test', {
                key: 'flag',
                type: 'boolean',
            });

            expect(result).toEqual({ flag: true });
        });

        it('未选中 checkbox 应返回 false', () => {
            container.innerHTML = '<input type="checkbox" id="test">';

            const result = extractDOMInfo('#test', {
                key: 'flag',
                type: 'boolean',
            });

            expect(result).toEqual({ flag: false });
        });
    });

    describe('type: url', () => {
        it('应从 a 标签提取 href', () => {
            container.innerHTML =
                '<a id="test" href="https://example.com/">Link</a>';

            const result = extractDOMInfo('#test', {
                key: 'url',
                type: 'url',
            });

            expect(result).toEqual({ url: 'https://example.com/' });
        });

        it('a 标签无 href 时应返回 textContent', () => {
            container.innerHTML = '<a id="test">Link</a>';

            const result = extractDOMInfo('#test', {
                key: 'url',
                type: 'url',
            });

            expect(result).toEqual({ url: 'Link' });
        });
    });

    describe('type: element', () => {
        it('应返回原生 DOM 元素', () => {
            container.innerHTML = '<span id="test">Element</span>';

            const result = extractDOMInfo('#test', {
                key: 'element',
                type: 'element',
            });

            expect(result.element).toBeInstanceOf(HTMLElement);
            expect((result.element as HTMLElement).id).toBe('test');
        });
    });

    describe('表单元素自动推断', () => {
        it('INPUT 元素应自动读取 value', () => {
            container.innerHTML = '<input class="username" value="admin" />';

            const result = extractDOMInfo(container, {
                key: 'username',
                selector: '.username',
            });

            expect(result.username).toBe('admin');
        });

        it('TEXTAREA 元素应自动读取 value', () => {
            container.innerHTML =
                '<textarea class="content">Hello World</textarea>';

            const result = extractDOMInfo(container, {
                key: 'content',
                selector: '.content',
            });

            expect(result.content).toBe('Hello World');
        });

        it('SELECT 元素应自动读取 value', () => {
            container.innerHTML = `
                <select class="city">
                    <option value="beijing">北京</option>
                    <option value="shanghai" selected>上海</option>
                </select>
            `;

            const result = extractDOMInfo(container, {
                key: 'city',
                selector: '.city',
            });

            expect(result.city).toBe('shanghai');
        });

        it('INPUT[type=number] 应正确转换为数字', () => {
            container.innerHTML =
                '<input type="number" class="age" value="25" />';

            const result = extractDOMInfo(container, {
                key: 'age',
                selector: '.age',
                type: 'number',
            });

            expect(result.age).toBe(25);
        });
    });

    describe('attribute 属性获取', () => {
        it('应获取指定属性的值', () => {
            container.innerHTML = '<div class="item" data-id="123">内容</div>';

            const result = extractDOMInfo(container, {
                key: 'id',
                selector: '.item',
                attribute: 'data-id',
            });

            expect(result.id).toBe('123');
        });

        it('应支持 Fallback 机制（数组）', () => {
            // 旧版本使用 data-user-id
            container.innerHTML =
                '<div class="item" data-user-id="456">内容</div>';

            const result = extractDOMInfo(container, {
                key: 'id',
                selector: '.item',
                attribute: ['data-id', 'data-user-id'], // 优先 data-id
            });

            expect(result.id).toBe('456');
        });

        it('Fallback 应返回第一个存在的属性', () => {
            container.innerHTML =
                '<div class="item" data-id="789" data-user-id="old">内容</div>';

            const result = extractDOMInfo(container, {
                key: 'id',
                selector: '.item',
                attribute: ['data-id', 'data-user-id'],
            });

            expect(result.id).toBe('789');
        });

        it('属性不存在时应返回 null', () => {
            container.innerHTML = '<div class="item">内容</div>';

            const result = extractDOMInfo(container, {
                key: 'id',
                selector: '.item',
                attribute: 'data-id',
            });

            expect(result.id).toBeNull();
        });

        it('boolean 类型通过 attribute 判断属性存在性', () => {
            container.innerHTML = '<div class="item" data-active>内容</div>';

            const result = extractDOMInfo(container, {
                key: 'isActive',
                selector: '.item',
                attribute: 'data-active',
                type: 'boolean',
            });

            expect(result.isActive).toBe(true);
        });

        it('boolean 类型 attribute="false" 应返回 false', () => {
            container.innerHTML =
                '<div class="item" data-active="false">内容</div>';

            const result = extractDOMInfo(container, {
                key: 'isActive',
                selector: '.item',
                attribute: 'data-active',
                type: 'boolean',
            });

            expect(result.isActive).toBe(false);
        });
    });

    describe('选择器缓存', () => {
        it('相同 selector 应复用查询结果', () => {
            container.innerHTML = '<span class="name">张三</span>';

            const result = extractDOMInfo(container, [
                { key: 'name', selector: '.name' },
                { key: 'nameElement', selector: '.name', type: 'element' },
            ]);

            expect(result.name).toBe('张三');
            expect(result.nameElement).toBeInstanceOf(HTMLElement);
            // 两次提取的是同一个元素
            expect((result.nameElement as HTMLElement).textContent).toBe(
                '张三',
            );
        });

        it('不存在的 selector 也应缓存', () => {
            const result = extractDOMInfo(container, [
                { key: 'missing1', selector: '.not-exist', defaultValue: 'A' },
                { key: 'missing2', selector: '.not-exist', defaultValue: 'B' },
            ]);

            expect(result.missing1).toBe('A');
            expect(result.missing2).toBe('B');
        });

        it('批量提取应正确处理多个不同 selector', () => {
            container.innerHTML = `
                <span class="name">李四</span>
                <span class="age">30</span>
                <input class="email" value="test@example.com" />
            `;

            const result = extractDOMInfo(container, [
                { key: 'name', selector: '.name' },
                { key: 'age', selector: '.age', type: 'number' },
                { key: 'email', selector: '.email' },
            ]);

            expect(result.name).toBe('李四');
            expect(result.age).toBe(30);
            expect(result.email).toBe('test@example.com');
        });
    });

    describe('边界与异常处理', () => {
        it('number 类型空格字符串应返回 null', () => {
            container.innerHTML = '<span class="num">   </span>';

            const result = extractDOMInfo(container, {
                key: 'num',
                selector: '.num',
                type: 'number',
            });

            expect(result.num).toBeNull();
        });

        it('number 类型 "123.45" 应正确解析', () => {
            container.innerHTML = '<span class="num">123.45</span>';

            const result = extractDOMInfo(container, {
                key: 'num',
                selector: '.num',
                type: 'number',
            });

            expect(result.num).toBe(123.45);
        });

        it('number 类型负数应正确解析', () => {
            container.innerHTML = '<span class="num">-100</span>';

            const result = extractDOMInfo(container, {
                key: 'num',
                selector: '.num',
                type: 'number',
            });

            expect(result.num).toBe(-100);
        });

        it('boolean 类型 "1" 应返回 true', () => {
            container.innerHTML = '<span class="flag">1</span>';

            const result = extractDOMInfo(container, {
                key: 'flag',
                selector: '.flag',
                type: 'boolean',
            });

            expect(result.flag).toBe(true);
        });

        it('boolean 类型 "0" 应返回 false', () => {
            container.innerHTML = '<span class="flag">0</span>';

            const result = extractDOMInfo(container, {
                key: 'flag',
                selector: '.flag',
                type: 'boolean',
            });

            expect(result.flag).toBe(false);
        });

        it('空规则数组应返回空对象', () => {
            const result = extractDOMInfo(container, []);

            expect(result).toEqual({});
        });

        it('单个规则（非数组）应正常工作', () => {
            container.innerHTML = '<span class="text">hello</span>';

            const result = extractDOMInfo(container, {
                key: 'text',
                selector: '.text',
            });

            expect(result.text).toBe('hello');
        });
    });
});
