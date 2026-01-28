'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AppShell } from '@/components/apps/AppShell';
import { PremiumSplashScreen } from '@/components/apps/PremiumSplashScreen';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
    Clock, Play, Pause, LayoutDashboard, FolderKanban, Calendar,
    BarChart3, Users, Settings, Plus, Timer, TrendingUp, Zap, Target,
    CheckCircle2, ChevronRight
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const ACCENT = '#6366F1';

const navItems = [
    { label: 'Dashboard', href: '/wrklog', icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: 'Projects', href: '/wrklog/projects', icon: <FolderKanban className="w-5 h-5" /> },
    { label: 'Analytics', href: '/wrklog/analytics', icon: <BarChart3 className="w-5 h-5" /> },
    { label: 'Settings', href: '/wrklog/settings', icon: <Settings className="w-5 h-5" /> },
];

// Mock data
const recentEntries = [
    { id: 1, project: 'Zenit Platform', task: 'Regression Testing', duration: '2h 45m', status: 'completed' },
    { id: 2, project: 'Mobile App', task: 'API Testing', duration: '1h 30m', status: 'completed' },
];

const projects = [
    { name: 'Zenit Platform', progress: 78, color: '#6366F1', hours: 24 },
    { name: 'Mobile App', progress: 45, color: '#10B981', hours: 12 },
    { name: 'Dashboard', progress: 92, color: '#F59E0B', hours: 8 },
];

export default function WrklogPage() {
    const [showSplash, setShowSplash] = useState(true);
    const [isTracking, setIsTracking] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [currentTask, setCurrentTask] = useState('');
    const { user } = useAuth();

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isTracking) {
            interval = setInterval(() => setCurrentTime(prev => prev + 1), 1000);
        }
        return () => clearInterval(interval);
    }, [isTracking]);

    const formatTime = (seconds: number) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const greeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    if (showSplash) {
        return (
            <PremiumSplashScreen
                onComplete={() => setShowSplash(false)}
                appName="Wrklog"
                tagline="Time Tracker"
                accentColor={ACCENT}
                icon={<Clock className="w-full h-full" />}
            />
        );
    }

    return (
        <AppShell
            appName="Wrklog"
            appIcon={<Clock className="w-6 h-6" style={{ color: ACCENT }} />}
            accentColor={ACCENT}
            navItems={navItems}
        >
            <div className="max-w-5xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                            {greeting()}, {user?.displayName?.split(' ')[0] || 'there'}
                        </h1>
                        <p className="text-sm text-slate-500">Track your testing time</p>
                    </div>
                </div>

                {/* Timer Card */}
                <Card className="bg-gradient-to-r from-indigo-500 to-purple-600 border-0 shadow-lg shadow-indigo-500/20">
                    <CardContent className="p-5">
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            <div className="flex-1 w-full sm:w-auto">
                                <Input
                                    placeholder="What are you working on?"
                                    value={currentTask}
                                    onChange={e => setCurrentTask(e.target.value)}
                                    className="bg-white/10 border-white/20 text-white placeholder:text-white/60 h-10"
                                />
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-2xl font-mono font-bold text-white">{formatTime(currentTime)}</span>
                                <Button
                                    onClick={() => setIsTracking(!isTracking)}
                                    size="icon"
                                    className={`w-12 h-12 rounded-full ${isTracking ? 'bg-white text-indigo-600' : 'bg-white/20 text-white border border-white/30'}`}
                                >
                                    {isTracking ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Stats Row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {[
                        { label: 'Today', value: '4h 32m', icon: Timer, color: '#6366F1' },
                        { label: 'This Week', value: '24h 15m', icon: TrendingUp, color: '#10B981' },
                        { label: 'Projects', value: '5', icon: Target, color: '#F59E0B' },
                        { label: 'Focus', value: '92%', icon: Zap, color: '#EC4899' },
                    ].map((stat, i) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 + i * 0.05 }}
                        >
                            <Card className="bg-white dark:bg-slate-900 border-slate-200/50 dark:border-slate-800/50">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg" style={{ backgroundColor: `${stat.color}15` }}>
                                            <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
                                        </div>
                                        <div>
                                            <p className="text-lg font-bold text-slate-900 dark:text-white">{stat.value}</p>
                                            <p className="text-xs text-slate-500">{stat.label}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recent Activity */}
                    <Card className="bg-white dark:bg-slate-900 border-slate-200/50 dark:border-slate-800/50">
                        <CardContent className="p-4">
                            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                                <Clock className="w-4 h-4 text-indigo-500" /> Recent Activity
                            </h3>
                            <div className="space-y-2">
                                {recentEntries.map((entry) => (
                                    <div key={entry.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{entry.task}</p>
                                            <p className="text-xs text-slate-500">{entry.project}</p>
                                        </div>
                                        <span className="text-sm font-mono text-slate-600 dark:text-slate-400">{entry.duration}</span>
                                    </div>
                                ))}
                                <Button variant="ghost" size="sm" className="w-full text-xs text-slate-500 mt-2">
                                    View All <ChevronRight className="w-3 h-3 ml-1" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Projects */}
                    <Card className="bg-white dark:bg-slate-900 border-slate-200/50 dark:border-slate-800/50">
                        <CardContent className="p-4">
                            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                                <FolderKanban className="w-4 h-4 text-indigo-500" /> Active Projects
                            </h3>
                            <div className="space-y-3">
                                {projects.map((project) => (
                                    <div key={project.name} className="group cursor-pointer">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 transition-colors">
                                                {project.name}
                                            </span>
                                            <span className="text-xs text-slate-500">{project.hours}h</span>
                                        </div>
                                        <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all"
                                                style={{ width: `${project.progress}%`, backgroundColor: project.color }}
                                            />
                                        </div>
                                    </div>
                                ))}
                                <Button variant="outline" size="sm" className="w-full mt-2 text-xs border-dashed">
                                    <Plus className="w-3 h-3 mr-1" /> New Project
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppShell>
    );
}
