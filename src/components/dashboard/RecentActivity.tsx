"use client";

import { useMemo } from 'react';
import type { TestSession, TestCase } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { History, Clock, FileKey } from 'lucide-react';
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
    return null;
  }

  const getValidDate = (d: any): Date | null => {
    if (!d) return null;
    if (d instanceof Date) return d;
    if ((d as any)?.toDate) return (d as any).toDate(); // Firestore Timestamp
    const date = new Date(d);
    return isNaN(date.getTime()) ? null : date;
  };

  return (
    <Card className="glass-panel overflow-hidden">
      <CardHeader className="border-b border-border bg-muted/20">
        <CardTitle className="flex items-center gap-2 text-lg">
          <History className="h-5 w-5 text-primary" /> Activity Log
        </CardTitle>
        <CardDescription>Real-time audit trail of your latest testing actions.</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[40%]">Test Case ID</TableHead>
              <TableHead>Environment</TableHead>
              <TableHead>Result</TableHead>
              <TableHead className="text-right">Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentActivity.map((item, i) => {
              const lastModifiedDate = getValidDate(item.lastModified);
              return (
                <TableRow key={item.id + i} className="hover:bg-muted/50 border-b border-border transition-colors">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <FileKey className="w-4 h-4 text-muted-foreground opacity-50" />
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="truncate max-w-[180px] cursor-help block">{item.testCaseTitle}</span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{item.testCaseTitle}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-normal text-muted-foreground">{item.platformName}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`
                      font-medium border-0 px-2 py-0.5
                      ${item.status === 'Pass' ? 'bg-green-500/10 text-green-600 dark:text-green-400' : ''}
                      ${item.status === 'Fail' ? 'bg-red-500/10 text-red-600 dark:text-red-400' : ''}
                      ${item.status === 'Fail (Known)' ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400' : ''}
                      ${item.status === 'N/A' ? 'bg-slate-500/10 text-slate-600 dark:text-slate-400' : ''}
                    `}>
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground">
                    <div className="flex items-center justify-end gap-1">
                      <Clock className="w-3 h-3 opacity-50" />
                      {lastModifiedDate ? formatDistanceToNowStrict(lastModifiedDate, { addSuffix: true }) : ''}
                    </div>
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
