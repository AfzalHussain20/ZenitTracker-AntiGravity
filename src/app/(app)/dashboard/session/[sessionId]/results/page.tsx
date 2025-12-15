
"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import type { TestSession, TestCase } from '@/types';
import { db } from '@/lib/firebaseConfig';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileSpreadsheet, ArrowLeft, Timer } from 'lucide-react';
import { format, formatDistanceStrict } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ArchiveX } from 'lucide-react';

export default function TestSessionResultPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  const { user } = useAuth();

  const [session, setSession] = useState<TestSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const getValidDate = (d: any): Date | null => {
    if (!d) return null;
    if (d instanceof Date) return d;
    if (d instanceof Timestamp) return d.toDate();
    if (typeof d === 'string' || typeof d === 'number') {
        const date = new Date(d);
        return isNaN(date.getTime()) ? null : date;
    }
    return null;
  };


  useEffect(() => {
    if (!sessionId || !user) {
      if (!user) router.push('/login');
      return;
    };

    const fetchSessionData = async () => {
      setIsLoading(true);
      try {
        const sessionDocRef = doc(db, 'testSessions', sessionId);
        const sessionSnap = await getDoc(sessionDocRef);

        if (!sessionSnap.exists() || sessionSnap.data()?.userId !== user.uid) {
          router.push('/dashboard');
          return;
        }
        
        const data = sessionSnap.data();
        const sessionData = { 
            id: sessionSnap.id, 
            ...data,
            createdAt: getValidDate(data.createdAt),
            updatedAt: getValidDate(data.updatedAt),
            completedAt: getValidDate(data.completedAt),
            testCases: (data.testCases || []).map((tc: any) => ({
                ...tc,
                lastModified: getValidDate(tc.lastModified),
            }))
        } as TestSession;
        setSession(sessionData);

      } catch (error) {
        console.error("Error fetching session result data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessionData();
  }, [sessionId, user, router]);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  if (!session) {
    return <div className="text-center py-10 text-muted-foreground">Test session report not found.</div>;
  }
  
  const { platformDetails, summary, status, reasonForIncompletion, testCases, createdAt, completedAt } = session;
  const sessionDuration = createdAt && completedAt ? formatDistanceStrict(completedAt, createdAt) : "N/A";


  return (
    <div className="max-w-4xl mx-auto space-y-6">
       <div className="flex justify-start">
         <Button variant="outline" onClick={() => router.push('/dashboard')}>
           <ArrowLeft className="mr-2 h-4 w-4" />
           Back to Dashboard
         </Button>
       </div>

       {status === 'Aborted' && reasonForIncompletion && (
        <Alert variant="destructive">
            <ArchiveX className="h-4 w-4" />
            <AlertTitle>Session Aborted</AlertTitle>
            <AlertDescription>
              This session was stopped before all test cases were completed. Reason: <strong>{reasonForIncompletion}</strong>
            </AlertDescription>
        </Alert>
       )}

      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl font-headline flex items-center">
                  <FileSpreadsheet className="mr-3 h-6 w-6 text-primary" />
                  Test Session Report
              </CardTitle>
              <CardDescription className="mt-1">
                {status === 'Completed' && `Completed on: ${format(new Date(session.completedAt || session.updatedAt), "PPP p")}`}
                {status === 'Aborted' && `Aborted on: ${format(new Date(session.completedAt || session.updatedAt), "PPP p")}`}
              </CardDescription>
            </div>
            <Badge variant={status === 'Completed' ? 'default' : 'destructive'} className="text-base px-4 py-1.5">{status}</Badge>
          </div>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2 text-sm">
                <h3 className="font-semibold text-lg text-primary mb-2">Platform Details</h3>
                <p><strong className="text-muted-foreground">Platform:</strong> {platformDetails.platformName}</p>
                {platformDetails.deviceModel && <p><strong className="text-muted-foreground">Device:</strong> {platformDetails.deviceModel}</p>}
                {platformDetails.osVersion && <p><strong className="text-muted-foreground">OS Version:</strong> {platformDetails.osVersion}</p>}
                {platformDetails.browserName && <p><strong className="text-muted-foreground">Browser:</strong> {platformDetails.browserName} {platformDetails.browserVersion || ''}</p>}
                {platformDetails.appVersion && <p><strong className="text-muted-foreground">App Version:</strong> {platformDetails.appVersion}</p>}
                {platformDetails.customPlatformName && <p><strong className="text-muted-foreground">Custom Name:</strong> {platformDetails.customPlatformName}</p>}
            </div>
            <div className="space-y-2 text-sm">
                 <h3 className="font-semibold text-lg text-primary mb-2">Execution Summary</h3>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Timer className="h-4 w-4" />
                    <strong>Total Duration:</strong>
                    <span>{sessionDuration}</span>
                 </div>
                 <p><strong className="text-green-500">Passed:</strong> {summary?.pass || 0}</p>
                 <p><strong className="text-red-500">Failed (New):</strong> {summary?.fail || 0}</p>
                 <p><strong className="text-orange-500">Failed (Known):</strong> {summary?.failKnown || 0}</p>
                 <p><strong className="text-yellow-500">Not Applicable:</strong> {summary?.na || 0}</p>
                 <p><strong className="text-gray-400">Total Test Cases:</strong> {summary?.total || 0}</p>
                 <p><strong className="text-gray-400">Untested:</strong> {summary?.untested || 0}</p>
            </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Detailed Test Case Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">#</TableHead>
                  <TableHead className="w-[30%]">Test Case Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Bug ID / N/A Reason</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-right">Last Modified</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {testCases.map((tc) => (
                  <TableRow key={tc.id}>
                    <TableCell className="font-mono text-muted-foreground">{tc.orderIndex + 1}</TableCell>
                    <TableCell className="font-medium">{tc.testCaseTitle}</TableCell>
                    <TableCell>
                      <Badge variant={
                          tc.status === 'Pass' ? 'default' : 
                          tc.status === 'Fail' ? 'destructive' :
                          tc.status === 'Fail (Known)' ? 'destructive' :
                          tc.status === 'N/A' ? 'secondary' : 'outline'
                      } className={tc.status === 'Fail (Known)' ? 'bg-orange-600' : ''}>
                          {tc.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{tc.bugId || tc.naReason || '—'}</TableCell>
                    <TableCell className="text-muted-foreground truncate max-w-xs">{tc.notes || '—'}</TableCell>
                    <TableCell className="text-right text-muted-foreground text-xs">{format(new Date(tc.lastModified), "PPP p")}</TableCell>
                  </TableRow>
                ))}
                 {testCases.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="h-24 text-center">No test cases found for this session.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
