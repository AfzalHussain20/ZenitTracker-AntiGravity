'use client';

import { motion } from 'framer-motion';
import { AppShell } from '@/components/apps/AppShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
    Clock, LayoutDashboard, FolderKanban, BarChart3,
    TrendingUp, Calendar, Target, Award, Zap,
    Flame, Briefcase, Coffee, ShieldAlert
} from 'lucide-react';

const ACCENT = '#6366F1';

const navItems = [
    { label: 'Dashboard', href: '/wrklog', icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: 'Projects', href: '/wrklog/projects', icon: <FolderKanban className="w-5 h-5" /> },
    { label: 'Work Calendar', href: '/wrklog/calendar', icon: <Calendar className="w-5 h-5" /> },
    { label: 'Analytics', href: '/wrklog/analytics', icon: <BarChart3 className="w-5 h-5" /> },
];

// Mock weekly data
const weeklyData = [
    { day: 'Mon', hours: 7.5, type: 'regular' },
    { day: 'Tue', hours: 8.2, type: 'regular' },
    { day: 'Wed', hours: 6.8, type: 'regular' },
    { day: 'Thu', hours: 9.1, type: 'regular' },
    { day: 'Fri', hours: 5.4, type: 'regular' },
    { day: 'Sat', hours: 4.5, type: 'support' },
    { day: 'Sun', hours: 2.0, type: 'support' },
];

const projectDistribution = [
    { name: 'Zenit Platform', hours: 24, percentage: 45, color: '#6366F1' },
    { name: 'Mobile Regression', hours: 12, percentage: 25, color: '#10B981' },
    { name: 'Support Tickets', hours: 8, percentage: 15, color: '#F59E0B' },
    { name: 'Documentation', hours: 5, percentage: 15, color: '#EC4899' },
];

const maxHours = Math.max(...weeklyData.map(d => d.hours));

export default function WrklogAnalyticsPage() {
    const totalHours = weeklyData.reduce((acc, d) => acc + d.hours, 0);
    const supportHours = weeklyData.filter(d => d.type === 'support').reduce((acc, d) => acc + d.hours, 0);
    const avgHours = totalHours / 7;

    return (
        <AppShell
            appName="Wrklog"
            appIcon={<Clock className="w-6 h-6" style={{ color: ACCENT }} />}
            accentColor={ACCENT}
            navItems={navItems}
        >
            <div className="max-w-5xl mx-auto space-y-6 pb-10">
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Productivity Insights</h1>
                        <p className="text-sm text-slate-500">Analysis of your time and effort</p>
                    </div>
                </div>

                {/* Score Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-indigo-600 text-white border-0 overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Zap className="w-24 h-24" />
                        </div>
                        <CardContent className="p-5">
                            <p className="text-indigo-100 text-sm font-medium">Efficiency Score</p>
                            <h2 className="text-4xl font-bold mt-1">94%</h2>
                            <div className="flex items-center gap-1.5 mt-4 text-xs font-medium text-indigo-100">
                                <TrendingUp className="w-3 h-3" />
                                <span>8% better than last week</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-900 text-white border-0 overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <ShieldAlert className="w-24 h-24" />
                        </div>
                        <CardContent className="p-5">
                            <p className="text-slate-400 text-sm font-medium">Support Effort</p>
                            <h2 className="text-4xl font-bold mt-1">{supportHours.toFixed(1)}h</h2>
                            <div className="flex items-center gap-1.5 mt-4 text-xs font-medium text-slate-400">
                                <Award className="w-3 h-3 text-amber-500" />
                                <span>Weekend & Holiday Support</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white dark:bg-slate-900 border-border/50">
                        <CardContent className="p-5">
                            <p className="text-slate-500 text-sm font-medium">Total Logging</p>
                            <h2 className="text-4xl font-bold mt-1 text-slate-900 dark:text-white">{totalHours.toFixed(1)}h</h2>
                            <div className="flex items-center gap-1.5 mt-4 text-xs font-medium text-emerald-600">
                                <Flame className="w-3 h-3" />
                                <span>12 Day Unbroken Streak</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Weekly Distribution Chart */}
                    <Card className="bg-white dark:bg-slate-900 border-border/50">
                        <CardHeader className="pb-0">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-indigo-500" /> Weekly Distribution
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="flex items-end justify-between gap-2 h-48">
                                {weeklyData.map((day, i) => (
                                    <div key={day.day} className="flex-1 flex flex-col items-center gap-3">
                                        <div className="relative w-full flex flex-col justify-end h-full">
                                            <motion.div
                                                initial={{ height: 0 }}
                                                animate={{ height: `${(day.hours / maxHours) * 100}%` }}
                                                transition={{ delay: i * 0.05, duration: 0.5 }}
                                                className={`w-full rounded-t-lg relative group ${day.type === 'support' ? 'bg-amber-400' : 'bg-indigo-500'}`}
                                            >
                                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-0.5 px-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                                    {day.hours}h ({day.type})
                                                </div>
                                            </motion.div>
                                        </div>
                                        <span className="text-xs font-bold text-slate-500">{day.day}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Project Allocation */}
                    <Card className="bg-white dark:bg-slate-900 border-border/50">
                        <CardHeader className="pb-0">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <Briefcase className="w-4 h-4 text-indigo-500" /> Project Allocation
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-5">
                            {projectDistribution.map((project, i) => (
                                <div key={project.name} className="space-y-1.5">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="font-bold text-slate-700 dark:text-slate-300">{project.name}</span>
                                        <span className="text-slate-500 font-mono">{project.hours}h ({project.percentage}%)</span>
                                    </div>
                                    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${project.percentage}%` }}
                                            transition={{ delay: 0.2 + (i * 0.1), duration: 0.5 }}
                                            className="h-full rounded-full"
                                            style={{ backgroundColor: project.color }}
                                        />
                                    </div>
                                </div>
                            ))}

                            <div className="pt-4 border-t border-border/50 flex items-center justify-between text-xs text-slate-500">
                                <div className="flex items-center gap-2">
                                    <Coffee className="w-3 h-3" />
                                    <span>Focus Hours: 32h</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Target className="w-3 h-3" />
                                    <span>Goal: 40h/week</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* AI Suggestions */}
                <Card className="border-0 bg-gradient-to-r from-violet-600/10 to-indigo-600/10 dark:from-violet-500/5 dark:to-indigo-500/5">
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm">
                            <Zap className="w-6 h-6 text-yellow-500" />
                        </div>
                        <div>
                            <h4 className="font-bold text-sm text-slate-900 dark:text-white text-indigo-600">AI Productivity Tip</h4>
                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                                You tend to log 40% more bugs during late evening sessions. Consider scheduling heavy testing between 10 AM - 1 PM for maximum accuracy.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppShell>
    );
}
