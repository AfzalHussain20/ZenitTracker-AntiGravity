
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
        >
            {value.toLocaleString()}{suffix}
        </motion.span>
    );
};

const KPICard = ({ title, value, suffix, icon: Icon, tooltip }: { title: string; value: number; suffix?: string; icon: React.ElementType, tooltip: string }) => (
    <TooltipProvider>
        <Tooltip>
            <TooltipTrigger asChild>
                 <Card className="bg-card/50 backdrop-blur-sm hover:bg-accent/50 transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{title}</CardTitle>
                        <Icon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
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
      // This effect runs on the client and will safely access localStorage
      if (typeof window !== 'undefined') {
        const count = localStorage.getItem('cleverTapEventCount') || '0';
        setCleverTapEventCount(parseInt(count, 10));
      }

      // Optional: Listen for storage events if you want to sync across tabs
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
    
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <KPICard title="Total Tests" value={kpiData.totalTests} icon={TestTubeDiagonal} tooltip="Total number of test cases across all sessions." />
            <KPICard title="Active Sessions" value={kpiData.activeSessions} icon={Activity} tooltip="Sessions that are currently 'In Progress' or 'Paused'." />
            <KPICard title="Pass Rate" value={kpiData.passRate} suffix="%" icon={CheckCircle2} tooltip="Percentage of passed tests out of all completed (Pass/Fail) tests." />
            <KPICard title="Total Failures" value={kpiData.totalFail} icon={AlertCircle} tooltip="Total number of new and known failures recorded." />
            <KPICard title="Tracked Events" value={cleverTapEventCount} icon={Wand2} tooltip="Total events tracked using the CleverTap Event Tracker tool." />
        </div>
    );
}
