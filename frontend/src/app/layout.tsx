import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: { default: 'RideShare — Fast, Safe Rides', template: '%s | RideShare' },
  description: 'Production-grade real-time ride-sharing platform. Book rides instantly, track drivers live, and arrive safely.',
  keywords: ['ride sharing', 'taxi', 'uber', 'ola', 'cab booking'],
  authors: [{ name: 'RideShare Team' }],
  openGraph: {
    type: 'website',
    siteName: 'RideShare',
    title: 'RideShare — Fast, Safe Rides',
    description: 'Production-grade real-time ride-sharing platform.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Outfit:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-surface text-white antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
