import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { createHash, timingSafeEqual } from "crypto";

/**
 * Constant-time string comparison.
 *
 * Both inputs are SHA-256 hashed first so the comparison runs over
 * fixed-length buffers (timingSafeEqual throws on length mismatch, and
 * comparing raw lengths would itself leak length information). The hash
 * keeps the compare time independent of where the first differing byte is,
 * defeating timing attacks against the credential check.
 */
function safeEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a, "utf8").digest();
  const hb = createHash("sha256").update(b, "utf8").digest();
  return timingSafeEqual(ha, hb);
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const expectedUsername = process.env.ADMIN_USERNAME;
        const expectedPassword = process.env.ADMIN_PASSWORD;

        // Fail closed: if the admin credentials are not configured, no login
        // is possible. This prevents an "undefined === undefined" bypass when
        // the env vars are absent, and avoids ever authenticating against an
        // empty secret.
        if (!expectedUsername || !expectedPassword) {
          return null;
        }

        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        // Constant-time comparison to avoid leaking timing information about
        // the configured username/password.
        const usernameMatches = safeEqual(credentials.username, expectedUsername);
        const passwordMatches = safeEqual(credentials.password, expectedPassword);

        if (usernameMatches && passwordMatches) {
          return {
            id: "1",
            name: "Admin",
            email: "admin@isaacavazquez.com",
          };
        }
        return null;
      }
    })
  ],
  pages: {
    signIn: '/admin', // Custom sign-in page
    error: '/admin', // Error code passed in query string as ?error=
  },
  session: {
    strategy: "jwt",
    // Admin sessions are stateless JWTs with no server-side revocation, so keep
    // the window short to limit the blast radius of a leaked token.
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.id as string;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Always redirect to admin page after successful authentication
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return `${baseUrl}/admin`;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};