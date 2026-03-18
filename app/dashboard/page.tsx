import { authOptions } from '@/lib/authOptions';
import DashboardActions from '@/components/DashboardActions';
import { getServerSession } from 'next-auth';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  return (
    <section className="py-24 text-center container mx-auto px-4">
      <div className="max-w-lg mx-auto">
        <h1 className="text-4xl font-light mb-4">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 text-lg mb-8">
          This is your livestream control dashboard. More controls can be found below.
        </p>
        <div className="flex justify-center gap-4 flex-wrap">
          <Link
            href="/streams"
            className="bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700 transition-colors"
          >
            Upcoming Streams
          </Link>
          <DashboardActions />
        </div>
      </div>
    </section>
  );
}
