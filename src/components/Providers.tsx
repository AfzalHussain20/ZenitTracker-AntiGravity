
"use client";

import { ReactNode, Suspense, useEffect } from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import TopLoader from '@/components/ui/top-loader';
import PwaInstaller from '@/components/pwa-installer';
import ServiceWorkerRegistrar from '@/components/service-worker-registrar';

export function Providers({ children }: { children: ReactNode }) {
    useEffect(() => {
        if ("serviceWorker" in navigator) {
            const handleMessage = (event: MessageEvent) => {
                if (event.data?.type === "SESSION_EXPIRED") {
                    console.warn("[Client] Workstation session expired — redirecting to login");
                    window.location.href = event.data.redirectUrl;
                }
            };
            navigator.serviceWorker.addEventListener("message", handleMessage);
            return () => navigator.serviceWorker.removeEventListener("message", handleMessage);
        }
    }, []);

    return (
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
    );
}
