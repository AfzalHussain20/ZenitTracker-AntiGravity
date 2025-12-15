
"use client";

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebaseConfig';
import { collection, onSnapshot } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Library } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

export default function RepositoryPreview() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const q = collection(db, "managedTestCases");
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCount(snapshot.size);
    }, (error) => {
      console.error("Error fetching test case count:", error);
      setCount(0);
    });

    return () => unsubscribe();
  }, []);

  if (count === null) {
      return (
          <Card>
              <CardHeader className="pb-2">
                 <Skeleton className="h-5 w-3/4" />
                 <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent className="space-y-3 pt-2">
                  <div className="text-center space-y-1">
                    <Skeleton className="h-6 w-12 mx-auto" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-9 w-full" />
              </CardContent>
          </Card>
      )
  }

  return (
    <Card className="transition-all hover:shadow-lg hover:-translate-y-1">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-3 text-base">
          <Library className="text-primary h-5 w-5" /> Test Repository
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-2 text-center">
         <div>
            <p className="text-xl font-bold">{count}</p>
            <p className="text-xs text-muted-foreground">Total Test Cases</p>
        </div>
        <Button asChild size="sm" className="w-full">
            <Link href="/dashboard/repository">
                Go to Repository
            </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
