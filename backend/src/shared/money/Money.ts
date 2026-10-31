/**
 * Money Value Object
 * Invariant: Currency amounts are stored strictly as integers in minor units (e.g. paise for INR).
 * Floating-point numbers are completely forbidden.
 */
export class Money {
  readonly minorUnits: bigint;
  readonly currency: string;

  constructor(minorUnits: bigint | number, currency = 'INR') {
    this.minorUnits = typeof minorUnits === 'number' ? BigInt(Math.trunc(minorUnits)) : minorUnits;
    this.currency = currency;
  }

  static zero(currency = 'INR'): Money {
    return new Money(0n, currency);
  }

  static fromPaise(paise: number | bigint, currency = 'INR'): Money {
    return new Money(paise, currency);
  }

  static fromRupees(rupees: number, currency = 'INR'): Money {
    // converts rupees to paise with integer precision
    const paise = BigInt(Math.round(rupees * 100));
    return new Money(paise, currency);
  }

  add(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.minorUnits + other.minorUnits, this.currency);
  }

  subtract(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.minorUnits - other.minorUnits, this.currency);
  }

  multiply(quantity: number | bigint): Money {
    const qty = typeof quantity === 'number' ? BigInt(Math.trunc(quantity)) : quantity;
    return new Money(this.minorUnits * qty, this.currency);
  }

  /**
   * Calculates a percentage using Basis Points (1 bp = 0.01%, 100 bp = 1%, 10,000 bp = 100%).
   * Applies half-up rounding.
   */
  applyBasisPoints(basisPoints: number | bigint): Money {
    const bp = typeof basisPoints === 'number' ? BigInt(Math.trunc(basisPoints)) : basisPoints;
    // (minorUnits * bp + 5000) / 10000 for positive half-up rounding
    const product = this.minorUnits * bp;
    const rounded = product >= 0n
      ? (product + 5000n) / 10000n
      : (product - 5000n) / 10000n;
    return new Money(rounded, this.currency);
  }

  isZero(): boolean {
    return this.minorUnits === 0n;
  }

  isPositive(): boolean {
    return this.minorUnits > 0n;
  }

  isNegative(): boolean {
    return this.minorUnits < 0n;
  }

  equals(other: Money): boolean {
    return this.currency === other.currency && this.minorUnits === other.minorUnits;
  }

  toDecimalString(): string {
    const isNegative = this.minorUnits < 0n;
    const abs = isNegative ? -this.minorUnits : this.minorUnits;
    const whole = abs / 100n;
    const fraction = abs % 100n;
    const paddedFraction = fraction < 10n ? `0${fraction}` : fraction.toString();
    return `${isNegative ? '-' : ''}${whole}.${paddedFraction}`;
  }

  formatDisplay(): string {
    const decimal = this.toDecimalString();
    return `${this.currency} ${decimal}`;
  }

  private assertSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new Error(`Currency mismatch: cannot operate between ${this.currency} and ${other.currency}`);
    }
  }
}
