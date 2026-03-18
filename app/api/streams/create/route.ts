import { authOptions } from '@/lib/authOptions';
import { createStream } from '@/lib/youtube';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

interface CreateStreamBody {
    title: string;
    description?: string;
    startTime: string;
    privacyStatus?: string;
    autoStart?: string;
    autoStop?: string;
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.access_token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    try {
        const body = (await req.json()) as CreateStreamBody;
        if (!body.title?.trim()) {
            return NextResponse.json({ errors: [{ message: 'Title is required.' }] }, { status: 400 });
        }
        const scheduledStartTime = /[Z+]/.test(body.startTime)
            ? body.startTime
            : new Date(body.startTime).toISOString();

        await createStream(session.access_token, {
            title: body.title.trim(),
            description: body.description ?? '',
            scheduledStartTime,
            privacyStatus: body.privacyStatus ?? 'private',
            enableAutoStart: body.autoStart === 'true',
            enableAutoStop: body.autoStop === 'true',
        });
        return NextResponse.json({ redirectUrl: '/streams' });
    } catch (e) {
        console.error('ERROR CREATING:', e);
        return NextResponse.json(e, { status: 500 });
    }
}
