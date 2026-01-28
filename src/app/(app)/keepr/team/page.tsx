'use client';

import { motion } from 'framer-motion';
import { AppShell } from '@/components/apps/AppShell';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
    Shield, LayoutDashboard, Package, Users, Crown, ClipboardCheck
} from 'lucide-react';

const ACCENT = '#0EA5E9';

const navItems = [
    { label: 'Devices', href: '/keepr', icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: 'My Devices', href: '/keepr/my-devices', icon: <Package className="w-5 h-5" /> },
    { label: 'Audit Log', href: '/keepr/audit-log', icon: <ClipboardCheck className="w-5 h-5" /> },
    { label: 'Team', href: '/keepr/team', icon: <Users className="w-5 h-5" /> },
];

// Mock team data
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebaseConfig';
import { collection, query, onSnapshot } from 'firebase/firestore';

export default function KeeprTeamPage() {
    const [devices, setDevices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, 'keepr_devices'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setDevices(snapshot.docs.map(doc => doc.data()));
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const teamCounts = devices.reduce((acc: any, d) => {
        if (d.status === 'checked-out' && d.checkedOutBy?.name) {
            acc[d.checkedOutBy.name] = (acc[d.checkedOutBy.name] || 0) + 1;
        }
        return acc;
    }, {});

    const TEAM_MEMBERS_FLAT = [
        "Manoj", "Suresh", "Divya", "Prakash",
        "Arun", "Karthik", "Priya", "Vijay",
        "Raja", "Sekar", "Deepak", "Anitha",
        "Santhosh", "Balan", "Maya", "Kevin",
        "Saranya", "Sathish"
    ];

    const teamList = TEAM_MEMBERS_FLAT.map(name => ({
        name,
        role: name === 'Saranya' ? 'QA Lead' : 'Tester',
        devicesCheckedOut: teamCounts[name] || 0,
        avatar: ''
    })).sort((a, b) => b.devicesCheckedOut - a.devicesCheckedOut);

    return (
        <AppShell
            appName="Keepr"
            appIcon={<Shield className="w-6 h-6" style={{ color: ACCENT }} />}
            accentColor={ACCENT}
            navItems={navItems}
        >
            <div className="max-w-4xl mx-auto space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Team</h1>
                    <p className="text-sm text-slate-500">See who has devices checked out</p>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                        <div className="w-12 h-12 bg-sky-100 rounded-full mb-4" />
                        <div className="h-4 w-32 bg-slate-100 rounded mb-2" />
                        <div className="h-3 w-48 bg-slate-50 rounded" />
                    </div>
                ) : (
                    <div className="space-y-2">
                        {teamList.map((member: any, i: number) => (
                            <motion.div
                                key={member.name}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                            >
                                <Card className="bg-white dark:bg-slate-900 border-slate-200/50 dark:border-slate-800/50">
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-4">
                                            <div className="relative">
                                                <Avatar className="w-10 h-10">
                                                    <AvatarFallback className="bg-sky-100 text-sky-700 font-semibold">
                                                        {member.name.split(' ').map((n: string) => n[0]).join('')}
                                                    </AvatarFallback>
                                                </Avatar>
                                                {i === 0 && member.devicesCheckedOut > 0 && (
                                                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center">
                                                        <Crown className="w-3 h-3 text-amber-900" />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex-1">
                                                <p className="font-semibold text-slate-900 dark:text-white">{member.name}</p>
                                                <p className="text-xs text-slate-500">{member.role}</p>
                                            </div>

                                            {member.devicesCheckedOut > 0 ? (
                                                <Badge className="bg-sky-100 text-sky-700 hover:bg-sky-100">
                                                    {member.devicesCheckedOut} device{member.devicesCheckedOut > 1 ? 's' : ''}
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary" className="text-slate-500 bg-slate-50 border-0">
                                                    No devices
                                                </Badge>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </AppShell>
    );
}
