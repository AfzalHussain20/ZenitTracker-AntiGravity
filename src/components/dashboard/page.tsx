
"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebaseConfig';
import { collection, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import type { TestSession } from '@/types';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { PlusCircle, Loader2, ChevronsRight, FolderClock, FolderCheck, ArchiveX } from 'lucide-react';
import ExportDataButton from '@/components/dashboard/ExportDataButton';
import TesterProfileCard from '@/components/dashboard/TesterProfileCard';
import OverallStatsChart from '@/components/dashboard/OverallStatsChart';
import { format } from 'date-fns';
import StarBorder from '@/components/ui/StarBorder';
import { motion } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import TeamPerformancePreview from '@/components/dashboard/TeamPerformancePreview';
import RepositoryPreview from '@/components/dashboard/RepositoryPreview';
import DashboardKPIRow from '@/components/dashboard/DashboardKPIRow';
import HistoricalPerformanceChart from '@/components/dashboard/HistoricalPerformanceChart';
import PlatformBubbleChart from '@/components/dashboard/PlatformBubbleChart';
import RecentActivity from '@/components/dashboard/RecentActivity';
import CleverTapPreview from '@/components/dashboard/CleverTapPreview';
import LocatorStudioPreview from '@/components/dashboard/LocatorStudioPreview';


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
            className="w-full"
        >
            <Card className="h-full flex flex-col transition-shadow hover:shadow-xl bg-card/50 backdrop-blur-sm">
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="truncate text-base">{session.platformDetails.platformName}</CardTitle>
                            <CardDescription>
                                {createdAt ? format(createdAt, "PPP") : 'No date'}
                            </CardDescription>
                        </div>
                         <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger>
                                    <div className="relative h-12 w-12">
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
                                            <span className="text-sm font-bold text-primary">{completion}%</span>
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
                <CardContent className="flex-grow py-0">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                        <p className="font-semibold text-green-500">Pass:</p><p className="text-right">{summary.pass}</p>
                        <p className="font-semibold text-red-500">Fail:</p><p className="text-right">{summary.fail}</p>
                        <p className="font-semibold text-orange-500">Known:</p><p className="text-right">{summary.failKnown}</p>
                        <p className="font-semibold text-muted-foreground">N/A:</p><p className="text-right">{summary.na}</p>
                    </div>
                     {isAborted && (
                        <div className="mt-2 flex items-center gap-2 text-xs text-amber-500 p-1.5 bg-amber-500/10 rounded-md">
                            <ArchiveX className="h-3 w-3" />
                            <span>Paused</span>
                        </div>
                    )}
                </CardContent>
                <CardFooter className="pt-4">
                    <Button asChild variant="default" size="sm" className="w-full">
                        <Link href={`/dashboard/session/${canContinue ? session.id : `${session.id}/results`}`}>
                            {canContinue ? 'Continue Session' : 'View Report'} <ChevronsRight className="ml-1 h-4 w-4" />
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
        </motion.div>
    );
};


export default function DashboardPage() {
  const { user } = useAuth();
  
  const [sessions, setSessions] = useState<TestSession[]>([]);
  const [loading, setLoading] = useState(true);
  
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
        <p className="sr-only">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
            <div>
                 <h1 className="text-3xl md:text-4xl font-headline font-bold text-foreground">Welcome Back, {user?.displayName?.split(' ')[0] || 'Tester'}!</h1>
                 <p className="text-muted-foreground mt-2">Here's your quality command center. Ready to start testing?</p>
            </div>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex gap-4"
            >
                <ExportDataButton userId={user?.uid || null} />
                <StarBorder>
                    <Button asChild size="lg" className="h-12 px-6 text-base">
                        <Link href="/dashboard/new-session">
                            <PlusCircle />
                            New Session
                        </Link>
                    </Button>
                </StarBorder>
            </motion.div>
        </div>

        {/* Top Section */}
        <div className="space-y-6">
            <DashboardKPIRow sessions={sessions} />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column */}
                <div className="lg:col-span-3 flex flex-col gap-6">
                    <TesterProfileCard user={user!} />
                    <Card className="transition-all hover:shadow-lg hover:-translate-y-1">
                        <CardHeader className="pb-4">
                            <CardTitle className="flex items-center gap-3"><FolderCheck className="text-primary"/>Completed Sessions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                        {completedSessions.length > 0 ? (
                                completedSessions.slice(0, 2).map(session => <SessionCard key={session.id} session={session} />)
                            ) : (
                            <div className="text-center text-muted-foreground py-10">
                                <p>No completed sessions yet.</p>
                            </div>
                            )}
                        </CardContent>
                        {completedSessions.length > 2 && (
                        <CardFooter>
                            <Button asChild variant="outline" className="w-full">
                            <Link href="/dashboard/sessions?tab=completed">View All Completed</Link>
                            </Button>
                        </CardFooter>
                        )}
                    </Card>
                    <RepositoryPreview />
                </div>

                {/* Center Column */}
                <div className="lg:col-span-6 flex flex-col gap-6">
                    <HistoricalPerformanceChart sessions={sessions} />
                    <RecentActivity sessions={sessions} />
                </div>

                {/* Right Column */}
                <div className="lg:col-span-3 flex flex-col gap-6">
                    <OverallStatsChart sessions={sessions} />
                    <PlatformBubbleChart sessions={sessions} />
                    <LocatorStudioPreview />
                    <CleverTapPreview />
                    <TeamPerformancePreview />
                </div>
            </div>
        </div>

        {/* Bottom Full-Width Section */}
        {activeSessions.length > 0 && (
            <div className="space-y-4 pt-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-headline font-bold text-foreground flex items-center gap-3">
                        <FolderClock className="text-primary"/> Active Sessions
                    </h2>
                    {activeSessions.length > 4 && (
                        <Button asChild variant="outline">
                            <Link href="/dashboard/sessions?tab=active">View All Active Sessions</Link>
                        </Button>
                    )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {activeSessions.slice(0, 4).map(session => <SessionCard key={session.id} session={session} />)}
                </div>
            </div>
        )}
    </div>
  );
}

    