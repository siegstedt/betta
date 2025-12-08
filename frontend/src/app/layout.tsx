import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider, ErrorBoundary, Footer } from '@/components';
import { ErrorProvider } from '@/contexts/ErrorContext';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Betta - Get Better',
  description:
    'A comprehensive training and performance analysis platform for data-driven cyclists and coaches.',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
    other: [
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '32x32',
        url: '/favicon-32x32.png',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '16x16',
        url: '/favicon-16x16.png',
      },
      {
        rel: 'android-chrome',
        type: 'image/png',
        sizes: '192x192',
        url: '/android-chrome-192x192.png',
      },
      {
        rel: 'android-chrome',
        type: 'image/png',
        sizes: '512x512',
        url: '/android-chrome-512x512.png',
      },
    ],
  },
  manifest: '/site.webmanifest',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <body className={`${inter.className} flex flex-col min-h-full`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ErrorProvider>
            <ErrorBoundary>
              <main className="flex-1">{children}</main>
            </ErrorBoundary>
          </ErrorProvider>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
