
import type { ReactNode, Suspense } from 'react';
import AppHeader from '@/components/layout/AppHeader';
import { Toaster } from '@/components/ui/toaster';
import TopLoader from '@/components/ui/top-loader';
import { Skeleton } from '@/components/ui/skeleton';

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="flex flex-col min-h-screen bg-background">
        <AppHeader />
        <main className="flex-1 container mx-auto py-8 px-4 sm:px-6 lg:px-8">
            {children}
        </main>
        <Toaster />
      </div>
    </>
  );
}
