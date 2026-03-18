import Link from 'next/link';

export default function AboutPage() {
  return (
    <section className="py-16 container mx-auto px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-light text-center mb-6">About</h1>
        <hr className="my-4 border-gray-200" />
        <article className="text-center mb-8">
          <h2 className="text-xl font-semibold mb-3">Welcome to The Livestream Console</h2>
          <p className="text-gray-600 mb-3">
            This app was built to help users control their YouTube livestreams in a more accessible
            way.
          </p>
          <p className="text-gray-600">
            This site is fully open source — feel free to contribute, fork, reuse and customise as
            you see fit. All I ask is accreditation to{' '}
            <a
              href="https://github.com/sol3uk"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline"
            >
              @sol3uk
            </a>
            .
          </p>
        </article>
        <article className="mb-8">
          <h3 className="text-lg font-semibold mb-3">Accreditations</h3>
          <ul className="list-disc list-inside space-y-1 text-gray-600 text-sm">
            <li>
              My colleague and friend{' '}
              <a
                href="https://github.com/npmSteven"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                @npmSteven
              </a>
            </li>
            <li>
              <a href="https://nextjs.org/" target="_blank" className="text-blue-600 underline">
                Next.js
              </a>{' '}
              +{' '}
              <a href="https://authjs.dev/" target="_blank" className="text-blue-600 underline">
                Auth.js
              </a>
            </li>
            <li>
              <a
                href="https://tailwindcss.com/"
                target="_blank"
                className="text-blue-600 underline"
              >
                Tailwind CSS
              </a>
            </li>
            <li>
              <a
                href="https://developers.google.com/youtube/v3"
                target="_blank"
                className="text-blue-600 underline"
              >
                YouTube Data API v3
              </a>
            </li>
            <li>
              <a
                href="https://app.termsfeed.com/"
                target="_blank"
                className="text-blue-600 underline"
              >
                Terms Feed
              </a>{' '}
              (ToS &amp; Privacy Policy)
            </li>
          </ul>
        </article>
        <hr className="my-4 border-gray-200" />
        <article className="text-center">
          <h2 className="text-xl font-semibold mb-3">Terms Of Service &amp; Privacy Policy</h2>
          <p className="text-gray-600 mb-3">
            In short, we do not store or sell your information. This app was made solely to help
            people control their YouTube livestreams.
          </p>
          <p className="text-gray-600 mb-3">
            This entire app is open source and can be browsed in full{' '}
            <a
              href="https://github.com/sol3uk/The-Livestream-Console"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline"
            >
              here
            </a>
            .
          </p>
          <ul className="space-y-1 text-sm">
            <li>
              <Link href="/tos" className="text-blue-600 underline">
                Terms of Service
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="text-blue-600 underline">
                Privacy Policy
              </Link>
            </li>
          </ul>
        </article>
      </div>
    </section>
  );
}
