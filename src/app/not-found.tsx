"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Home } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            {/* Background Ambient */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-500/5 blur-[120px] rounded-full mix-blend-multiply dark:mix-blend-screen" />
            </div>

            <div className="max-w-md w-full text-center space-y-6 relative z-10 glass-panel p-10 rounded-2xl border-white/20 dark:border-white/10">
                <div className="mx-auto w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mb-6 ring-4 ring-red-500/20">
                    <AlertTriangle className="w-12 h-12 text-red-500" />
                </div>

                <h1 className="text-4xl font-extrabold tracking-tight text-foreground">
                    404: Lost in Space
                </h1>

                <p className="text-muted-foreground text-lg">
                    The requested coordinate system is undefined. This page does not exist or has been moved.
                </p>

                <Button asChild className="w-full h-12 text-base bg-foreground text-background hover:bg-foreground/90">
                    <Link href="/dashboard">
                        <Home className="mr-2 w-4 h-4" /> Return to Command Center
                    </Link>
                </Button>
            </div>
        </div>
    );
}
