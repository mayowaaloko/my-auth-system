import { ThrottlerGuard } from '@nestjs/throttler';
export declare class LoginThrottlerGuard extends ThrottlerGuard {
    protected getTracker(req: Record<string, any>): Promise<string>;
    protected throwThrottlingException(): Promise<void>;
}
