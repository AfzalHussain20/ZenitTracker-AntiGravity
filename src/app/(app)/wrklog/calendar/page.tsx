'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { AppShell } from '@/components/apps/AppShell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    LayoutDashboard, FolderKanban, Calendar as CalendarIcon,
    BarChart3, ChevronLeft, ChevronRight, Plus, Clock,
    Coffee, Zap, Palmtree
} from 'lucide-react';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

const ACCENT = '#6366F1';

const navItems = [
    { label: 'Dashboard', href: '/wrklog', icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: 'Projects', href: '/wrklog/projects', icon: <FolderKanban className="w-5 h-5" /> },
    { label: 'Work Calendar', href: '/wrklog/calendar', icon: <CalendarIcon className="w-5 h-5" /> },
    { label: 'Analytics', href: '/wrklog/analytics', icon: <BarChart3 className="w-5 h-5" /> },
];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Mock logs
const mockLogs: Record<number, { task: string, hours: string, type: 'regular' | 'support' | 'holiday' }[]> = {
    18: [{ task: 'Feature Testing', hours: '8h', type: 'regular' }],
    19: [{ task: 'Bug Fixing', hours: '7h', type: 'regular' }],
    20: [{ task: 'Documentation', hours: '8h', type: 'regular' }],
    21: [{ task: 'On-Call Support', hours: '4h', type: 'support' }],
    22: [{ task: 'Weekend Shift', hours: '6h', type: 'support' }],
};

export default function WrklogCalendarPage() {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDay, setSelectedDay] = useState<number | null>(null);
    const [isLogDialogOpen, setIsLogDialogOpen] = useState(false);

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const lastDate = new Date(year, month + 1, 0).getDate();

        const days = [];
        // Pad with empty days from prev month
        for (let i = 0; i < firstDay; i++) days.push(null);
        // Current month days
        for (let i = 1; i <= lastDate; i++) days.push(i);

        return days;
    };

    const days = getDaysInMonth(currentMonth);
    const monthName = currentMonth.toLocaleString('default', { month: 'long' });
    const year = currentMonth.getFullYear();

    const isWeekend = (day: number | null) => {
        if (!day) return false;
        const d = new Date(year, currentMonth.getMonth(), day).getDay();
        return d === 0 || d === 6;
    };

    return (
        <AppShell
            appName="Wrklog"
            appIcon={<Clock className="w-6 h-6" style={{ color: ACCENT }} />}
            accentColor={ACCENT}
            navItems={navItems}
        >
            <div className="max-w-5xl mx-auto space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Work Calendar</h1>
                        <p className="text-sm text-slate-500">View and log your daily efforts</p>
                    </div>

                    <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1 rounded-lg border border-border/50">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(new Date(year, currentMonth.getMonth() - 1))}>
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <span className="text-sm font-bold px-4 min-w-[120px] text-center">{monthName} {year}</span>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(new Date(year, currentMonth.getMonth() + 1))}>
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                {/* Legend */}
                <div className="flex gap-4 text-xs font-medium text-slate-500">
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-indigo-500/10 border border-indigo-200" /> Regular</div>
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-amber-500/10 border border-amber-200" /> Support</div>
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-green-500/10 border border-green-200" /> Holiday / Weekend</div>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-2">
                    {DAYS.map(d => (
                        <div key={d} className="text-center py-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                            {d}
                        </div>
                    ))}

                    {days.map((day, i) => {
                        const weekend = isWeekend(day);
                        const hasLogs = day && mockLogs[day];

                        return (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.01 }}
                            >
                                <Card
                                    className={`h-24 sm:h-32 border-border/40 transition-all cursor-pointer group hover:border-indigo-400 hover:shadow-md ${!day ? 'bg-slate-50 opacity-30 cursor-default' : ''} ${weekend ? 'bg-green-50/30' : 'bg-white'}`}
                                    onClick={() => day && (setSelectedDay(day), setIsLogDialogOpen(true))}
                                >
                                    <div className="p-2 h-full flex flex-col">
                                        <div className="flex justify-between items-start">
                                            <span className={`text-sm font-bold ${weekend ? 'text-green-600' : 'text-slate-900 dark:text-white'}`}>
                                                {day}
                                            </span>
                                            {day === new Date().getDate() && currentMonth.getMonth() === new Date().getMonth() && (
                                                <Badge className="bg-indigo-500 text-white h-4 px-1 text-[8px]">TODAY</Badge>
                                            )}
                                            {weekend && day && (
                                                <Palmtree className="w-3 h-3 text-green-400 opacity-60" />
                                            )}
                                        </div>

                                        <div className="mt-1 space-y-1 overflow-hidden">
                                            {Array.isArray(hasLogs) && hasLogs.map((log: any, li: number) => (
                                                <div
                                                    key={li}
                                                    className={`text-[9px] p-1 rounded border truncate font-medium ${log.type === 'support' ? 'bg-amber-50 border-amber-100 text-amber-700' :
                                                        log.type === 'holiday' ? 'bg-green-50 border-green-100 text-green-700' :
                                                            'bg-indigo-50 border-indigo-100 text-indigo-700'
                                                        }`}
                                                >
                                                    {log.hours} {log.task}
                                                </div>
                                            ))}
                                        </div>

                                        {!hasLogs && day && !weekend && (
                                            <div className="mt-auto flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Plus className="w-4 h-4 text-indigo-300" />
                                            </div>
                                        )}
                                        {weekend && day && !hasLogs && (
                                            <div className="mt-auto block">
                                                <span className="text-[9px] text-green-500 font-bold uppercase tracking-tighter opacity-100 italic">Holiday</span>
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Log Dialog */}
                <Dialog open={isLogDialogOpen} onOpenChange={setIsLogDialogOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Log Effort for {selectedDay} {monthName}</DialogTitle>
                            <DialogDescription>Add work details, support shifts, or weekend activities.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Select Log Type</Label>
                                <Select defaultValue="regular">
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="regular">Regular Work</SelectItem>
                                        <SelectItem value="support">Holiday/Weekend Support</SelectItem>
                                        <SelectItem value="overtime">Overtime</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Task Description</Label>
                                <Input placeholder="e.g. API Testing, Regression..." />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Project</Label>
                                    <Select>
                                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="zenit">Zenit Platform</SelectItem>
                                            <SelectItem value="mobile">Mobile App</SelectItem>
                                            <SelectItem value="others">Others</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Duration (Hours)</Label>
                                    <Input type="number" defaultValue="8" />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsLogDialogOpen(false)}>Cancel</Button>
                            <Button className="bg-indigo-500 hover:bg-indigo-600">Save Log</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppShell>
    );
}
