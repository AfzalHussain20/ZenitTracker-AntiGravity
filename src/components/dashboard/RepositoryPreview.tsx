"use client";

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Library, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function RepositoryPreview() {
  return (
    <Card className="glass-panel group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-blue-500/50 cursor-pointer">
      <Link href="/dashboard/repository" className="absolute inset-0 z-20" aria-label="Access Test Repository" />

      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        <Library className="h-16 w-16 text-blue-500 rotate-12" />
      </div>

      <CardHeader className="pb-2 relative z-10">
        <CardTitle className="flex items-center gap-3 text-base group-hover:text-blue-500 transition-colors">
          <div className="p-2 rounded-lg bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
            <Library className="text-blue-500 h-4 w-4" />
          </div>
          Test Repository
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-2 px-6 pb-4 relative z-10">
        <div className="flex items-center justify-between text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors group-hover:translate-x-1 duration-300">
          Access Library <ArrowRight className="h-4 w-4" />
        </div>
      </CardContent>
    </Card>
  );
}
