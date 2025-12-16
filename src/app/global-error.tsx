"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertOctagon, RefreshCw } from "lucide-react";

// Global error must define its own html/body tags
export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("Global Fatal Error:", error);
    }, [error]);

    return (
        <html lang="en">
            <body className="min-h-screen bg-black text-white flex items-center justify-center p-4 font-sans">
                <div className="max-w-md w-full text-center space-y-8">
                    <div className="mx-auto w-24 h-24 bg-red-900/30 rounded-full flex items-center justify-center mb-6 ring-4 ring-red-500/50">
                        <AlertOctagon className="w-12 h-12 text-red-500" />
                    </div>

                    <h1 className="text-3xl font-bold tracking-tight">
                        Critical Failure
                    </h1>

                    <p className="text-slate-400">
                        The application encountered a fatal error in the root layout.
                    </p>

                    <div className="p-4 bg-red-950/30 border border-red-900 rounded text-left overflow-auto text-xs font-mono text-red-200">
                        {error.message}
                    </div>

                    <Button onClick={() => reset()} variant="destructive" className="w-full h-12 text-lg">
                        <RefreshCw className="mr-2 w-5 h-5" /> Reboot System
                    </Button>
                </div>
            </body>
        </html>
    );
}
