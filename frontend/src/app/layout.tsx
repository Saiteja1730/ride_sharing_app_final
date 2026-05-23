import type { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' });

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
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <body className="bg-surface text-white antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

