# Security Policy & Implementation

This document describes the security measures implemented in AeroArcade. It serves as both a checklist for audits and a reference for developers.

---

## 1. Password Hashing (Argon2 / bcrypt)

- Passwords are hashed using **Argon2** (`argon2` package) with the default memory, time, and parallelism parameters.
- A **bcrypt fallback** (salt rounds = 12) is available in the seed script and legacy paths.
- Passwords are **never stored in plaintext** or logged at any point.
- Password hash field (`password_hash`) is excluded from all API responses via Prisma field selection.

**Implementation**: `backend/src/auth/auth.service.ts`, `backend/prisma/seed.ts`

---

## 2. HTTP-Only Secure Cookies

- JWT refresh tokens are stored in **HTTP-only, secure, SameSite cookies**.
- Cookies are not accessible via JavaScript (`HttpOnly`), preventing XSS-based token theft.
- The `Secure` flag is enabled in production (HTTPS required).
- `SameSite=Lax` prevents CSRF by restricting cross-origin cookie sending.

**Implementation**: `backend/src/main.ts:21-23` (cookie-parser middleware)

---

## 3. CSRF Protection

- **SameSite cookies** (`SameSite=Lax / Strict`) prevent cross-origin form submission attacks.
- All state-changing requests require authentication via JWT Bearer token in the `Authorization` header.
- No CSRF token is needed because the API uses the `Authorization` header (immune to CSRF by default).
- CORS is restricted to a single allowed origin (`CORS_ORIGIN` env var).

---

## 4. CORS Configuration

```typescript
app.enableCors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
});
```

- Only the configured origin is allowed (defaults to `http://localhost:3000` in development).
- Credentials (cookies) are only sent when the origin matches.
- In production, `CORS_ORIGIN` must be set to the actual frontend domain.

**Implementation**: `backend/src/main.ts:16-19`

---

## 5. Rate Limiting

- **Global rate limit**: 100 requests per 60 seconds per IP (via `@nestjs/throttler`).
- **Nginx rate limiting** (production):
  - API endpoints: 30 requests/second with burst of 20
  - General traffic: 100 requests/second with burst of 50
- Auth endpoints should be further restricted (see Brute Force Protection).

**Implementation**: `backend/src/app.module.ts:20-25`, `docker/nginx.conf:9-10`

---

## 6. Input Validation

- **Class-validator** with **whitelist mode** is enabled globally.
- `whitelist: true` strips unknown properties from request bodies.
- `forbidNonWhitelisted: true` rejects requests with unexpected properties.
- `transform: true` auto-transforms payloads to DTO instances.
- Zod validation on the frontend (React Hook Form + Zod) provides client-side validation.

**Implementation**: `backend/src/main.ts:25-31`

---

## 7. SQL Injection Prevention

- All database queries use **Prisma ORM** with **parameterized queries**.
- Raw SQL is never constructed through string concatenation.
- Prisma's type-safe query builder automatically escapes user input.

**Database**: `backend/prisma/schema.prisma` via `@prisma/client`

---

## 8. Content Security Policy

- Helmet's CSP middleware sets default security headers.
- In production, the Nginx configuration adds:
  - `X-Frame-Options: SAMEORIGIN`
  - `X-Content-Type-Options: nosniff`
  - `X-XSS-Protection: 1; mode=block`
- A strict CSP should be added via Helmet configuration:

```typescript
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", "data:", "https:"],
    connectSrc: ["'self'", process.env.CORS_ORIGIN],
    fontSrc: ["'self'"],
    objectSrc: ["'none'"],
    frameSrc: ["'none'"],
  },
}));
```

---

## 9. Secure Headers (Helmet)

- `helmet()` middleware sets 15+ security headers including:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: SAMEORIGIN`
  - `X-XSS-Protection: 1; mode=block`
  - `Strict-Transport-Security` (set by Nginx in production)
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy` restricting camera, microphone, geolocation

**Implementation**: `backend/src/main.ts:21`, `docker/nginx.conf:32-37`

---

## 10. XSS Prevention

- React's JSX escaping handles output encoding.
- Helmet's `X-XSS-Protection` header adds browser-level XSS filter.
- CSP restricts script sources.
- HTTP-only cookies prevent session token theft via XSS.
- Never use `dangerouslySetInnerHTML` in React components.

---

## 11. Brute Force Protection

- **Rate limiting** on auth endpoints via `@nestjs/throttler` (100 requests/60s globally).
- For stricter auth protection, configure a dedicated rate limiter:

```typescript
// In auth.controller.ts
@UseGuards(ThrottlerGuard)
@Throttle({ default: { ttl: 60000, limit: 5 } })
@Post('login')
async login(@Body() dto: LoginDto) { ... }
```

- Account lockout should be implemented after N failed attempts.
- Password reset tokens have a short expiration and are single-use.

---

## 12. Refresh Token Rotation

- Each login creates a new session with a unique refresh token.
- When a refresh token is used, it is **rotated** (old token invalidated, new token issued).
- If a compromised refresh token is used, all sessions for that user can be revoked.
- Refresh tokens are stored as SHA-256 hashes in the `sessions` table.
- Session expiration is configurable via the `expiresAt` field.

**Models**: `backend/prisma/schema.prisma:138-153` (Session model)

---

## 13. Audit Logging

- All administrative actions are logged to `admin_audit_logs` table.
- Logged fields: admin user ID, action type, entity type, entity ID, changes (JSON diff), IP address, timestamp.
- Audit logs are **append-only** and cannot be modified by administrators.
- Regular users cannot access audit logs.

**Model**: `backend/prisma/schema.prisma:440-456` (AdminAuditLog)

---

## 14. Role-Based Access Control (RBAC)

- Two roles: `USER` (default) and `ADMIN`.
- Role-based guards protect admin endpoints.
- `@Roles('ADMIN')` decorator on controller methods.
- `RolesGuard` checks the user's role from the JWT payload.
- Unauthorized access returns HTTP 403 Forbidden.

**Implementation**: `backend/src/common/guards/roles.guard.ts`, `backend/src/common/decorators/roles.decorator.ts`

---

## 15. Environment Variable Security

- `.env` is listed in `.gitignore` and **never committed**.
- `.env.example` provides a template without real secrets.
- Production secrets are injected via Docker secrets or environment variables.
- Never hardcode secrets in source code.
- Rotate `JWT_SECRET` and `JWT_REFRESH_SECRET` regularly in production.

---

## 16. Safe Error Messages

- A global exception filter (`HttpExceptionFilter`) catches all unhandled errors.
- In production (`NODE_ENV=production`), stack traces are **never** returned to the client.
- Error responses follow the format: `{ statusCode, message, error }`.
- Internal server errors return a generic "Internal server error" message.

**Implementation**: `backend/src/common/filters/http-exception.filter.ts`

---

## 17. Dependency Security

- Dependencies are regularly updated via `npm update` and `npm audit fix`.
- CI pipeline includes `npm audit` to fail builds on critical vulnerabilities.
- Use `npm audit --production` to focus on runtime dependencies.
- Lockfiles (`package-lock.json`) ensure reproducible installs.
- Pin major versions in `package.json` to avoid breaking changes.

---

## 18. Session Management

- Users can view all active sessions (device info, IP, last activity).
- Users can **revoke** individual sessions or all sessions.
- Password change revokes all sessions except the current one.
- Admin can revoke any user's sessions.
- Sessions expire automatically based on `expiresAt` timestamp.
- Expired sessions are cleaned up periodically.

**Endpoint**: `GET /api/users/sessions`, `DELETE /api/users/sessions/:id`

---

## 19. Two-Factor Authentication (2FA) Notes

- TOTP-based 2FA using the `otplib` library (to be added via `twoFactorSecret` field).
- During setup, the user scans a QR code with their authenticator app.
- A backup codes list (10 codes) is generated for account recovery.
- 2FA can be enabled/disabled via the security settings page.
- When 2FA is enabled, login requires both password and TOTP code.

**Model field**: `User.twoFactorSecret` in `backend/prisma/schema.prisma:114`

---

## Security Checklist

- [x] Passwords hashed with Argon2/bcrypt
- [x] HTTP-only, secure, SameSite cookies
- [x] CORS restricted to single origin
- [x] Global rate limiting (ThrottlerModule)
- [x] Input validation with whitelist mode
- [x] Prisma parameterized queries (no SQL injection)
- [x] Helmet security headers
- [x] Global exception filter (no stack traces in production)
- [x] Role-based access control
- [x] Admin audit logging
- [x] Refresh token rotation
- [ ] Content Security Policy (needs explicit configuration)
- [ ] Rate limiting on auth endpoints (needs dedicated throttler)
- [ ] Account lockout after failed attempts (to be implemented)
- [ ] 2FA fully implemented (schema ready, UI pending)
- [ ] Email verification flow (to be completed)
- [ ] Brute force protection on password reset

---

## Reporting a Vulnerability

If you discover a security vulnerability, please do not open a public issue. Instead, email the project maintainer directly at security@aeroarcade.com. We will respond within 48 hours and coordinate a fix before public disclosure.
