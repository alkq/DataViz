import { Controller, Post, Get, Body, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { IsEmail, IsString, MinLength } from 'class-validator'; // 1. Import class-validator decorators
import { AuthService, TokenPayload } from './auth.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, Public } from '../../common/decorators';

class LocalLoginDto {
  @IsEmail({}, { message: 'Invalid email address' })
  email!: string;

  @IsString()
  password!: string;
}

class RegisterDto {
  @IsEmail({}, { message: 'Invalid email address' })
  email!: string;

  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' }) // optional: enforces password length
  password!: string;
}

class KeycloakLoginDto {
  token!: string;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Throttle({ auth: {} })
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new local user' })
  async register(@Body() registerDto: RegisterDto) {
    const payload = await this.authService.register(registerDto.email, registerDto.password);
    const accessToken = await this.authService.generateToken(payload);
    return { accessToken, tokenType: 'Bearer', expiresIn: 3600 };
  }

  @Public()
  @Throttle({ auth: {} })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate with email and password' })
  async login(@Body() loginDto: LocalLoginDto) {
    const payload = await this.authService.validateLocalUser(loginDto.email, loginDto.password);
    const accessToken = await this.authService.generateToken(payload);
    return { accessToken, tokenType: 'Bearer', expiresIn: 3600 };
  }

  @Public()
  @Throttle({ auth: {} })
  @Post('keycloak-login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Exchange Keycloak token for API JWT' })
  async keycloakLogin(@Body() loginDto: KeycloakLoginDto) {
    const payload = await this.authService.validateKeycloakToken(loginDto.token);
    if (!payload) {
      return { error: 'Invalid Keycloak token' };
    }
    const accessToken = await this.authService.generateToken(payload);
    return { accessToken, tokenType: 'Bearer', expiresIn: 3600 };
  }

  @Public()
  @Post('dev-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate development token (DEV ONLY)' })
  async devToken(@Body() body: Partial<TokenPayload>) {
    if (process.env.NODE_ENV === 'production') {
      return { error: 'Not available in production' };
    }
    const accessToken = this.authService.createMockToken(body);
    return { accessToken, tokenType: 'Bearer', expiresIn: 3600 };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user info' })
  async me(@CurrentUser() user: TokenPayload) {
    return user;
  }

  @UseGuards(JwtAuthGuard)
  @Throttle({ auth: {} })
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Refresh access token' })
  async refresh(@CurrentUser() user: TokenPayload) {
    const accessToken = await this.authService.generateToken(user);
    return { accessToken, tokenType: 'Bearer', expiresIn: 3600 };
  }
}