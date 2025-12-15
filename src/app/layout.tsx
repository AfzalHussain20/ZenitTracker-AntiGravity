
'use client';

import { Suspense, useEffect } from 'react';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/context/AuthContext';
import { Inter, Space_Grotesk } from 'next/font/google';
import PwaInstaller from '@/components/pwa-installer';
import { ThemeProvider } from '@/components/theme-provider';
import ServiceWorkerRegistrar from '@/components/service-worker-registrar';
import TopLoader from '@/components/ui/top-loader';


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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data?.type === "SESSION_EXPIRED") {
          console.warn("[Client] Workstation session expired — redirecting to login");
          window.location.href = event.data.redirectUrl;
        }
      });
    }
  }, []);

  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`} suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#FFFFFF" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#1C2741" media="(prefers-color-scheme: dark)" />
         <link rel="manifest" href="/manifest.json" crossOrigin="use-credentials" />
      </head>
      <body className="font-body antialiased min-h-screen flex flex-col bg-background">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <Suspense fallback={null}>
                <TopLoader />
            </Suspense>
            {children}
            <Toaster />
            <PwaInstaller />
            <ServiceWorkerRegistrar />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
