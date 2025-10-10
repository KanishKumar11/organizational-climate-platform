import type { Metadata } from 'next';
import { Inter, Roboto, Montserrat } from 'next/font/google';
import './globals.css';
import SessionProvider from '../components/providers/SessionProvider';
import { PWAProvider } from '../components/providers/PWAProvider';
import { QueryProvider } from '../components/providers/QueryProvider';
import { TranslationProvider } from '../contexts/TranslationContext';
import { Toaster } from '../components/ui/sonner';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const roboto = Roboto({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  variable: '--font-roboto',
  display: 'swap',
});

const montserrat = Montserrat({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-montserrat',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Organizational Climate Platform',
  description:
    'AI-powered organizational climate and culture measurement platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#3b82f6" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Climate Survey" />
      </head>
      <body
        className={`${inter.variable} ${roboto.variable} ${montserrat.variable} font-sans`}
      >
        <SessionProvider>
          <QueryProvider>
            <TranslationProvider>
              <PWAProvider>{children}</PWAProvider>
              <Toaster />
            </TranslationProvider>
          </QueryProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
