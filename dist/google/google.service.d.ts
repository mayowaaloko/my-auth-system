import { ConfigService } from '@nestjs/config';
export declare class GoogleService {
    private configService;
    private readonly scopes;
    constructor(configService: ConfigService);
    private getClient;
    getAuthUrl(): string;
    getUserFromCode(code: string): Promise<{
        googleId: string;
        email: string;
        name: string;
        emailVerified: boolean;
        refreshToken: string;
        accessToken: string;
    }>;
}
