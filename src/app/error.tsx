"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import Link from 'next/link';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("Zenit Runtime Error:", error);
    }, [error]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            {/* Background Ambient */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/5 blur-[120px] rounded-full mix-blend-multiply dark:mix-blend-screen" />
            </div>

            <div className="max-w-md w-full text-center space-y-6 relative z-10 glass-panel p-10 rounded-2xl border-indigo-500/20">
                <div className="mx-auto w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mb-6 ring-4 ring-red-500/20 animate-pulse">
                    <AlertCircle className="w-12 h-12 text-red-500" />
                </div>

                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">
                        System Malfunction
                    </h2>
                    <p className="text-muted-foreground mt-2 text-sm">
                        Next.js detected a runtime error.
                    </p>
                    <div className="mt-4 p-4 bg-muted/50 rounded-lg text-xs font-mono text-left overflow-auto max-h-32 border border-border">
                        {error.message || "Unknown error occurred."}
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    <Button onClick={() => reset()} className="w-full h-11">
                        <RefreshCw className="mr-2 w-4 h-4" /> Try Again
                    </Button>
                    <Button variant="outline" asChild className="w-full h-11">
                        <Link href="/dashboard">
                            <Home className="mr-2 w-4 h-4" /> Return to Dashboard
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
