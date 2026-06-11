import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';

@Injectable()
export class GoogleService {
  private readonly scopes = ['openid', 'email', 'profile'];
  constructor(private configService: ConfigService) {}
  private getClient(): OAuth2Client {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET');
    const redirectUri = this.configService.get<string>('GOOGLE_REDIRECT_URI');
    if (!clientId || !clientSecret || !redirectUri) {
      throw new Error('Missing Google OAuth configuration');
    }
    return new OAuth2Client(clientId, clientSecret, redirectUri);
  }
  getAuthUrl(): string {
    const client = this.getClient();
    return client.generateAuthUrl({
      access_type: 'offline',
      scope: this.scopes,
      include_granted_scopes: true,
      prompt: 'consent',
    });
  }
  async getUserFromCode(code: string): Promise<{
    googleId: string;
    email: string;
    name: string;
    emailVerified: boolean;
    refreshToken: string;
    accessToken: string;
  }> {
    const client = this.getClient();
    const { tokens } = await client.getToken(code);
    if (!tokens.id_token || !tokens.access_token) {
      throw new Error('Google OAuth failed - Failed to get tokens');
    }
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: this.configService.get<string>('GOOGLE_CLIENT_ID'),
    });
    const payload = ticket.getPayload();
    if (!payload) {
      throw new Error('Google OAuth failed - Failed to get payload');
    }
    const { sub: googleId, email, name, email_verified } = payload;
    if (!googleId || !email || !name || typeof email_verified !== 'boolean') {
      throw new Error('Google OAuth failed - Email not verified');
    }
    return {
      googleId,
      email,
      name: name || '',
      emailVerified: email_verified,
      refreshToken: tokens.refresh_token || '',
      accessToken: tokens.access_token,
    };
  }
}
