
"use client";

import { useMemo } from 'react';
import type { TestSession, TestCase } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Clock, History } from 'lucide-react';
import { formatDistanceToNowStrict } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface RecentActivityProps {
  sessions: TestSession[];
}

interface ActivityItem extends TestCase {
  platformName: string;
}

export default function RecentActivity({ sessions }: RecentActivityProps) {
  const recentActivity = useMemo(() => {
    const allActionedCases: ActivityItem[] = [];
    
    sessions.forEach(session => {
      session.testCases.forEach(tc => {
        if (tc.status !== 'Untested') {
          allActionedCases.push({
            ...tc,
            platformName: session.platformDetails.platformName,
          });
        }
      });
    });

    // Sort by last modified date, descending
    allActionedCases.sort((a, b) => {
        const dateA = (a.lastModified as any)?.toDate ? (a.lastModified as any).toDate() : new Date(a.lastModified);
        const dateB = (b.lastModified as any)?.toDate ? (b.lastModified as any).toDate() : new Date(b.lastModified);
        return dateB.getTime() - dateA.getTime();
    });

    return allActionedCases.slice(0, 5);
  }, [sessions]);
  
  if (recentActivity.length === 0) {
      return null; // Don't render the card if there's no activity
  }

  const getValidDate = (d: any): Date | null => {
    if (!d) return null;
    if (d instanceof Date) return d;
    if ((d as any)?.toDate) return (d as any).toDate(); // Firestore Timestamp
    const date = new Date(d);
    return isNaN(date.getTime()) ? null : date;
  };

  return (
    <Card className="transition-all hover:shadow-lg hover:-translate-y-1">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <History className="text-primary"/> Recent Activity
        </CardTitle>
        <CardDescription>Your 5 most recently actioned test cases.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Test Case</TableHead>
              <TableHead>Platform</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentActivity.map(item => {
              const lastModifiedDate = getValidDate(item.lastModified);
              return (
                <TableRow key={item.id}>
                  <TableCell className="font-medium max-w-[200px] truncate">
                      <TooltipProvider>
                          <Tooltip>
                              <TooltipTrigger asChild>
                                  <span className="cursor-help">{item.testCaseTitle}</span>
                              </TooltipTrigger>
                              <TooltipContent>
                                  <p>{item.testCaseTitle}</p>
                              </TooltipContent>
                          </Tooltip>
                      </TooltipProvider>
                  </TableCell>
                  <TableCell><Badge variant="outline">{item.platformName}</Badge></TableCell>
                  <TableCell>
                    <Badge variant={
                      item.status === 'Pass' ? 'default' :
                      item.status === 'Fail' ? 'destructive' :
                      item.status === 'Fail (Known)' ? 'destructive' :
                      item.status === 'N/A' ? 'secondary' : 'outline'
                    } className={item.status === 'Fail (Known)' ? 'bg-orange-600' : ''}>
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground text-xs">
                    {lastModifiedDate ? formatDistanceToNowStrict(lastModifiedDate, { addSuffix: true }) : 'Invalid date'}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
