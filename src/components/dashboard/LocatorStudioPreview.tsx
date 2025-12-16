"use client";
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { FlaskConical, ArrowRight } from 'lucide-react';

export default function LocatorStudioPreview() {
  return (
    <Card className="glass-panel group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-purple-500/50 cursor-pointer">
      <Link href="/dashboard/locator-studio" className="absolute inset-0 z-20" aria-label="Open Locator Lab" />

      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        <FlaskConical className="h-16 w-16 text-purple-500 rotate-12" />
      </div>

      <CardHeader className="pb-2 relative z-10">
        <CardTitle className="flex items-center gap-3 text-base group-hover:text-purple-500 transition-colors">
          <div className="p-2 rounded-lg bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
            <FlaskConical className="text-purple-500 h-4 w-4" />
          </div>
          Locator Lab
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          Generate robust selectors from DOM content.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-2 relative z-10">
        <div className="flex items-center justify-between text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors group-hover:translate-x-1 duration-300">
          Open Lab <ArrowRight className="h-4 w-4" />
        </div>
      </CardContent>
    </Card>
  );
}