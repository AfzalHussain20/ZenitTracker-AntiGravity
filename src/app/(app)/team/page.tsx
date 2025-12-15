
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebaseConfig';
import { collection, getDocs, query, Timestamp } from 'firebase/firestore';
import type { TestSession, UserProfile } from '@/types';
import { Loader2, Users, AlertTriangle, Percent, TestTubeDiagonal } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useRouter } from 'next/navigation';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import PlatformBubbleChart from '@/components/dashboard/PlatformBubbleChart';
import { format, formatDistanceToNowStrict } from 'date-fns';

interface TesterStats {
  userId: string;
  userName: string;
  email: string;
  photoURL?: string;
  totalSessions: number;
  totalTests: number;
  pass: number;
  fail: number;
  failKnown: number;
  na: number;
  lastActive?: Date;
}

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


export default function TeamPage() {
  const { user, userRole, loading: authLoading } = useAuth();
  const router = useRouter();
  const [testerStats, setTesterStats] = useState<TesterStats[]>([]);
  const [allSessions, setAllSessions] = useState<TestSession[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) {
      return; 
    }

    if (!user || userRole !== 'lead') {
      router.replace('/dashboard');
      return;
    }

    const fetchAllData = async () => {
      setLoadingData(true);
      setError(null);
      try {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const userProfiles: { [key: string]: UserProfile } = {};
        usersSnapshot.forEach(doc => {
            const data = doc.data() as UserProfile;
            userProfiles[doc.id] = { ...data, uid: doc.id };
        });

        const sessionsQuery = query(collection(db, 'testSessions'));
        const sessionsSnapshot = await getDocs(sessionsQuery);
        const fetchedSessions = sessionsSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: getValidDate(data.createdAt),
                completedAt: getValidDate(data.completedAt),
                updatedAt: getValidDate(data.updatedAt),
            } as TestSession;
        });
        setAllSessions(fetchedSessions);

        const statsMap: { [key: string]: TesterStats } = {};
        
        Object.values(userProfiles).forEach(profile => {
             if (profile.role === 'tester' || profile.role === 'lead') { // Also include leads if they test
                 statsMap[profile.uid] = {
                  userId: profile.uid,
                  userName: profile.displayName,
                  email: profile.email,
                  photoURL: profile.photoURL || '', 
                  totalSessions: 0,
                  totalTests: 0,
                  pass: 0,
                  fail: 0,
                  failKnown: 0,
                  na: 0,
                };
             }
        });
        
        fetchedSessions.forEach(session => {
          if (statsMap[session.userId] && session.summary) {
            const stats = statsMap[session.userId];
            stats.totalSessions += 1;
            stats.totalTests += session.summary.total;
            stats.pass += session.summary.pass;
            stats.fail += session.summary.fail;
            stats.failKnown += session.summary.failKnown;
            stats.na += session.summary.na;
            
            const activityDate = getValidDate(session.completedAt) || getValidDate(session.updatedAt);
            if (activityDate) {
              if (!stats.lastActive || activityDate > stats.lastActive) {
                stats.lastActive = activityDate;
              }
            }
          }
        });
        
        setTesterStats(Object.values(statsMap).sort((a,b) => (b.lastActive?.getTime() || 0) - (a.lastActive?.getTime() || 0)));
      } catch (err: any) {
        console.error("Failed to fetch team sessions:", err);
        if (err.code === 'permission-denied') {
            setError("Permission Denied. Please ensure your Firestore security rules are updated to allow 'lead' role access. This may take a moment to apply after saving.");
        } else {
            setError("An error occurred while fetching team data.");
        }
      } finally {
        setLoadingData(false);
      }
    };

    fetchAllData();
  }, [user, userRole, authLoading, router]);
  
  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'QA';
    const names = name.split(' ');
    if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  };

  const { teamTotalCases, teamPassRate, teamTotalActionable } = useMemo(() => {
    const teamTotalCases = testerStats.reduce((acc, tester) => acc + tester.totalTests, 0);
    const teamTotalPass = testerStats.reduce((acc, tester) => acc + tester.pass, 0);
    const teamTotalActionable = testerStats.reduce((acc, tester) => acc + tester.pass + tester.fail + tester.failKnown, 0);
    const teamPassRate = teamTotalActionable > 0 ? Math.round((teamTotalPass / teamTotalActionable) * 100) : 0;
    return { teamTotalCases, teamPassRate, teamTotalActionable };
  }, [testerStats]);


  if (authLoading || (userRole === 'lead' && loadingData)) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-20rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4">Loading team data...</p>
      </div>
    );
  }
  
  if (userRole !== 'lead') {
    return (
        <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Access Denied</AlertTitle>
            <AlertDescription>You do not have permission to view this page. Redirecting...</AlertDescription>
        </Alert>
    );
  }

  if (error) {
     return (
        <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error Fetching Data</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
        </Alert>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
       <div>
          <h1 className="text-3xl font-headline font-bold text-foreground flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" />
              Team Performance
          </h1>
          <p className="text-muted-foreground">An overview of all tester activity and product health.</p>
        </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Testers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{testerStats.filter(t => t.totalSessions > 0).length}</div>
            <p className="text-xs text-muted-foreground">out of {testerStats.length} total testers</p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cases Executed</CardTitle>
            <TestTubeDiagonal className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamTotalCases}</div>
            <p className="text-xs text-muted-foreground">across all sessions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Pass Rate</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamPassRate}%</div>
            <p className="text-xs text-muted-foreground">{teamTotalActionable} actionable cases</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-6 lg:grid-cols-3 auto-rows-fr">
        <div className="lg:col-span-2">
            <Card className="h-full">
            <CardHeader>
                <CardTitle>Testers Summary</CardTitle>
                <CardDescription>
                Aggregated statistics for each tester.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="border rounded-md">
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Tester</TableHead>
                        <TableHead className="text-center">Total Sessions</TableHead>
                        <TableHead className="text-center">Pass Rate</TableHead>
                        <TableHead className="text-right">Last Active</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {testerStats.length > 0 ? (
                        testerStats.map(tester => {
                        const totalActioned = tester.pass + tester.fail + tester.failKnown;
                        const passRate = totalActioned > 0 ? Math.round((tester.pass / totalActioned) * 100) : 0;
                        return (
                            <TableRow key={tester.userId}>
                            <TableCell>
                                <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="flex items-center gap-3">
                                            <Avatar>
                                                <AvatarImage src={tester.photoURL || undefined} alt={tester.userName}/>
                                                <AvatarFallback>{getInitials(tester.userName)}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                            <span className="font-medium">{tester.userName}</span>
                                            <p className="text-xs text-muted-foreground">{tester.email}</p>
                                            </div>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                        <p className="font-bold col-span-2">{tester.userName}</p>
                                        <p className="text-green-500">Pass:</p><p className="text-right">{tester.pass}</p>
                                        <p className="text-red-500">Fail:</p><p className="text-right">{tester.fail}</p>
                                        <p className="text-orange-500">Fail (Known):</p><p className="text-right">{tester.failKnown}</p>
                                        <p className="text-gray-400">N/A:</p><p className="text-right">{tester.na}</p>
                                        <p className="font-semibold col-span-2 border-t mt-1 pt-1">Total Cases: {tester.totalTests}</p>
                                    </div>
                                    </TooltipContent>
                                </Tooltip>
                                </TooltipProvider>
                            </TableCell>
                            <TableCell className="text-center font-mono">{tester.totalSessions}</TableCell>
                            <TableCell className="text-center">
                                <span className={`font-semibold ${passRate >= 90 ? 'text-green-500' : passRate >= 70 ? 'text-yellow-500' : 'text-red-500'}`}>
                                    {totalActioned > 0 ? `${passRate}%` : 'N/A'}
                                </span>
                            </TableCell>
                                <TableCell className="text-right">
                                {tester.lastActive ? (
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger>
                                                <Badge variant="outline">{formatDistanceToNowStrict(tester.lastActive, { addSuffix: true })}</Badge>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>{format(tester.lastActive, 'PP p')}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                ) : (
                                    <Badge variant="secondary">No Sessions</Badge>
                                )}
                            </TableCell>
                            </TableRow>
                        )
                        })
                    ) : (
                        <TableRow>
                        <TableCell colSpan={5} className="text-center h-24">
                            No testers found.
                        </TableCell>
                        </TableRow>
                    )}
                    </TableBody>
                </Table>
                </div>
            </CardContent>
            </Card>
        </div>
        <div className="lg:col-span-1 h-full">
            <PlatformBubbleChart sessions={allSessions} />
        </div>
      </div>
    </div>
  );
}
