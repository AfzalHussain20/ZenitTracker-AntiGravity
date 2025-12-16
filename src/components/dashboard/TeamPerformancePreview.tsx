"use client";

import { useAuth } from '@/context/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Users, BarChart, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function TeamPerformancePreview() {
  const { userRole } = useAuth();

  // This component will only render its content for users with the 'lead' role.
  if (userRole !== 'lead') {
    return null;
  }

  return (
    <Card className="glass-panel group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-pink-500/50 cursor-pointer">
      <Link href="/team" className="absolute inset-0 z-20" aria-label="View Team Report" />

      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        <Users className="h-16 w-16 text-pink-500 rotate-12" />
      </div>

      <CardHeader className="pb-2 relative z-10">
        <CardTitle className="flex items-center gap-3 text-base group-hover:text-pink-500 transition-colors">
          <div className="p-2 rounded-lg bg-pink-500/10 group-hover:bg-pink-500/20 transition-colors">
            <BarChart className="text-pink-500 h-4 w-4" />
          </div>
          Team Analytics
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          Lead access only. Performance metrics overview.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-2 relative z-10">
        <div className="flex items-center justify-between text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors group-hover:translate-x-1 duration-300">
          View Report <ArrowRight className="h-4 w-4" />
        </div>
      </CardContent>
    </Card>
  );
}
