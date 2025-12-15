
"use client";

import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wand2 } from 'lucide-react';

export default function CleverTapPreview() {

  return (
    <Card className="transition-all hover:shadow-lg hover:-translate-y-1">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-3 text-base">
          <Wand2 className="text-primary h-5 w-5" /> CleverTap Tracker
        </CardTitle>
         <CardDescription>
            Guided wizard for tracking event data.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-2">
        <Button asChild size="sm" className="w-full">
            <Link href="/dashboard/clevertap-tracker">
                Open Tracker Tool
            </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
