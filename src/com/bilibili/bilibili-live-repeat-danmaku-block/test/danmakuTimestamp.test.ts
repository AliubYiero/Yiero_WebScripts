import { describe, expect, it } from 'vitest';
import { parseDanmakuTimestamp } from '../src/module/danmakuTimestamp.ts';

describe('parseDanmakuTimestamp', () => {
    it('ts 为秒时换算成毫秒', () => {
        expect(parseDanmakuTimestamp('1700000000', '')).toBe(
            1_700_000_000_000,
        );
    });

    it('ts 缺失时回退 timestamp', () => {
        expect(parseDanmakuTimestamp('', '1700000000123')).toBe(
            1_700_000_000_123,
        );
    });

    it('两者都为空时返回 NaN', () => {
        expect(parseDanmakuTimestamp('', '')).toBeNaN();
    });

    it('ts 为 0 (自己发送的弹幕) 时回退 timestamp', () => {
        expect(parseDanmakuTimestamp('0', '1700000000123')).toBe(
            1_700_000_000_123,
        );
    });

    it('ts 与 timestamp 都有效时优先用 ts', () => {
        expect(parseDanmakuTimestamp('1700000000', '1')).toBe(
            1_700_000_000_000,
        );
    });
});
