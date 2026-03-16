import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/authOptions';
import { getStreams } from '@/lib/youtube';
import { formatStreams, parallelAsync } from '@/lib/utils';
import { streamStatus } from '@/lib/constants';
import StreamsClient from '@/components/StreamsClient';
import type { StreamsData, StreamsPageError } from '@/lib/types';

export default async function StreamsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');
  // Force re-login if the refresh token is exhausted
  if (session.error === 'RefreshAccessTokenError') redirect('/api/auth/signin');

  let streamsData: StreamsData | null = null;
  let error: StreamsPageError | null = null;

  try {
    const { upcoming, active, last } = await parallelAsync({
      upcoming: getStreams(session.access_token!, streamStatus.UPCOMING),
      active: getStreams(session.access_token!, streamStatus.ACTIVE, 1),
      last: getStreams(session.access_token!, streamStatus.COMPLETED, 1),
    });
    streamsData = {
      active: formatStreams(active),
      upcoming: formatStreams(upcoming),
      last: formatStreams(last),
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
