import { ConfigService } from '@nestjs/config';
import { Logger } from 'winston';
export declare class EmailService {
    private readonly configService;
    private readonly logger;
    private readonly resend;
    constructor(configService: ConfigService, logger: Logger);
    sendVerificationEmail(email: string, token: string): Promise<void>;
    sendPasswordResetEmail(email: string, token: string): Promise<void>;
}
