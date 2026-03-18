import { NextResponse } from 'next/server';

interface EnvCheck {
    key: string;
    set: boolean;
    description: string;
}

/**
 * GET /api/health
 *
 * Returns the runtime health state of the container: which required
 * environment variables are present and what the Node/Next versions are.
 * Values are never exposed — only presence/absence.
 */
export async function GET() {
    const checks: EnvCheck[] = [
        {
            key: 'NEXTAUTH_SECRET',
            set: !!process.env.NEXTAUTH_SECRET,
            description: 'JWT encryption key for Auth.js sessions',
        },
        {
            key: 'NEXTAUTH_URL',
            set: !!process.env.NEXTAUTH_URL,
            description: 'Public URL of this app',
        },
        {
            key: 'GOOGLE_CLIENT_ID',
            set: !!process.env.GOOGLE_CLIENT_ID,
            description: 'Google OAuth 2.0 Client ID',
        },
        {
            key: 'GOOGLE_CLIENT_SECRET',
            set: !!process.env.GOOGLE_CLIENT_SECRET,
            description: 'Google OAuth 2.0 Client Secret',
        },
    ];

    const missing = checks.filter((c) => !c.set).map((c) => c.key);
    const healthy = missing.length === 0;

    const body = {
        status: healthy ? 'ok' : 'degraded',
        healthy,
        ...(missing.length > 0 && { missing }),
        env: checks.map(({ key, set, description }) => ({ key, set, description })),
        runtime: {
            node: process.version,
            nextauth_debug: process.env.NEXTAUTH_DEBUG === '1',
            node_env: process.env.NODE_ENV,
        },
    };

    return NextResponse.json(body, { status: healthy ? 200 : 503 });
}
