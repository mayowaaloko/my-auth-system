
import { Injectable } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerException } from '@nestjs/throttler';

@Injectable()
export class ForgotPasswordThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    const email = req.body?.email?.trim().toLowerCase() || 'unknown';
    const ip =
      req.ips?.[0] || req.ip || req.connection?.remoteAddress || 'unknown';
    return `forgot-password-${email}-${ip}`;
  }

  protected async throwThrottlingException(): Promise<void> {
    throw new ThrottlerException(
      'Too many password reset attempts. Please try again later.',
    );
  }
}
