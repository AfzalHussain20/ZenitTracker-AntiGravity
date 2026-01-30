"use client";

import React, { useState, useEffect, useRef } from 'react';
import {
    Play, Terminal, Activity, Users, Globe, Lock, Sliders, Layers,
    Wifi, Server, ArrowRight, StopCircle, CheckCircle2, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default function AutomationPage() {
    const [accountCount, setAccountCount] = useState(1);
    const [selectedRegion, setSelectedRegion] = useState<'international' | 'domestic'>('international');
    const [isRunning, setIsRunning] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);
    const [status, setStatus] = useState<'idle' | 'running' | 'completed' | 'error'>('idle');
    const scrollRef = useRef<HTMLDivElement>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isRunning || status === 'running') {
            interval = setInterval(async () => {
                await fetchLogs();
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isRunning, status]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    const fetchLogs = async () => {
        try {
            const res = await fetch('/api/automation/run');
            const data = await res.json();
            setLogs(data.logs || []);
            setIsRunning(data.isRunning);
            if (!data.isRunning && status === 'running') {
                setStatus('completed');
            }
        } catch (e) {
            console.error("Failed to fetch logs", e);
        }
    };

    const handleStart = async () => {
        setIsRunning(true);
        setStatus('running');
        setLogs(['Initializing environment...', 'Sending command to runner...']);
        try {
            const res = await fetch('/api/automation/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ count: accountCount }),
            });
            if (!res.ok) {
                const data = await res.json();
                setLogs(prev => [...prev, `[ERROR] ${data.message}`]);
                setStatus('error');
                setIsRunning(false);
            }
        } catch (e) {
            setLogs(prev => [...prev, "[FATAL] Network error. Check status."]);
            setStatus('error');
            setIsRunning(false);
        }
    };

    if (!mounted) return null;

    return (
        <div className="min-h-screen bg-background text-foreground font-sans">
            {/* Minimal Header */}
            <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Activity className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-lg font-semibold leading-none">Automation Runner</h1>
                            <p className="text-xs text-muted-foreground mt-1">SunNXT Account Provisioning One-Click Suite</p>
                        </div>
                    </div>
                    <div>
                        <StatusBadge status={status} />
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Configuration Panel */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="rounded-xl border bg-card shadow-sm">
                        <div className="p-6 border-b">
                            <h2 className="font-semibold flex items-center gap-2">
                                <Sliders className="w-4 h-4 text-muted-foreground" />
                                Configuration
                            </h2>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="space-y-3">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    Number of Accounts
                                </label>
                                <div className="relative">
                                    <Input
                                        type="number"
                                        min={1}
                                        max={50}
                                        value={accountCount}
                                        onChange={(e) => setAccountCount(parseInt(e.target.value) || 1)}
                                        className="pl-10 h-10 bg-muted/50"
                                    />
                                    <Users className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
                                </div>
                                <p className="text-[11px] text-muted-foreground">
                                    Define how many sequential user flows to execute.
                                </p>
                            </div>

                            <Separator />

                            <div className="space-y-3">
                                <label className="text-sm font-medium">Target Environment</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <div
                                        onClick={() => setSelectedRegion('international')}
                                        className={`border rounded-lg p-3 flex flex-col gap-2 cursor-pointer transition-all ${selectedRegion === 'international'
                                            ? 'bg-blue-500/10 border-blue-500 ring-1 ring-blue-500'
                                            : 'bg-primary/5 border-primary/20 hover:border-primary/50'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <Globe className={`w-4 h-4 ${selectedRegion === 'international' ? 'text-blue-400' : 'text-primary'}`} />
                                            {selectedRegion === 'international' && <CheckCircle2 className="w-3 h-3 text-blue-400" />}
                                        </div>
                                        <span className={`text-sm font-medium ${selectedRegion === 'international' ? 'text-blue-100' : ''}`}>International</span>
                                    </div>
                                    <div
                                        onClick={() => setSelectedRegion('domestic')}
                                        className={`border rounded-lg p-3 flex flex-col gap-2 cursor-pointer transition-all ${selectedRegion === 'domestic'
                                            ? 'bg-blue-500/10 border-blue-500 ring-1 ring-blue-500'
                                            : 'bg-muted/30 border-zinc-800 hover:border-zinc-600'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <Lock className={`w-4 h-4 ${selectedRegion === 'domestic' ? 'text-blue-400' : 'text-zinc-500'}`} />
                                            {selectedRegion === 'domestic' && <CheckCircle2 className="w-3 h-3 text-blue-400" />}
                                        </div>
                                        <span className={`text-sm font-medium ${selectedRegion === 'domestic' ? 'text-blue-100' : 'text-zinc-500'}`}>Domestic</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-[11px] text-amber-500/80 bg-amber-500/10 p-2 rounded-md">
                                    <Wifi className="w-3 h-3" />
                                    <span>Result depends on active VPN connection.</span>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 bg-muted/20 border-t">
                            {!isRunning ? (
                                <Button size="lg" className="w-full gap-2 font-semibold" onClick={handleStart}>
                                    Run Automation <ArrowRight className="w-4 h-4" />
                                </Button>
                            ) : (
                                <Button size="lg" variant="secondary" className="w-full gap-2 cursor-not-allowed" disabled>
                                    <Activity className="w-4 h-4 animate-spin" /> Execution in Progress
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="rounded-xl border bg-card shadow-sm p-6 space-y-4">
                        <h3 className="font-semibold text-sm flex items-center gap-2">
                            <Layers className="w-4 h-4 text-muted-foreground" />
                            System Information
                        </h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between py-1 border-b border-border/50">
                                <span className="text-muted-foreground">Runner</span>
                                <span className="font-mono">Local / Maven</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-border/50">
                                <span className="text-muted-foreground">Driver Strategy</span>
                                <span className="font-mono">Eager Load</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Logs Panel */}
                <div className="lg:col-span-8 flex flex-col h-[calc(100vh-180px)] min-h-[500px] rounded-xl border bg-zinc-950 text-zinc-300 shadow-inner overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 bg-zinc-900 border-b border-zinc-800">
                        <div className="flex items-center gap-3">
                            <Terminal className="w-4 h-4 text-zinc-400" />
                            <span className="text-sm font-medium font-mono">Console Output</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="flex h-2 w-2 rounded-full bg-zinc-500"></span>
                            <span className="text-xs text-zinc-500 font-mono">/dev/tty1</span>
                        </div>
                    </div>
                    <div className="flex-1 overflow-auto p-4 font-mono text-xs md:text-sm leading-relaxed" ref={scrollRef}>
                        {logs.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-zinc-600 space-y-2 select-none">
                                <Server className="w-10 h-10 opacity-20" />
                                <p>Ready for jobs.</p>
                            </div>
                        )}
                        {logs.map((log, i) => (
                            <div key={i} className="flex gap-3 mb-1 break-words">
                                <span className="text-zinc-600 shrink-0 select-none">
                                    {new Date().toLocaleTimeString("en-US", { hour12: false })}
                                </span>
                                <span className={
                                    log.includes('[ERROR]') ? 'text-red-400' :
                                        log.includes('Success') ? 'text-green-400' :
                                            log.includes('INFO') ? 'text-blue-400' : 'text-zinc-300'
                                }>
                                    {log}
                                </span>
                            </div>
                        ))}
                        {status === 'running' && (
                            <div className="animate-pulse text-zinc-500 mt-2">_</div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    if (status === 'running') {
        return (
            <Badge variant="outline" className="gap-1.5 py-1.5 px-3 border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800">
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                Running
            </Badge>
        )
    }
    if (status === 'completed') {
        return (
            <Badge variant="outline" className="gap-1.5 py-1.5 px-3 border-green-200 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Completed
            </Badge>
        )
    }
    if (status === 'error') {
        return (
            <Badge variant="outline" className="gap-1.5 py-1.5 px-3 border-red-200 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800">
                <AlertCircle className="w-3.5 h-3.5" />
                Error
            </Badge>
        )
    }
    return (
        <Badge variant="secondary" className="gap-1.5 py-1.5 px-3 text-muted-foreground">
            <StopCircle className="w-3.5 h-3.5" />
            Idle
        </Badge>
    )
}
