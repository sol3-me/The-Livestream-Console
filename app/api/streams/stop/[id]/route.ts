import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { stopStreamById } from '@/lib/youtube';

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.access_token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    await stopStreamById(session.access_token, params.id);
    return NextResponse.json({ redirectUrl: '/streams' });
  } catch (e) {
    console.error('ERROR STOPPING:', e);
    return NextResponse.json(e, { status: 500 });
  }
}
