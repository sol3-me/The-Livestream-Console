import DashboardClient from '@/components/DashboardClient';
import { authOptions } from '@/lib/authOptions';
import type { FormattedStream } from '@/lib/types';
import { formatStreams } from '@/lib/utils';
import { getLiveStreamsByIds, getStreams } from '@/lib/youtube';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

type BroadcastItem = { id?: string; contentDetails?: { boundStreamId?: string } };
type BroadcastsResponse = { data?: { items?: BroadcastItem[] } };

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  let activeStreams: FormattedStream[] = [];
  let completedStreams: FormattedStream[] = [];
  let upcomingCount = 0;

  try {
    const [active, completed, upcoming] = await Promise.all([
      getStreams(session.access_token!, 'active'),
      getStreams(session.access_token!, 'completed'),
      getStreams(session.access_token!, 'upcoming'),
    ]);

    const allItems = [
      ...((active as BroadcastsResponse).data?.items ?? []),
      ...((completed as BroadcastsResponse).data?.items ?? []),
    ];
    const boundStreamIds = Array.from(
      new Set(
        allItems
          .map((i) => i.contentDetails?.boundStreamId)
          .filter((id): id is string => !!id),
      ),
    );
    const liveStreamItems =
      boundStreamIds.length > 0
        ? await getLiveStreamsByIds(session.access_token!, boundStreamIds)
        : [];

    type LiveStreamItem = { id?: string; snippet?: { title?: string } };
    const streamKeyNameMap = new Map(
      (liveStreamItems as LiveStreamItem[]).map((s) => [s.id ?? '', s.snippet?.title ?? '']),
    );

    activeStreams = formatStreams(active, streamKeyNameMap);
    completedStreams = formatStreams(completed, streamKeyNameMap);
    upcomingCount = ((upcoming as BroadcastsResponse).data?.items ?? []).length;
  } catch {
    // degrade gracefully — dashboard still renders with empty data
  }

  return (
    <DashboardClient
      activeStreams={activeStreams}
      completedStreams={completedStreams}
      upcomingCount={upcomingCount}
    />
  );
}

