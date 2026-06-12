import { HashPasswordService } from "../hash-password/hash-password.service";
import { UsersService } from "../users/users.service";
import { Logger } from 'winston';
export declare class TwoFactorAuthService {
    private readonly logger;
    private readonly usersService;
    private readonly hashPasswordService;
    constructor(logger: Logger, usersService: UsersService, hashPasswordService: HashPasswordService);
    setup(userId: string): Promise<{
        message: string;
        qrCode: string;
    }>;
    verifyAndEnable(userId: string, code: string): Promise<{
        message: string;
        backupCodes: string[];
        warning: string;
    }>;
    verifyLoginCode(userId: string, code: string): Promise<boolean>;
    verifyBackupCode(userId: string, code: string): Promise<boolean>;
    disable(userId: string, password: string): Promise<{
        message: string;
    }>;
    private generateBackupCodes;
}
