import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'The Livestream Console',
  description: 'Manage your YouTube live streams',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Prevent flash of unstyled content by setting dark class before React hydrates */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark');}})();`,
          }}
        />
      </head>
      <body className="flex flex-col min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100 transition-colors">
        <Providers>
          <Navbar />
          <Toaster richColors position="top-right" closeButton />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
