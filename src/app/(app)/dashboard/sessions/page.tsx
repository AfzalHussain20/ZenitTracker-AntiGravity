
"use client";

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebaseConfig';
import { collection, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import type { TestSession } from '@/types';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Loader2, ChevronsRight, FolderClock, FolderCheck, ArchiveX, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

const SessionCard = ({ session }: { session: TestSession }) => {
    const summary = session.summary || { pass: 0, fail: 0, na: 0, failKnown: 0, total: 0 };
    const completedCount = summary.pass + summary.fail + summary.na + summary.failKnown;
    const completion = summary.total > 0 ? Math.round((completedCount / summary.total) * 100) : 0;
    const createdAt = getValidDate(session.createdAt);
    const isAborted = session.status === 'Aborted';
    const canContinue = session.status === 'In Progress' || session.status === 'Aborted';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="w-full h-full"
        >
            <Card className="h-full flex flex-col transition-shadow hover:shadow-xl bg-card/50 backdrop-blur-sm">
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="truncate">{session.platformDetails.platformName}</CardTitle>
                            <CardDescription>
                                {createdAt ? format(createdAt, "PPP") : 'No date'}
                            </CardDescription>
                        </div>
                         <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger>
                                    <div className="relative h-16 w-16">
                                        <svg className="h-full w-full" viewBox="0 0 36 36">
                                            <path
                                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                fill="none"
                                                stroke="hsl(var(--border))"
                                                strokeWidth="3"
                                            />
                                            <path
                                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                fill="none"
                                                stroke="hsl(var(--primary))"
                                                strokeWidth="3"
                                                strokeDasharray={`${completion}, 100`}
                                                strokeLinecap="round"
                                                className="transition-all duration-500"
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="text-lg font-bold text-primary">{completion}%</span>
                                        </div>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{completedCount} of {summary.total} cases actioned</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </CardHeader>
                <CardContent className="flex-grow">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                        <p className="font-semibold text-green-500">Pass:</p><p className="text-right">{summary.pass}</p>
                        <p className="font-semibold text-red-500">Fail:</p><p className="text-right">{summary.fail}</p>
                        <p className="font-semibold text-orange-500">Known:</p><p className="text-right">{summary.failKnown}</p>
                        <p className="font-semibold text-muted-foreground">N/A:</p><p className="text-right">{summary.na}</p>
                    </div>
                     {isAborted && (
                        <div className="mt-3 flex items-center gap-2 text-sm text-amber-500 p-2 bg-amber-500/10 rounded-md">
                            <ArchiveX className="h-4 w-4" />
                            <span>Paused (Aborted)</span>
                        </div>
                    )}
                </CardContent>
                <CardFooter>
                    <Button asChild variant="default" size="sm" className="w-full">
                        <Link href={`/dashboard/session/${canContinue ? session.id : `${session.id}/results`}`}>
                            {canContinue ? 'Continue Session' : 'View Full Report'} <ChevronsRight className="ml-1 h-4 w-4" />
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
        </motion.div>
    );
};

const SessionListPageContent = () => {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [sessions, setSessions] = useState<TestSession[]>([]);
  const [loading, setLoading] = useState(true);
  const defaultTab = searchParams.get('tab') === 'completed' ? 'completed' : 'active';
  
  useEffect(() => {
    if (!user) {
        setLoading(false);
        return;
    }
    
    setLoading(true);
    const sessionsQuery = query(
        collection(db, 'testSessions'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(sessionsQuery, (snapshot) => {
        const fetchedSessions = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: getValidDate(data.createdAt),
                updatedAt: getValidDate(data.updatedAt)
            } as TestSession;
        });
        setSessions(fetchedSessions);
        setLoading(false);
    }, (err) => {
        console.error("Failed to fetch sessions:", err);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const { activeSessions, completedSessions } = useMemo(() => {
    const active = sessions.filter(s => s.status === 'In Progress' || s.status === 'Aborted');
    const completed = sessions.filter(s => s.status === 'Completed');
    return { activeSessions: active, completedSessions: completed };
  }, [sessions]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-20rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="sr-only">Loading sessions...</p>
      </div>
    );
  }

  const renderSessionGrid = (sessionList: TestSession[], emptyMessage: string) => {
      if (sessionList.length > 0) {
          return (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-fr">
                  {sessionList.map(session => <SessionCard key={session.id} session={session} />)}
              </div>
          );
      }
      return (
          <div className="text-center text-muted-foreground py-20">
              <p>{emptyMessage}</p>
          </div>
      );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
        <div className="flex justify-between items-center">
            <h1 className="text-3xl font-headline font-bold text-foreground">All Sessions</h1>
            <Button variant="outline" onClick={() => router.push('/dashboard')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
            </Button>
        </div>
        
        <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="active">
                    <FolderClock className="mr-2 h-4 w-4"/> Active ({activeSessions.length})
                </TabsTrigger>
                <TabsTrigger value="completed">
                    <FolderCheck className="mr-2 h-4 w-4"/> Completed ({completedSessions.length})
                </TabsTrigger>
            </TabsList>
            <TabsContent value="active" className="mt-6">
                {renderSessionGrid(activeSessions, "No active sessions found.")}
            </TabsContent>
            <TabsContent value="completed" className="mt-6">
                 {renderSessionGrid(completedSessions, "No completed sessions yet.")}
            </TabsContent>
        </Tabs>
    </div>
  );
}

export default function AllSessionsPage() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center h-[calc(100vh-20rem)]"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
            <SessionListPageContent />
        </Suspense>
    )
}
