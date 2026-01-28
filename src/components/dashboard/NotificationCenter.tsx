"use client";

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Bell, Clock, Shield, User, Info, CheckCircle2, AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Notification {
    id: string;
    type: 'reminder' | 'update' | 'alert' | 'info';
    title: string;
    message: string;
    time: string;
    read: boolean;
    category: 'keepr' | 'wrklog' | 'system';
}

export default function NotificationCenter() {
    const [notifications, setNotifications] = useState<Notification[]>([
        {
            id: '1',
            type: 'reminder',
            category: 'keepr',
            title: 'Device Handover',
            message: "Manoj's checkout for MacBook Pro 16\" is over 24h. Please verify handover.",
            time: '2h ago',
            read: false
        },
        {
            id: '2',
            category: 'wrklog',
            type: 'info',
            title: 'Log Reminder',
            message: "Don't forget to log your support hours for today's release.",
            time: '5h ago',
            read: false
        },
        {
            id: '3',
            category: 'keepr',
            type: 'alert',
            title: 'Missing Accessory',
            message: 'Galaxy M32 5G was returned without a cable. Saranya notified.',
            time: '1d ago',
            read: true
        }
    ]);

    const markAsRead = (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };

    const deleteNotification = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'reminder': return <Clock className="w-4 h-4 text-sky-500" />;
            case 'alert': return <AlertTriangle className="w-4 h-4 text-red-500" />;
            case 'update': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
            default: return <Info className="w-4 h-4 text-slate-500" />;
        }
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <Card className="glass-panel h-full flex flex-col bg-card/60 overflow-hidden group">
            <CardHeader className="pb-3 flex flex-row items-center justify-between border-b border-border/40">
                <div className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-primary" />
                    <CardTitle className="text-base font-bold">Notification Center</CardTitle>
                    {unreadCount > 0 && (
                        <Badge variant="destructive" className="h-5 px-1.5 text-[10px] min-w-[20px] justify-center ml-1 animate-pulse">
                            {unreadCount}
                        </Badge>
                    )}
                </div>
                <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground hover:text-primary">
                    Mark all read
                </Button>
            </CardHeader>
            <CardContent className="p-0 flex-grow overflow-y-auto max-h-[400px] scrollbar-hide">
                <div className="divide-y divide-border/20">
                    <AnimatePresence initial={false}>
                        {notifications.length === 0 ? (
                            <div className="p-12 text-center">
                                <Bell className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                                <p className="text-sm text-muted-foreground">No new updates</p>
                            </div>
                        ) : (
                            notifications.map((n) => (
                                <motion.div
                                    key={n.id}
                                    layout
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className={`p-4 relative hover:bg-muted/30 transition-colors group/item ${!n.read ? 'bg-primary/[0.03]' : ''}`}
                                >
                                    <div className="flex gap-3">
                                        <div className="mt-0.5">
                                            {getIcon(n.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-0.5">
                                                <h4 className={`text-sm font-semibold truncate ${!n.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                                                    {n.title}
                                                </h4>
                                                <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">{n.time}</span>
                                            </div>
                                            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                                {n.message}
                                            </p>
                                            <div className="mt-2 flex items-center gap-3">
                                                <Badge variant="outline" className="text-[9px] uppercase tracking-wider h-4 bg-muted/50 border-0">
                                                    {n.category}
                                                </Badge>
                                                {!n.read && (
                                                    <button
                                                        onClick={() => markAsRead(n.id)}
                                                        className="text-[10px] text-primary font-bold hover:underline"
                                                    >
                                                        Mark Read
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => deleteNotification(n.id)}
                                            className="opacity-0 group-hover/item:opacity-100 transition-opacity p-1 hover:bg-red-50 hover:text-red-500 rounded text-muted-foreground"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </AnimatePresence>
                </div>
            </CardContent>
            {notifications.length > 0 && (
                <div className="p-3 border-t border-border/40 text-center">
                    <Button variant="link" size="sm" className="h-auto py-0 text-xs text-muted-foreground font-medium">
                        View All History
                    </Button>
                </div>
            )}
        </Card>
    );
}
