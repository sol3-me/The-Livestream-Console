import { NextResponse } from 'next/server';

interface GitHubRelease {
    tag_name?: string;
    html_url?: string;
}

export async function GET() {
    try {
        const res = await fetch('https://api.github.com/repos/sol3uk/The-Livestream-Console/releases/latest', {
            headers: {
                Accept: 'application/vnd.github+json',
                'User-Agent': 'The-Livestream-Console',
            },
            next: { revalidate: 3600 },
        });

        if (!res.ok) {
            return NextResponse.json({ error: 'Failed to fetch latest release.' }, { status: 502 });
        }

        const data = (await res.json()) as GitHubRelease;
        const tag = data.tag_name ?? '';
        const version = tag.startsWith('v') ? tag.slice(1) : tag;

        if (!version || !data.html_url) {
            return NextResponse.json({ error: 'Latest release data is incomplete.' }, { status: 502 });
        }

        return NextResponse.json({
            version,
            url: data.html_url,
        });
    } catch {
        return NextResponse.json({ error: 'Failed to fetch latest release.' }, { status: 502 });
    }
}
