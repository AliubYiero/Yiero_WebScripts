import { describe, expect, it } from '@rstest/core';
import { parseResponseText } from '../../src/API/util/parseResponseText';

describe('parseResponseText', () => {
    it('should parse JSON string to object', () => {
        const input = '{"name": "test", "value": 123}';
        const result = parseResponseText(input);
        expect(result).toEqual({ name: 'test', value: 123 });
    });

    it('should parse HTML string to Document', () => {
        const input =
            '<!DOCTYPE html><html><body><div>test</div></body></html>';
        const result = parseResponseText(input) as Document;
        expect(result.body).toBeDefined();
        expect(result.body.innerHTML).toContain('<div>test</div>');
    });

    it('should return Document for plain text (DOMParser never throws)', () => {
        const input = 'plain text content';
        const result = parseResponseText(input) as Document;
        // 注意：DOMParser.parseFromString() 永远不会抛出异常
        // 即使是纯文本，它也会返回一个 Document 对象
        expect(result).toBeInstanceOf(Document);
        // 纯文本会被包裹在 body 中
        expect(result.body.textContent).toBe('plain text content');
    });
});
