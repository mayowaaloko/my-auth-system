import { CanActivate, ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from "../../users/users.service";
export declare class JwtAuthGuard implements CanActivate {
    private reflector;
    private jwtService;
    private configService;
    private userService;
    constructor(reflector: Reflector, jwtService: JwtService, configService: ConfigService, userService: UsersService);
    canActivate(context: ExecutionContext): Promise<boolean>;
    private extractTokenFromHeader;
}
