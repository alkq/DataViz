import { Injectable, UnauthorizedException, BadRequestException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg'; // 1. Import pg Pool
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

export interface TokenPayload {
  sub: string;
  email: string;
  tenant_id: string;
  role: string;
  session_id: string;
}

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    @Inject('PG_POOL') private pool: Pool, // 2. Inject the global PG Pool
  ) {}

  async register(email: string, password: string): Promise<TokenPayload> {
    // 1. Check if user already exists
    const existing = await this.pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows && existing.rows.length > 0) {
      throw new BadRequestException('Email is already registered');
    }

    // 2. Hash the password with 10 salt rounds
    const passwordHash = await bcrypt.hash(password, 10);

    // 3. Save to database (defaults to the first mock tenant)
    const result = await this.pool.query(
      'INSERT INTO users (email, password_hash, tenant_id) VALUES ($1, $2, $3) RETURNING id, email, tenant_id, role',
      [email, passwordHash, '00000000-0000-0000-0000-000000000001']
    );

    const user = result.rows[0];
    return {
      sub: user.id,
      email: user.email,
      tenant_id: user.tenant_id,
      role: user.role,
      session_id: crypto.randomUUID(),
    };
  }

  async validateLocalUser(email: string, password: string): Promise<TokenPayload> {
    // 1. Find user in Postgres
    const result = await this.pool.query(
      'SELECT id, email, password_hash, tenant_id, role FROM users WHERE email = $1',
      [email]
    );

    const user = result.rows?.[0];
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // 2. Verify hashed password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return {
      sub: user.id,
      email: user.email,
      tenant_id: user.tenant_id,
      role: user.role,
      session_id: crypto.randomUUID(),
    };
  }

  async validateKeycloakToken(token: string): Promise<TokenPayload | null> {
    try {
      const keycloakUrl = this.configService.get<string>('KEYCLOAK_URL') || 'http://localhost:8080';
      const realm = this.configService.get<string>('KEYCLOAK_REALM') || 'dataviz';
      
      const response = await fetch(`${keycloakUrl}/realms/${realm}/protocol/openid-connect/userinfo`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) {
        return null;
      }
      
      const userInfo = await response.json() as any;
      return {
        sub: userInfo.sub,
        email: userInfo.email,
        tenant_id: userInfo.tenant_id || '00000000-0000-0000-0000-000000000001',
        role: userInfo.realm_access?.roles?.[0] || 'viewer',
        session_id: userInfo.session_id || crypto.randomUUID(),
      };
    } catch {
      return null;
    }
  }

  async generateToken(payload: TokenPayload): Promise<string> {
    return this.jwtService.signAsync(payload);
  }

  async verifyToken(token: string): Promise<TokenPayload> {
    try {
      return await this.jwtService.verifyAsync<TokenPayload>(token);
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }

  createMockToken(overrides: Partial<TokenPayload> = {}): string {
    const payload: TokenPayload = {
      sub: '00000000-0000-0000-0000-000000000001',
      email: 'admin@demo.com',
      tenant_id: '00000000-0000-0000-0000-000000000001',
      role: 'admin',
      session_id: crypto.randomUUID(),
      ...overrides,
    };
    return this.jwtService.sign(payload);
  }
}