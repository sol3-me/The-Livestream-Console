import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/authOptions';
import Link from 'next/link';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  return (
    <section className="py-24 text-center container mx-auto px-4">
      <div className="max-w-lg mx-auto">
        <h1 className="text-4xl font-light mb-4">Dashboard</h1>
        <p className="text-gray-500 text-lg mb-8">
          This is your livestream control dashboard. More controls can be found below.
        </p>
        <div className="flex justify-center gap-4 flex-wrap">
          <Link
            href="/streams"
            className="bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700 transition-colors"
          >
            Upcoming Streams
          </Link>
          <button
            disabled
            className="bg-gray-200 text-gray-400 px-6 py-3 rounded-md font-medium cursor-not-allowed"
          >
            Create Stream — Coming Soon
          </button>
        </div>
      </div>
    </section>
  );
}
