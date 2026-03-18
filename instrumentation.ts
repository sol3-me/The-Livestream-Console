/**
 * Next.js instrumentation hook — runs once when the server process starts.
 * Logs the presence (never the value) of every required environment variable
 * so container startup issues are immediately visible in Docker logs.
 */
export async function register() {
    const required: Record<string, string> = {
        NEXTAUTH_SECRET: 'JWT encryption key (run: openssl rand -base64 32)',
        NEXTAUTH_URL: 'Public URL of this app (e.g. http://localhost:3000)',
        GOOGLE_CLIENT_ID: 'OAuth 2.0 Client ID from Google Cloud Console',
        GOOGLE_CLIENT_SECRET: 'OAuth 2.0 Client Secret from Google Cloud Console',
    };

    const missing: string[] = [];
    const present: string[] = [];

    for (const [key, description] of Object.entries(required)) {
        if (process.env[key]) {
            present.push(key);
        } else {
            missing.push(`  ✗ ${key.padEnd(24)} — ${description}`);
        }
    }

    console.log('\n[TLC] ── Environment check ──────────────────────────────');
    present.forEach((key) => console.log(`[TLC]   ✓ ${key}`));

    if (missing.length > 0) {
        console.error('[TLC]');
        console.error('[TLC] MISSING REQUIRED ENVIRONMENT VARIABLES:');
        missing.forEach((msg) => console.error(`[TLC] ${msg}`));
        console.error('[TLC]');
        console.error('[TLC] The app will start but requests will fail until these are set.');
        console.error('[TLC] Pass them with: docker run -e NEXTAUTH_SECRET=... -e NEXTAUTH_URL=... etc.');
    } else {
        console.log('[TLC]   All required environment variables are set.');
    }

    if (process.env.NEXTAUTH_DEBUG === '1') {
        console.log('[TLC]   NEXTAUTH_DEBUG is enabled — verbose auth logs active.');
    }

    console.log('[TLC] ─────────────────────────────────────────────────\n');
}
