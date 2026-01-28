'use client';

import { PageShell } from '@/components/ui/page-shell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Layout, Play, CheckCircle2, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function TestSuiteDashboard() {
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
        <PageShell
            title="Zenit Test Suite"
            description="Next-generation test management for high-velocity engineering teams."
            actions={
                <Link href="/test-suite/plans/new">
                    <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 rounded-xl transition-all hover:scale-105 active:scale-95">
                        <Plus className="w-5 h-5 mr-2" />
                        New Test Plan
                    </Button>
                </Link>
            }
        >
            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10"
            >
                <StatsCard icon={Layout} label="Total Plans" value="12" trend="+2.5%" />
                <StatsCard icon={CheckCircle2} label="Test Cases" value="1,240" trend="+12%" />
                <StatsCard icon={Play} label="Active Runs" value="3" trend="Stable" />
                <StatsCard icon={TrendingUp} label="Pass Rate" value="98.2%" trend="+0.4%" isGood />
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-2xl font-headline font-semibold">Recent Activity</h2>
                    <div className="grid gap-4">
                        {/* Placeholder for Recent Plans List */}
                        {[1, 2, 3].map((i) => (
                            <motion.div key={i} variants={item}>
                                <div className="glass-panel-interactive p-4 rounded-xl flex items-center justify-between group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                            <Layout className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">Core Authentication Flow</h3>
                                            <p className="text-sm text-muted-foreground">Updated 2 hours ago • 24 Cases</p>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon" className="group-hover:translate-x-1 transition-transform">
                                        <Play className="w-4 h-4" />
                                    </Button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                <div className="space-y-6">
                    <h2 className="text-2xl font-headline font-semibold">Quick Access</h2>
                    <div className="space-y-4">
                        <Link href="/test-suite/plans" className="block">
                            <Card className="glass-card cursor-pointer hover:border-primary/50 transition-colors">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Layout className="w-5 h-5 text-primary" />
                                        Test Plans
                                    </CardTitle>
                                    <CardDescription>Manage and organize your test suites.</CardDescription>
                                </CardHeader>
                            </Card>
                        </Link>
                        <Link href="/test-suite/runs" className="block">
                            <Card className="glass-card cursor-pointer hover:border-primary/50 transition-colors">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Play className="w-5 h-5 text-primary" />
                                        Test Runs
                                    </CardTitle>
                                    <CardDescription>Execute and track test progress.</CardDescription>
                                </CardHeader>
                            </Card>
                        </Link>
                    </div>
                </div>
            </div>
        </PageShell>
    );
}

function StatsCard({ icon: Icon, label, value, trend, isGood }: any) {
    return (
        <Card className="glass-panel border-none shadow-xl">
            <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-primary/10 rounded-xl text-primary">
                        <Icon className="w-6 h-6" />
                    </div>
                    <span className={cn("text-xs font-medium px-2 py-1 rounded-full", isGood ? "bg-green-500/10 text-green-500" : "bg-primary/5 text-primary")}>
                        {trend}
                    </span>
                </div>
                <div className="space-y-1">
                    <p className="text-muted-foreground text-sm font-medium">{label}</p>
                    <h3 className="text-3xl font-bold font-headline">{value}</h3>
                </div>
            </CardContent>
        </Card>
    );
}
