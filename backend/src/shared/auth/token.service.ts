import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';
import { CONFIG } from '../config';

export interface JwtPayload {
  sub: string;
  email: string;
  role: 'ADMIN' | 'STAFF' | 'CUSTOMER';
  customerId?: string | null;
  iat?: number;
  exp?: number;
}

@Injectable()
export class TokenService {
  private base64UrlEncode(str: string): string {
    return Buffer.from(str)
      .toString('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  }

  private base64UrlDecode(str: string): string {
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) {
      str += '=';
    }
    return Buffer.from(str, 'base64').toString('utf8');
  }

  generateAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
    const header = { alg: 'HS256', typ: 'JWT' };
    const now = Math.floor(Date.now() / 1000);
    const exp = now + 900; // 15 mins

    const fullPayload: JwtPayload = {
      ...payload,
      iat: now,
      exp,
    };

    const headerEncoded = this.base64UrlEncode(JSON.stringify(header));
    const payloadEncoded = this.base64UrlEncode(JSON.stringify(fullPayload));
    const dataToSign = `${headerEncoded}.${payloadEncoded}`;

    const signature = crypto
      .createHmac('sha256', CONFIG.jwtSecret)
      .update(dataToSign)
      .digest('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    return `${dataToSign}.${signature}`;
  }

  verifyAccessToken(token: string): JwtPayload {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new UnauthorizedException('Malformed token');
      }

      const [headerEncoded, payloadEncoded, signature] = parts;
      const dataToSign = `${headerEncoded}.${payloadEncoded}`;

      const expectedSignature = crypto
        .createHmac('sha256', CONFIG.jwtSecret)
        .update(dataToSign)
        .digest('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');

      const valid = crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature),
      );

      if (!valid) {
        throw new UnauthorizedException('Invalid token signature');
      }

      const payload: JwtPayload = JSON.parse(this.base64UrlDecode(payloadEncoded));
      const now = Math.floor(Date.now() / 1000);

      if (payload.exp && payload.exp < now) {
        throw new UnauthorizedException('Token expired');
      }

      return payload;
    } catch (err) {
      if (err instanceof UnauthorizedException) {
        throw err;
      }
      throw new UnauthorizedException('Token verification failed');
    }
  }

  hashToken(rawToken: string): string {
    return crypto.createHash('sha256').update(rawToken).digest('hex');
  }

  generateRefreshToken(): { rawToken: string; tokenHash: string; expiresAt: Date } {
    const rawToken = crypto.randomBytes(40).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    return { rawToken, tokenHash, expiresAt };
  }

  generateResetToken(): { rawToken: string; tokenHash: string; expiresAt: Date } {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    return { rawToken, tokenHash, expiresAt };
  }
}
