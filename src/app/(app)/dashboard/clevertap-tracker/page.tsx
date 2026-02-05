"use client";

import { useState, Suspense, useEffect } from 'react';
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
    Globe, Box, FileDown, Wand2, FileJson, Trash2, Layers, Zap
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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

function parseJsonToParams(jsonStr: string): Record<string, string> {
    try {
        let obj = JSON.parse(jsonStr);

        // Smart Detection: If this is an Elasticsearch/Kibana export, 
        // prioritize the 'fields' or '_source.fields' block which contains the actual analytics.
        if (obj._source && obj._source.fields) {
            obj = obj._source.fields;
        } else if (obj.fields && typeof obj.fields === 'object' && !Array.isArray(obj.fields)) {
            obj = obj.fields;
        } else if (obj._source) {
            obj = obj._source;
        }

        const params: Record<string, string> = {};

        const flatten = (data: any, prefix = '') => {
            if (data === null || data === undefined) return;

            Object.entries(data).forEach(([key, value]) => {
                const newKey = prefix ? `${prefix}.${key}` : key;

                if (typeof value === 'object' && value !== null) {
                    if (Array.isArray(value)) {
                        params[newKey] = JSON.stringify(value);
                    } else {
                        flatten(value, newKey);
                    }
                } else {
                    params[newKey] = String(value);
                }
            });
        };

        flatten(obj);
        return params;
    } catch (e) {
        throw new Error("Invalid JSON");
    }
}

const SECTION_PRIORITY: Record<string, number> = {
    "document_metadata": 1,
    "event_attributes": 2,
    "raw_event": 3,
    "indexed_fields": 4,
    "search_metadata": 5,
    "sorting_metadata": 6,
    "other": 7
};

function getSection(key: string): string {
    if (key.startsWith("_source.message.")) return "event_attributes";
    if (key.startsWith("_source.event.")) return "raw_event";
    if (key.startsWith("fields.")) return "indexed_fields";
    if (key.startsWith("highlight.")) return "search_metadata";
    if (key.startsWith("sort.")) return "sorting_metadata";
    if (key.startsWith("_") || key === "found" || key === "took") return "document_metadata";
    return "other";
}

function getSortScore(key: string): number {
    const section = getSection(key);
    return SECTION_PRIORITY[section] || 99;
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

// --- New Interfaces for In-House Analytics ---
interface InHouseEvent {
    eventName: string;
    json: string;
    params: Record<string, string>;
}

// Utility to clean attribute names from all possible prefixes and normalize to lowercase
function cleanAttributeName(attrName: string): string {
    let cleaned = attrName;

    // Remove _source.* patterns (handles message, event, fields, feilds, etc.)
    if (cleaned.startsWith('_source.')) {
        // Remove everything up to and including the second dot after _source
        const afterSource = cleaned.substring(8); // Remove '_source.'
        const nextDotIndex = afterSource.indexOf('.');
        if (nextDotIndex !== -1) {
            cleaned = afterSource.substring(nextDotIndex + 1);
        } else {
            // Just _source.something without further nesting
            cleaned = afterSource;
        }
    }

    // Remove other common prefixes
    const otherPrefixes = [
        'event.original.',
        'message.',
    ];

    for (const prefix of otherPrefixes) {
        if (cleaned.startsWith(prefix)) {
            cleaned = cleaned.substring(prefix.length);
        }
    }

    return cleaned.toLowerCase();
}

function isInvalidNAValue(v: any): boolean {
    if (v === null || v === undefined) return true;
    const s = String(v).trim();
    if (s === "") return true;
    const lower = s.toLowerCase();
    // Flag if it's some form of 'na' but NOT exactly 'na'
    if (lower === "na" && s !== "na") return true;
    // Flag words 'null', 'undefined'
    if (lower === "null" || lower === "undefined") return true;
    return false;
}

interface NAValidationResult {
    sheetName: string;
    titleName: string;
    eventName: string;
    missingAttributes: string[];
    extraAttributes: { attribute: string; value: string }[];
    formatErrors: { attribute: string; value: string; type: 'CAPITAL_ATTR' | 'INVALID_NA' }[];
    status: "PASS" | "FAIL";
}

interface InHouseTitle {
    id: string;
    name: string;
    events: InHouseEvent[];
}

interface InHousePlan {
    id: string;
    sheetName: string;
    titles: InHouseTitle[];
}

const IN_HOUSE_EVENT_TYPES = ["App Launched", "Content Clicked", "Content Attempted", "Content Played"];

// --- In-House Analytics Modal ---
function InHouseAnalyticsModal({ onSave, initialPlans = [] }: { onSave: (plans: InHousePlan[]) => void, initialPlans?: InHousePlan[] }) {
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(false);

    // Plans State (Multiple Sheets) - Initialize with provided plans
    const [plans, setPlans] = useState<InHousePlan[]>(initialPlans);
    const [activePlanId, setActivePlanId] = useState<string | null>(null);
    const [newSheetName, setNewSheetName] = useState('');

    // Update plans when modal opens with initialPlans
    useEffect(() => {
        if (isOpen && initialPlans.length > 0) {
            setPlans(initialPlans);
            setActivePlanId(initialPlans[0]?.id || null);
        }
    }, [isOpen, initialPlans.length, initialPlans]);

    // Common Titles Helper (Clone Logic)
    const [cloneSourceId, setCloneSourceId] = useState<string | null>(null);

    // UI Helpers for Active Plan
    const [activeTitleId, setActiveTitleId] = useState<string | null>(null);
    const [newTitleName, setNewTitleName] = useState('');

    const activePlan = plans.find(p => p.id === activePlanId);

    // Default clone source to the last added plan
    useEffect(() => {
        if (plans.length > 0 && !cloneSourceId) {
            setCloneSourceId(plans[plans.length - 1].id);
        }
    }, [plans.length, plans, cloneSourceId]);

    // Add New Sheet
    const handleAddSheet = () => {
        if (!newSheetName.trim()) return;

        // Prepare initial titles from clone source
        let initialTitles: InHouseTitle[] = [];
        if (cloneSourceId) {
            const sourcePlan = plans.find(p => p.id === cloneSourceId);
            if (sourcePlan) {
                // Deep copy structure (Events are reset to empty JSON)
                initialTitles = sourcePlan.titles.map(t => ({
                    ...t,
                    id: Date.now().toString() + Math.random(), // New IDs
                    events: t.events.map(e => ({ ...e, json: '', params: {} })) // Clear data
                }));
            }
        }

        const newPlan: InHousePlan = {
            id: Date.now().toString(),
            sheetName: newSheetName,
            titles: initialTitles
        };

        setPlans([...plans, newPlan]);
        setNewSheetName('');
        setActivePlanId(newPlan.id);
        setCloneSourceId(newPlan.id); // Auto-update clone source to this new one
        toast({ title: "Sheet Added", description: `"${newSheetName}" is ready.${initialTitles.length > 0 ? ` Cloned ${initialTitles.length} titles.` : ''}` });
    };

    const handleDeleteSheet = (id: string, e: any) => {
        e.stopPropagation();
        setPlans(prev => prev.filter(p => p.id !== id));
        if (activePlanId === id) setActivePlanId(null);
    };

    // Add Title to Active Plan
    const handleAddTitle = () => {
        if (!activePlanId || !newTitleName.trim()) return;

        const newTitle: InHouseTitle = {
            id: Date.now().toString(),
            name: newTitleName,
            events: IN_HOUSE_EVENT_TYPES.map(name => ({ eventName: name, json: '', params: {} }))
        };

        setPlans(prev => prev.map(p => {
            if (p.id !== activePlanId) return p;
            return { ...p, titles: [...p.titles, newTitle] };
        }));

        setNewTitleName('');
        setActiveTitleId(newTitle.id);
    };

    // Update Event JSON in Active Plan
    const updateEventJson = (titleId: string, eventName: string, json: string) => {
        if (!activePlanId) return;
        setPlans(prev => prev.map(p => {
            if (p.id !== activePlanId) return p;
            return {
                ...p,
                titles: p.titles.map(t => {
                    if (t.id !== titleId) return t;
                    return {
                        ...t,
                        events: t.events.map(e => e.eventName === eventName ? { ...e, json } : e)
                    };
                })
            };
        }));
    };

    const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const ab = event.target?.result as ArrayBuffer;
                const wb = XLSX.read(ab, { type: 'array' });

                let targetSheet = wb.SheetNames.find(n => n.toLowerCase().includes("detailed"));
                if (!targetSheet) targetSheet = wb.SheetNames.find(n => n.toLowerCase().includes("na validation"));
                if (!targetSheet) {
                    targetSheet = wb.SheetNames.find(name => {
                        const json = XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1 }) as any[][];
                        const header = json[0] || [];
                        return header.some(h => String(h).toLowerCase().includes("attribute"));
                    });
                }
                if (!targetSheet) targetSheet = wb.SheetNames[0];

                const data: any[] = XLSX.utils.sheet_to_json(wb.Sheets[targetSheet]);
                const importedPlans: InHousePlan[] = [];

                // Group by Sheet -> Title -> Event
                const planMap: Record<string, Record<string, Record<string, Record<string, string>>>> = {};

                data.forEach(row => {
                    const sName = row.Sheet || row["Sheet Name"] || row["Domain/Sheet"] || row["Domain"] || "Imported Plan";
                    const tName = row.Title || row["Title Name"] || "Imported Title";
                    const eName = row.Event || row["Event Name"] || "";
                    const attr = row.Attribute || row["Parameter Name"] || row["Key"] || row["Parameter"];

                    // Explicitly handle alternate headers (In-House Export uses 'Actual Value')
                    const rawVal = row["Captured Value"] ?? row["Actual Value"] ?? row["Value"] ?? row["Data"] ?? row["Actual"];
                    const val = (rawVal === null || rawVal === undefined) ? "" : String(rawVal);

                    if (!eName || !attr || attr === "--- HEADER ---" || attr === "All Rules" || val.includes("MISSING")) return;

                    if (!planMap[sName]) planMap[sName] = {};
                    if (!planMap[sName][tName]) planMap[sName][tName] = {};
                    if (!planMap[sName][tName][eName]) planMap[sName][tName][eName] = {};

                    planMap[sName][tName][eName][attr] = val;
                });

                Object.entries(planMap).forEach(([sName, titles]) => {
                    const planTitles: InHouseTitle[] = Object.entries(titles).map(([tName, events]) => {
                        const titleEvents: InHouseEvent[] = Object.entries(events).map(([eventName, params]) => {
                            return {
                                eventName: eventName,
                                json: JSON.stringify(params, null, 2),
                                params: params
                            };
                        });

                        // Ensure standard event types are present even if not in Excel
                        IN_HOUSE_EVENT_TYPES.forEach(type => {
                            if (!titleEvents.find(e => e.eventName === type)) {
                                titleEvents.push({ eventName: type, json: '', params: {} });
                            }
                        });

                        return { id: Math.random().toString(), name: tName, events: titleEvents };
                    });
                    importedPlans.push({
                        id: Math.random().toString(),
                        sheetName: sName,
                        titles: planTitles
                    });
                });

                if (importedPlans.length > 0) {
                    setPlans(prev => [...prev, ...importedPlans]);
                    setActivePlanId(importedPlans[0].id);
                    toast({ title: "Import Successful", description: `Recovered ${importedPlans.length} plans from "${targetSheet}".` });
                } else {
                    toast({ title: "No Data Found", description: "Checked the sheet but couldn't identify any valid events." });
                }
            } catch (err) {
                toast({ title: "Import Failed", description: "Could not parse Excel file.", variant: "destructive" });
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const handleSaveAll = () => {
        if (plans.length === 0) {
            toast({ title: "No Sheets", description: "Please add at least one Sheet (Plan).", variant: "destructive" });
            return;
        }

        // Validate and Process All
        const processedPlans: InHousePlan[] = [];
        let globalHasData = false;

        for (const plan of plans) {
            if (plan.titles.length === 0) continue; // Skip empty plans? Or warn?

            const processedTitles: InHouseTitle[] = [];
            for (const title of plan.titles) {
                const processedEvents: InHouseEvent[] = [];
                for (const event of title.events) {
                    if (!event.json.trim()) continue;
                    try {
                        const params = parseJsonToParams(event.json);
                        processedEvents.push({ ...event, params });
                        globalHasData = true;
                    } catch (e) {
                        toast({ title: "Parsing Error", description: `Invalid JSON in Sheet "${plan.sheetName}" - Title "${title.name}"`, variant: "destructive" });
                        return;
                    }
                }
                if (processedEvents.length > 0) {
                    processedTitles.push({ ...title, events: processedEvents });
                }
            }
            if (processedTitles.length > 0) {
                processedPlans.push({ ...plan, titles: processedTitles });
            }
        }

        if (!globalHasData) {
            toast({ title: "Empty Data", description: "No valid JSON data found in any sheet.", variant: "destructive" });
            return;
        }

        onSave(processedPlans);
        toast({ title: "Plans Saved", description: `${processedPlans.length} Sheets saved to workspace. You can continue editing or close.` });
        // Don't close, don't reset - let user continue or manually close
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="rounded-full shadow-sm">
                    <FileJson className="mr-2 h-4 w-4" /> In-House Validation
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-background border-border rounded-2xl max-w-5xl max-h-[95vh] overflow-y-auto flex flex-col">
                <DialogHeader>
                    <DialogTitle>In-House Analytics Validator</DialogTitle>
                    <DialogDescription>Define Sheets (Plans), Titles, and Events.</DialogDescription>
                </DialogHeader>

                <div className="flex-1 flex flex-col gap-6 py-4">
                    {/* 1. Sheet Manager Section */}
                    <div className="space-y-4 p-4 bg-muted/20 rounded-xl border border-border/50">
                        <div className="flex items-center justify-between">
                            <Label className="text-base font-bold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">1. Manage Sheets (Excel Tabs)</Label>
                            {plans.length > 0 && (
                                <div className="flex items-center gap-2">
                                    <Label className="text-xs text-muted-foreground whitespace-nowrap">Clone Structure From:</Label>
                                    <Select value={cloneSourceId || ""} onValueChange={setCloneSourceId}>
                                        <SelectTrigger className="h-7 w-[140px] text-xs"><SelectValue placeholder="None" /></SelectTrigger>
                                        <SelectContent>
                                            {plans.map(p => <SelectItem key={p.id} value={p.id}>{p.sheetName}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <Input
                                value={newSheetName}
                                onChange={e => setNewSheetName(e.target.value)}
                                placeholder="New Sheet Name (e.g. 'Sprint 24')"
                                className="font-semibold bg-background"
                            />
                            <Button onClick={handleAddSheet} disabled={!newSheetName.trim()} className="shrink-0"><PlusCircle className="mr-2 h-4 w-4" /> Add Sheet</Button>
                            <div className="relative">
                                <Button variant="outline" className="shrink-0 border-indigo-200 text-indigo-600 hover:bg-indigo-50">
                                    <FileDown className="mr-2 h-4 w-4 rotate-180" /> Import Report Excel
                                </Button>
                                <input
                                    type="file"
                                    accept=".xlsx, .xls"
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    onChange={handleImportExcel}
                                />
                            </div>
                        </div>

                        {/* Sheets Carousel/List */}
                        {plans.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {plans.map(plan => (
                                    <div
                                        key={plan.id}
                                        onClick={() => setActivePlanId(plan.id)}
                                        className={`group cursor-pointer flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm transition-all ${activePlanId === plan.id ? 'bg-primary/10 border-primary text-primary font-bold ring-1 ring-primary/20' : 'bg-background border-border hover:border-primary/50 text-muted-foreground'}`}
                                    >
                                        <Layers className="w-3 h-3" />
                                        {plan.sheetName}
                                        <div
                                            className="ml-1 p-0.5 rounded-full hover:bg-destructive/10 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={(e) => handleDeleteSheet(plan.id, e)}
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="w-full h-[1px] bg-border/50" />

                    {/* 2. Title & Event Manager for Active Plan */}
                    {activePlan ? (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-base font-bold flex items-center gap-2">
                                    <span className="text-muted-foreground font-normal">Editing Sheet:</span>
                                    {activePlan.sheetName}
                                </Label>
                                <span className="text-xs text-muted-foreground">{activePlan.titles.length} Titles</span>
                            </div>

                            <div className="flex gap-2">
                                <Input
                                    value={newTitleName}
                                    onChange={e => setNewTitleName(e.target.value)}
                                    placeholder="New Title (e.g. 'User Login Flow')"
                                />
                                <Button onClick={handleAddTitle} disabled={!newTitleName.trim()} variant="secondary"><PlusCircle className="mr-2 h-4 w-4" /> Add Title</Button>
                            </div>

                            <div className="space-y-2 mt-2">
                                {activePlan.titles.length === 0 && <p className="text-center text-muted-foreground text-sm py-8 italic border-2 border-dashed rounded-xl">No titles in this sheet yet. Add one above.</p>}
                                {activePlan.titles.map(title => (
                                    <Card key={title.id} className="overflow-hidden border-border/50 shadow-sm">
                                        <div
                                            className="p-3 bg-card flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors"
                                            onClick={() => setActiveTitleId(activeTitleId === title.id ? null : title.id)}
                                        >
                                            <div className="flex items-center gap-2 font-semibold text-sm">
                                                <ChevronRight className={`w-4 h-4 transition-transform ${activeTitleId === title.id ? 'rotate-90' : ''}`} />
                                                {title.name}
                                            </div>
                                            <Badge variant="outline" className="text-[10px]">{title.events.filter(e => e.json.trim()).length} Events Params</Badge>
                                        </div>

                                        {activeTitleId === title.id && (
                                            <CardContent className="p-4 bg-muted/10 border-t">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {title.events.map(event => (
                                                        <div key={event.eventName} className="space-y-1.5">
                                                            <div className="flex justify-between">
                                                                <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{event.eventName}</Label>
                                                                {event.json.trim() && <CheckCircle2 className="w-3 h-3 text-green-500" />}
                                                            </div>
                                                            <Textarea
                                                                value={event.json}
                                                                onChange={e => updateEventJson(title.id, event.eventName, e.target.value)}
                                                                placeholder="{ ...JSON }"
                                                                className="font-mono text-[10px] min-h-[60px] bg-background resize-none focus:ring-1"
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </CardContent>
                                        )}
                                    </Card>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground py-12 space-y-2 border-2 border-dashed rounded-2xl">
                            <Layers className="w-12 h-12 opacity-20" />
                            <p>Select or Add a Sheet to begin editing.</p>
                        </div>
                    )}
                </div>

                <DialogFooter className="mt-auto pt-4 border-t sticky bottom-0 bg-background z-10 w-full flex justify-end gap-2">
                    <Button variant="ghost" onClick={() => setIsOpen(false)}>Close</Button>
                    <Button onClick={handleSaveAll} className="bg-primary text-primary-foreground shadow-lg">
                        <CheckCircle2 className="mr-2 h-4 w-4" /> Save Plans to Workspace
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// --- comparison modal for NA Validation ---
function NAValidationReportModal({ plans, rules }: { plans: InHousePlan[], rules: Record<string, string[]> }) {
    const [isOpen, setIsOpen] = useState(false);

    // Generate Report Data on Open
    const validationResults: NAValidationResult[] = [];

    if (isOpen) {
        plans.forEach(plan => {
            plan.titles.forEach(title => {
                title.events.forEach(event => {
                    const expectedAttrs = rules[event.eventName] || [];
                    if (expectedAttrs.length === 0) return;

                    // Capture all actual attributes and check formatting/values
                    const actualParams: Record<string, string> = {};
                    const formatErrors: { attribute: string; value: string; type: 'CAPITAL_ATTR' | 'INVALID_NA' }[] = [];

                    Object.entries(event.params).forEach(([k, v]) => {
                        const cleanedKey = cleanAttributeName(k);
                        if (!cleanedKey || cleanedKey === 'original') return;

                        // 1. Check for Capital Letters in raw key name
                        if (/[A-Z]/.test(k)) {
                            formatErrors.push({ attribute: k, value: String(v), type: 'CAPITAL_ATTR' });
                        }

                        // 2. Check for incorrect NA/null/blank values
                        if (isInvalidNAValue(v)) {
                            formatErrors.push({ attribute: k, value: (v === null || v === undefined || String(v).trim() === "") ? "(blank)" : String(v), type: 'INVALID_NA' });
                        }

                        // Normalize for matching logic
                        const strVal = String(v).trim();
                        const normalizedVal = (!strVal || strVal.toLowerCase() === "na" || strVal.toLowerCase() === "null") ? "na" : strVal;
                        actualParams[cleanedKey] = normalizedVal;
                    });

                    const actualKeys = Object.keys(actualParams);

                    // 1. Missing: Expected but not in Actual
                    const missing = expectedAttrs.filter(a => !actualKeys.includes(a));

                    // 2. Extra: In Actual but not in Expected
                    const extra = actualKeys
                        .filter(a => !expectedAttrs.includes(a))
                        .map(a => ({ attribute: a, value: actualParams[a] }));

                    const status = (missing.length > 0 || formatErrors.length > 0) ? "FAIL" : "PASS";

                    validationResults.push({
                        sheetName: plan.sheetName,
                        titleName: title.name,
                        eventName: event.eventName,
                        missingAttributes: missing,
                        extraAttributes: extra,
                        formatErrors: formatErrors,
                        status: status
                    });
                });
            });
        });
    }

    const handleExportNA = () => {
        const wb = XLSX.utils.book_new();

        // 1. Summary Worksheet
        const summaryRows = validationResults.map(res => ({
            "Domain/Sheet": res.sheetName,
            "Title Name": res.titleName,
            "Event Name": res.eventName,
            "Status": res.status,
            "Missing Attrs (Count)": res.missingAttributes.length,
            "Extra Attrs (Count)": res.extraAttributes.length,
            "Format Errors (Count)": res.formatErrors.length,
            "NA Check": res.status === "PASS" ? "PASSED" : "FAILED"
        }));
        const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
        wsSummary['!cols'] = [{ wch: 20 }, { wch: 30 }, { wch: 25 }, { wch: 10 }, { wch: 20 }, { wch: 20 }, { wch: 15 }];

        // 2. Detailed Worksheet
        const detailedRows: any[] = [];
        validationResults.forEach(res => {
            // Add a header for this event
            detailedRows.push({
                "Sheet": res.sheetName,
                "Title": res.titleName,
                "Event": res.eventName,
                "Attribute": "--- HEADER ---",
                "Captured Value": "---",
                "Result": res.status
            });

            res.missingAttributes.forEach(a => {
                detailedRows.push({
                    "Sheet": res.sheetName,
                    "Title": res.titleName,
                    "Event": res.eventName,
                    "Attribute": a,
                    "Captured Value": "MISSING",
                    "Result": "FAIL (Missing)"
                });
            });

            res.formatErrors.forEach(err => {
                detailedRows.push({
                    "Sheet": res.sheetName,
                    "Title": res.titleName,
                    "Event": res.eventName,
                    "Attribute": err.attribute,
                    "Captured Value": err.value,
                    "Result": err.type === 'CAPITAL_ATTR' ? 'FAIL (Capital Attr)' : 'FAIL (Invalid NA format)'
                });
            });

            res.extraAttributes.forEach(a => {
                detailedRows.push({
                    "Sheet": res.sheetName,
                    "Title": res.titleName,
                    "Event": res.eventName,
                    "Attribute": a.attribute,
                    "Captured Value": a.value,
                    "Result": "EXTRA (Highlight)"
                });
            });

            if (res.missingAttributes.length === 0 && res.extraAttributes.length === 0 && res.formatErrors.length === 0) {
                detailedRows.push({
                    "Sheet": res.sheetName,
                    "Title": res.titleName,
                    "Event": res.eventName,
                    "Attribute": "All Rules",
                    "Captured Value": "All attributes passed",
                    "Result": "PASS"
                });
            }

            detailedRows.push({}); // Empty row for separation
        });

        const wsDetailed = XLSX.utils.json_to_sheet(detailedRows);
        wsDetailed['!cols'] = [{ wch: 15 }, { wch: 25 }, { wch: 20 }, { wch: 25 }, { wch: 30 }, { wch: 20 }];

        XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");
        XLSX.utils.book_append_sheet(wb, wsDetailed, "Detailed Analytics Report");

        XLSX.writeFile(wb, `In-House_Analytics_Report_${format(new Date(), "yyyyMMdd_HHmm")}.xlsx`);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="text-orange-600 border-orange-200 hover:bg-orange-50">
                    <Sparkles className="mr-2 h-4 w-4" /> Verify NA Rules
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col bg-background">
                <DialogHeader>
                    <DialogTitle>NA Attribute Validation</DialogTitle>
                    <DialogDescription>Checking for naming conventions (lowercase) and valid NA formats.</DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto py-4 space-y-4">
                    {validationResults.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground">No data to validate or no rules loaded.</div>
                    ) : (
                        <div className="space-y-4">
                            {validationResults.map((res, idx) => (
                                <Card key={`${res.sheetName}-${res.titleName}-${res.eventName}-${idx}`} className={`border-l-4 ${res.status === 'PASS' ? 'border-l-green-500' : 'border-l-red-500'}`}>
                                    <div className="p-4 flex gap-4 items-start">
                                        <div className="w-[200px] shrink-0 space-y-1">
                                            <div className="text-xs font-semibold text-primary/70 mb-1">Sheet: {res.sheetName}</div>
                                            <div className="font-bold text-sm">{res.eventName}</div>
                                            <div className="text-xs text-muted-foreground">{res.titleName}</div>
                                            <Badge variant={res.status === 'PASS' ? 'default' : 'destructive'} className="mt-1">{res.status}</Badge>
                                        </div>

                                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 text-sm">
                                            <div className="space-y-1.5">
                                                <span className="font-bold text-[10px] text-muted-foreground tracking-tight block">Missing (Expected NA)</span>
                                                {res.missingAttributes.length > 0 ? (
                                                    <ul className="list-disc list-inside text-red-600 text-[10px] space-y-0.5">
                                                        {res.missingAttributes.map(a => <li key={a}>{a}</li>)}
                                                    </ul>
                                                ) : <div className="text-green-600 text-[10px] py-1 font-medium">None</div>}
                                            </div>

                                            <div className="space-y-1.5">
                                                <span className="font-bold text-[10px] text-muted-foreground tracking-tight block">Extra (Unexpected)</span>
                                                {res.extraAttributes.length > 0 ? (
                                                    <ul className="list-disc list-inside text-orange-600 text-[10px] space-y-0.5">
                                                        {res.extraAttributes.map(a => (
                                                            <li key={a.attribute} className="truncate" title={a.attribute}>
                                                                {a.attribute}: <span className="opacity-70 italic text-[9px]">&quot;{a.value}&quot;</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : <div className="text-green-600 text-[10px] py-1 font-medium">None</div>}
                                            </div>

                                            <div className="space-y-1.5">
                                                <span className="font-bold text-[10px] text-muted-foreground tracking-tight block leading-tight">If capital letters present in fetched Atribute names</span>
                                                {res.formatErrors.filter(e => e.type === 'CAPITAL_ATTR').length > 0 ? (
                                                    <div className="space-y-1">
                                                        {res.formatErrors.filter(e => e.type === 'CAPITAL_ATTR').map((err, i) => (
                                                            <div key={i} className="text-[9px] bg-red-50 p-1 rounded border border-red-100 text-red-700 font-bold truncate">
                                                                {err.attribute}
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : <div className="text-green-600 text-[10px] py-1 font-medium">None</div>}
                                            </div>

                                            <div className="space-y-1.5">
                                                <span className="font-bold text-[10px] text-muted-foreground tracking-tight block leading-tight">Capital NA, Null, and Blank value captured for any attributes</span>
                                                {res.formatErrors.filter(e => e.type === 'INVALID_NA').length > 0 ? (
                                                    <div className="space-y-1">
                                                        {res.formatErrors.filter(e => e.type === 'INVALID_NA').map((err, i) => (
                                                            <div key={i} className="text-[9px] bg-red-50 p-1 rounded border border-red-100 flex flex-col">
                                                                <span className="text-red-700 font-bold leading-tight">{err.attribute}</span>
                                                                <span className="text-red-500 italic text-[8px]">&quot;{err.value}&quot;</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : <div className="text-green-600 text-[10px] py-1 font-medium">None</div>}
                                            </div>

                                            <div className="space-y-1.5">
                                                <span className="font-bold text-[10px] text-muted-foreground tracking-tight block">Value Mismatch (Not NA)</span>
                                                <div className="text-green-600 text-[10px] py-1 font-medium">None</div>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button onClick={handleExportNA} className="bg-green-600 hover:bg-green-700 text-white shadow-md">
                        <FileDown className="mr-2 h-4 w-4" /> Export NA Report (Excel)
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// --- New Standalone Quick JSON Validator ---
function QuickNAValidator({ rules }: { rules: Record<string, string[]> }) {
    const [jsonInput, setJsonInput] = useState("");
    const [selectedEvent, setSelectedEvent] = useState("");
    const [result, setResult] = useState<NAValidationResult | null>(null);
    const { toast } = useToast();

    const handleValidate = () => {
        if (!jsonInput.trim()) return;
        if (!selectedEvent) {
            toast({ title: "Event Required", description: "Please select an event type to validate against.", variant: "destructive" });
            return;
        }

        try {
            const params = parseJsonToParams(jsonInput);
            const expectedAttrs = rules[selectedEvent] || [];

            const actualParams: Record<string, string> = {};
            const formatErrors: { attribute: string; value: string; type: 'CAPITAL_ATTR' | 'INVALID_NA' }[] = [];

            Object.entries(params).forEach(([k, v]) => {
                const cleanedKey = cleanAttributeName(k);
                if (!cleanedKey || cleanedKey === 'original') return;

                if (/[A-Z]/.test(k)) {
                    formatErrors.push({ attribute: k, value: String(v), type: 'CAPITAL_ATTR' });
                }

                if (isInvalidNAValue(v)) {
                    formatErrors.push({ attribute: k, value: (v === null || v === undefined || String(v).trim() === "") ? "(blank)" : String(v), type: 'INVALID_NA' });
                }

                const strVal = String(v).trim();
                const normalizedVal = (!strVal || strVal.toLowerCase() === "na" || strVal.toLowerCase() === "null") ? "na" : strVal;
                actualParams[cleanedKey] = normalizedVal;
            });

            const actualKeys = Object.keys(actualParams);
            const missing = expectedAttrs.filter(a => !actualKeys.includes(a));
            const extra = actualKeys
                .filter(a => !expectedAttrs.includes(a))
                .map(a => ({ attribute: a, value: actualParams[a] }));

            const status = (missing.length > 0 || formatErrors.length > 0) ? "FAIL" : "PASS";

            setResult({
                sheetName: "Instant Validation",
                titleName: "Manual Paste",
                eventName: selectedEvent,
                missingAttributes: missing,
                extraAttributes: extra,
                formatErrors: formatErrors,
                status: status
            });
        } catch (e) {
            toast({ title: "Invalid JSON", description: "Please provide a valid JSON object.", variant: "destructive" });
        }
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" className="text-indigo-600 border-indigo-200 hover:bg-indigo-50">
                    <Zap className="mr-2 h-4 w-4" /> Instant NA Verify
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col bg-background">
                <DialogHeader>
                    <DialogTitle>Instant JSON NA Validator</DialogTitle>
                    <DialogDescription>Paste JSON directly to see if it follows NA verification rules.</DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto py-4 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase text-muted-foreground">1. Select Event Type</Label>
                            <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                                <SelectTrigger className="bg-background">
                                    <SelectValue placeholder="Select Event Rules..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.keys(rules).sort().map(name => (
                                        <SelectItem key={name} value={name}>{name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase text-muted-foreground">2. Paste JSON</Label>
                            <Textarea
                                className="font-mono text-[10px] min-h-[120px] bg-muted/20"
                                placeholder='{ "fields": { "attribute": "value" } }'
                                value={jsonInput}
                                onChange={(e) => setJsonInput(e.target.value)}
                            />
                        </div>
                    </div>

                    <Button onClick={handleValidate} className="w-full bg-indigo-600 hover:bg-indigo-700">Validate Now</Button>

                    {result && (
                        <div className="pt-4 border-t animate-in fade-in slide-in-from-top-2">
                            <Card className={`border-l-4 ${result.status === 'PASS' ? 'border-l-green-500' : 'border-l-red-500'}`}>
                                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                                    <div className="space-y-1.5">
                                        <span className="font-bold text-[10px] text-muted-foreground tracking-tight block">Missing (Expected NA)</span>
                                        {result.missingAttributes.length > 0 ? (
                                            <ul className="list-disc list-inside text-red-600 text-[10px] space-y-0.5">
                                                {result.missingAttributes.map(a => <li key={a}>{a}</li>)}
                                            </ul>
                                        ) : <div className="text-green-600 text-[10px] py-1 font-medium">None</div>}
                                    </div>

                                    <div className="space-y-1.5">
                                        <span className="font-bold text-[10px] text-muted-foreground tracking-tight block">Extra (Unexpected)</span>
                                        {result.extraAttributes.length > 0 ? (
                                            <ul className="list-disc list-inside text-orange-600 text-[10px] space-y-0.5">
                                                {result.extraAttributes.map(a => (
                                                    <li key={a.attribute} className="truncate" title={a.attribute}>
                                                        {a.attribute}: <span className="opacity-70 italic">&quot;{a.value}&quot;</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : <div className="text-green-600 text-[10px] py-1 font-medium">None</div>}
                                    </div>

                                    <div className="space-y-1.5">
                                        <span className="font-bold text-[10px] text-muted-foreground tracking-tight block leading-tight">If capital letters present in fetched Atribute names</span>
                                        {result.formatErrors.filter(e => e.type === 'CAPITAL_ATTR').length > 0 ? (
                                            <div className="space-y-1">
                                                {result.formatErrors.filter(e => e.type === 'CAPITAL_ATTR').map((err, i) => (
                                                    <div key={i} className="text-[9px] bg-red-50 p-1 rounded border border-red-100 text-red-700 font-bold truncate">
                                                        {err.attribute}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : <div className="text-green-600 text-[10px] py-1 font-medium">None</div>}
                                    </div>

                                    <div className="space-y-1.5">
                                        <span className="font-bold text-[10px] text-muted-foreground tracking-tight block leading-tight">Capital NA, Null, and Blank value captured for any attributes</span>
                                        {result.formatErrors.filter(e => e.type === 'INVALID_NA').length > 0 ? (
                                            <div className="space-y-1">
                                                {result.formatErrors.filter(e => e.type === 'INVALID_NA').map((err, i) => (
                                                    <div key={i} className="text-[9px] bg-red-50 p-1 rounded border border-red-100 flex flex-col">
                                                        <span className="text-red-700 font-bold">{err.attribute}</span>
                                                        <span className="text-red-500 italic">&quot;{err.value}&quot;</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : <div className="text-green-600 text-[10px] py-1 font-medium">None</div>}
                                    </div>

                                    <div className="space-y-1.5">
                                        <span className="font-bold text-[10px] text-muted-foreground tracking-tight block">Value Mismatch (Not NA)</span>
                                        <div className="text-green-600 text-[10px] py-1 font-medium">None</div>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    )}
                </div>
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

    // Legacy Events
    const [collectedEvents, setCollectedEvents] = useState<EventData[]>([]);
    const [otherEvents, setOtherEvents] = useState<OtherEventData[]>([]);

    // New In-House Plans
    const [inHousePlans, setInHousePlans] = useState<InHousePlan[]>([]);
    const [validationRules, setValidationRules] = useState<Record<string, string[]>>({});

    const [completedContentTypes, setCompletedContentTypes] = useState<string[]>([]);
    const { control, handleSubmit, setValue, watch, formState: { errors } } = useForm<PlatformFormValues>({ resolver: zodResolver(platformDetailsSchema) });
    const selectedPlatform = watch("platformName");

    // Load Validation Rules on Mount
    useEffect(() => {
        const filenames = [
            '/In-House_Analytics_Expected_Attributes.xlsx',
            '/InHouse_Analytics_Validation_Rules.xlsx',
            '/In-House_Analytics_na_Validation_Sheet.xlsx'
        ];

        const tryFetch = async (index: number) => {
            if (index >= filenames.length) {
                console.warn("No validation sheet found from any of the specified paths:", filenames.join(", "));
                toast({ title: "Notice", description: "Default validation rules applied (No custom sheet found)." });
                return;
            }
            try {
                const res = await fetch(filenames[index]);
                if (!res.ok) throw new Error("Not found");
                const ab = await res.arrayBuffer();
                const wb = XLSX.read(ab, { type: 'array' });
                const rules: Record<string, string[]> = {};
                wb.SheetNames.forEach(name => {
                    const sheet = wb.Sheets[name];
                    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
                    const attrs = data.flat()
                        .filter(x => x !== null && x !== undefined && x !== '')
                        .map(x => String(x).trim().toLowerCase())
                        .filter(x => x !== '');
                    rules[name.trim()] = Array.from(new Set(attrs));
                });
                setValidationRules(rules);
                console.log(`Validation Rules Loaded from ${filenames[index]}:`, rules);
            } catch (e) {
                tryFetch(index + 1);
            }
        };

        tryFetch(0);
    }, [toast]);

    const handlePlatformDetailsSubmit = (data: PlatformFormValues) => { setPlatformData(data); setStep("config"); };
    const handleNextStep = () => {
        if (step === "config") {
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

    const handleValidationExport = () => {
        if (inHousePlans.length === 0) {
            // This function is now specifically for the main report, not NA validation.
            // If no inHousePlans, it means no data for the main report either.
            toast({ title: "No In-House Plans", description: "No data to export for main plans.", variant: "destructive" });
            return;
        }

        const wb = XLSX.utils.book_new();

        // Process each plan into a sheet
        inHousePlans.forEach((plan, idx) => {
            const validationRows: any[] = [];

            // Columns: Sheet Name | Title | Event Name | Attribute | Actual Value | Expected Value | Match Status
            plan.titles.forEach(title => {
                title.events.forEach(event => {
                    // Extract all keys
                    const keys = Object.keys(event.params).filter(k => cleanAttributeName(k) !== "original").sort((a, b) => getSortScore(a) - getSortScore(b));

                    if (keys.length === 0) return;

                    keys.forEach(key => {
                        // Extract key Clean but keep original key for the labels if we want casing errors to show
                        const actualVal = event.params[key];
                        const keyClean = cleanAttributeName(key);

                        const eventRules = validationRules[event.eventName] || [];
                        const isExpectedNa = eventRules.includes(keyClean);
                        const expectedVal = isExpectedNa ? "na" : "Value";

                        let matchStatus = "Mismatched";
                        if (isExpectedNa) {
                            // Must be EXACTLY lowercase 'na'
                            if (actualVal === "na") matchStatus = "Matched";
                        } else {
                            // If NOT expected to be NA, it must have a value and NOT be any form of NA/null/blank
                            if (!isInvalidNAValue(actualVal) && String(actualVal).toLowerCase() !== "na") matchStatus = "Matched";
                        }

                        validationRows.push({
                            "Sheet Name": plan.sheetName,
                            "Title": title.name,
                            "Event Name": event.eventName,
                            "Attribute": key, // Use ORIGINAL KEY to preserve casing for the export! 
                            "Actual Value": actualVal,
                            "Expected Value": expectedVal,
                            "Match Status": matchStatus
                        });
                    });
                    // Add spacer row for readability? No, strict table requested.
                });
            });

            if (validationRows.length > 0) {
                const ws = XLSX.utils.json_to_sheet(validationRows);
                // Adjust column widths
                ws['!cols'] = [
                    { wch: 20 }, // Sheet
                    { wch: 30 }, // Title
                    { wch: 25 }, // Event
                    { wch: 40 }, // Attribute
                    { wch: 30 }, // Actual
                    { wch: 15 }, // Expected
                    { wch: 15 }  // Status
                ];
                // Create unique sheet name to avoid duplicates
                const reportSheetName = `${plan.sheetName.substring(0, 20)} (R${idx + 1})`;
                XLSX.utils.book_append_sheet(wb, ws, reportSheetName);

                // --- GENERATE MATRIX VIEW (SIDE-BY-SIDE) SHEET ---
                // Format:
                // Row 1: [Title Name] [Empty] [Empty] ... for each title
                // Row 2: [Event 1] [Event 2] [Event 3] ...
                // Row 3+: Attribute | Value | Attribute | Value ...

                // To make it readable, we will create a vertical stack of Comparisons per Title.
                // Title: Title Name
                // [Event 1] | | [Event 2] | | [Event 3]
                // Attr | Val | Attr | Val | Attr | Val

                const matrixRows: any[][] = [];

                plan.titles.forEach(title => {
                    // Header for Title
                    matrixRows.push([title.name]); // Row with Title

                    const eventHeaders: string[] = [];
                    const subHeaders: string[] = [];
                    const eventDataColumns: { key: string, val: string }[][] = [];
                    let maxRows = 0;

                    title.events.forEach(event => {
                        eventHeaders.push(event.eventName, ""); // Spans 2 cols
                        subHeaders.push("_Attribute_", "Value");

                        const keys = Object.keys(event.params).filter(k => cleanAttributeName(k) !== "original").sort();
                        const colData = keys.map(k => ({ key: cleanAttributeName(k), val: event.params[k] }));
                        eventDataColumns.push(colData);
                        if (colData.length > maxRows) maxRows = colData.length;
                    });

                    matrixRows.push(eventHeaders); // Event Names
                    matrixRows.push(subHeaders);   // Attr/Value Headers

                    // Data Rows
                    for (let i = 0; i < maxRows; i++) {
                        const row: string[] = [];
                        eventDataColumns.forEach(col => {
                            if (col[i]) {
                                row.push(col[i].key, col[i].val);
                            } else {
                                row.push("", "");
                            }
                        });
                        matrixRows.push(row);
                    }

                    matrixRows.push([]); // Spacer between titles
                    matrixRows.push([]);
                });

                if (matrixRows.length > 0) {
                    const matrixWs = XLSX.utils.aoa_to_sheet(matrixRows);
                    // Style hint: Merge title cells if possible (SheetJS free version basic usage)
                    // Set reasonable widths
                    const matrixCols = [];
                    for (let c = 0; c < 20; c++) matrixCols.push({ wch: 35 }, { wch: 30 });
                    matrixWs['!cols'] = matrixCols;

                    // Create unique matrix sheet name
                    const matrixSheetName = `${plan.sheetName.substring(0, 20)} (M${idx + 1})`;
                    XLSX.utils.book_append_sheet(wb, matrixWs, matrixSheetName);
                }
            }
        });

        // Also append Legacy Summary if exists
        XLSX.writeFile(wb, `Validation_Report_${format(new Date(), "yyyyMMdd_HHmm")}.xlsx`);
    };

    const handleExport = () => {
        // This handleExport is now specifically for the legacy data.
        // The inHousePlans export is handled by handleValidationExport, which is called by a separate button.

        if (collectedEvents.length === 0 && otherEvents.length === 0) { toast({ title: "No Data", description: "Nothing to export from legacy events.", variant: "destructive" }); return; }

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

        // ... (Rest of legacy export logic basically untouched if strictly legacy data)
        const eventsByName: Record<string, any[]> = {};
        // @ts-ignore
        allEvents.forEach(e => {
            if (!eventsByName[e.name]) { eventsByName[e.name] = []; }
            eventsByName[e.name].push(e);
        });

        Object.entries(eventsByName).forEach(([eventName, events]) => {
            const paramKeys = [...new Set(events.flatMap((e: any) => Object.keys(e.params)))]
                .filter(k => {
                    const cleaned = cleanAttributeName(k);
                    return cleaned && cleaned !== 'original';
                }).sort((a, b) => getSortScore(a) - getSortScore(b));
            const isSingle = events.length === 1;
            const headerRow = ["Attribute", ...events.map((e, idx) => isSingle ? "Value" : `Instance ${e.instance || idx + 1}`)];
            const dataRows: any[][] = [];
            paramKeys.forEach(key => {
                dataRows.push([cleanAttributeName(key), ...events.map(e => e.params[key] || "")]);
            });
            const ws = XLSX.utils.aoa_to_sheet([headerRow, ...dataRows]);
            const colWidths = [{ wch: 45 }]; events.forEach(() => colWidths.push({ wch: 30 })); ws['!cols'] = colWidths;
            XLSX.utils.book_append_sheet(wb, ws, eventName.substring(0, 31));
        });

        const masterKeys = Array.from(new Set(allEvents.flatMap(e => Object.keys(e.params)))).sort();
        const masterRows = allEvents.map((e: any, idx: number) => ({
            "Event Name": e.name, "Content Type": e.contentType || "N/A", "Instance": e.instance || idx + 1,
            ...masterKeys.reduce((acc, k) => ({ ...acc, [cleanAttributeName(k)]: e.params[k] || "" }), {}),
        }));
        if (masterRows.length > 0) {
            const masterWs = XLSX.utils.json_to_sheet(masterRows);
            XLSX.utils.book_append_sheet(wb, masterWs, "Master Data");
        }

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
                                        <InHouseAnalyticsModal
                                            initialPlans={inHousePlans}
                                            onSave={(plans) => {
                                                // Replace all plans with the updated ones
                                                setInHousePlans(plans);
                                            }}
                                        />

                                        {/* Original Bulk NA Validation */}
                                        <NAValidationReportModal plans={inHousePlans} rules={validationRules} />

                                        {/* New Standalone Direct JSON Paste Validator */}
                                        <QuickNAValidator rules={validationRules} />

                                        <Button
                                            onClick={handleValidationExport}
                                            disabled={inHousePlans.length === 0}
                                            className="bg-green-600 hover:bg-green-700 text-white shadow-lg rounded-full px-6 disabled:opacity-50"
                                        >
                                            <FileDown className="mr-2 h-4 w-4" /> Export In-House Plans
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            onClick={() => { setCollectedEvents([]); setOtherEvents([]); setInHousePlans([]); setCompletedContentTypes([]); toast({ title: "Workspace Cleared", description: "All data removed." }); }}
                                            className="rounded-full shadow-lg px-6"
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" /> Clear
                                        </Button>
                                    </div>
                                </div>

                                {/* In-House Plans List (Excel Sheets Preview) */}
                                {inHousePlans.length > 0 && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-3">
                                        <div className="flex items-center gap-2 px-2">
                                            <Layers className="w-4 h-4 text-muted-foreground" />
                                            <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Staged Sheets (Export Plan)</h4>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {inHousePlans.map((plan, idx) => (
                                                <div key={plan.id} className="bg-card border border-border/60 rounded-xl p-4 flex flex-col gap-2 relative group hover:border-primary/50 transition-colors">
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex items-center gap-2">
                                                            <div className="bg-primary/10 text-primary font-bold px-2 py-1 rounded text-xs">Sheet {idx + 1}</div>
                                                            <span className="font-bold text-sm truncate max-w-[150px]" title={plan.sheetName}>{plan.sheetName}</span>
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6 text-destructive/50 hover:text-destructive -mt-1 -mr-1"
                                                            onClick={() => setInHousePlans(prev => prev.filter(p => p.id !== plan.id))}
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                        </Button>
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {plan.titles.length} Titles &bull; {plan.titles.reduce((acc, t) => acc + t.events.length, 0)} Total Events
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}

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
