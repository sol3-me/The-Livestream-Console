import LoginButton from '@/components/LoginButton';
import { authOptions } from '@/lib/authOptions';
import { getServerSession } from 'next-auth';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function LoginPage() {
  const session = await getServerSession(authOptions);
  if (session) redirect('/dashboard');

  return (
    <section className="py-24 text-center container mx-auto px-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-light mb-4">Get Started</h1>
        <hr className="my-4 border-gray-200" />
        <p className="text-gray-600 mb-3">
          To manage your YouTube live streams, log in with Google.
        </p>
        <p className="text-gray-600 mb-6">
          We do <strong>not</strong> store your data or send your information to advertisers.{' '}
          Read more about our{' '}
          <Link
            href="/about"
            className="text-blue-600 underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            terms of service and privacy policy
          </Link>
          .
        </p>
        <hr className="my-4 border-gray-200" />
        <LoginButton />
      </div>
    </section>
  );
}
