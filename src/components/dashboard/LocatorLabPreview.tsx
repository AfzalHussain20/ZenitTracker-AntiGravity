"use client";
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FlaskConical } from 'lucide-react';

export default function LocatorLabPreview() {
  return (
    <Card className="transition-all hover:shadow-lg hover:-translate-y-1">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-3 text-base">
          <FlaskConical className="text-primary h-5 w-5" /> Locator Lab
        </CardTitle>
         <CardDescription>
            Generate locators from HTML content.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-2">
        <Button asChild size="sm" className="w-full">
            <Link href="/dashboard/locator-studio">
                Open Locator Lab
            </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
