/**
 * Better Auth integration boundary.
 *
 * This scaffold currently uses header-based auth for local API testing.
 * Replace with concrete Better Auth route handlers and session verification
 * in implementation hardening.
 */
export const betterAuthConfig = {
  basePath: process.env.BETTER_AUTH_BASE_PATH ?? "/api/auth",
  secretConfigured: Boolean(process.env.BETTER_AUTH_SECRET)
};

