
"use client";

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebaseConfig';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import type { TestCase, TestSession } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

interface TestCaseTableProps {
  sessionId: string;
}

export default function TestCaseTable({ sessionId }: TestCaseTableProps) {
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTestCases = async () => {
      if (!sessionId) return;
      setLoading(true);
      try {
        const sessionDocRef = doc(db, 'testSessions', sessionId);
        const sessionSnap = await getDoc(sessionDocRef);

        if (sessionSnap.exists()) {
            const sessionData = sessionSnap.data() as TestSession;
            // Sort test cases by their original order index
            const sortedTestCases = (sessionData.testCases || []).sort((a,b) => a.orderIndex - b.orderIndex);
            setTestCases(sortedTestCases);
        }

      } catch (error) {
        console.error(`Failed to fetch test cases for session ${sessionId}:`, error);
      } finally {
        setLoading(false);
      }
    };
    fetchTestCases();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (testCases.length === 0) {
    return <p className="text-sm text-muted-foreground p-4 text-center">No test cases found for this session.</p>;
  }

  return (
    <div className="p-2 bg-background/50 rounded-md border max-h-80 overflow-y-auto">
        <Table>
        <TableHeader>
            <TableRow>
            <TableHead className="w-[50px]">#</TableHead>
            <TableHead className="w-2/5">Test Case</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Bug ID / N/A Reason</TableHead>
            <TableHead className="w-2/5">Actual Result</TableHead>
            </TableRow>
        </TableHeader>
        <TableBody>
            {testCases.map((tc) => (
            <TableRow key={tc.id}>
                <TableCell className="font-mono text-muted-foreground">{tc.orderIndex + 1}</TableCell>
                <TableCell className="font-medium truncate max-w-xs">{tc.testCaseTitle}</TableCell>
                <TableCell>
                    <Badge variant={
                        tc.status === 'Pass' ? 'default' : 
                        tc.status === 'Fail' ? 'destructive' :
                        tc.status === 'Fail (Known)' ? 'destructive' :
                        tc.status === 'N/A' ? 'secondary' : 'outline'
                    } className={`capitalize whitespace-nowrap ${tc.status === 'Fail (Known)' ? 'bg-orange-600 hover:bg-orange-700' : ''}`}>
                        {tc.status.toLowerCase()}
                    </Badge>
                </TableCell>
                <TableCell className="truncate max-w-[150px]">{tc.bugId || tc.naReason || '—'}</TableCell>
                <TableCell className="text-muted-foreground truncate max-w-xs">{tc.actualResult || '—'}</TableCell>
            </TableRow>
            ))}
        </TableBody>
        </Table>
    </div>
  );
}
