"use client";

import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Clock, ArrowRight } from 'lucide-react';

export default function WrklogPreview() {
    return (
        <Card className="glass-panel group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-primary/50 cursor-pointer">
            <Link href="/wrklog" className="absolute inset-0 z-20" aria-label="Launch Wrklog" />

            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Clock className="h-16 w-16 text-primary rotate-12" />
            </div>

            <CardHeader className="pb-2 relative z-10">
                <CardTitle className="flex items-center gap-3 text-base group-hover:text-primary transition-colors">
                    <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                        <Clock className="text-primary h-4 w-4" />
                    </div>
                    Wrklog Team Hub
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                    AI-enhanced time tracking & productivity analytics.
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-2 relative z-10">
                <div className="flex items-center justify-between text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors group-hover:translate-x-1 duration-300">
                    Open Work Log <ArrowRight className="h-4 w-4" />
                </div>
            </CardContent>
        </Card>
    );
}
