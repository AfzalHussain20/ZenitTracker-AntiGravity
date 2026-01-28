'use client';

import { PageShell } from '@/components/ui/page-shell';
import { Button } from '@/components/ui/button';
import { Play, Activity, Clock, AlertCircle, CheckCircle, BrainCircuit } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';

export default function TestRunsPage() {
    const runs = [
        { id: 'RUN-4921', plan: 'Core Authentication', status: 'Running', progress: 45, agents: 2, time: 'Now' },
        { id: 'RUN-4920', plan: 'Payment Gateway v2', status: 'Failed', progress: 100, agents: 1, time: '2h ago' },
        { id: 'RUN-4919', plan: 'User Profile Sync', status: 'Passed', progress: 100, agents: 3, time: '5h ago' },
        { id: 'RUN-4918', plan: 'Onboarding Flow', status: 'Passed', progress: 100, agents: 1, time: 'Yesterday' },
    ];

    const stats = [
        { label: "Active Sessions", value: "3", icon: Activity, color: "text-blue-500" },
        { label: "Global Pass Rate", value: "94.2%", icon: CheckCircle, color: "text-green-500" },
        { label: "Critical Defects", value: "0", icon: AlertCircle, color: "text-red-500" },
    ];

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const item = {
        hidden: { opacity: 0, x: -20 },
        show: { opacity: 1, x: 0 }
    };

    return (
        <PageShell
            title="Live Operations"
            description="Real-time execution monitoring and historical telemetry."
            actions={
                <div className="flex gap-2">
                    <Button variant="outline" className="text-purple-500 border-purple-500/20 bg-purple-500/10 hover:bg-purple-500/20">
                        <BrainCircuit className="w-4 h-4 mr-2" /> Neural Sim
                    </Button>
                    <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25">
                        <Play className="w-4 h-4 mr-2" />
                        Initiate Run
                    </Button>
                </div>
            }
        >
            <div className="space-y-8">
                {/* Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {stats.map((stat, i) => (
                        <Card key={i} className="glass-panel border-white/5 bg-white/5">
                            <CardContent className="p-6 flex items-center justify-between">
                                <div>
                                    <p className="text-muted-foreground text-xs uppercase font-bold tracking-wider">{stat.label}</p>
                                    <h3 className="text-2xl font-headline font-bold mt-1">{stat.value}</h3>
                                </div>
                                <div className={`p-3 rounded-full bg-background/50 border border-white/5 ${stat.color}`}>
                                    <stat.icon className="w-6 h-6" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Timeline */}
                <div>
                    <h3 className="text-lg font-headline font-semibold mb-6">Execution Telemetry</h3>
                    <motion.div
                        variants={container}
                        initial="hidden"
                        animate="show"
                        className="space-y-4 relative before:absolute before:left-6 before:top-4 before:bottom-4 before:w-[1px] before:bg-white/10"
                    >
                        {runs.map((run, i) => (
                            <motion.div key={run.id} variants={item} className="relative z-10 pl-16 group">
                                <div className={`absolute left-[21px] top-6 w-3 h-3 rounded-full border-2 border-background ${run.status === 'Running' ? 'bg-blue-500 animate-pulse' : run.status === 'Failed' ? 'bg-red-500' : 'bg-green-500'}`} />

                                <Card className="glass-card-interactive hover:bg-white/5 border border-white/5 transition-all">
                                    <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-3">
                                                <Badge variant="outline" className="font-mono text-[10px] opacity-70">{run.id}</Badge>
                                                <span className="font-semibold text-sm">{run.plan}</span>
                                            </div>
                                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {run.time}</span>
                                                <span>•</span>
                                                <span> {run.agents} Active Agent(s)</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6">
                                            <div className="w-24 md:w-32">
                                                <div className="flex justify-between text-[10px] mb-1">
                                                    <span>Progress</span>
                                                    <span>{run.progress}%</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${run.status === 'Failed' ? 'bg-red-500' : run.status === 'Running' ? 'bg-blue-500' : 'bg-green-500'}`}
                                                        style={{ width: `${run.progress}%` }}
                                                    />
                                                </div>
                                            </div>

                                            <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                View Logs
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </div>
        </PageShell>
    );
}
