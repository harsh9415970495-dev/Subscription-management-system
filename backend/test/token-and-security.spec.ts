import { describe, it, expect } from 'vitest';
import { TokenService } from '../src/shared/auth/token.service';
import { RolesGuard } from '../src/shared/auth/roles.guard';
import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as crypto from 'crypto';

describe('Token and Security Invariants (§8 Exit Gate)', () => {
  const tokenService = new TokenService();

  it('generates and successfully verifies an HS256 access token', () => {
    const token = tokenService.generateAccessToken({
      sub: 'usr-12345',
      email: 'jane@acme.com',
      role: 'CUSTOMER',
      customerId: 'cust-999',
    });

    const payload = tokenService.verifyAccessToken(token);
    expect(payload.sub).toBe('usr-12345');
    expect(payload.email).toBe('jane@acme.com');
    expect(payload.role).toBe('CUSTOMER');
    expect(payload.customerId).toBe('cust-999');
    expect(payload.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });

  it('rejects tampered access tokens with 401 Unauthorized', () => {
    const token = tokenService.generateAccessToken({
      sub: 'usr-12345',
      email: 'jane@acme.com',
      role: 'CUSTOMER',
    });

    // Tamper with payload
    const parts = token.split('.');
    const tampered = `${parts[0]}.${parts[1]}abc.${parts[2]}`;

    expect(() => {
      tokenService.verifyAccessToken(tampered);
    }).toThrow(UnauthorizedException);
  });

  it('proves password reset tokens are stored hashed in database (SHA-256)', () => {
    const { rawToken, tokenHash, expiresAt } = tokenService.generateResetToken();

    // Raw token must be high-entropy hex string
    expect(rawToken).toHaveLength(64);

    // Hash must match SHA-256 of raw token
    const expectedHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    expect(tokenHash).toBe(expectedHash);
    expect(tokenHash).not.toBe(rawToken);

    // Expires in future
    expect(expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it('enforces RolesGuard: STAFF calling an ADMIN-only endpoint throws 403 Forbidden', () => {
    const reflector = new Reflector();
    reflector.getAllAndOverride = ((key: string) => {
      if (key === 'roles') return ['ADMIN'];
      return undefined;
    }) as any;

    const rolesGuard = new RolesGuard(reflector);

    const mockStaffContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          user: { sub: 'staff-1', email: 'staff@brightloop.local', role: 'STAFF' },
        }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;

    expect(() => {
      rolesGuard.canActivate(mockStaffContext);
    }).toThrow(ForbiddenException);

    try {
      rolesGuard.canActivate(mockStaffContext);
    } catch (err) {
      expect((err as ForbiddenException).getStatus()).toBe(403);
      expect((err as ForbiddenException).message).toContain('Access denied: required role ADMIN');
    }
  });

  it('allows ADMIN to call an ADMIN-only endpoint', () => {
    const reflector = new Reflector();
    reflector.getAllAndOverride = ((key: string) => {
      if (key === 'roles') return ['ADMIN'];
      return undefined;
    }) as any;

    const rolesGuard = new RolesGuard(reflector);

    const mockAdminContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          user: { sub: 'admin-1', email: 'admin@brightloop.local', role: 'ADMIN' },
        }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;

    const allowed = rolesGuard.canActivate(mockAdminContext);
    expect(allowed).toBe(true);
  });
});
