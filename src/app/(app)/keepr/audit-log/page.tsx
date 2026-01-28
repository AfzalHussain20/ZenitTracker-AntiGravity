'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppShell } from '@/components/apps/AppShell';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Shield, LayoutDashboard, Package, Users, ClipboardCheck,
    CheckCircle2, XCircle, Clock, Calendar, Search, Trash2
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/firebaseConfig';
import { collection, query, onSnapshot, orderBy, getDocs, deleteDoc, doc } from 'firebase/firestore';

const ACCENT = '#0EA5E9';

const navItems = [
    { label: 'Devices', href: '/keepr', icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: 'My Devices', href: '/keepr/my-devices', icon: <Package className="w-5 h-5" /> },
    { label: 'Audit Log', href: '/keepr/audit-log', icon: <ClipboardCheck className="w-5 h-5" /> },
    { label: 'Team', href: '/keepr/team', icon: <Users className="w-5 h-5" /> },
];

export default function KeeprAuditLogPage() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');

    useEffect(() => {
        const q = query(collection(db, 'keepr_audit_logs'), orderBy('date', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setLogs(fetched);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleClearLogs = async () => {
        if (!confirm('Are you sure you want to clear all audit logs? This cannot be undone.')) return;

        const q = query(collection(db, 'keepr_audit_logs'));
        const snapshot = await getDocs(q);
        const deletePromises = snapshot.docs.map(d => deleteDoc(doc(db, 'keepr_audit_logs', d.id)));
        await Promise.all(deletePromises);
    };

    const filteredLogs = logs.filter(log =>
        log.device?.toLowerCase().includes(filter.toLowerCase()) ||
        log.auditor?.toLowerCase().includes(filter.toLowerCase())
    );

    return (
        <AppShell
            appName="Keepr"
            appIcon={<Shield className="w-6 h-6" style={{ color: ACCENT }} />}
            accentColor={ACCENT}
            navItems={navItems}
        >
            <div className="max-w-4xl mx-auto space-y-6 pb-10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Audit History</h1>
                        <p className="text-sm text-slate-500">Record of all daily device audits</p>
                    </div>
                    {logs.length > 0 && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="text-red-500 border-red-100 hover:bg-red-50 gap-2"
                            onClick={handleClearLogs}
                        >
                            <Trash2 className="w-4 h-4" /> Clear History
                        </Button>
                    )}
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                        placeholder="Filter by device or auditor..."
                        className="pl-9"
                        value={filter}
                        onChange={e => setFilter(e.target.value)}
                    />
                </div>

                <div className="space-y-3">
                    {loading ? (
                        <div className="py-20 text-center">
                            <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                            <p className="text-slate-500 text-sm">Loading audit history...</p>
                        </div>
                    ) : filteredLogs.length > 0 ? (
                        filteredLogs.map((log, i) => (
                            <motion.div
                                key={log.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                            >
                                <Card className="border-border/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
                                    <CardContent className="p-4 flex items-center gap-4">
                                        <div className={`p-2 rounded-lg ${log.status === 'verified' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                            {log.status === 'verified' ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">{log.device}</h4>
                                                <Badge variant="outline" className="text-[10px] h-4 font-bold border-slate-200">
                                                    {log.location}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500">
                                                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(log.date).toLocaleString()}</span>
                                                <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {log.auditor}</span>
                                            </div>
                                            {log.notes && (
                                                <p className="text-[10px] text-slate-400 italic mt-1">{log.notes}</p>
                                            )}
                                        </div>

                                        <div>
                                            {log.status === 'verified' ? (
                                                <Badge className="bg-emerald-500 hover:bg-emerald-500 text-white border-0 text-[10px] font-bold">VERIFIED</Badge>
                                            ) : (
                                                <Badge className="bg-red-500 hover:bg-red-500 text-white border-0 text-[10px] font-bold">MISSING</Badge>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))
                    ) : (
                        <div className="text-center py-20 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
                            <ClipboardCheck className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                            <p className="text-slate-500 font-medium">No audit logs found</p>
                            <p className="text-slate-400 text-xs mt-1">Daily audits will appear here once recorded</p>
                        </div>
                    )}
                </div>
            </div>
        </AppShell>
    );
}
