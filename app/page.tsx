import { authOptions } from '@/lib/authOptions';
import { getServerSession } from 'next-auth';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  if (session) redirect('/dashboard');

  return (
    <section className="py-24 text-center container mx-auto px-4">
      <div className="max-w-lg mx-auto">
        <h1 className="text-4xl font-light mb-4">
          Welcome to
          <br />
          <strong>The Livestream Console!</strong>
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-lg mb-8">
          Manage your YouTube live streams in an easy way, and interact with existing events.
        </p>
        <Link
          href="/login"
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700 transition-colors"
        >
          Get Started
        </Link>
      </div>
    </section>
  );
}
