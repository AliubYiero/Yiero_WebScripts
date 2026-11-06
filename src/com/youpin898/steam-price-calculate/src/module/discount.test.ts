import { describe, expect, it } from 'vitest';
import { calculateDiscount, DiscountType } from './discount.ts';

describe('calculateDiscount', () => {
    it('78%: 在售价低于 Steam 净价的 80% 时为降价', () => {
        const result = calculateDiscount(8.46, 12.8);

        expect(result.sellNetPrice).toBeCloseTo(10.88);
        expect(result.discount).toBeCloseTo(0.7776, 4);
        expect(result.discountText).toBe('78%');
        expect(result.discountType).toBe(DiscountType.Drop);
    });

    it('80%: 正好等于阈值时为中间档', () => {
        const result = calculateDiscount(10.88, 16);

        expect(result.sellNetPrice).toBeCloseTo(13.6);
        expect(result.discount).toBeCloseTo(0.8);
        expect(result.discountText).toBe('80%');
        expect(result.discountType).toBe(DiscountType.Middle);
    });

    it('100%: 与 Steam 净价持平时为中间档', () => {
        const result = calculateDiscount(13.6, 16);

        expect(result.sellNetPrice).toBeCloseTo(13.6);
        expect(result.discount).toBeCloseTo(1);
        expect(result.discountText).toBe('100%');
        expect(result.discountType).toBe(DiscountType.Middle);
    });

    it('110%: 高于 Steam 净价时为涨价', () => {
        const result = calculateDiscount(14.96, 16);

        expect(result.sellNetPrice).toBeCloseTo(13.6);
        expect(result.discount).toBeCloseTo(1.1);
        expect(result.discountText).toBe('110%');
        expect(result.discountType).toBe(DiscountType.Increase);
    });
});
