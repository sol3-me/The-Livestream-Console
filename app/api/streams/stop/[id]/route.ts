import { authOptions } from '@/lib/authOptions';
import { getYouTubeService } from '@/lib/services/youtube';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.access_token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { stopStreamById } = getYouTubeService();
  try {
    await stopStreamById(session.access_token, params.id);
    return NextResponse.json({ redirectUrl: '/streams' });
  } catch (e) {
    console.error('ERROR STOPPING:', e);
    return NextResponse.json(e, { status: 500 });
  }
}
