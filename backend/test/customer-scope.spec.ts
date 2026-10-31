import { describe, it, expect } from 'vitest';
import { CustomerScope } from '../src/modules/customers/application/customer-scope';
import { NotFoundException } from '@nestjs/common';

describe('Customer Scope Tenant Isolation (§8 Invariant)', () => {
  it('allows ADMIN to access any customer resource', () => {
    expect(() => {
      CustomerScope.assertAccess('ADMIN', null, 'customer-target-123');
    }).not.toThrow();
  });

  it('allows STAFF to access any customer resource', () => {
    expect(() => {
      CustomerScope.assertAccess('STAFF', null, 'customer-target-123');
    }).not.toThrow();
  });

  it('allows CUSTOMER to access their own customer resource', () => {
    expect(() => {
      CustomerScope.assertAccess('CUSTOMER', 'customer-uuid-1', 'customer-uuid-1');
    }).not.toThrow();
  });

  it('throws 404 NotFoundException (not 403) when Customer A attempts to access Customer B resource', () => {
    expect(() => {
      CustomerScope.assertAccess('CUSTOMER', 'customer-A', 'customer-B');
    }).toThrow(NotFoundException);

    try {
      CustomerScope.assertAccess('CUSTOMER', 'customer-A', 'customer-B');
    } catch (err) {
      expect((err as NotFoundException).getStatus()).toBe(404);
      expect((err as NotFoundException).message).toBe('Customer resource not found');
    }
  });

  it('throws 404 when CUSTOMER has no associated customerId', () => {
    expect(() => {
      CustomerScope.assertAccess('CUSTOMER', null, 'customer-target');
    }).toThrow(NotFoundException);
  });
});
