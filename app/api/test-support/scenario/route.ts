import { DEFAULT_SCENARIO, isScenarioName, SCENARIO_NAMES } from '@/lib/services/youtube/fake/scenarios';
import { resetFakeStore } from '@/lib/services/youtube/fake/store';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Test-only: resets the fake YouTube to a named scenario (Playwright calls this before each test).
 * Body: { "scenario": "one-live" }. With no scenario it resets to the default.
 * Outside TLC_YOUTUBE_MODE=fake it is a 404, indistinguishable from a route that doesn't exist.
 */
export async function POST(req: NextRequest) {
    if (process.env.TLC_YOUTUBE_MODE !== 'fake') {
        return new NextResponse(null, { status: 404 });
    }
    const body = (await req.json().catch(() => ({}))) as { scenario?: unknown };
    const scenario = body?.scenario ?? DEFAULT_SCENARIO;
    if (!isScenarioName(scenario)) {
        return NextResponse.json(
            { error: `Unknown scenario "${String(scenario)}"`, scenarios: [...SCENARIO_NAMES] },
            { status: 400 },
        );
    }
    resetFakeStore(scenario);
    return NextResponse.json({ scenario });
}
