import { NewRefreshToken } from "../db/schema";
export declare class RefreshTokenService {
    create(data: NewRefreshToken): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        tokenHash: string;
        family: string;
        jti: string;
        used: boolean;
        expiresAt: Date;
        revokedAt: Date | null;
    }>;
    findLatestByFamily(family: string): Promise<{
        id: string;
        userId: string;
        tokenHash: string;
        family: string;
        jti: string;
        used: boolean;
        expiresAt: Date;
        revokedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    revokeFamily(family: string): Promise<import("drizzle-orm/neon-http").NeonHttpQueryResult<never>>;
    revokeToken(id: string): Promise<import("drizzle-orm/neon-http").NeonHttpQueryResult<never>>;
    findByJti(jti: string): Promise<{
        id: string;
        userId: string;
        tokenHash: string;
        family: string;
        jti: string;
        used: boolean;
        expiresAt: Date;
        revokedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    markAsUsed(id: string): Promise<import("drizzle-orm/neon-http").NeonHttpQueryResult<never>>;
    revokeAllForUser(userId: string): Promise<{
        id: string;
        userId: string;
        tokenHash: string;
        family: string;
        jti: string;
        used: boolean;
        expiresAt: Date;
        revokedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
}
