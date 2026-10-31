import { describe, it, expect } from 'vitest';
import { PasswordValidator } from '../password-validator';

describe('PasswordValidator (Domain Invariant)', () => {
  it('rejects passwords shorter than 9 characters (boundary: 8 fails)', () => {
    // 8 characters: 1 upper, 1 lower, 1 num, 1 special
    const res = PasswordValidator.validate('Aa1!5678');
    expect(res.isValid).toBe(false);
    expect(res.checklist.minLength).toBe(false);
    expect(res.errors).toContain('Password must be at least 9 characters long');
  });

  it('accepts passwords with exactly 9 characters when all conditions are met (boundary: 9 passes)', () => {
    // 9 characters: 1 upper, 1 lower, 1 num, 1 special + 5 chars
    const res = PasswordValidator.validate('Aa1!56789');
    expect(res.isValid).toBe(true);
    expect(res.checklist.minLength).toBe(true);
    expect(res.errors).toHaveLength(0);
  });

  it('rejects passwords without an uppercase letter', () => {
    const res = PasswordValidator.validate('abcdef12!@');
    expect(res.isValid).toBe(false);
    expect(res.checklist.uppercase).toBe(false);
    expect(res.errors).toContain('Password must contain at least one uppercase letter (A-Z)');
  });

  it('rejects passwords without a lowercase letter', () => {
    const res = PasswordValidator.validate('ABCDEF12!@');
    expect(res.isValid).toBe(false);
    expect(res.checklist.lowercase).toBe(false);
    expect(res.errors).toContain('Password must contain at least one lowercase letter (a-z)');
  });

  it('rejects passwords without a numeric digit', () => {
    const res = PasswordValidator.validate('Abcdefgh!@');
    expect(res.isValid).toBe(false);
    expect(res.checklist.number).toBe(false);
    expect(res.errors).toContain('Password must contain at least one numeric digit (0-9)');
  });

  it('rejects passwords without a special character', () => {
    const res = PasswordValidator.validate('Abcdefgh12');
    expect(res.isValid).toBe(false);
    expect(res.checklist.specialChar).toBe(false);
    expect(res.errors).toContain('Password must contain at least one special character');
  });

  it('provides a complete checklist mapping for live frontend verification', () => {
    const res = PasswordValidator.validate('Ab1');
    expect(res.checklist).toEqual({
      minLength: false,
      uppercase: true,
      lowercase: true,
      number: true,
      specialChar: false,
    });
  });
});
