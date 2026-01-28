import './globals.css';
import { Inter, Space_Grotesk, Syne, Figtree, Instrument_Sans } from 'next/font/google';
import { Providers } from '@/components/Providers';
import { AnimatedBackground } from '@/components/ui/animated-background';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-syne',
  display: 'swap',
});

const figtree = Figtree({
  subsets: ['latin'],
  variable: '--font-figtree',
  display: 'swap',
});

const instrumentSans = Instrument_Sans({
  subsets: ['latin'],
  variable: '--font-instrument-sans',
  display: 'swap',
});

export const metadata = {
  title: 'Zenit Tracker | Precision Testing',
  description: 'Enterprise-grade test tracking and management system.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable} ${syne.variable} ${figtree.variable} ${instrumentSans.variable}`} suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#FFFFFF" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#0a0a16" media="(prefers-color-scheme: dark)" />
        <link rel="manifest" href="/manifest.json" crossOrigin="use-credentials" />
      </head>
      <body className="font-body antialiased min-h-screen flex flex-col bg-background">
        <Providers>
          <AnimatedBackground />
          <main className="relative z-10 flex flex-col min-h-screen">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
