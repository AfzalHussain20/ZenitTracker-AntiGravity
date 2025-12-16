"use client";

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Activity, CheckCircle2, AlertCircle, TestTubeDiagonal, Wand2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { TestSession } from '@/types';

interface DashboardKPIRowProps {
    sessions: TestSession[];
}

const AnimatedCounter = ({ value, suffix = '' }: { value: number, suffix?: string }) => {
    return (
        <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="tracking-tight"
        >
            {value.toLocaleString()}{suffix}
        </motion.span>
    );
};

// Simplified and cleaner Card design that works in Light and Dark modes
const KPICard = ({ title, value, suffix, icon: Icon, tooltip, colorClass }: { title: string; value: number; suffix?: string; icon: React.ElementType, tooltip: string, colorClass: string }) => (
    <TooltipProvider>
        <Tooltip>
            <TooltipTrigger asChild>
                <Card className="glass-panel hover:shadow-xl transition-all duration-300 border-l-4 border-l-transparent hover:border-l-primary group">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">{title}</CardTitle>
                        <div className={`p-2 rounded-full bg-accent/50 group-hover:bg-accent transition-colors ${colorClass}`}>
                            <Icon className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-foreground">
                            <AnimatedCounter value={value} suffix={suffix} />
                        </div>
                    </CardContent>
                </Card>
            </TooltipTrigger>
            <TooltipContent>
                <p>{tooltip}</p>
            </TooltipContent>
        </Tooltip>
    </TooltipProvider>
);

export default function DashboardKPIRow({ sessions }: DashboardKPIRowProps) {
    const [cleverTapEventCount, setCleverTapEventCount] = useState(0);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const count = localStorage.getItem('cleverTapEventCount') || '0';
            setCleverTapEventCount(parseInt(count, 10));
        }

        const handleStorageChange = (event: StorageEvent) => {
            if (event.key === 'cleverTapEventCount' && event.newValue) {
                setCleverTapEventCount(parseInt(event.newValue, 10));
            }
        };
        window.addEventListener('storage', handleStorageChange);
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    const kpiData = useMemo(() => {
        const totalTests = sessions.reduce((acc, s) => acc + (s.summary?.total || 0), 0);
        const totalPass = sessions.reduce((acc, s) => acc + (s.summary?.pass || 0), 0);
        const totalFail = sessions.reduce((acc, s) => acc + (s.summary?.fail || 0) + (s.summary?.failKnown || 0), 0);
        const activeSessions = sessions.filter(s => s.status === 'In Progress' || s.status === 'Aborted').length;
        const totalActionable = totalPass + totalFail;
        const passRate = totalActionable > 0 ? Math.round((totalPass / totalActionable) * 100) : 0;

        return { totalTests, activeSessions, passRate, totalFail };
    }, [sessions]);

    // Staggered animation for cards
    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5"
        >
            <motion.div variants={item}><KPICard title="Total Tests" value={kpiData.totalTests} icon={TestTubeDiagonal} tooltip="Total test cases executed." colorClass="text-blue-500" /></motion.div>
            <motion.div variants={item}><KPICard title="Active Missions" value={kpiData.activeSessions} icon={Activity} tooltip="In-progress sessions." colorClass="text-yellow-500" /></motion.div>
            <motion.div variants={item}><KPICard title="Success Rate" value={kpiData.passRate} suffix="%" icon={CheckCircle2} tooltip="Pass percentage." colorClass="text-green-500" /></motion.div>
            <motion.div variants={item}><KPICard title="Failures" value={kpiData.totalFail} icon={AlertCircle} tooltip="Total failures recorded." colorClass="text-red-500" /></motion.div>
            <motion.div variants={item}><KPICard title="Events" value={cleverTapEventCount} icon={Wand2} tooltip="CleverTap events tracked." colorClass="text-purple-500" /></motion.div>
        </motion.div>
    );
}
