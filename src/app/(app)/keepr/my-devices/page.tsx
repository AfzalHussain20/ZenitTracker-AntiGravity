'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AppShell } from '@/components/apps/AppShell';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Shield, LayoutDashboard, Package, Users,
    Laptop, Smartphone, Tablet, Monitor, Tv, Box, LogIn, User, ClipboardCheck
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebaseConfig';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';

const ACCENT = '#0EA5E9';

const navItems = [
    { label: 'Devices', href: '/keepr', icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: 'My Devices', href: '/keepr/my-devices', icon: <Package className="w-5 h-5" /> },
    { label: 'Audit Log', href: '/keepr/audit-log', icon: <ClipboardCheck className="w-5 h-5" /> },
    { label: 'Team', href: '/keepr/team', icon: <Users className="w-5 h-5" /> },
];

const deviceIcons: Record<string, any> = {
    laptop: Laptop,
    phone: Smartphone,
    tablet: Tablet,
    monitor: Monitor,
    tv: Tv,
    other: Box,
};

export default function MyDevicesPage() {
    const { user } = useAuth();
    const [devices, setDevices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        const q = query(collection(db, 'keepr_devices'), where('checkedOutBy.uid', '==', user.uid));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setDevices(fetched);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [user]);

    const handleCheckIn = async (deviceId: string) => {
        const deviceRef = doc(db, 'keepr_devices', deviceId);
        await updateDoc(deviceRef, {
            status: 'available',
            checkedOutBy: null,
            checkedOutAt: null,
        });
    };
    return (
        <AppShell
            appName="Keepr"
            appIcon={<Shield className="w-6 h-6" style={{ color: ACCENT }} />}
            accentColor={ACCENT}
            navItems={navItems}
        >
            <div className="max-w-4xl mx-auto space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Devices</h1>
                    <p className="text-sm text-slate-500">Devices currently checked out to you</p>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                        <div className="w-12 h-12 bg-sky-100 rounded-full mb-4" />
                        <div className="h-4 w-32 bg-slate-100 rounded mb-2" />
                        <div className="h-3 w-48 bg-slate-50 rounded" />
                    </div>
                ) : devices.length > 0 ? (
                    <div className="space-y-3">
                        {devices.map((device, i) => {
                            const DeviceIcon = deviceIcons[device.type] || Box;
                            const checkedOutDate = new Date(device.checkedOutAt);
                            const duration = Math.round((Date.now() - checkedOutDate.getTime()) / (1000 * 60 * 60));

                            return (
                                <motion.div
                                    key={device.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                >
                                    <Card className="bg-white dark:bg-slate-900 border-slate-200/50 dark:border-slate-800/50">
                                        <CardContent className="p-4">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 rounded-lg bg-sky-50 dark:bg-sky-900/20">
                                                    <DeviceIcon className="w-6 h-6 text-sky-600" />
                                                </div>

                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-slate-900 dark:text-white">{device.name}</h3>
                                                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                                                        <span>{device.location}</span>
                                                        <span>•</span>
                                                        <span>{duration}h checked out</span>
                                                    </div>
                                                </div>

                                                <Button size="sm" className="gap-1.5 bg-sky-500 hover:bg-sky-600" onClick={() => handleCheckIn(device.id)}>
                                                    <LogIn className="w-4 h-4" /> Check In
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <Package className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                        <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">No devices checked out</h3>
                        <p className="text-sm text-slate-500 mb-4">Head to the Device Rack to check out a device</p>
                        <Button asChild className="bg-sky-500 hover:bg-sky-600">
                            <a href="/keepr">Go to Device Rack</a>
                        </Button>
                    </div>
                )}
            </div>
        </AppShell>
    );
}
