'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Clock, Shield, ArrowRight, Library, Crosshair, ChevronRight
} from 'lucide-react';

interface AppsHubSectionProps {
    className?: string;
}

const apps = [
    {
        id: 'wrklog',
        name: 'Wrklog',
        description: 'Track your testing time',
        icon: Clock,
        color: '#6366F1',
        href: '/wrklog',
    },
    {
        id: 'keepr',
        name: 'Keepr',
        description: 'Device check-in/out',
        icon: Shield,
        color: '#0EA5E9',
        href: '/keepr',
        isNew: true,
    },
    {
        id: 'repository',
        name: 'Repository',
        description: 'Test case library',
        icon: Library,
        color: '#10B981',
        href: '/dashboard/repository',
    },
    {
        id: 'locator',
        name: 'Locator Lab',
        description: 'Element finder tool',
        icon: Crosshair,
        color: '#F59E0B',
        href: '/dashboard/locator-lab',
    },
];

export function AppsHubSection({ className }: AppsHubSectionProps) {
    return (
        <section className={className}>
            {/* Section Header */}
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-foreground">Zenit Apps</h2>
                <Link href="/apps">
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground gap-1 h-8 text-xs">
                        View All <ChevronRight className="w-3 h-3" />
                    </Button>
                </Link>
            </div>

            {/* Apps Grid - Compact */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {apps.map((app, index) => {
                    const AppIcon = app.icon;

                    return (
                        <motion.div
                            key={app.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <Link href={app.href}>
                                <Card className="border-border/50 bg-card/50 hover:shadow-lg hover:border-primary/30 transition-all duration-300 cursor-pointer group h-full">
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="p-2 rounded-lg transition-transform group-hover:scale-110"
                                                style={{ backgroundColor: `${app.color}15` }}
                                            >
                                                <AppIcon className="w-5 h-5" style={{ color: app.color }} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors truncate">
                                                        {app.name}
                                                    </h3>
                                                    {app.isNew && (
                                                        <Badge className="bg-primary/10 text-primary border-0 text-[8px] px-1 py-0">NEW</Badge>
                                                    )}
                                                </div>
                                                <p className="text-xs text-muted-foreground truncate">
                                                    {app.description}
                                                </p>
                                            </div>
                                            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all opacity-0 group-hover:opacity-100" />
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        </motion.div>
                    );
                })}
            </div>
        </section>
    );
}
