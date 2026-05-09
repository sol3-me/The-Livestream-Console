import StreamsClient from '@/components/StreamsClient';
import { authOptions } from '@/lib/authOptions';
import { streamStatus } from '@/lib/constants';
import type { StreamsData, StreamsPageError } from '@/lib/types';
import { formatStreams, parallelAsync } from '@/lib/utils';
import { getLiveStreamsByIds, getStreams } from '@/lib/youtube';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

export default async function StreamsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');
  // Force re-login if the refresh token is exhausted
  if (session.error === 'RefreshAccessTokenError') redirect('/api/auth/signin');

  let streamsData: StreamsData | null = null;
  let error: StreamsPageError | null = null;

  try {
    const { upcoming, active, completed } = await parallelAsync({
      upcoming: getStreams(session.access_token!, streamStatus.UPCOMING, 50),
      active: getStreams(session.access_token!, streamStatus.ACTIVE, 1),
      completed: getStreams(session.access_token!, streamStatus.COMPLETED, 50),
    });

    // Collect all bound stream IDs and batch-fetch their names in one call
    type BroadcastItem = { contentDetails?: { boundStreamId?: string } };
    const allItems = [
      ...((active as { data?: { items?: BroadcastItem[] } }).data?.items ?? []),
      ...((upcoming as { data?: { items?: BroadcastItem[] } }).data?.items ?? []),
      ...((completed as { data?: { items?: BroadcastItem[] } }).data?.items ?? []),
    ];
    const boundStreamIds = Array.from(
      new Set(
        allItems.map((i) => i.contentDetails?.boundStreamId).filter((id): id is string => !!id),
      ),
    );
    const liveStreamItems = await getLiveStreamsByIds(session.access_token!, boundStreamIds);
    const streamKeyNameMap = new Map(liveStreamItems.map((s) => [s.id!, s.snippet?.title ?? '']));

    const formattedCompleted = formatStreams(completed, streamKeyNameMap);
    streamsData = {
      active: formatStreams(active, streamKeyNameMap),
      upcoming: formatStreams(upcoming, streamKeyNameMap),
      completed: formattedCompleted,
      last: formattedCompleted.slice(0, 1),
    };
  } catch (e: unknown) {
    console.error('ERROR - /streams:', e);
    const ytError = e as { errors?: { message: string; extendedHelp?: string }[]; code?: number };
    if (ytError.errors) {
      error = {
        errorMessage: ytError.errors[0].message,
        helpLink: ytError.errors[0].extendedHelp,
        code: ytError.code,
      };
    } else {
      redirect('/');
    }
  }

  return <StreamsClient streams={streamsData} error={error} />;
}
