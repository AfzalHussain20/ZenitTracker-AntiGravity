'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Clock, Shield, Library, Crosshair, Wand2, Users, ChevronRight } from 'lucide-react';

const apps = [
    {
        id: 'wrklog',
        name: 'Wrklog',
        description: 'Track your testing time and productivity',
        icon: Clock,
        color: '#6366F1',
        href: '/wrklog',
    },
    {
        id: 'keepr',
        name: 'Keepr',
        description: 'Device check-in and check-out for testing',
        icon: Shield,
        color: '#0EA5E9',
        href: '/keepr',
    },
    {
        id: 'repository',
        name: 'Repository',
        description: 'Test case library and management',
        icon: Library,
        color: '#10B981',
        href: '/dashboard/repository',
    },
    {
        id: 'locator',
        name: 'Locator Lab',
        description: 'Element locator generator tool',
        icon: Crosshair,
        color: '#F59E0B',
        href: '/dashboard/locator-lab',
    },
    {
        id: 'clevertap',
        name: 'CleverTap Tracker',
        description: 'CleverTap event intelligence',
        icon: Wand2,
        color: '#EC4899',
        href: '/dashboard/clevertap-tracker',
    },
    {
        id: 'team',
        name: 'Team Performance',
        description: 'Team analytics and leaderboard',
        icon: Users,
        color: '#8B5CF6',
        href: '/dashboard/team-performance',
    },
];

export default function AppsPage() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50">
                <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-4">
                    <Link href="/dashboard">
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <h1 className="font-bold text-lg">Zenit Apps</h1>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-5xl mx-auto px-4 py-8">
                <p className="text-slate-500 mb-6">All tools and applications in the Zenit suite</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {apps.map((app, index) => {
                        const AppIcon = app.icon;
                        return (
                            <motion.div
                                key={app.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <Link href={app.href}>
                                    <Card className="bg-white dark:bg-slate-900 border-slate-200/50 dark:border-slate-800/50 hover:shadow-lg hover:border-primary/30 transition-all cursor-pointer group h-full">
                                        <CardContent className="p-5">
                                            <div className="flex items-start gap-4">
                                                <div
                                                    className="p-3 rounded-xl transition-transform group-hover:scale-110"
                                                    style={{ backgroundColor: `${app.color}15` }}
                                                >
                                                    <AppIcon className="w-6 h-6" style={{ color: app.color }} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-primary transition-colors mb-1">
                                                        {app.name}
                                                    </h3>
                                                    <p className="text-sm text-slate-500 line-clamp-2">
                                                        {app.description}
                                                    </p>
                                                </div>
                                                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all mt-1" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            </motion.div>
                        );
                    })}
                </div>
            </main>
        </div>
    );
}
