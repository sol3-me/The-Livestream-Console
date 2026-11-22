import { NextRequest, NextResponse } from 'next/server';

export async function POST(_req: NextRequest) {
    return new NextResponse(null, { status: 404 });
}
