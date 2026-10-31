import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { and, eq, gt, isNull } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DB_CLIENT } from '../../../shared/database/database.provider';
import { AuditFacade } from '../../audit';
import { CustomersFacade } from '../../customers';
import {
  CreateStaffDto,
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
} from '../api/dto/auth.dto';
import { PasswordValidator } from '../domain/password-validator';
import {
  passwordResetTokens,
  refreshTokens,
  users,
} from '../infrastructure/schema';
import { PasswordHasher } from './password-hasher.service';
import { TokenService } from '../../../shared/auth';
import { EmailService } from '../../../shared/email/email.service';

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    role: 'ADMIN' | 'STAFF' | 'CUSTOMER';
    status: string;
    customerId?: string | null;
  };
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(DB_CLIENT) private readonly db: PostgresJsDatabase,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenService: TokenService,
    private readonly customersFacade: CustomersFacade,
    private readonly auditFacade: AuditFacade,
    private readonly emailService: EmailService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const passwordValidation = PasswordValidator.validate(dto.password);
    if (!passwordValidation.isValid) {
      throw new BadRequestException({
        statusCode: 400,
        message: 'Password does not meet complexity rules',
        errors: passwordValidation.errors,
        checklist: passwordValidation.checklist,
      });
    }

    const normalizedEmail = dto.email.trim().toLowerCase();

    // Check duplicate email
    const [existing] = await this.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (existing) {
      throw new ConflictException('Email is already registered');
    }

    const passwordHash = await this.passwordHasher.hash(dto.password);

    // Atomically create customer and user
    const result = await this.db.transaction(async (tx) => {
      // 1. Create Customer record via CustomersFacade
      const customer = await this.customersFacade.createCustomer(
        {
          name: dto.name,
          companyName: dto.companyName,
          phone: dto.phone,
          billingAddress: dto.billingAddress,
          taxId: dto.taxId,
        },
        tx as unknown as PostgresJsDatabase,
      );

      // 2. Create User record
      const [newUser] = await tx
        .insert(users)
        .values({
          email: normalizedEmail,
          passwordHash,
          role: 'CUSTOMER',
          status: 'ACTIVE',
          customerId: customer.id,
        })
        .returning();

      // 3. Link user to customer
      await this.customersFacade.linkUserToCustomer(
        customer.id,
        newUser.id,
        tx as unknown as PostgresJsDatabase,
      );

      // 4. Create initial tokens
      const accessToken = this.tokenService.generateAccessToken({
        sub: newUser.id,
        email: newUser.email,
        role: newUser.role as 'CUSTOMER',
        customerId: customer.id,
      });

      const { rawToken, tokenHash, expiresAt } =
        this.tokenService.generateRefreshToken();

      await tx.insert(refreshTokens).values({
        userId: newUser.id,
        tokenHash,
        expiresAt,
      });

      return {
        accessToken,
        refreshToken: rawToken,
        user: {
          id: newUser.id,
          email: newUser.email,
          role: newUser.role as 'CUSTOMER',
          status: newUser.status,
          customerId: customer.id,
        },
      };
    });

    await this.auditFacade.record({
      actor: result.user.email,
      action: 'AUTH_REGISTER_SUCCESS',
      entityName: 'identity.users',
      entityId: result.user.id,
      details: { role: 'CUSTOMER', customerId: result.user.customerId },
    });

    return result;
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const normalizedEmail = dto.email.trim().toLowerCase();

    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (!user) {
      await this.auditFacade.record({
        actor: normalizedEmail,
        action: 'AUTH_LOGIN_FAILURE',
        entityName: 'identity.users',
        entityId: 'unknown',
        details: { reason: 'User not found' },
      });
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Account is suspended or inactive');
    }

    const passwordValid = await this.passwordHasher.verify(
      user.passwordHash,
      dto.password,
    );

    if (!passwordValid) {
      await this.auditFacade.record({
        actor: user.email,
        action: 'AUTH_LOGIN_FAILURE',
        entityName: 'identity.users',
        entityId: user.id,
        details: { reason: 'Incorrect password' },
      });
      throw new UnauthorizedException('Invalid email or password');
    }

    const accessToken = this.tokenService.generateAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role as 'ADMIN' | 'STAFF' | 'CUSTOMER',
      customerId: user.customerId,
    });

    const { rawToken, tokenHash, expiresAt } =
      this.tokenService.generateRefreshToken();

    await this.db.insert(refreshTokens).values({
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    await this.auditFacade.record({
      actor: user.email,
      action: 'AUTH_LOGIN_SUCCESS',
      entityName: 'identity.users',
      entityId: user.id,
      details: { role: user.role },
    });

    return {
      accessToken,
      refreshToken: rawToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role as 'ADMIN' | 'STAFF' | 'CUSTOMER',
        status: user.status,
        customerId: user.customerId,
      },
    };
  }

  async refresh(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const tokenHash = this.tokenService.hashToken(refreshToken);

    const [existingToken] = await this.db
      .select()
      .from(refreshTokens)
      .where(
        and(
          eq(refreshTokens.tokenHash, tokenHash),
          isNull(refreshTokens.revokedAt),
          gt(refreshTokens.expiresAt, new Date()),
        ),
      )
      .limit(1);

    if (!existingToken) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Revoke old refresh token (rotation)
    await this.db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(refreshTokens.id, existingToken.id));

    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, existingToken.userId))
      .limit(1);

    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('User account is invalid or suspended');
    }

    const newAccessToken = this.tokenService.generateAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role as 'ADMIN' | 'STAFF' | 'CUSTOMER',
      customerId: user.customerId,
    });

    const { rawToken, tokenHash: newHash, expiresAt } =
      this.tokenService.generateRefreshToken();

    await this.db.insert(refreshTokens).values({
      userId: user.id,
      tokenHash: newHash,
      expiresAt,
    });

    return {
      accessToken: newAccessToken,
      refreshToken: rawToken,
    };
  }

  async logout(refreshToken: string): Promise<void> {
    if (!refreshToken) return;
    const tokenHash = this.tokenService.hashToken(refreshToken);
    await this.db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(refreshTokens.tokenHash, tokenHash));
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string; previewToken?: string }> {
    const normalizedEmail = dto.email.trim().toLowerCase();

    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    // Anti-enumeration: always return success message
    if (!user) {
      return {
        message: 'If an account exists with this email, a password reset link has been dispatched.',
      };
    }

    const { rawToken, tokenHash, expiresAt } =
      this.tokenService.generateResetToken();

    await this.db.insert(passwordResetTokens).values({
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    await this.auditFacade.record({
      actor: user.email,
      action: 'AUTH_PASSWORD_RESET_REQUESTED',
      entityName: 'identity.users',
      entityId: user.id,
    });

    await this.emailService.sendPasswordResetEmail(user.email, rawToken);

    return {
      message: 'If an account exists with this email, a password reset link has been dispatched.',
      previewToken: process.env.NODE_ENV !== 'production' ? rawToken : undefined,
    };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const validation = PasswordValidator.validate(dto.newPassword);
    if (!validation.isValid) {
      throw new BadRequestException({
        statusCode: 400,
        message: 'New password does not meet complexity rules',
        errors: validation.errors,
        checklist: validation.checklist,
      });
    }

    const tokenHash = this.tokenService.hashToken(dto.token);

    const [resetRecord] = await this.db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.tokenHash, tokenHash),
          isNull(passwordResetTokens.usedAt),
          gt(passwordResetTokens.expiresAt, new Date()),
        ),
      )
      .limit(1);

    if (!resetRecord) {
      throw new BadRequestException('Invalid or expired password reset token');
    }

    const newPasswordHash = await this.passwordHasher.hash(dto.newPassword);

    await this.db.transaction(async (tx) => {
      // 1. Mark token as used
      await tx
        .update(passwordResetTokens)
        .set({ usedAt: new Date() })
        .where(eq(passwordResetTokens.id, resetRecord.id));

      // 2. Update password
      await tx
        .update(users)
        .set({
          passwordHash: newPasswordHash,
          updatedAt: new Date(),
        })
        .where(eq(users.id, resetRecord.userId));

      // 3. Revoke all refresh tokens for this user
      await tx
        .update(refreshTokens)
        .set({ revokedAt: new Date() })
        .where(eq(refreshTokens.userId, resetRecord.userId));
    });

    await this.auditFacade.record({
      actor: resetRecord.userId,
      action: 'AUTH_PASSWORD_RESET_COMPLETED',
      entityName: 'identity.users',
      entityId: resetRecord.userId,
    });

    return {
      message: 'Password successfully updated. Please log in with your new password.',
    };
  }

  async getMe(userId: string): Promise<object> {
    const [user] = await this.db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        status: users.status,
        customerId: users.customerId,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new NotFoundException('User profile not found');
    }

    let customer = null;
    if (user.customerId) {
      customer = await this.customersFacade.getCustomerById(user.customerId);
    }

    return {
      user,
      customer,
    };
  }

  async createStaff(dto: CreateStaffDto, creatorEmail: string): Promise<{ id: string; email: string; role: string }> {
    const validation = PasswordValidator.validate(dto.password);
    if (!validation.isValid) {
      throw new BadRequestException({
        statusCode: 400,
        message: 'Password does not meet complexity rules',
        errors: validation.errors,
      });
    }

    const normalizedEmail = dto.email.trim().toLowerCase();

    const [existing] = await this.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (existing) {
      throw new ConflictException('Staff email is already registered');
    }

    const passwordHash = await this.passwordHasher.hash(dto.password);

    const [staff] = await this.db
      .insert(users)
      .values({
        email: normalizedEmail,
        passwordHash,
        role: dto.role,
        status: 'ACTIVE',
      })
      .returning();

    await this.auditFacade.record({
      actor: creatorEmail,
      action: 'STAFF_USER_CREATED',
      entityName: 'identity.users',
      entityId: staff.id,
      details: { role: staff.role },
    });

    return {
      id: staff.id,
      email: staff.email,
      role: staff.role,
    };
  }

  async listStaff(): Promise<Array<{ id: string; email: string; role: string; status: string; createdAt: Date }>> {
    return await this.db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        status: users.status,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.role, 'STAFF'));
  }
}
