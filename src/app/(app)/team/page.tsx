"use client";

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebaseConfig';
import { collection, query, getDocs, where, orderBy, limit } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Trophy,
  Target,
  TrendingUp,
  ShieldAlert,
  Zap,
  Crown,
  Medal,
  Swords,
  BarChart3,
  Lock
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { motion } from 'framer-motion';
import StarBorder from '@/components/ui/StarBorder';
import { useRouter } from 'next/navigation';

export default function TeamPerformancePage() {
  const { user, userRole } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [teamData, setTeamData] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return; // Wait for auth

    const fetchRealTeamData = async () => {
      setIsLoading(true);
      try {
        // 1. Fetch Users
        // In a real scenario, you'd fetch all users. If restricted by rules, we might only see ourselves + supervised.
        // Assuming we can read 'users' collection or derived from sessions.
        // Fallback method: Scan all recent test sessions to find unique UIDs and aggregate.
        // This is 'Real Data' aggregation.

        const sessionsQuery = query(collection(db, 'testSessions'), orderBy('createdAt', 'desc'), limit(500));
        const snapshot = await getDocs(sessionsQuery);

        const statsMap = new Map<string, {
          name: string,
          role: string,
          tests: number,
          xp: number,
          passes: number
        }>();

        snapshot.docs.forEach(doc => {
          const data = doc.data();
          const uid = data.userId;
          // Try to get name from session metadata or just fallback
          // Note: Ideally sessions store 'userName' snapshot. If not, we might have partial info.
          // We will rely on what's available.

          // Mocking name if missing in session, but logic handles real data count
          const name = (data.userName || uid || 'Unknown Agent').split('@')[0];

          if (!statsMap.has(uid)) {
            statsMap.set(uid, {
              name: name,
              role: 'Agent', // Default, real app would fetch user profile
              tests: 0,
              xp: 0,
              passes: 0
            });
          }

          const entry = statsMap.get(uid)!;
          entry.tests += 1;

          if (data.summary) {
            // XP Formula: (Pass * 10) + (Fail * 2) + 50 per session
            const sessionXP = (data.summary.pass * 10) + (data.summary.fail * 2) + 50;
            entry.xp += sessionXP;
            entry.passes += data.summary.pass;
          }
          // Update name if we find a better one
          if (!entry.name.includes('Unknown') && data.userName) entry.name = data.userName;
        });

        const aggregatedData = Array.from(statsMap.values()).map(stat => ({
          ...stat,
          passRate: stat.tests > 0 ? Math.round((stat.passes / (stat.tests * 5)) * 100) : 0, // Approx 5 tests/session for rate
          avatar: stat.name.substring(0, 2).toUpperCase()
        }));

        // If no real data found (e.g. empty DB), handle gracefully
        if (aggregatedData.length === 0 && user) {
          // Add current user at least
          aggregatedData.push({
            name: user.displayName || 'You',
            role: userRole || 'Agent',
            tests: 0,
            xp: 0,
            passes: 0,
            passRate: 0,
            avatar: 'ME'
          });
        }

        setTeamData(aggregatedData);

      } catch (err) {
        console.error("Team Data fetch failed", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRealTeamData();
  }, [user, userRole]);


  if (isLoading) {
    return <div className="h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  }

  // --- Access Control ---
  if (userRole !== 'lead') {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center space-y-6 text-center p-8">
        <div className="relative">
          <ShieldAlert className="w-24 h-24 text-muted-foreground/20" />
          <Lock className="w-8 h-8 text-primary absolute bottom-0 right-0" />
        </div>
        <h1 className="text-3xl font-bold">Restricted Access</h1>
        <p className="text-muted-foreground max-w-md">
          This command center is reserved for Team Leads. <br />
          Your current clearance level: <Badge variant="outline">{userRole || 'Agent'}</Badge>
        </p>
        <Button onClick={() => router.push('/dashboard')}>Return to Dashboard</Button>
      </div>
    );
  }

  const topPerformer = teamData.length > 0
    ? teamData.reduce((prev, current) => (prev.tests > current.tests) ? prev : current)
    : { name: 'N/A', tests: 0 };

  const totalTests = teamData.reduce((acc, curr) => acc + curr.tests, 0);

  return (
    <div className="min-h-screen p-4 md:p-8 space-y-8 max-w-[1600px] mx-auto">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
        <div className="absolute top-[-10%] left-[30%] w-[60%] h-[60%] bg-indigo-500/5 blur-[150px] rounded-full mix-blend-screen" />
      </div>

      <div className="flex justify-between items-end border-b section-border pb-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2 flex items-center gap-3">
            <Swords className="w-10 h-10 text-pink-500" /> Squad Command
          </h1>
          <p className="text-muted-foreground text-lg">
            Real-time agent performance tracking and leaderboards.
          </p>
        </div>
        <div className="flex gap-3">
          <StarBorder>
            <Button className="bg-pink-600 hover:bg-pink-700 text-white">Generate Report</Button>
          </StarBorder>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* 1. Leaderboard Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Top Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="glass-panel border-pink-500/20 bg-gradient-to-br from-pink-500/5 to-transparent">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-pink-500 flex items-center gap-2">
                  <Crown className="w-4 h-4" /> Top Agent
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{topPerformer.name}</div>
                <p className="text-xs text-muted-foreground">{topPerformer.tests} missions completed</p>
              </CardContent>
            </Card>
            <Card className="glass-panel border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-blue-500 flex items-center gap-2">
                  <Zap className="w-4 h-4" /> Total Velocity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalTests}</div>
                <p className="text-xs text-muted-foreground">Combined team output</p>
              </CardContent>
            </Card>
            <Card className="glass-panel border-green-500/20 bg-gradient-to-br from-green-500/5 to-transparent">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-green-500 flex items-center gap-2">
                  <Target className="w-4 h-4" /> Active Agents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{teamData.length}</div>
                <p className="text-xs text-muted-foreground">Contributing members</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Leaderboard Table */}
          <Card className="glass-panel min-h-[400px]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Trophy className="text-yellow-500" /> Active Agents</CardTitle>
              <CardDescription>Ranked by contribution points (XP) and mission velocity.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {teamData.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    No team activity detected yet.
                  </div>
                ) : (
                  teamData.sort((a, b) => b.xp - a.xp).map((agent, index) => (
                    <motion.div
                      key={agent.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-4 rounded-xl bg-card/40 border border-transparent hover:border-pink-500/30 hover:bg-card/60 transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${index === 0 ? 'bg-yellow-500 text-black' : index === 1 ? 'bg-slate-400 text-black' : index === 2 ? 'bg-orange-700 text-white' : 'bg-muted text-muted-foreground'}`}>
                          {index + 1}
                        </div>
                        <Avatar className="h-10 w-10 border-2 border-background">
                          <AvatarFallback className="bg-primary/20 text-primary font-bold">{agent.avatar}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-semibold flex items-center gap-2">
                            {agent.name}
                            {index === 0 && <Crown className="w-3 h-3 text-yellow-500 fill-yellow-500" />}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-3">
                            <span>Lvl {Math.floor(agent.xp / 1000)} {agent.role}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-600" />
                            <span className="text-green-500">{agent.xp} XP</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right hidden sm:block">
                          <div className="text-xs text-muted-foreground">Missions</div>
                          <div className="font-mono font-bold">{agent.tests}</div>
                        </div>
                        <div className="text-right w-20">
                          <div className="text-xs text-muted-foreground">Passes</div>
                          <div className="font-mono font-bold text-green-500">{agent.passes}</div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 2. Charts & Insights Column */}
        <div className="space-y-6">
          <Card className="glass-panel h-[350px] flex flex-col">
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" /> Velocity Trend
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 pb-0">
              {teamData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={teamData}>
                    <XAxis dataKey="avatar" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip
                      cursor={{ fill: 'hsl(var(--muted)/0.3)' }}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                    />
                    <Bar dataKey="tests" fill="currentColor" radius={[4, 4, 0, 0]} className="fill-primary" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">No data chart</div>
              )}
            </CardContent>
          </Card>

          <Card className="glass-panel">
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Medal className="w-4 h-4 text-purple-500" /> Recent Achievements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {teamData.length > 0 && topPerformer.tests > 5 && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <Zap className="w-5 h-5 text-purple-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold">Sprint Champion</p>
                    <p className="text-xs text-muted-foreground">{topPerformer.name} is leading the charge.</p>
                  </div>
                </div>
              )}
              <p className="text-xs text-muted-foreground">Real-time milestones will appear here as the team progresses.</p>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
