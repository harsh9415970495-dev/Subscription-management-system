import { describe, it, expect } from 'vitest';
import { Money } from '../Money';

describe('Money Value Object', () => {
  it('creates zero money', () => {
    const zero = Money.zero();
    expect(zero.minorUnits).toBe(0n);
    expect(zero.currency).toBe('INR');
    expect(zero.isZero()).toBe(true);
  });

  it('creates money from paise and rupees accurately', () => {
    const m1 = Money.fromPaise(1550);
    expect(m1.minorUnits).toBe(1550n);
    expect(m1.toDecimalString()).toBe('15.50');

    const m2 = Money.fromRupees(15.5);
    expect(m2.minorUnits).toBe(1550n);
    expect(m2.equals(m1)).toBe(true);
  });

  it('performs addition and subtraction', () => {
    const a = Money.fromPaise(1000); // ₹10.00
    const b = Money.fromPaise(550);  // ₹5.50

    const sum = a.add(b);
    expect(sum.minorUnits).toBe(1550n);

    const diff = a.subtract(b);
    expect(diff.minorUnits).toBe(450n);
  });

  it('multiplies by integer quantity', () => {
    const price = Money.fromPaise(2500); // ₹25.00
    const total = price.multiply(4);
    expect(total.minorUnits).toBe(10000n); // ₹100.00
  });

  it('calculates basis points with half-up rounding', () => {
    // 18% GST = 1800 basis points on ₹100.00 (10000 paise) = 1800 paise
    const base = Money.fromPaise(10000);
    const tax = base.applyBasisPoints(1800);
    expect(tax.minorUnits).toBe(1800n);

    // Rounding edge case: ₹10.55 (1055 paise) with 5% (500 bp) = 1055 * 500 / 10000 = 52.75 paise -> rounds to 53 paise
    const small = Money.fromPaise(1055);
    const fivePercent = small.applyBasisPoints(500);
    expect(fivePercent.minorUnits).toBe(53n);
  });

  it('formats display output with currency code', () => {
    const m = Money.fromPaise(123456);
    expect(m.formatDisplay()).toBe('INR 1234.56');
  });

  it('throws on currency mismatch', () => {
    const inr = Money.fromPaise(100, 'INR');
    const usd = Money.fromPaise(100, 'USD');
    expect(() => inr.add(usd)).toThrow('Currency mismatch');
  });
});
