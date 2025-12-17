"use client";

import { useState, Suspense } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
    Rocket, ArrowLeft, CheckCircle2, PlusCircle, ChevronRight,
    Tv, Sparkles, Database, Smartphone, Monitor, Gamepad2, Laptop,
    Globe, Box, FileDown, Wand2
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// --- Type definitions ---
interface EventData {
    name: string;
    params: Record<string, string>;
    contentType: string;
    instance: number;
}
interface OtherEventData {
    name: string;
    params: Record<string, string>;
}
type Step = "platform_details" | "config" | "workspace";

// --- Constants ---
const contentTypesMap: Record<string, string> = {
    "1": "Live TV", "2": "TV Shows", "3": "Movies", "4": "Shorts", "5": "Music Videos", "6": "Comedy"
};

const platformOptions = [
    "Android TV", "Apple TV", "Fire TV", "LG TV", "Samsung TV", "Roku", "Web", "Mobile (Android)", "Mobile (iOS)", "Other"
];

const orderedEventInputs = ["Content Started", "Content Played", "Content Started Version 1", "Content Played Version 1"];
const adsEventName = "Ads Played";

// --- Zod Schema ---
const platformDetailsSchema = z.object({
    platformName: z.string().min(1, "Platform required"),
    testEnvironment: z.enum(["Production", "Pre-Production"], { required_error: "Environment required" }),
    appVersion: z.string().min(1, "Version required"),
});
type PlatformFormValues = z.infer<typeof platformDetailsSchema>;

// --- Helper Functions ---
function parseHtmlToParams(htmlMarkup: string): Record<string, string> {
    const pattern = /<span[^>]*data-t="tooltip"[^>]*title="([^"]*)"[^>]*>([^<]*)<\/span>/g;
    const matches = [...htmlMarkup.matchAll(pattern)];
    const params: Record<string, string> = {};
    const keyCounts: Record<string, number> = {};
    for (const match of matches) {
        let key = match[1].trim();
        const value = match[2].trim();
        if (keyCounts[key]) {
            keyCounts[key]++;
            params[`${key} (${keyCounts[key]})`] = value;
        } else {
            keyCounts[key] = 1;
            params[key] = value;
        }
    }
    return params;
}

const getPlatformIcon = (p: string) => {
    switch (p) {
        case "Android TV": return Tv;
        case "Apple TV": return Monitor;
        case "Fire TV": return Box;
        case "LG TV": return Tv;
        case "Samsung TV": return Tv;
        case "Roku": return Gamepad2;
        case "Web": return Laptop;
        case "Mobile (Android)": return Smartphone;
        case "Mobile (iOS)": return Smartphone;
        default: return Globe;
    }
};

const GradientIcon = ({ icon: Icon, className }: { icon: any, className?: string }) => (
    <div className={`relative flex items-center justify-center p-4 rounded-2xl bg-gradient-to-tr from-indigo-50/50 to-purple-50/50 dark:from-indigo-900/10 dark:to-purple-900/10 group-hover:from-indigo-100 group-hover:to-purple-100 dark:group-hover:from-indigo-800/20 dark:group-hover:to-purple-800/20 transition-colors ${className}`}>
        <Icon strokeWidth={2} className="w-8 h-8 text-indigo-600 dark:text-indigo-400 drop-shadow-sm" />
    </div>
);

// --- Modals ---
function OtherEventModal({ onSave }: { onSave: (event: OtherEventData) => void }) {
    const { toast } = useToast();
    const [eventName, setEventName] = useState('');
    const [htmlMarkup, setHtmlMarkup] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const handleSave = () => {
        if (!eventName || !htmlMarkup) {
            toast({ title: 'Missing Info', description: 'Provide event name and HTML.', variant: 'destructive' });
            return;
        }
        setIsSaving(true);
        try {
            const params = parseHtmlToParams(htmlMarkup);
            onSave({ name: eventName, params });
            toast({ title: 'Event Saved', description: `"${eventName}" added.` });
            setEventName(''); setHtmlMarkup(''); setIsOpen(false);
        } catch (error) {
            toast({ title: 'Error', description: 'Invalid HTML format.', variant: 'destructive' });
        } finally { setIsSaving(false); }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="rounded-full shadow-sm"><PlusCircle className="mr-2 h-4 w-4" /> Add Custom Event</Button>
            </DialogTrigger>
            <DialogContent className="bg-background border-border rounded-2xl">
                <DialogHeader>
                    <DialogTitle>Add Custom Event</DialogTitle>
                    <DialogDescription>Manually defined events.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div><Label>Event Name</Label><Input value={eventName} onChange={(e) => setEventName(e.target.value)} placeholder="e.g., Login" className="bg-background" /></div>
                    <div><Label>HTML Markup</Label><Textarea value={htmlMarkup} onChange={(e) => setHtmlMarkup(e.target.value)} placeholder="Paste raw HTML..." rows={6} className="bg-background font-mono text-xs" /></div>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button onClick={handleSave} disabled={isSaving} className="bg-primary text-primary-foreground">{isSaving ? <Wand2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />} Save</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function HtmlInputModal({ contentType, adsIncluded, onSave, onCancel }: { contentType: string, adsIncluded: boolean, onSave: (data: Record<string, string>) => void, onCancel: () => void }) {
    const [localHtmlInputs, setLocalHtmlInputs] = useState<Record<string, string>>({});
    const eventNames = adsIncluded ? [...orderedEventInputs, adsEventName] : orderedEventInputs;
    const handleSave = () => onSave(localHtmlInputs);

    return (
        <Dialog open={true} onOpenChange={(open) => !open && onCancel()}>
            <DialogContent className="max-w-4xl bg-background border-border md:max-h-[85vh] flex flex-col rounded-3xl shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold flex items-center gap-2">Input HTML for <span className="text-primary">{contentType}</span></DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-4 overflow-y-auto flex-1 pr-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {eventNames.map(eventName => (
                            <motion.div className="space-y-2 p-5 rounded-2xl border bg-card/60" key={eventName} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                <Label className="font-semibold text-foreground">{eventName}</Label>
                                <Textarea value={localHtmlInputs[eventName] || ''} onChange={(e) => setLocalHtmlInputs(prev => ({ ...prev, [eventName]: e.target.value }))} placeholder={`HTML for ${eventName}...`} rows={4} className="font-mono text-xs resize-none bg-background border-border focus:ring-primary/20" />
                            </motion.div>
                        ))}
                    </div>
                </div>
                <DialogFooter className="mt-4 pt-2">
                    <Button variant="ghost" onClick={onCancel} className="rounded-full">Cancel</Button>
                    <Button onClick={handleSave} className="bg-primary text-primary-foreground shadow-lg rounded-full px-8">Save & Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// --- Main Page Component ---
function CleverTapTrackerPageComponent() {
    const [step, setStep] = useState<Step>("platform_details");
    const router = useRouter();
    const { toast } = useToast();
    const [platformData, setPlatformData] = useState<PlatformFormValues | null>(null);
    const [allSelectedContentTypes, setAllSelectedContentTypes] = useState<string[]>([]);
    const [adsIncluded, setAdsIncluded] = useState<Record<string, boolean>>({});
    const [contentTypeToProcess, setContentTypeToProcess] = useState<string | null>(null);
    const [collectedEvents, setCollectedEvents] = useState<EventData[]>([]);
    const [otherEvents, setOtherEvents] = useState<OtherEventData[]>([]);
    const [completedContentTypes, setCompletedContentTypes] = useState<string[]>([]);
    const { control, handleSubmit, setValue, watch, formState: { errors } } = useForm<PlatformFormValues>({ resolver: zodResolver(platformDetailsSchema) });
    const selectedPlatform = watch("platformName");

    const handlePlatformDetailsSubmit = (data: PlatformFormValues) => { setPlatformData(data); setStep("config"); };
    const handleNextStep = () => {
        if (step === "config") {
            // Allow proceeding without selection per user request
            setStep("workspace");
        }
    };

    const handleHtmlInputSave = (htmlInputs: Record<string, string>) => {
        if (!contentTypeToProcess) return;
        const newEvents: EventData[] = [];
        const allEventNames = adsIncluded[contentTypeToProcess] ? [...orderedEventInputs, adsEventName] : orderedEventInputs;
        const existingInstances = collectedEvents.filter(e => e.contentType === contentTypeToProcess);
        const maxInstance = existingInstances.reduce((max, e) => Math.max(max, e.instance), 0);
        const instanceNum = maxInstance + 1;

        for (const eventName of allEventNames) {
            const html = htmlInputs[eventName];
            if (html) {
                try {
                    const parsedParams = parseHtmlToParams(html);
                    newEvents.push({ name: eventName, contentType: contentTypeToProcess, params: parsedParams, instance: instanceNum });
                } catch { toast({ title: "Error", description: `Bad HTML for ${eventName}`, variant: "destructive" }); return; }
            }
        }
        setCollectedEvents(prev => [...prev, ...newEvents]);
        if (!completedContentTypes.includes(contentTypeToProcess)) setCompletedContentTypes(prev => [...prev, contentTypeToProcess]);
        toast({ title: "Saved", description: `${contentTypeToProcess} #${instanceNum} saved.` });
        setContentTypeToProcess(null);
    };

    const handleExport = () => {
        if (collectedEvents.length === 0 && otherEvents.length === 0) { toast({ title: "No Data", description: "Nothing to export.", variant: "destructive" }); return; }
        const wb = XLSX.utils.book_new();
        const exportDate = format(new Date(), "yyyy-MM-dd HH:mm:ss");

        const allEvents = [...collectedEvents, ...otherEvents];

        /* =========================
           SUMMARY SHEET
        ========================= */
        if (platformData) {
            const eventCounts: Record<string, number> = {};
            // @ts-ignore
            allEvents.forEach(e => {
                eventCounts[e.name] = (eventCounts[e.name] || 0) + 1;
            });

            const summaryData = [
                { Metric: "Platform", Value: platformData.platformName }, { Metric: "Environment", Value: platformData.testEnvironment },
                { Metric: "Version", Value: platformData.appVersion }, { Metric: "Date", Value: exportDate },
                { Metric: "", Value: "" }, { Metric: "Total Events", Value: allEvents.length },
                { Metric: "", Value: "" }, ...Object.entries(eventCounts).map(([k, v]) => ({ Metric: k, Value: v })),
            ];
            const summaryWs = XLSX.utils.json_to_sheet(summaryData);
            summaryWs['!cols'] = [{ wch: 28 }, { wch: 40 }];
            XLSX.utils.sheet_add_aoa(summaryWs, [["ZENIT REPORT"]], { origin: "A1" });
            XLSX.utils.book_append_sheet(wb, summaryWs, "Summary");
        }

        /* =========================
           PER-EVENT SHEETS (PRE-EVENT)
        ========================= */
        const eventsByName: Record<string, any[]> = {};

        // @ts-ignore
        allEvents.forEach(e => {
            if (!eventsByName[e.name]) {
                eventsByName[e.name] = [];
            }
            eventsByName[e.name].push(e);
        });

        Object.entries(eventsByName).forEach(([eventName, events]) => {
            const paramKeys = Array.from(
                new Set(events.flatMap(e => Object.keys(e.params)))
            ).sort();

            const rows = events.map((e: any, idx: number) => ({
                "Content Type": e.contentType || "N/A",
                "Instance": e.instance || idx + 1,
                ...paramKeys.reduce(
                    (acc, k) => ({ ...acc, [k]: e.params[k] || "" }),
                    {}
                ),
            }));

            const ws = XLSX.utils.json_to_sheet(rows);
            XLSX.utils.book_append_sheet(
                wb,
                ws,
                eventName.substring(0, 31) // Excel limit
            );
        });

        /* =========================
           MASTER DATA SHEET
        ========================= */
        const masterKeys = Array.from(
            new Set(allEvents.flatMap(e => Object.keys(e.params)))
        ).sort();

        const masterRows = allEvents.map((e: any, idx: number) => ({
            "Event Name": e.name,
            "Content Type": e.contentType || "N/A",
            "Instance": e.instance || idx + 1,
            ...masterKeys.reduce(
                (acc, k) => ({ ...acc, [k]: e.params[k] || "" }),
                {}
            ),
        }));
        const masterWs = XLSX.utils.json_to_sheet(masterRows);
        XLSX.utils.book_append_sheet(wb, masterWs, "Master Data");
        XLSX.writeFile(wb, `Zenit_Report_${format(new Date(), "yyyyMMdd_HHmm")}.xlsx`);
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8 bg-background relative overflow-hidden font-sans">
            {/* Background Decor */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute -top-[20%] -left-[10%] w-[600px] h-[600px] bg-indigo-100 dark:bg-indigo-900/10 rounded-full blur-[100px]" />
                <div className="absolute -bottom-[20%] -right-[10%] w-[600px] h-[600px] bg-purple-100 dark:bg-purple-900/10 rounded-full blur-[100px]" />
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-6xl z-10">
                <div className="text-center mb-12 space-y-4">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2 }} className="inline-flex p-4 rounded-full bg-white dark:bg-card shadow-lg shadow-purple-500/10 mb-2">
                        <Sparkles className="w-8 h-8 text-primary" />
                    </motion.div>
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
                        {step === 'platform_details' && 'Telemetry Composer'}
                        {step === 'config' && 'Scope Configuration'}
                        {step === 'workspace' && 'Event Workspace'}
                    </h1>
                    <p className="text-lg text-muted-foreground uppercase tracking-widest font-medium text-xs">
                        Phase {step === 'platform_details' ? '1' : step === 'config' ? '2' : '3'} of 3: {step === 'platform_details' ? 'Initialize' : step === 'config' ? 'Define' : 'Capture'}
                    </p>
                </div>

                <AnimatePresence mode="wait">
                    {/* STEP 1: PLATFORM */}
                    {step === 'platform_details' && (
                        <motion.div key="step1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
                            <form onSubmit={handleSubmit(handlePlatformDetailsSubmit)} className="space-y-8">
                                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 mb-6">
                                    {platformOptions.map((opt, i) => (
                                        <motion.div key={opt} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }}>
                                            <div onClick={() => setValue("platformName", opt)} className={`group relative cursor-pointer flex flex-col items-center justify-center bg-card hover:bg-white dark:hover:bg-card/80 border rounded-xl p-2 h-24 transition-all duration-200 ease-out ${selectedPlatform === opt ? 'border-primary shadow-lg shadow-primary/10 ring-2 ring-primary/10 scale-105' : 'border-border/40 hover:border-primary/30 hover:shadow-sm'}`}>
                                                <GradientIcon icon={getPlatformIcon(opt)} className="scale-75 mb-1" />
                                                <span className={`text-[10px] font-bold text-center ${selectedPlatform === opt ? 'text-primary' : 'text-foreground/80 group-hover:text-foreground'}`}>{opt}</span>
                                                {selectedPlatform === opt && (<div className="absolute top-1 right-1 text-primary"><CheckCircle2 className="w-3 h-3 fill-primary text-white" /></div>)}
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                                {selectedPlatform && (
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto bg-card/50 p-6 rounded-2xl border border-border/50">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                            <div className="space-y-1.5">
                                                <Label className="text-xs font-semibold uppercase text-muted-foreground">Environment</Label>
                                                <Select onValueChange={(v) => setValue("testEnvironment", v as any)}>
                                                    <SelectTrigger className="bg-background h-10 rounded-lg border-border"><SelectValue placeholder="Select" /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Production">Production</SelectItem>
                                                        <SelectItem value="Pre-Production">Pre-Prod</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs font-semibold uppercase text-muted-foreground">App Version</Label>
                                                <Input {...control.register("appVersion")} placeholder="v1.0.0" className="bg-background h-10 rounded-lg border-border" />
                                            </div>
                                        </div>

                                        <Button type="submit" className="w-full mt-6 h-10 rounded-lg text-sm font-bold shadow-md hover:scale-[1.01] transition-transform">Configure Scope <ChevronRight className="ml-2 w-4 h-4" /></Button>
                                    </motion.div>
                                )}
                            </form>
                        </motion.div>
                    )}

                    {/* STEP 2: CONFIG */}
                    {step === 'config' && (
                        <motion.div key="step2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-4xl mx-auto space-y-8">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {Object.entries(contentTypesMap).map(([key, value]) => (
                                    <div key={key} onClick={() => setAllSelectedContentTypes(prev => prev.includes(value) ? prev.filter(i => i !== value) : [...prev, value])}
                                        className={`p-6 rounded-[1.5rem] border-2 cursor-pointer transition-all flex flex-col justify-between min-h-[140px] ${allSelectedContentTypes.includes(value) ? 'bg-primary/5 border-primary shadow-lg shadow-primary/5' : 'bg-card border-border/50 hover:border-primary/30'}`}>
                                        <div className="flex justify-between items-start">
                                            <div className={`p-3 rounded-full ${allSelectedContentTypes.includes(value) ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}><Tv className="w-6 h-6" /></div>
                                            {allSelectedContentTypes.includes(value) && <CheckCircle2 className="w-6 h-6 text-primary fill-primary/20" />}
                                        </div>
                                        <div className="mt-4">
                                            <span className="font-bold text-lg">{value}</span>
                                            {allSelectedContentTypes.includes(value) && (
                                                <div className="mt-2 pt-2 border-t border-dashed border-primary/20 flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                                    <Checkbox id={`ads-${key}`} checked={adsIncluded[value] || false} onCheckedChange={c => setAdsIncluded(prev => ({ ...prev, [value]: !!c }))} className="rounded-md" />
                                                    <Label htmlFor={`ads-${key}`} className="text-xs cursor-pointer font-medium text-muted-foreground">Include Ads</Label>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-center gap-4">
                                <Button variant="ghost" onClick={() => setStep('platform_details')} className="rounded-full px-6 h-10 text-sm">Back</Button>
                                <Button onClick={() => setStep('workspace')} variant="secondary" className="rounded-full px-6 h-10 text-sm font-medium">Skip Selection</Button>
                                <Button onClick={handleNextStep} className="bg-primary text-primary-foreground h-10 rounded-full px-8 text-sm font-bold shadow-md">Enter Workspace <ChevronRight className="ml-2 w-4 h-4" /></Button>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 3: WORKSPACE */}
                    {
                        step === 'workspace' && (
                            <motion.div key="step3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                                <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-[2rem] p-6 flex flex-wrap justify-between items-center gap-4 shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-primary/10 p-3 rounded-full text-primary"><Database className="h-6 w-6" /></div>
                                        <div>
                                            <h3 className="text-xl font-bold">Active Workspace</h3>
                                            <p className="text-sm text-muted-foreground">{collectedEvents.length + otherEvents.length} events captured</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <OtherEventModal onSave={(e) => setOtherEvents(prev => [...prev, e])} />
                                        <Button onClick={handleExport} className="bg-green-600 hover:bg-green-700 text-white shadow-lg rounded-full px-6"><FileDown className="mr-2 h-4 w-4" /> Export Report</Button>
                                        <Button variant="ghost" onClick={() => setStep('config')} className="rounded-full">Back</Button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {allSelectedContentTypes.map(contentType => {
                                        const isDone = completedContentTypes.includes(contentType);
                                        return (
                                            <div key={contentType} onClick={() => setContentTypeToProcess(contentType)} className={`group p-6 rounded-[1.5rem] border-2 cursor-pointer flex items-center justify-between transition-all ${isDone ? 'bg-green-500/5 border-green-500/20' : 'bg-card border-border/50 hover:border-primary/30 hover:shadow-lg'}`}>
                                                <div className="flex items-center gap-4">
                                                    <div className={`p-4 rounded-full ${isDone ? 'bg-green-100 text-green-600' : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors'}`}>
                                                        {isDone ? <CheckCircle2 className="w-6 h-6" /> : <Tv className="w-6 h-6" />}
                                                    </div>
                                                    <span className={`text-lg font-bold ${isDone ? 'text-green-700' : 'text-foreground'}`}>{contentType}</span>
                                                </div>
                                                {!isDone && <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center border border-border group-hover:border-primary/50"><ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary" /></div>}
                                            </div>
                                        )
                                    })}
                                </div>
                            </motion.div>
                        )
                    }
                </AnimatePresence >
            </motion.div >

            {contentTypeToProcess && (
                <HtmlInputModal contentType={contentTypeToProcess} adsIncluded={adsIncluded[contentTypeToProcess] || false} onSave={handleHtmlInputSave} onCancel={() => setContentTypeToProcess(null)} />
            )
            }
        </div >
    );
}

export default function CleverTapTrackerPage() {
    return <Suspense fallback={null}><CleverTapTrackerPageComponent /></Suspense>;
}
