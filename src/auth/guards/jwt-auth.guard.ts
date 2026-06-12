import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import { IS_PUBLIC_KEY } from '../../common/decorators/public.decorator';
import { UsersService } from '../../users/users.service';

@Injectable()
// export class JwtAuthGuard extends AuthGuard('jwt') {}
export class JwtAuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private jwtService: JwtService,
    private configService: ConfigService,
    private userService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    const request = context
      .switchToHttp()
      .getRequest<Request & { user: any }>();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException('Missing token');
    }
    let payload: { sub: string; email: string; role: string; iat: number };
    try {
      payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET')!,
      });
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
    const user = await this.userService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('Invalid token');
    }
    if (user.passwordChangedAt) {
      const passwordChangedTimestamp = Math.floor(
        user.passwordChangedAt.getTime() / 1000,
      );
      if (payload.iat < passwordChangedTimestamp) {
        throw new UnauthorizedException(
          'Password recently changed. Please log in again.',
        );
      }
    }

    request.user = user;
    return true;
  }
  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] =
      (
        request.headers as unknown as Record<string, string>
      ).authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
