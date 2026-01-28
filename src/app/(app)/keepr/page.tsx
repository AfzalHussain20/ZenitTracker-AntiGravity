'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppShell } from '@/components/apps/AppShell';
import { PremiumSplashScreen } from '@/components/apps/PremiumSplashScreen';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Shield, LayoutDashboard, Package, Users,
    Plus, Search, Laptop, Smartphone, Tablet, Monitor, Tv,
    AlertTriangle, CheckCircle2, Clock, User, LogIn, LogOut,
    Sparkles, Box, ClipboardCheck, History, XCircle, Copy,
    ChevronDown, Cable, Zap, Activity, TrendingUp, BarChart3,
    ArrowUpRight, RefreshCw, Layers, MapPin
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
    ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts';

import { useRouter } from 'next/navigation';

// Color scheme
const ACCENT = '#0EA5E9';

const navItems = [
    { label: 'Devices', href: '/keepr', icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: 'My Devices', href: '/keepr/my-devices', icon: <Package className="w-5 h-5" /> },
    { label: 'Audit Log', href: '/keepr/audit-log', icon: <ClipboardCheck className="w-5 h-5" /> },
    { label: 'Team', href: '/keepr/team', icon: <Users className="w-5 h-5" /> },
];

// Device icons
const deviceIcons: Record<string, any> = {
    laptop: Laptop,
    phone: Smartphone,
    tablet: Tablet,
    monitor: Monitor,
    tv: Tv,
    other: Box,
};

const LOCATIONS = [
    "QA Team Device Rack",
    "Raja Sekar Rack",
    "API Team",
    "Android Team",
    "Sun Direct Team",
    "iOS Team",
    "Others"
];

const TEAM_MEMBERS: Record<string, string[]> = {
    "API Team": ["Manoj", "Suresh", "Divya", "Prakash"],
    "Android Team": ["Arun", "Karthik", "Priya", "Vijay"],
    "Sun Direct Team": ["Raja", "Sekar", "Deepak", "Anitha"],
    "iOS Team": ["Santhosh", "Balan", "Maya", "Kevin"],
    "Others": ["General Rack", "Meeting Room", "Lab"]
};

interface Device {
    id: string;
    name: string;
    type: string;
    status: 'available' | 'checked-out' | 'maintenance';
    checkedOutBy?: { name: string; uid: string };
    checkedOutAt?: string;
    location: string;
    assignedTo?: string; // For team assignment
    lastAuditDate?: string;
    auditStatus?: 'verified' | 'missing' | 'pending';
    accessories?: {
        box?: boolean;
        adapter?: boolean;
        cable?: boolean;
        hdmiCable?: boolean;
        powerCable?: boolean;
        notes: string;
    };
}

// Sample devices from User's list
const initialDevices: Device[] = [
    { id: '1', name: 'Oppo A78', type: 'phone', status: 'available', location: 'QA Team Device Rack', auditStatus: 'pending', accessories: { box: true, adapter: true, cable: true, notes: 'with box, adapter & charger cable' } },
    { id: '2', name: 'Moto g31 mobile', type: 'phone', status: 'available', location: 'QA Team Device Rack', auditStatus: 'pending', accessories: { box: true, adapter: true, cable: true, notes: 'with box, adapter & charger cable' } },
    { id: '3', name: 'Galaxy M32 5G', type: 'phone', status: 'checked-out', location: 'QA Team Device Rack', checkedOutBy: { name: 'Saranya', uid: 'system' }, assignedTo: 'Saranya', checkedOutAt: new Date().toISOString(), auditStatus: 'pending', accessories: { box: true, adapter: false, cable: false, notes: 'new mobile. adapter & cable missing' } },
    { id: '4', name: 'Vivo y16 mobile', type: 'phone', status: 'available', location: 'QA Team Device Rack', auditStatus: 'pending', accessories: { box: true, adapter: true, cable: true, notes: '& box with charger & cable' } },
    { id: '6', name: 'Samsung fold mobile', type: 'phone', status: 'checked-out', location: 'API Team', checkedOutBy: { name: 'Manoj', uid: 'system' }, assignedTo: 'Manoj', checkedOutAt: new Date().toISOString(), auditStatus: 'pending', accessories: { box: true, adapter: true, cable: false, notes: 'with box without a cable - Cable missing' } },
    { id: '7', name: 'Redmi Tab Pad Large', type: 'tablet', status: 'available', location: 'QA Team Device Rack', auditStatus: 'pending', accessories: { box: true, adapter: true, cable: true, notes: 'with box, adaptor & cable' } },
    { id: '8', name: 'Redmi note 12 pro mobile', type: 'phone', status: 'checked-out', location: 'QA Team Device Rack', checkedOutBy: { name: 'Sathish', uid: 'system' }, assignedTo: 'Sathish', checkedOutAt: new Date().toISOString(), auditStatus: 'pending', accessories: { box: true, adapter: true, cable: false, notes: 'with box is here but charger cable given to(Sathish Team)' } },
    { id: '9', name: 'Roku 1 device', type: 'tv', status: 'available', location: 'Sony TV', auditStatus: 'pending', accessories: { hdmiCable: true, powerCable: true, notes: 'inserted to Sony TV kindly don\'t remove' } },
    { id: '10', name: 'Fire TV 4K Stick', type: 'tv', status: 'available', location: 'QA Team Device Rack', auditStatus: 'pending', accessories: { hdmiCable: true, powerCable: true, notes: '' } },
    { id: '11', name: 'Fire TV HD stick', type: 'tv', status: 'available', location: 'QA Team Device Rack', auditStatus: 'pending', accessories: { hdmiCable: true, powerCable: true, notes: '' } },
    { id: '14', name: 'Fire TV Cube', type: 'tv', status: 'available', location: 'QA Team Device Rack', auditStatus: 'pending', accessories: { hdmiCable: false, powerCable: true, notes: 'with a Box set, but HDMI cable is missing' } },
    { id: '15', name: 'Unifi TV box', type: 'tv', status: 'available', location: 'QA Team Device Rack', auditStatus: 'pending', accessories: { hdmiCable: true, powerCable: true, notes: 'with set' } },
    { id: '16', name: 'Airtel X Stream Box', type: 'tv', status: 'available', location: 'QA Team Device Rack', auditStatus: 'pending', accessories: { hdmiCable: true, powerCable: true, notes: 'set' } },
    { id: '17', name: 'Oppo A17 K', type: 'phone', status: 'maintenance', location: 'QA Team Device Rack', auditStatus: 'pending', accessories: { box: true, adapter: false, cable: false, notes: 'Box only here, but cable, adapter & mobile are missing' } },
    { id: '18', name: 'Samsung Old mobile', type: 'phone', status: 'available', location: 'QA Team Device Rack', auditStatus: 'pending', accessories: { notes: 'is here' } },
];

import { db } from '@/lib/firebaseConfig';
import { collection, query, onSnapshot, updateDoc, doc, setDoc, getDocs, addDoc, serverTimestamp, orderBy, limit } from 'firebase/firestore';

export default function KeeprPage() {
    const router = useRouter();
    const [showSplash, setShowSplash] = useState(true);
    const [devices, setDevices] = useState<Device[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isAuditMode, setIsAuditMode] = useState(false);
    const { user } = useAuth();

    // Fetch and Sync with Firestore
    useEffect(() => {
        const q = query(collection(db, 'keepr_devices'));
        const unsubscribe = onSnapshot(q, async (snapshot) => {
            if (snapshot.empty) {
                // Seed initial devices if empty
                console.log("Seeding initial devices...");
                for (const d of initialDevices) {
                    await setDoc(doc(db, 'keepr_devices', d.id), d);
                }
            } else {
                const fetchedDevices = snapshot.docs.map(doc => ({
                    ...doc.data()
                })) as Device[];
                // Sort by ID naturally
                setDevices(fetchedDevices.sort((a, b) => Number(a.id) - Number(b.id)));
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, []);

    // New device form
    const [newDevice, setNewDevice] = useState({
        name: '',
        type: 'phone',
        location: LOCATIONS[0],
        assignedTo: '',
        accessories: { box: true, adapter: true, cable: true, notes: '', hdmiCable: false, powerCable: false }
    });

    const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
    const [auditReport, setAuditReport] = useState('');

    // Stats
    const stats = {
        total: devices.length,
        available: devices.filter(d => d.status === 'available').length,
        checkedOut: devices.filter(d => d.status === 'checked-out').length,
        pendingAudit: devices.filter(d => d.auditStatus === 'pending').length,
    };

    // Live Activity Stream
    const [recentLogs, setRecentLogs] = useState<any[]>([]);
    useEffect(() => {
        const q = query(collection(db, 'keepr_audit_logs'), orderBy('date', 'desc'), limit(5));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setRecentLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsubscribe();
    }, []);

    // Filter
    const filteredDevices = devices.filter(device => {
        const matchesSearch = device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            device.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
            device.assignedTo?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterStatus === 'all' ||
            (filterStatus === 'audit-pending' ? device.auditStatus === 'pending' : device.status === filterStatus);
        return matchesSearch && matchesFilter;
    });

    // Chart Data
    const chartData = [
        { name: 'Available', value: stats.available, color: '#10b981' },
        { name: 'In Use', value: stats.checkedOut, color: '#0ea5e9' },
        { name: 'Maintenance', value: stats.total - stats.available - stats.checkedOut, color: '#f59e0b' }
    ].filter(d => d.value > 0);

    const [selectedDeviceForCheckout, setSelectedDeviceForCheckout] = useState<Device | null>(null);
    const [checkoutPerson, setCheckoutPerson] = useState('');

    // Check out device
    const handleCheckOut = async () => {
        if (!selectedDeviceForCheckout) return;
        const deviceRef = doc(db, 'keepr_devices', selectedDeviceForCheckout.id);
        await updateDoc(deviceRef, {
            status: 'checked-out',
            checkedOutBy: { name: checkoutPerson || user?.displayName || 'Tester', uid: user?.uid || 'temp' },
            checkedOutAt: new Date().toISOString(),
            assignedTo: checkoutPerson || selectedDeviceForCheckout.assignedTo || ''
        });
        setSelectedDeviceForCheckout(null);
        setCheckoutPerson('');
    };

    // Check in device
    const handleCheckIn = async (deviceId: string) => {
        const deviceRef = doc(db, 'keepr_devices', deviceId);
        await updateDoc(deviceRef, {
            status: 'available',
            checkedOutBy: null,
            checkedOutAt: null,
        });
    };

    // Audit Actions
    const performAudit = async (deviceId: string, status: 'verified' | 'missing' | 'pending', updates?: Partial<Device>) => {
        const deviceRef = doc(db, 'keepr_devices', deviceId);
        const device = devices.find(d => d.id === deviceId);

        await updateDoc(deviceRef, {
            ...updates,
            auditStatus: status,
            lastAuditDate: new Date().toISOString().split('T')[0]
        });

        if (status !== 'pending' && device) {
            // Log the audit
            await addDoc(collection(db, 'keepr_audit_logs'), {
                deviceId,
                device: device.name,
                status,
                auditor: user?.displayName || 'System',
                date: new Date().toISOString(),
                location: device.location,
                notes: updates?.accessories?.notes || ''
            });
        }
    };

    const generateReport = () => {
        let report = `ZENIT DEVICE AUDIT REPORT\nDate: ${new Date().toLocaleDateString()}\nStatus: COMPLETED\n-----------------------------------\n\n`;

        const categories = {
            'phone': 'Android Devices',
            'tablet': 'Tablets',
            'tv': 'TV & Streaming Devices',
            'laptop': 'Laptops',
            'other': 'Other Assets'
        };

        const grouped = devices.reduce((acc: any, d) => {
            const cat = categories[d.type as keyof typeof categories] || 'Others';
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push(d);
            return acc;
        }, {});

        Object.entries(grouped).forEach(([cat, items]: [string, any]) => {
            report += `${cat} list:\n`;
            items.forEach((d: Device, index: number) => {
                let line = `${index + 1}. ${d.name}`;

                if (d.auditStatus === 'missing') {
                    line += ` - Missing.`;
                    if (d.accessories?.notes) line += ` ${d.accessories.notes}.`;
                    if (d.assignedTo) line += ` Given to ${d.assignedTo}.`;
                    line += ` (Reported Missing)`;
                } else if (d.auditStatus === 'verified') {
                    // Custom accessory text based on type
                    let accText = "";
                    if (d.type === 'phone' || d.type === 'tablet') {
                        const hasBox = d.accessories?.box;
                        const hasCharger = d.accessories?.adapter;
                        const hasCable = d.accessories?.cable;

                        if (hasBox && hasCharger && hasCable) accText = " - & box with charger & cable are here.";
                        else {
                            const missing = [];
                            if (!hasBox) missing.push("box");
                            if (!hasCharger) missing.push("adapter");
                            if (!hasCable) missing.push("cable");
                            accText = ` - ${missing.length > 0 ? missing.join(" & ") + " missing." : "all accessories are here."}`;
                        }
                    } else if (d.type === 'tv') {
                        const hasHDMI = d.accessories?.hdmiCable;
                        const hasPower = d.accessories?.powerCable;
                        if (hasHDMI && hasPower) accText = " - with HDMI & Power cable are here.";
                        else {
                            const missing = [];
                            if (!hasHDMI) missing.push("HDMI cable");
                            if (!hasPower) missing.push("Power cable");
                            accText = ` - ${missing.join(" & ")} missing.`;
                        }
                    } else {
                        accText = " - with all accessories are here.";
                    }

                    line += accText;
                    if (d.accessories?.notes) line += ` ${d.accessories.notes}.`;

                    if (d.assignedTo && d.status === 'checked-out') {
                        line += ` (Handed over to ${d.assignedTo})`;
                    } else {
                        line += ` (Available in Rack)`;
                    }
                } else {
                    line += ` (Not yet verified)`;
                }

                report += `${line}\n`;
            });
            report += `\n`;
        });

        report += `-----------------------------------\nVerified by: ${user?.displayName || 'System Admin'}`;
        setAuditReport(report);
        setIsReportDialogOpen(true);
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(auditReport);
        // Feedback would be nice here, maybe a toast
    };

    // Add device
    const handleAddDevice = async () => {
        if (!newDevice.name) return;
        const id = Date.now().toString();
        const device: Device = {
            id,
            name: newDevice.name,
            type: newDevice.type,
            status: 'available',
            location: newDevice.location,
            assignedTo: newDevice.assignedTo,
            auditStatus: 'pending',
            accessories: newDevice.accessories
        };
        await setDoc(doc(db, 'keepr_devices', id), device);
        setNewDevice({ name: '', type: 'phone', location: LOCATIONS[0], assignedTo: '', accessories: { box: true, adapter: true, cable: true, notes: '', hdmiCable: false, powerCable: false } });
        setIsAddDialogOpen(false);
    };

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'available':
                return { color: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50', label: 'Available' };
            case 'checked-out':
                return { color: 'bg-sky-500', text: 'text-sky-700', bg: 'bg-sky-50', label: 'In Use' };
            case 'maintenance':
                return { color: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50', label: 'Repair' };
            default:
                return { color: 'bg-slate-500', text: 'text-slate-700', bg: 'bg-slate-50', label: status };
        }
    };

    if (showSplash) {
        return (
            <PremiumSplashScreen
                onComplete={() => setShowSplash(false)}
                appName="Keepr"
                tagline="Device Tracker"
                accentColor={ACCENT}
                icon={<Shield className="w-full h-full" />}
            />
        );
    }

    return (
        <AppShell
            appName="Keepr"
            appIcon={<Shield className="w-6 h-6" style={{ color: ACCENT }} />}
            accentColor={ACCENT}
            navItems={navItems}
        >
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Mission Control Dashboard */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Utilization Chart */}
                    <Card className="md:col-span-2 border-border/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl overflow-hidden group">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-bold flex items-center gap-2">
                                    <BarChart3 className="w-4 h-4 text-sky-500" />
                                    Fleet Utilization
                                </CardTitle>
                                <Badge variant="outline" className="text-[10px] font-bold border-emerald-500/20 text-emerald-600 bg-emerald-500/5">
                                    Live Sync Active
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[200px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData} layout="vertical" margin={{ left: -20, right: 20 }}>
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} className="text-[11px] font-bold" />
                                        <RechartsTooltip
                                            cursor={{ fill: 'transparent' }}
                                            content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                    return (
                                                        <div className="bg-white dark:bg-slate-800 p-2 shadow-xl border rounded-lg text-[11px] font-bold">
                                                            {payload[0].value} Devices
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                                            {chartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-2 gap-3">
                        <motion.div whileHover={{ y: -4 }}>
                            <Card className="p-4 border-border/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl h-full flex flex-col justify-between overflow-hidden relative group">
                                <div className="absolute -right-2 -top-2 w-16 h-16 bg-sky-500/10 rounded-full blur-2xl group-hover:bg-sky-500/20 transition-all" />
                                <Package className="w-5 h-5 text-sky-500 mb-2" />
                                <div>
                                    <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Total Fleet</p>
                                    <p className="text-2xl font-black text-slate-900 dark:text-white">{stats.total}</p>
                                </div>
                            </Card>
                        </motion.div>
                        <motion.div whileHover={{ y: -4 }}>
                            <Card className="p-4 border-border/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl h-full flex flex-col justify-between overflow-hidden relative group">
                                <div className="absolute -right-2 -top-2 w-16 h-16 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all" />
                                <CheckCircle2 className="w-5 h-5 text-emerald-500 mb-2" />
                                <div>
                                    <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Available</p>
                                    <p className="text-2xl font-black text-slate-900 dark:text-white">{stats.available}</p>
                                </div>
                            </Card>
                        </motion.div>
                        <motion.div whileHover={{ y: -4 }}>
                            <Card className="p-4 border-border/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl h-full flex flex-col justify-between overflow-hidden relative group">
                                <div className="absolute -right-2 -top-2 w-16 h-16 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all" />
                                <Activity className="w-5 h-5 text-amber-500 mb-2" />
                                <div>
                                    <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Pending Audit</p>
                                    <p className="text-2xl font-black text-slate-900 dark:text-white">{stats.pendingAudit}</p>
                                </div>
                            </Card>
                        </motion.div>
                        <motion.button
                            whileHover={{ y: -4, scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={generateReport}
                            className="bg-emerald-500 text-white rounded-xl p-4 flex flex-col justify-between items-start shadow-lg shadow-emerald-500/20 text-left overflow-hidden relative group"
                        >
                            <div className="absolute -right-2 -top-2 w-16 h-16 bg-white/20 rounded-full blur-xl group-hover:scale-110 transition-all" />
                            <TrendingUp className="w-5 h-5 mb-2" />
                            <div>
                                <p className="text-[10px] uppercase tracking-wider text-white/80 font-bold">Daily Report</p>
                                <p className="text-xs font-bold flex items-center gap-1">Generate <ArrowUpRight className="w-3 h-3" /></p>
                            </div>
                        </motion.button>
                    </div>
                </div>

                {/* Sub Header & Live Feed */}
                <div className="flex flex-col lg:flex-row gap-6">
                    <div className="flex-1 space-y-6">
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Device Rack</h1>
                                <p className="text-sm text-slate-500">Monitor and Audit testing devices</p>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant={isAuditMode ? "destructive" : "outline"}
                                    size="sm"
                                    className="gap-1.5 h-9"
                                    onClick={() => setIsAuditMode(!isAuditMode)}
                                >
                                    <ClipboardCheck className="w-4 h-4" />
                                    {isAuditMode ? "Exit Audit" : "Start Audit"}
                                </Button>

                                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button size="sm" className="gap-1.5 bg-sky-500 hover:bg-sky-600 h-9">
                                            <Plus className="w-4 h-4" /> Add Device
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-md">
                                        <DialogHeader>
                                            <DialogTitle>Add Device</DialogTitle>
                                            <DialogDescription>Register a new testing device in the system.</DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                            <div className="space-y-2">
                                                <Label>Device Name</Label>
                                                <Input
                                                    placeholder="e.g. iPhone 15 Pro"
                                                    value={newDevice.name}
                                                    onChange={e => setNewDevice({ ...newDevice, name: e.target.value })}
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-2">
                                                    <Label>Type</Label>
                                                    <Select value={newDevice.type} onValueChange={v => setNewDevice({ ...newDevice, type: v })}>
                                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="phone">Phone</SelectItem>
                                                            <SelectItem value="tablet">Tablet</SelectItem>
                                                            <SelectItem value="laptop">Laptop</SelectItem>
                                                            <SelectItem value="tv">TV/STB</SelectItem>
                                                            <SelectItem value="monitor">Monitor</SelectItem>
                                                            <SelectItem value="other">Other</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Location</Label>
                                                    <Select value={newDevice.location} onValueChange={v => setNewDevice({ ...newDevice, location: v, assignedTo: '' })}>
                                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                                        <SelectContent>
                                                            {LOCATIONS.map(loc => (
                                                                <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>

                                            {TEAM_MEMBERS[newDevice.location] && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="space-y-2"
                                                >
                                                    <Label>Assign to Team Member</Label>
                                                    <Select value={newDevice.assignedTo} onValueChange={v => setNewDevice({ ...newDevice, assignedTo: v })}>
                                                        <SelectTrigger><SelectValue placeholder="Select member" /></SelectTrigger>
                                                        <SelectContent>
                                                            {TEAM_MEMBERS[newDevice.location].map(member => (
                                                                <SelectItem key={member} value={member}>{member}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </motion.div>
                                            )}

                                            <div className="space-y-3">
                                                <Label>Standard Accessories</Label>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {newDevice.type === 'tv' ? (
                                                        <>
                                                            <div className="flex items-center gap-2 text-sm border rounded-lg px-3 py-2">
                                                                <Label className="flex-1 cursor-pointer" htmlFor="hdmi">HDMI Cable</Label>
                                                                <input
                                                                    type="checkbox"
                                                                    id="hdmi"
                                                                    checked={newDevice.accessories.hdmiCable}
                                                                    onChange={e => setNewDevice({
                                                                        ...newDevice,
                                                                        accessories: { ...newDevice.accessories, hdmiCable: e.target.checked }
                                                                    })}
                                                                />
                                                            </div>
                                                            <div className="flex items-center gap-2 text-sm border rounded-lg px-3 py-2">
                                                                <Label className="flex-1 cursor-pointer" htmlFor="power">Power Cable</Label>
                                                                <input
                                                                    type="checkbox"
                                                                    id="power"
                                                                    checked={newDevice.accessories.powerCable}
                                                                    onChange={e => setNewDevice({
                                                                        ...newDevice,
                                                                        accessories: { ...newDevice.accessories, powerCable: e.target.checked }
                                                                    })}
                                                                />
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <div className="flex items-center gap-2 text-sm border rounded-lg px-3 py-2">
                                                                <Label className="flex-1 cursor-pointer" htmlFor="box">Box</Label>
                                                                <input
                                                                    type="checkbox"
                                                                    id="box"
                                                                    checked={newDevice.accessories.box}
                                                                    onChange={e => setNewDevice({
                                                                        ...newDevice,
                                                                        accessories: { ...newDevice.accessories, box: e.target.checked }
                                                                    })}
                                                                />
                                                            </div>
                                                            <div className="flex items-center gap-2 text-sm border rounded-lg px-3 py-2">
                                                                <Label className="flex-1 cursor-pointer" htmlFor="adapter">Adapter</Label>
                                                                <input
                                                                    type="checkbox"
                                                                    id="adapter"
                                                                    checked={newDevice.accessories.adapter}
                                                                    onChange={e => setNewDevice({
                                                                        ...newDevice,
                                                                        accessories: { ...newDevice.accessories, adapter: e.target.checked }
                                                                    })}
                                                                />
                                                            </div>
                                                            <div className="flex items-center gap-2 text-sm border rounded-lg px-3 py-2">
                                                                <Label className="flex-1 cursor-pointer" htmlFor="cable">USB Cable</Label>
                                                                <input
                                                                    type="checkbox"
                                                                    id="cable"
                                                                    checked={newDevice.accessories.cable}
                                                                    onChange={e => setNewDevice({
                                                                        ...newDevice,
                                                                        accessories: { ...newDevice.accessories, cable: e.target.checked }
                                                                    })}
                                                                />
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Internal Notes / Condition</Label>
                                                <Input
                                                    placeholder="Notes about missing parts..."
                                                    value={newDevice.accessories.notes}
                                                    onChange={e => setNewDevice({
                                                        ...newDevice,
                                                        accessories: { ...newDevice.accessories, notes: e.target.value }
                                                    })}
                                                />
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                                            <Button onClick={handleAddDevice} className="bg-sky-500 hover:bg-sky-600">Register</Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </div>

                        {/* Search & Filters */}
                        <div className="flex flex-col sm:flex-row gap-4 items-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-md p-2 rounded-2xl border border-border/50">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input
                                    placeholder="Search by ID, Name or Member..."
                                    className="pl-9 h-11 border-0 bg-transparent focus-visible:ring-0 text-sm font-medium"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="h-6 w-[1px] bg-border/50 hidden sm:block" />
                            <div className="flex gap-2">
                                <Select value={filterStatus} onValueChange={setFilterStatus}>
                                    <SelectTrigger className="w-[140px] h-9 text-xs border-0 bg-transparent focus:ring-0 font-bold">
                                        <Layers className="w-3 h-3 mr-2 text-sky-500" />
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Items</SelectItem>
                                        <SelectItem value="available">Available</SelectItem>
                                        <SelectItem value="checked-out">Checked Out</SelectItem>
                                        <SelectItem value="audit-pending">Needs Audit</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Audit Mode Header */}
                        {isAuditMode && (
                            <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center justify-between"
                            >
                                <div className="flex items-center gap-3">
                                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                                    <div>
                                        <p className="font-semibold text-amber-800 dark:text-amber-200">Daily Audit Mode Active</p>
                                        <p className="text-xs text-amber-600 dark:text-amber-400">{stats.pendingAudit} devices remaining to verify.</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        size="sm"
                                        className="bg-amber-500 hover:bg-amber-600 border-0 h-8 gap-1.5"
                                        onClick={generateReport}
                                    >
                                        <Sparkles className="w-4 h-4" /> Generate Report
                                    </Button>
                                    <Badge className="bg-amber-500 text-white border-0">{stats.pendingAudit} Left</Badge>
                                </div>
                            </motion.div>
                        )}

                        {/* Device Rack Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                            <AnimatePresence mode="popLayout">
                                {filteredDevices.map((device, i) => {
                                    const Icon = deviceIcons[device.type] || Box;
                                    const status = getStatusConfig(device.status);

                                    return (
                                        <motion.div
                                            key={device.id}
                                            layout
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            transition={{ duration: 0.2, delay: i * 0.02 }}
                                        >
                                            <Card className={`group relative overflow-hidden transition-all hover:shadow-2xl hover:shadow-sky-500/10 border-border/50 dark:bg-slate-900/50 backdrop-blur-sm ${isAuditMode && device.auditStatus === 'pending' ? 'ring-2 ring-amber-500 ring-offset-2 dark:ring-offset-slate-950' : ''}`}>
                                                <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-white/80 dark:bg-slate-800/80">
                                                        <Clock className="w-4 h-4 text-slate-400" />
                                                    </Button>
                                                </div>

                                                <CardContent className="p-5">
                                                    <div className="flex gap-4">
                                                        <motion.div
                                                            whileHover={{ rotate: 10, scale: 1.1 }}
                                                            className={`p-3 rounded-2xl h-14 w-14 flex items-center justify-center ${status.bg}`}
                                                        >
                                                            <Icon className={`w-7 h-7 ${status.text}`} />
                                                        </motion.div>

                                                        <div className="flex-1 min-w-0 pt-0.5">
                                                            <div className="flex items-center gap-1.5 mb-0.5">
                                                                <h3 className="font-bold text-slate-900 dark:text-white truncate group-hover:text-sky-500 transition-colors">
                                                                    {device.name}
                                                                </h3>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                                                <MapPin className="w-3 h-3 text-sky-400" />
                                                                {device.location}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="mt-6 flex flex-col gap-4">
                                                        {/* Status & Indicators */}
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <div className={`w-2 h-2 rounded-full ${status.color} animate-pulse`} />
                                                                <span className={`text-[11px] font-black uppercase tracking-widest ${status.text}`}>
                                                                    {status.label}
                                                                </span>
                                                            </div>
                                                            {device.status === 'checked-out' && (
                                                                <div className="flex items-center gap-1.5 bg-sky-50 dark:bg-sky-900/20 px-2 py-0.5 rounded-full border border-sky-100 dark:border-sky-800/50">
                                                                    <User className="w-3 h-3 text-sky-600" />
                                                                    <span className="text-[10px] font-bold text-sky-700 dark:text-sky-400 truncate max-w-[60px]">
                                                                        {device.checkedOutBy?.name || device.assignedTo}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Audit Section */}
                                                        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                                                            {isAuditMode ? (
                                                                <div className="space-y-3">
                                                                    <div className="flex flex-wrap gap-1 mb-2">
                                                                        {device.type === 'phone' || device.type === 'tablet' ? (
                                                                            <>
                                                                                <Badge variant={device.accessories?.box ? 'default' : 'outline'} className={`text-[9px] h-4 py-0 font-bold ${device.accessories?.box ? 'bg-sky-500' : 'text-slate-400 border-slate-200'}`}>BOX</Badge>
                                                                                <Badge variant={device.accessories?.adapter ? 'default' : 'outline'} className={`text-[9px] h-4 py-0 font-bold ${device.accessories?.adapter ? 'bg-sky-500' : 'text-slate-400 border-slate-200'}`}>CHARGER</Badge>
                                                                                <Badge variant={device.accessories?.cable ? 'default' : 'outline'} className={`text-[9px] h-4 py-0 font-bold ${device.accessories?.cable ? 'bg-sky-500' : 'text-slate-400 border-slate-200'}`}>CABLE</Badge>
                                                                            </>
                                                                        ) : device.type === 'tv' ? (
                                                                            <>
                                                                                <Badge variant={device.accessories?.hdmiCable ? 'default' : 'outline'} className={`text-[9px] h-4 py-0 font-bold ${device.accessories?.hdmiCable ? 'bg-sky-500' : 'text-slate-400 border-slate-200'}`}>HDMI</Badge>
                                                                                <Badge variant={device.accessories?.powerCable ? 'default' : 'outline'} className={`text-[9px] h-4 py-0 font-bold ${device.accessories?.powerCable ? 'bg-sky-500' : 'text-slate-400 border-slate-200'}`}>POWER</Badge>
                                                                            </>
                                                                        ) : null}
                                                                        {device.accessories?.notes && (
                                                                            <Badge variant="outline" className="text-[9px] h-4 py-0 font-bold text-amber-600 border-amber-200 cursor-help" title={device.accessories.notes}>
                                                                                NOTES*
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex gap-2">
                                                                        <Button
                                                                            size="sm"
                                                                            variant="default"
                                                                            className="flex-1 text-[10px] h-8 gap-1 bg-emerald-500 hover:bg-emerald-600 border-0 font-bold"
                                                                            onClick={() => performAudit(device.id, 'verified')}
                                                                        >
                                                                            <CheckCircle2 className="w-3 h-3" /> VERIFIED
                                                                        </Button>
                                                                        <Button
                                                                            size="sm"
                                                                            variant="outline"
                                                                            className="flex-1 text-[10px] h-8 gap-1 border-red-200 text-red-600 hover:bg-red-50 font-bold"
                                                                            onClick={() => performAudit(device.id, 'missing')}
                                                                        >
                                                                            <XCircle className="w-3 h-3" /> MISSING
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="flex gap-2">
                                                                    {device.status === 'available' ? (
                                                                        <Button
                                                                            size="sm"
                                                                            onClick={() => {
                                                                                setSelectedDeviceForCheckout(device);
                                                                                setCheckoutPerson(device.assignedTo || '');
                                                                            }}
                                                                            className="flex-1 h-9 text-[11px] font-bold gap-2 bg-slate-900 dark:bg-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-slate-200 transition-all shadow-lg"
                                                                        >
                                                                            <LogOut className="w-3.5 h-3.5" /> CHECK OUT
                                                                        </Button>
                                                                    ) : (
                                                                        <Button
                                                                            size="sm"
                                                                            onClick={() => handleCheckIn(device.id)}
                                                                            className="flex-1 h-9 text-[11px] font-bold gap-2 bg-sky-500 hover:bg-sky-600 border-0 transition-all shadow-lg shadow-sky-500/10"
                                                                        >
                                                                            <LogIn className="w-3.5 h-3.5" /> CHECK IN
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Right Side: Live Pulse */}
                    <div className="w-full lg:w-72 space-y-6">
                        <Card className="border-border/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-ping" />
                                    Live activity
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {recentLogs.length > 0 ? (
                                    recentLogs.map((log, i) => (
                                        <div key={log.id} className="relative pl-4 border-l border-slate-100 dark:border-slate-800">
                                            <div className={`absolute left-[-4.5px] top-1 w-2 h-2 rounded-full ${log.status === 'verified' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                            <p className="text-[11px] font-bold text-slate-900 dark:text-white truncate">{log.device}</p>
                                            <div className="flex items-center justify-between mt-0.5">
                                                <span className="text-[9px] text-slate-500 font-medium capitalize">{log.status}</span>
                                                <span className="text-[9px] text-slate-400 font-medium">
                                                    {new Date(log.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-6">
                                        <RefreshCw className="w-8 h-8 text-slate-200 mx-auto mb-2 animate-spin-slow" />
                                        <p className="text-[10px] text-slate-400 font-bold italic">No recent events</p>
                                    </div>
                                )}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full text-[10px] font-bold text-sky-500 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-900/10 p-0 h-6 mt-2"
                                    onClick={() => router.push('/keepr/audit-log')}
                                >
                                    View full history
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Smart Info Card */}
                        <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-600 to-sky-500 text-white shadow-xl shadow-sky-500/20 relative overflow-hidden group">
                            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-125 transition-all duration-700" />
                            <Shield className="w-8 h-8 mb-4 text-white/50" />
                            <h4 className="font-black text-sm mb-1 uppercase tracking-tight">System Integrity</h4>
                            <p className="text-[10px] text-white/70 font-medium leading-relaxed">
                                Your device rack is {Math.round((stats.available / stats.total) * 100)}% available.
                                Audit completion: {Math.round(((stats.total - stats.pendingAudit) / stats.total) * 100)}%.
                            </p>
                            <div className="mt-4 h-1 w-full bg-white/20 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-white"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${((stats.total - stats.pendingAudit) / stats.total) * 100}%` }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Empty State */}
                {filteredDevices.length === 0 && (
                    <Card className="border-dashed py-16 flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                            <Box className="w-8 h-8 text-slate-300" />
                        </div>
                        <h3 className="font-semibold text-lg text-slate-900 dark:text-white">No devices found</h3>
                        <p className="text-slate-500 max-w-xs mx-auto text-sm mt-1">We couldn't find any devices matching your search or filters.</p>
                        <Button
                            variant="link"
                            onClick={() => { setSearchTerm(''); setFilterStatus('all'); }}
                            className="text-sky-600 font-bold mt-2"
                        >
                            Reset all filters
                        </Button>
                    </Card>
                )}
                {/* Checkout Confirmation Dialog */}
                <Dialog open={!!selectedDeviceForCheckout} onOpenChange={(open) => !open && setSelectedDeviceForCheckout(null)}>
                    <DialogContent className="sm:max-w-sm">
                        <DialogHeader>
                            <DialogTitle>Check Out Device</DialogTitle>
                            <DialogDescription>Confirm who is taking this device.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-border/50">
                                <Package className="w-5 h-5 text-sky-500" />
                                <div className="min-w-0">
                                    <p className="text-sm font-bold truncate">{selectedDeviceForCheckout?.name}</p>
                                    <p className="text-[10px] text-slate-500">{selectedDeviceForCheckout?.location}</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Assigned To / Taken By</Label>
                                {selectedDeviceForCheckout && TEAM_MEMBERS[selectedDeviceForCheckout.location] ? (
                                    <Select value={checkoutPerson} onValueChange={setCheckoutPerson}>
                                        <SelectTrigger><SelectValue placeholder="Select Person" /></SelectTrigger>
                                        <SelectContent>
                                            {TEAM_MEMBERS[selectedDeviceForCheckout.location].map(p => (
                                                <SelectItem key={p} value={p}>{p}</SelectItem>
                                            ))}
                                            <SelectItem value={user?.displayName || 'Me'}>Me ({user?.displayName || 'Tester'})</SelectItem>
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <Input
                                        placeholder="Enter name"
                                        value={checkoutPerson}
                                        onChange={e => setCheckoutPerson(e.target.value)}
                                    />
                                )}
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setSelectedDeviceForCheckout(null)}>Cancel</Button>
                            <Button onClick={handleCheckOut} className="bg-sky-500 hover:bg-sky-600">Confirm Check Out</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Audit Report Dialog */}
                <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
                    <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <ClipboardCheck className="w-5 h-5 text-sky-500" />
                                Audit Report Generated
                            </DialogTitle>
                            <DialogDescription>
                                Copy this report for your records or sharing.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-border/50 font-mono text-xs whitespace-pre-wrap max-h-[400px] overflow-y-auto">
                            {auditReport}
                        </div>
                        <DialogFooter className="flex-row gap-2 sm:justify-end">
                            <Button variant="outline" onClick={() => setIsReportDialogOpen(false)}>Close</Button>
                            <Button className="bg-sky-500 hover:bg-sky-600 gap-2" onClick={copyToClipboard}>
                                <Copy className="w-4 h-4" /> Copy to Clipboard
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppShell >
    );
}
