import { type AuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

async function refreshAccessToken(token: Record<string, unknown>) {
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        grant_type: 'refresh_token',
        refresh_token: token.refresh_token as string,
      }),
    });
    const tokens = (await response.json()) as Record<string, unknown>;
    if (!response.ok) throw tokens;
    return {
      ...token,
      access_token: tokens.access_token as string,
      expires_at: Math.floor(Date.now() / 1000 + (tokens.expires_in as number)),
      refresh_token: (tokens.refresh_token as string | undefined) ?? token.refresh_token,
      error: undefined,
    };
  } catch {
    return { ...token, error: 'RefreshAccessTokenError' };
  }
}

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'openid email profile https://www.googleapis.com/auth/youtube',
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, account }) {
      // On first sign-in, persist tokens from the provider
      if (account) {
        return {
          ...token,
          access_token: account.access_token,
          refresh_token: account.refresh_token,
          expires_at: account.expires_at,
        };
      }
      // Token still valid
      if (Date.now() < (token.expires_at as number) * 1000) {
        return token;
      }
      // Token expired – try to refresh
      return refreshAccessToken(token as Record<string, unknown>);
    },
    async session({ session, token }) {
      session.access_token = token.access_token as string;
      if (token.error) session.error = token.error as string;
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
};
