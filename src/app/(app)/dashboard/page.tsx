"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebaseConfig';
import { collection, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import type { TestSession } from '@/types';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { PlusCircle, Loader2, ChevronsRight, FolderCheck, Activity, Layers, Zap, Smartphone, Monitor, Tv, TrendingUp, PieChart } from 'lucide-react';
import ExportDataButton from '@/components/dashboard/ExportDataButton';
import TesterProfileCard from '@/components/dashboard/TesterProfileCard';
import { format } from 'date-fns';
import StarBorder from '@/components/ui/StarBorder';
import { motion } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import TeamPerformancePreview from '@/components/dashboard/TeamPerformancePreview';
import RepositoryPreview from '@/components/dashboard/RepositoryPreview';
import DashboardKPIRow from '@/components/dashboard/DashboardKPIRow';
import HistoricalPerformanceChart from '@/components/dashboard/HistoricalPerformanceChart';
import RecentActivity from '@/components/dashboard/RecentActivity';
import CleverTapPreview from '@/components/dashboard/CleverTapPreview';
import LocatorStudioPreview from '@/components/dashboard/LocatorStudioPreview';
import { AppsHubSection } from '@/components/dashboard/AppsHubSection';
import { ResponsiveContainer, PieChart as RePie, Pie, Cell } from 'recharts';
import NotificationCenter from '@/components/dashboard/NotificationCenter';

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
    const canContinue = session.status === 'In Progress' || session.status === 'Aborted';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            whileHover={{ y: -4, scale: 1.02 }}
            className="w-full"
        >
            <Card className="h-full flex flex-col transition-all duration-300 glass-panel hover:shadow-xl hover:border-primary/50 group overflow-hidden bg-card/60">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Activity className="w-24 h-24 text-primary rotate-12" />
                </div>

                <CardHeader className="relative z-10 pb-2">
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="truncate text-base font-semibold group-hover:text-primary transition-colors text-foreground">
                                {session.platformDetails.platformName}
                            </CardTitle>
                            <CardDescription className="text-muted-foreground">
                                {createdAt ? format(createdAt, "PPP") : 'No date'}
                            </CardDescription>
                        </div>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger>
                                    <div className="relative h-12 w-12 flex-shrink-0">
                                        <svg className="h-full w-full rotate-[-90deg]" viewBox="0 0 36 36">
                                            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" className="text-muted/20" />
                                            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray={`${completion}, 100`} strokeLinecap="round" className="text-primary transition-all duration-700 ease-out" />
                                        </svg>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="text-[10px] font-bold text-primary">{completion}%</span>
                                        </div>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{completedCount} of {summary.total} cases executed</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </CardHeader>
                <CardContent className="flex-grow py-2 relative z-10">
                    <div className="grid grid-cols-4 gap-2 text-xs bg-muted/40 p-2 rounded-lg border border-border/50">
                        <div className="text-center"><p className="text-green-500 font-bold">{summary.pass}</p><p className="text-[10px] text-muted-foreground">Pass</p></div>
                        <div className="text-center"><p className="text-red-500 font-bold">{summary.fail}</p><p className="text-[10px] text-muted-foreground">Fail</p></div>
                        <div className="text-center"><p className="text-orange-500 font-bold">{summary.failKnown}</p><p className="text-[10px] text-muted-foreground">Known</p></div>
                        <div className="text-center"><p className="text-slate-500 font-bold">{summary.na}</p><p className="text-[10px] text-muted-foreground">N/A</p></div>
                    </div>
                </CardContent>
                <CardFooter className="pt-2 relative z-10">
                    <Button asChild variant="default" size="sm" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                        <Link href={`/dashboard/session/${canContinue ? session.id : `${session.id}/results`}`}>
                            {canContinue ? 'Resume Mission' : 'Analysis Report'} <ChevronsRight className="ml-1 h-3 w-3" />
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
        </motion.div>
    );
};

// --- New "Special" Overall Stats Widget ---
const OverallStatsWidget = ({ sessions }: { sessions: TestSession[] }) => {
    const stats = useMemo(() => {
        let pass = 0, fail = 0, na = 0;
        sessions.forEach(s => {
            if (s.summary) { pass += s.summary.pass; fail += s.summary.fail + s.summary.failKnown; na += s.summary.na; }
        });
        const total = pass + fail + na;
        return { pass, fail, na, total };
    }, [sessions]);

    const data = [
        { name: 'Pass', value: stats.pass, color: '#22c55e' },
        { name: 'Fail', value: stats.fail, color: '#ef4444' },
        { name: 'N/A', value: stats.na, color: '#64748b' },
    ];

    if (stats.total === 0) return (
        <Card className="glass-panel h-full flex items-center justify-center p-6 text-muted-foreground bg-card/60">
            No Test Data
        </Card>
    );

    return (
        <Card className="glass-panel h-full overflow-hidden relative group bg-card/60">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <PieChart className="w-32 h-32 text-slate-500" />
            </div>
            <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-500" /> Overall Test Results
                </CardTitle>
                <CardDescription>Aggregate performance across {sessions.length} sessions.</CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
                <div className="flex items-center gap-4">
                    <div className="w-32 h-32 relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <RePie>
                                <Pie data={data} cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={5} dataKey="value" stroke="none">
                                    {data.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                </Pie>
                            </RePie>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                            <span className="text-xl font-bold text-foreground">{stats.total}</span>
                            <span className="text-[10px] text-muted-foreground uppercase">Tests</span>
                        </div>
                    </div>
                    <div className="space-y-3 flex-1">
                        {data.map(item => (
                            <div key={item.name} className="flex justify-between items-center text-sm">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                                    <span className="text-foreground">{item.name}</span>
                                </div>
                                <span className="font-mono font-bold text-foreground">{item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

// --- New "Special" Platform Health Widget ---
const PlatformHealthWidget = ({ sessions }: { sessions: TestSession[] }) => {
    const platforms = useMemo(() => {
        const map = new Map<string, { total: number, pass: number, fail: number }>();
        sessions.forEach(s => {
            const name = s.platformDetails.platformName || 'Unknown';
            if (!map.has(name)) map.set(name, { total: 0, pass: 0, fail: 0 });
            const entry = map.get(name)!;
            if (s.summary) {
                entry.total += s.summary.total;
                entry.pass += s.summary.pass;
                entry.fail += s.summary.fail + s.summary.failKnown;
            }
        });
        return Array.from(map.entries()).map(([name, stats]) => ({ name, ...stats }));
    }, [sessions]);

    return (
        <Card className="glass-panel h-full overflow-hidden relative group bg-card/60">
            <div className="absolute bottom-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Layers className="w-32 h-32 text-blue-500" />
            </div>
            <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-500" /> Platform Health
                </CardTitle>
                <CardDescription>Breakdown by Target Environment</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 relative z-10 pt-2">
                {platforms.length === 0 ? <p className="text-sm text-muted-foreground">No platform data.</p> :
                    platforms.map(p => (
                        <motion.div
                            key={p.name}
                            initial={{ x: -10, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            className="group/item"
                        >
                            <div className="flex justify-between items-center mb-1">
                                <div className="flex items-center gap-2">
                                    {p.name.includes('Mobile') ? <Smartphone className="w-4 h-4 text-pink-500" /> :
                                        p.name.includes('Web') ? <Monitor className="w-4 h-4 text-blue-500" /> :
                                            <Tv className="w-4 h-4 text-purple-500" />}
                                    <span className="text-sm font-medium text-foreground">{p.name}</span>
                                </div>
                                <span className="text-xs font-mono text-muted-foreground group-hover/item:text-foreground transition-colors">{p.total} cases</span>
                            </div>
                            {/* Hover reveal stats */}
                            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden flex">
                                <div className="h-full bg-green-500" style={{ width: `${(p.pass / p.total) * 100}%` }} />
                                <div className="h-full bg-red-500" style={{ width: `${(p.fail / p.total) * 100}%` }} />
                            </div>
                            <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5 opacity-0 group-hover/item:opacity-100 transition-opacity h-0 group-hover/item:h-auto">
                                <span>Pass: {p.pass}</span>
                                <span>Fail: {p.fail}</span>
                            </div>
                        </motion.div>
                    ))}
            </CardContent>
        </Card>
    );
};


export default function DashboardPage() {
    const { user, loading: authLoading } = useAuth();
    const [sessions, setSessions] = useState<TestSession[]>([]);
    const [sessionsLoading, setSessionsLoading] = useState(true);

    useEffect(() => {
        if (authLoading) return;
        if (!user) { setSessionsLoading(false); return; }
        setSessionsLoading(true);
        const sessionsQuery = query(collection(db, 'testSessions'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(sessionsQuery, (snapshot) => {
            const fetchedSessions = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id, ...data,
                    createdAt: getValidDate(data.createdAt),
                    updatedAt: getValidDate(data.updatedAt)
                } as TestSession;
            });
            setSessions(fetchedSessions);
            setSessionsLoading(false);
        }, (err) => { console.error("Failed to fetch sessions:", err); setSessionsLoading(false); });
        return () => unsubscribe();
    }, [user, authLoading]);

    const { activeSessions, completedSessions } = useMemo(() => {
        const active = sessions.filter(s => s.status === 'In Progress' || s.status === 'Aborted');
        const completed = sessions.filter(s => s.status === 'Completed');
        return { activeSessions: active, completedSessions: completed };
    }, [sessions]);

    // Loading State
    if (authLoading || sessionsLoading) return <div className="flex justify-center items-center h-screen"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
    if (!user) return null;

    return (
        <div className="space-y-8 max-w-[1700px] mx-auto p-4 md:p-8 text-foreground selection:bg-primary/20">
            {/* Background Ambient Glow (Light/Dark Safe) */}
            <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden bg-background">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500/10 dark:bg-blue-500/5 blur-[150px] rounded-full mix-blend-multiply dark:mix-blend-screen" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 dark:bg-purple-500/5 blur-[150px] rounded-full mix-blend-multiply dark:mix-blend-screen" />
            </div>

            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-6 pb-6 section-border border-b border-border/50">
                <div>
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-card border border-border text-xs text-muted-foreground mb-4 shadow-sm"
                    >
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> SYSTEM ONLINE
                    </motion.div>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
                        Welcome, <span className="text-primary">{user?.displayName?.split(' ')[0] || 'Commander'}</span>
                    </h1>
                    <p className="text-muted-foreground mt-2 text-lg">Your testing command center is ready.</p>
                </div>
                <div className="flex gap-4">
                    <ExportDataButton userId={user?.uid || null} />
                    <StarBorder>
                        <Button asChild size="lg" className="h-12 px-8 text-base bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-500 dark:to-purple-500 text-white shadow-xl hover:shadow-indigo-500/25 transition-all">
                            <Link href="/dashboard/new-session">
                                <PlusCircle className="mr-2 h-5 w-5" /> New Mission
                            </Link>
                        </Button>
                    </StarBorder>
                </div>
            </div>

            {/* KPI Row */}
            <DashboardKPIRow sessions={sessions} />

            {/* Main Grid Layout */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">

                {/* Left Column (Tools & Profile) - 3 Cols */}
                <div className="xl:col-span-3 space-y-6">
                    <TesterProfileCard user={user!} />
                    <div className="glass-panel rounded-xl p-5 border-border/60 bg-card/60">
                        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-foreground"><Layers className="w-4 h-4 text-primary" /> Zenit Tools</h3>
                        <div className="space-y-4">
                            <CleverTapPreview />
                            <LocatorStudioPreview />
                            <TeamPerformancePreview />
                        </div>
                    </div>
                </div>

                {/* Center Column (Detailed Analytics) - 6 Cols */}
                <div className="xl:col-span-6 space-y-6">
                    <HistoricalPerformanceChart sessions={sessions} />
                    <RecentActivity sessions={sessions} />
                </div>

                {/* Right Column (New Widgets & Archives) - 3 Cols */}
                <div className="xl:col-span-3 space-y-6">
                    <div className="h-[250px]"><OverallStatsWidget sessions={sessions} /></div>
                    <div className="h-auto"><PlatformHealthWidget sessions={sessions} /></div>

                    {/* Notification Center */}
                    <div className="h-auto">
                        <NotificationCenter />
                    </div>

                    <RepositoryPreview />
                </div>
            </div>

            {/* Zenit Apps Hub Section */}
            <AppsHubSection className="pt-8 border-t border-border/50" />

            {/* Active Sessions Deck */}
            {activeSessions.length > 0 && (
                <div className="pt-8 border-t border-border/50">
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 text-foreground">
                        <Zap className="text-yellow-500 fill-yellow-500/20 w-6 h-6" /> Active Missions
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {activeSessions.slice(0, 4).map(session => <SessionCard key={session.id} session={session} />)}
                    </div>
                </div>
            )}
        </div>
    );
}