
import './globals.css';
import { Inter, Space_Grotesk } from 'next/font/google';
import { Providers } from '@/components/Providers';

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
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`} suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#FFFFFF" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#1C2741" media="(prefers-color-scheme: dark)" />
        <link rel="manifest" href="/manifest.json" crossOrigin="use-credentials" />
      </head>
      <body className="font-body antialiased min-h-screen flex flex-col bg-background">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
