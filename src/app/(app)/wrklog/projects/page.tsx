'use client';

import { AppShell } from '@/components/apps/AppShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import {
    Clock, FolderKanban, Plus, Search, MoreHorizontal, Calendar,
    LayoutDashboard, BarChart3, Users, Settings, ChevronRight
} from 'lucide-react';

const ACCENT = '#6366F1';

const navItems = [
    { label: 'Dashboard', href: '/wrklog', icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: 'Projects', href: '/wrklog/projects', icon: <FolderKanban className="w-5 h-5" />, badge: '12' },
    { label: 'Calendar', href: '/wrklog/calendar', icon: <Calendar className="w-5 h-5" /> },
    { label: 'Analytics', href: '/wrklog/analytics', icon: <BarChart3 className="w-5 h-5" /> },
    { label: 'Team', href: '/wrklog/team', icon: <Users className="w-5 h-5" /> },
    { label: 'Settings', href: '/wrklog/settings', icon: <Settings className="w-5 h-5" /> },
];

const mockProjects = [
    { id: '1', name: 'Zenit Platform', description: 'Main testing suite development', status: 'active', progress: 78, hours: 124, tasks: 32, color: '#6366F1' },
    { id: '2', name: 'Mobile App', description: 'iOS and Android app development', status: 'active', progress: 45, hours: 67, tasks: 18, color: '#10B981' },
    { id: '3', name: 'Marketing Site', description: 'Company website redesign', status: 'completed', progress: 100, hours: 42, tasks: 12, color: '#F59E0B' },
    { id: '4', name: 'API Integration', description: 'Third-party service integrations', status: 'active', progress: 23, hours: 28, tasks: 8, color: '#EC4899' },
    { id: '5', name: 'Documentation', description: 'Technical documentation update', status: 'paused', progress: 60, hours: 16, tasks: 6, color: '#8B5CF6' },
];

export default function WrklogProjectsPage() {
    return (
        <AppShell
            appName="Wrklog"
            appIcon={<Clock className="w-6 h-6" style={{ color: ACCENT }} />}
            accentColor={ACCENT}
            navItems={navItems}
        >
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div>
                        <motion.h1
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white"
                        >
                            Projects
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="text-slate-500 mt-1"
                        >
                            Manage and track time across all your projects
                        </motion.p>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className="flex items-center gap-3"
                    >
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input placeholder="Search projects..." className="pl-10 w-64" />
                        </div>
                        <Button className="gap-2 bg-indigo-500 hover:bg-indigo-600">
                            <Plus className="w-4 h-4" /> New Project
                        </Button>
                    </motion.div>
                </div>

                {/* Projects Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {mockProjects.map((project, i) => (
                        <motion.div
                            key={project.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 + i * 0.05 }}
                        >
                            <Card className="bg-white dark:bg-slate-900 border-slate-200/50 dark:border-slate-800/50 hover:shadow-xl hover:border-indigo-200 dark:hover:border-indigo-800 transition-all cursor-pointer group overflow-hidden">
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div
                                            className="w-3 h-3 rounded-full"
                                            style={{ backgroundColor: project.color }}
                                        />
                                        <Badge
                                            variant="secondary"
                                            className={`text-xs ${project.status === 'active' ? 'bg-green-100 text-green-700' :
                                                    project.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                                                        'bg-gray-100 text-gray-700'
                                                }`}
                                        >
                                            {project.status}
                                        </Badge>
                                    </div>

                                    <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1 group-hover:text-indigo-600 transition-colors">
                                        {project.name}
                                    </h3>
                                    <p className="text-sm text-slate-500 mb-4">{project.description}</p>

                                    {/* Progress Bar */}
                                    <div className="mb-4">
                                        <div className="flex justify-between text-xs text-slate-500 mb-1">
                                            <span>Progress</span>
                                            <span>{project.progress}%</span>
                                        </div>
                                        <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all"
                                                style={{ width: `${project.progress}%`, backgroundColor: project.color }}
                                            />
                                        </div>
                                    </div>

                                    {/* Stats */}
                                    <div className="flex gap-4 text-sm text-slate-500">
                                        <div className="flex items-center gap-1">
                                            <Clock className="w-4 h-4" />
                                            <span>{project.hours}h</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <span>{project.tasks} tasks</span>
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                        <span className="text-xs text-slate-400 uppercase tracking-wider">View Details</span>
                                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </div>
        </AppShell>
    );
}
