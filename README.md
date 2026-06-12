# My Auth System

A production-ready authentication API built with NestJS, PostgreSQL, Drizzle ORM, JWT authentication, refresh-token rotation, email verification, password reset, Google OAuth, rate limiting, and two-factor authentication.

This project was built as a portfolio backend to demonstrate secure authentication flows, clean modular NestJS architecture, database-backed session management, and cloud deployment with Docker.

## Live API

Base URL:

```txt
https://my-auth-system-production.up.railway.app/api/v1
```

Example register endpoint:

```txt
POST https://my-auth-system-production.up.railway.app/api/v1/auth/register
```

Swagger documentation, if enabled on the deployed environment:

```txt
https://my-auth-system-production.up.railway.app/api/v1/docs
```

## Features

- User registration with strong password validation
- Email verification flow
- Login with JWT access tokens
- HTTP-only refresh token cookies
- Refresh-token rotation and token family revocation
- Logout from one session or all sessions
- Forgot password and reset password flow
- Authenticated password update
- Google OAuth login flow
- Two-factor authentication setup, verification, and disable flow
- Account lockout fields for failed login protection
- Rate limiting for sensitive auth endpoints
- Centralized exception filtering
- Request validation with DTOs
- API documentation with Swagger
- PostgreSQL schema managed with Drizzle ORM
- Dockerized production deployment

## Tech Stack

- NestJS
- TypeScript
- PostgreSQL
- Drizzle ORM
- Neon serverless PostgreSQL driver
- JWT
- Passport
- Resend for email delivery
- Google OAuth
- Winston logging
- Helmet
- Cookie Parser
- Class Validator
- Docker
- Railway

## API Overview

All routes are prefixed with:

```txt
/api/v1
```

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/` | Health/root endpoint |
| `POST` | `/auth/register` | Register a new user |
| `GET` | `/auth/verify-email?token=...` | Verify email address |
| `POST` | `/auth/login` | Login user |
| `POST` | `/auth/refresh` | Refresh access token |
| `POST` | `/auth/logout` | Logout current session |
| `POST` | `/auth/logout-all` | Logout all user sessions |
| `POST` | `/auth/forgot-password` | Request password reset email |
| `POST` | `/auth/reset-password?token=...` | Reset password |
| `POST` | `/auth/update-password` | Update password for authenticated user |
| `GET` | `/auth/google` | Start Google OAuth |
| `GET` | `/auth/google/callback` | Google OAuth callback |
| `POST` | `/auth/2fa/setup` | Generate 2FA secret and QR code |
| `POST` | `/auth/2fa/verify` | Verify and enable 2FA |
| `POST` | `/auth/2fa/disable` | Disable 2FA |

Protected routes require:

```txt
Authorization: Bearer <access_token>
```

Refresh tokens are primarily handled through an HTTP-only `refreshToken` cookie. The refresh endpoint can also accept a refresh token in the request body.

## Example Requests

Register:

```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "firstName": "Daniel",
  "lastName": "Shola",
  "email": "daniel@example.com",
  "password": "Password@123",
  "confirmPassword": "Password@123"
}
```

Login:

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "daniel@example.com",
  "password": "Password@123"
}
```

Forgot password:

```http
POST /api/v1/auth/forgot-password
Content-Type: application/json

{
  "email": "daniel@example.com"
}
```

Reset password:

```http
POST /api/v1/auth/reset-password?token=<reset_token>
Content-Type: application/json

{
  "newPassword": "NewPassword@123",
  "confirmPassword": "NewPassword@123"
}
```

Update password:

```http
POST /api/v1/auth/update-password
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "oldPassword": "Password@123",
  "newPassword": "NewPassword@123",
  "confirmNewPassword": "NewPassword@123"
}
```

## Local Development

Install dependencies:

```bash
npm install
```

Create a `.env` file in the project root:

```env
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://user:password@host:5432/database

JWT_ACCESS_SECRET=your_access_token_secret
JWT_REFRESH_SECRET=your_refresh_token_secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

COOKIE_SECRET=your_cookie_secret
API_URL=http://localhost:3000
APP_URL=http://localhost:5000/api/v1

RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=onboarding@resend.dev

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/v1/auth/google/callback

HIBP_URL=https://api.pwnedpasswords.com/range
USER_AGENT=MyAuthSystem
```

For Railway, set `APP_URL` to the deployed API base URL:

```env
APP_URL=https://my-auth-system-production.up.railway.app/api/v1
```

This value is used when generating email verification and password reset links.
It is also used to build the Google OAuth callback URL:

```txt
https://my-auth-system-production.up.railway.app/api/v1/auth/google/callback
```

Add that exact callback URL to your Google Cloud OAuth client's authorized redirect URIs.

Push the database schema:

```bash
npm run db:push
```

Start the development server:

```bash
npm run start:dev
```

The local API will run at:

```txt
http://localhost:5000/api/v1
```

## Production Build

Build the project:

```bash
npm run build
```

Start the compiled app:

```bash
npm run start:prod
```

The production entry point is:

```txt
dist/main.js
```

## Docker Deployment

This project includes a Dockerfile with a build stage and a runtime stage.

Build the image:

```bash
docker build -t my-auth-system .
```

Run the container:

```bash
docker run -p 5000:5000 --env-file .env my-auth-system
```

## Railway Deployment Notes

The app is configured to run with:

```txt
node dist/main
```

Important production notes:

- Set all required environment variables in Railway.
- Use a production PostgreSQL connection string for `DATABASE_URL`.
- Keep secrets out of the repository.
- Run database schema changes before testing auth flows.
- Use relative imports or configure runtime path aliases properly before deployment.
- Do not copy TypeScript incremental build cache into production Docker builds.

## Project Structure

```txt
src
├── auth
│   ├── dto
│   ├── guards
│   ├── auth.controller.ts
│   ├── auth.module.ts
│   └── auth.service.ts
├── common
│   ├── decorators
│   ├── filter
│   └── validators
├── db
│   ├── db.ts
│   └── schema.ts
├── email
├── google
├── hash-password
├── logger
├── refresh-token
├── two-factor-auth
├── users
├── app.module.ts
└── main.ts
```

## Security Highlights

- Passwords are hashed before storage.
- Access tokens and refresh tokens use separate secrets.
- Refresh tokens are stored as hashes in the database.
- Refresh-token reuse can revoke a token family.
- Sensitive endpoints are rate-limited.
- DTO validation rejects unknown request fields.
- Cookies are HTTP-only and marked secure in production.
- Helmet is enabled for common HTTP security headers.

## Scripts

```bash
npm run build
npm run start
npm run start:dev
npm run start:prod
npm run db:push
npm run db:generate
npm run db:migrate
npm run db:studio
npm run test
npm run test:e2e
npm run test:cov
```

## Status

Deployed on Railway:

```txt
https://my-auth-system-production.up.railway.app/api/v1
```

This API is suitable for demonstrating backend authentication architecture, production deployment workflow, and secure session handling in a NestJS application.
