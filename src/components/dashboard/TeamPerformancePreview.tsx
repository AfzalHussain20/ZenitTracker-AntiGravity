
"use client";

import { useAuth } from '@/context/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, BarChart } from 'lucide-react';
import Link from 'next/link';

export default function TeamPerformancePreview() {
  const { userRole } = useAuth();

  // This component will only render its content for users with the 'lead' role.
  if (userRole !== 'lead') {
    return null;
  }

  return (
    <Card className="transition-all hover:shadow-lg hover:-translate-y-1 h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <Users className="text-primary" /> Team Performance
        </CardTitle>
        <CardDescription>Get a high-level overview of your team's activity.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button asChild className="w-full">
            <Link href="/team">
                <BarChart className="mr-2 h-4 w-4" /> View Full Report
            </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
