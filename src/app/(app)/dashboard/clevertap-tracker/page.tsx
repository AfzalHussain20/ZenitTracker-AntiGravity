"use client";

import { useState, useMemo, useEffect, useCallback, Suspense } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Wand2, FileDown, Rocket, TableIcon, ArrowLeft, CheckCircle, PlusCircle, ArrowRight, Server, Tv, Bot } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// --- Type definitions
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


// --- Constants
const contentTypesMap: Record<string, string> = {
  "1": "Live TV", "2": "TV Shows", "3": "Movies", "4": "Shorts", "5": "Music Videos", "6": "Comedy"
};

const platformOptions = [
  "Android TV", "Apple TV", "Fire TV", "LG TV", "Samsung TV", "Roku", "Web", "Mobile (Android)", "Mobile (iOS)", "Other"
];

const orderedEventInputs = ["Content Started", "Content Played", "Content Started Version 1", "Content Played Version 1"];
const adsEventName = "Ads Played";


// --- Zod Schema for Platform Details
const platformDetailsSchema = z.object({
  platformName: z.string().min(1, { message: "Platform selection is required." }),
  testEnvironment: z.enum(["Production", "Pre-Production"], { required_error: "Test Environment is required." }),
  appVersion: z.string().min(1, { message: "App Version is required." }),
});

type PlatformFormValues = z.infer<typeof platformDetailsSchema>;


// --- Utility functions
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

// --- Modals
function OtherEventModal({ onSave }: { onSave: (event: OtherEventData) => void }) {
    const { toast } = useToast();
    const [eventName, setEventName] = useState('');
    const [htmlMarkup, setHtmlMarkup] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const handleSave = () => {
        if (!eventName || !htmlMarkup) {
            toast({
                title: 'Missing Information',
                description: 'Please provide an event name and HTML markup.',
                variant: 'destructive',
            });
            return;
        }

        setIsSaving(true);
        try {
            const params = parseHtmlToParams(htmlMarkup);
            const newEvent: OtherEventData = { name: eventName, params };
            onSave(newEvent);
            toast({
                title: 'Event Saved',
                description: `The event "${eventName}" has been added.`,
            });
            setEventName('');
            setHtmlMarkup('');
            setIsOpen(false);
        } catch (error) {
            toast({
                title: 'Error Parsing HTML',
                description: 'Could not process the provided HTML markup. Please check its format.',
                variant: 'destructive',
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline"><PlusCircle className="mr-2 h-4 w-4"/> Add Other Event</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add a Custom Event</DialogTitle>
                    <DialogDescription>Use this for any event not covered by standard types. Each unique event name creates a new sheet.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div>
                        <Label htmlFor="other-event-name">Event Name</Label>
                        <Input id="other-event-name" value={eventName} onChange={(e) => setEventName(e.target.value)} placeholder="e.g., User Profile Updated" />
                    </div>
                    <div>
                        <Label htmlFor="other-html-markup">HTML Markup</Label>
                        <Textarea id="other-html-markup" value={htmlMarkup} onChange={(e) => setHtmlMarkup(e.target.value)} placeholder="Paste the raw HTML here." rows={8} />
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? <Wand2 className="mr-2 h-4 w-4 animate-spin"/> : <PlusCircle className="mr-2 h-4 w-4"/>}
                        Save Event
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function HtmlInputModal({ contentType, adsIncluded, onSave, onCancel }: { contentType: string, adsIncluded: boolean, onSave: (data: Record<string, string>) => void, onCancel: () => void }) {
    const [localHtmlInputs, setLocalHtmlInputs] = useState<Record<string, string>>({});
    const eventNames = adsIncluded ? [...orderedEventInputs, adsEventName] : orderedEventInputs;

    const handleSave = () => {
        onSave(localHtmlInputs);
    };
    
    return (
        <Dialog open={true} onOpenChange={(open) => !open && onCancel()}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Input HTML for <span className="text-primary">{contentType}</span></DialogTitle>
                    <DialogDescription>Paste the HTML markup for each event associated with this content type.</DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-6 max-h-[60vh] overflow-y-auto pr-4">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {eventNames.map(eventName => (
                            <div className="space-y-2" key={eventName}>
                                <Label>{eventName}</Label>
                                <Textarea 
                                    value={localHtmlInputs[eventName] || ''} 
                                    onChange={(e) => setLocalHtmlInputs(prev => ({ ...prev, [eventName]: e.target.value }))} 
                                    placeholder="Paste HTML markup here..." 
                                    rows={4}
                                />
                            </div>
                        ))}
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onCancel}>Cancel</Button>
                    <Button onClick={handleSave}>Save & Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}


// --- Main Component
function CleverTapTrackerPageComponent() {
    const [step, setStep] = useState<Step>("platform_details");
    const router = useRouter();
    const { toast } = useToast();

    // State for the entire flow
    const [platformData, setPlatformData] = useState<PlatformFormValues | null>(null);
    const [allSelectedContentTypes, setAllSelectedContentTypes] = useState<string[]>([]);
    const [adsIncluded, setAdsIncluded] = useState<Record<string, boolean>>({});
    
    const [contentTypeToProcess, setContentTypeToProcess] = useState<string | null>(null);

    const [collectedEvents, setCollectedEvents] = useState<EventData[]>([]);
    const [otherEvents, setOtherEvents] = useState<OtherEventData[]>([]);
    const [completedContentTypes, setCompletedContentTypes] = useState<string[]>([]);

    const { control, handleSubmit, formState: { errors } } = useForm<PlatformFormValues>({
        resolver: zodResolver(platformDetailsSchema)
    });
    
    // --- Navigation and step handling
    const handlePlatformDetailsSubmit = (data: PlatformFormValues) => {
        setPlatformData(data);
        setStep("config");
    };
    
    const handleNextStep = () => {
        if (step === "config") {
            if (allSelectedContentTypes.length === 0) {
                toast({ title: "No Content Types Selected", description: "Proceeding to workspace for custom events.", variant: "default"});
            }
            setStep("workspace");
        }
    };
    
    const handlePrevStep = () => {
        if (step === "workspace") setStep("config");
        if (step === "config") setStep("platform_details");
    };

    // --- Data processing
    const handleHtmlInputSave = (htmlInputs: Record<string, string>) => {
        if (!contentTypeToProcess) return;

        const newEvents: EventData[] = [];
        const allEventNames = adsIncluded[contentTypeToProcess] ? [...orderedEventInputs, adsEventName] : orderedEventInputs;
        
        // Find the next instance number for this content type
        const existingInstances = collectedEvents.filter(e => e.contentType === contentTypeToProcess);
        const maxInstance = existingInstances.reduce((max, e) => Math.max(max, e.instance), 0);
        const instanceNum = maxInstance + 1;

        for (const eventName of allEventNames) {
            const html = htmlInputs[eventName];
            if (html) {
                try {
                    const parsedParams = parseHtmlToParams(html);
                    const eventData: EventData = {
                        name: eventName,
                        contentType: contentTypeToProcess,
                        params: parsedParams,
                        instance: instanceNum,
                    };
                    newEvents.push(eventData);
                } catch {
                     toast({ title: "Parsing Error", description: `Could not parse HTML for "${eventName}". Please check it.`, variant: "destructive"});
                     return;
                }
            }
        }
        
        setCollectedEvents(prev => [...prev, ...newEvents]);

        if (!completedContentTypes.includes(contentTypeToProcess)) {
            setCompletedContentTypes(prev => [...prev, contentTypeToProcess]);
        }
        
        toast({ title: "Success", description: `Data for instance #${instanceNum} of "${contentTypeToProcess}" has been saved.` });
        setContentTypeToProcess(null);
    };
    
    const handleOtherEventSave = (event: OtherEventData) => {
        setOtherEvents(prev => [...prev, event]);
    };


    // --- Progress UI
    const progressPercentage = useMemo(() => {
        if (step === 'platform_details') return 10;
        if (step === 'config') return 33;
        if (step === 'workspace') {
            if (allSelectedContentTypes.length === 0) return 100;
            const completedRatio = completedContentTypes.length / allSelectedContentTypes.length;
            return 66 + (completedRatio * 34);
        }
        return 0;
    }, [step, completedContentTypes, allSelectedContentTypes]);


    // --- Excel Export
    const getColumnWidths = (rows: any[], headers: string[]) => {
        return headers.map(header => {
            const headerWidth = header.length;
            const maxWidth = Math.max(headerWidth, ...rows.map(row => {
                const value = row[header];
                // Check if value is a valid string or number before trying to get its length
                return (typeof value === 'string' || typeof value === 'number') ? String(value).length : 0;
            }));
            return { wch: Math.min(Math.max(maxWidth, 10), 60) + 2 }; // Min 10, Max 60
        });
    };

    const styleAndCreateSheet = (rows: any[], headers: string[]) => {
      const ws = XLSX.utils.json_to_sheet(rows, { header: headers });
      const range = XLSX.utils.decode_range(ws['!ref']!);

      // Header style
      const headerStyle = {
          font: { bold: true, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "4F46E5" } }, // Indigo-600
          alignment: { horizontal: "center", vertical: "center" },
      };

      for (let C = range.s.c; C <= range.e.c; ++C) {
          const cellRef = XLSX.utils.encode_cell({ c: C, r: 0 });
          if (ws[cellRef]) ws[cellRef].s = headerStyle;
      }
      
      ws['!cols'] = getColumnWidths(rows, headers);
      ws['!autofilter'] = { ref: XLSX.utils.encode_range(range) };
      ws['!views'] = [{state: 'frozen', ySplit: 1}];

      return ws;
    };


    const handleExport = () => {
        if (collectedEvents.length === 0 && otherEvents.length === 0) {
            toast({ title: "No Data", description: "There is no event data to export.", variant: "destructive" });
            return;
        }

        const wb = XLSX.utils.book_new();

        // --- 1. Summary Sheet ---
        if (platformData) {
            const summaryData = [
                { Key: "Platform", Value: platformData.platformName },
                { Key: "Environment", Value: platformData.testEnvironment },
                { Key: "App Version", Value: platformData.appVersion },
                { Key: "Export Date", Value: format(new Date(), "yyyy-MM-dd HH:mm:ss") },
            ];
            const summaryWs = XLSX.utils.json_to_sheet(summaryData, { skipHeader: true });
            summaryWs['!cols'] = [{ wch: 20 }, { wch: 40 }];
            XLSX.utils.book_append_sheet(wb, summaryWs, "Summary");
        }
        
        // --- 2. Individual Event Sheets (as requested in the screenshot) ---
        const eventsByName = [...collectedEvents, ...otherEvents].reduce((acc, event) => {
            if (!acc[event.name]) {
                acc[event.name] = [];
            }
            acc[event.name].push(event);
            return acc;
        }, {} as Record<string, (EventData | OtherEventData)[]>);
        
        for (const eventName in eventsByName) {
            const instances = eventsByName[eventName];
            
            // Gather all unique parameter keys for this event type
            const allKeys = new Set<string>();
            instances.forEach(inst => Object.keys(inst.params).forEach(key => allKeys.add(key)));
            const sortedKeys = Array.from(allKeys).sort();

            const headers = ['Content Type', 'Instance', ...sortedKeys];

            const rows = instances.map((inst: any) => {
                const row: Record<string, any> = {
                    'Content Type': inst.contentType || 'N/A', // For 'other' events
                    'Instance': inst.instance || 1, // For 'other' events
                };
                // Populate the row with parameter values
                sortedKeys.forEach(key => {
                    row[key] = inst.params[key] || '';
                });
                return row;
            });
            
            if(rows.length > 0) {
                const ws = styleAndCreateSheet(rows, headers);
                // Sanitize sheet name
                const safeSheetName = eventName.replace(/[\/\?\*\[\]]/g, '').substring(0, 31);
                XLSX.utils.book_append_sheet(wb, ws, safeSheetName);
            }
        }
        
        if (wb.SheetNames.length === 0 || (wb.SheetNames.length === 1 && wb.SheetNames[0] === 'Summary')) {
             toast({ title: "No Content", description: "No event attributes with values were found to export.", variant: "destructive" });
             return;
        }

        XLSX.writeFile(wb, `clevertap_zenit_tracker_data_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
    };
    
    return (
        <div className="max-w-4xl mx-auto">
            <Button variant="outline" onClick={() => router.back()} className="mb-4">
               <ArrowLeft className="mr-2 h-4 w-4" />
               Back
            </Button>
            {contentTypeToProcess && (
                <HtmlInputModal 
                    contentType={contentTypeToProcess} 
                    adsIncluded={adsIncluded[contentTypeToProcess] || false}
                    onSave={handleHtmlInputSave}
                    onCancel={() => setContentTypeToProcess(null)}
                />
            )}
            <Card className="shadow-xl">
                <CardHeader>
                    <CardTitle className="text-2xl font-headline text-center flex items-center justify-center gap-2">
                        <Wand2 className="h-6 w-6 text-primary"/> CleverTap Event Composer
                    </CardTitle>
                    <CardDescription className="text-center">
                        A guided tool to collect and structure raw event data for CleverTap.
                    </CardDescription>
                     <div className="w-full bg-muted rounded-full h-2.5 mt-4">
                        <Progress value={progressPercentage} className="h-2.5" />
                    </div>
                </CardHeader>

                <CardContent className="min-h-[400px]">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={step}
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 50 }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                        >
                            {step === "platform_details" && (
                                <form onSubmit={handleSubmit(handlePlatformDetailsSubmit)} className="space-y-4 max-w-lg mx-auto">
                                     <h3 className="font-semibold text-lg text-center mb-2">Step 1: Define Your Test Environment</h3>
                                     <p className="text-center text-muted-foreground text-sm">Select the platform and environment you are testing against.</p>
                                    <div className="pt-4 space-y-4">
                                        <Controller
                                            name="platformName"
                                            control={control}
                                            render={({ field }) => (
                                                <div className="space-y-1.5">
                                                <Label>Platform</Label>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <SelectTrigger><SelectValue placeholder="Select a platform..." /></SelectTrigger>
                                                    <SelectContent>{platformOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent>
                                                </Select>
                                                {errors.platformName && <p className="text-xs text-destructive">{errors.platformName.message}</p>}
                                                </div>
                                            )}
                                        />
                                        <Controller
                                            name="testEnvironment"
                                            control={control}
                                            render={({ field }) => (
                                                <div className="space-y-1.5">
                                                <Label>Test Environment</Label>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <SelectTrigger><SelectValue placeholder="Select an environment..." /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Production">Production</SelectItem>
                                                        <SelectItem value="Pre-Production">Pre-Production</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                {errors.testEnvironment && <p className="text-xs text-destructive">{errors.testEnvironment.message}</p>}
                                                </div>
                                            )}
                                        />
                                         <div className="space-y-1.5">
                                            <Label htmlFor="appVersion">App Version</Label>
                                            <Input id="appVersion" {...control.register("appVersion")} placeholder="e.g., 1.2.3, build 45" />
                                            {errors.appVersion && <p className="text-xs text-destructive">{errors.appVersion.message}</p>}
                                        </div>
                                    </div>
                                     <Button type="submit" className="w-full !mt-8">
                                        Next: Select Content Types <ArrowRight className="ml-2"/>
                                    </Button>
                                </form>
                            )}
                            {step === "config" && (
                                <div>
                                    <h3 className="font-semibold text-lg text-center mb-2">Step 2: Select Content Types & Options</h3>
                                    <p className="text-center text-muted-foreground text-sm">Choose any predefined content types you will be testing in this batch.</p>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
                                        {Object.entries(contentTypesMap).map(([key, value]) => (
                                            <motion.div 
                                                key={key} 
                                                className="flex flex-col space-y-2 p-3 rounded-md border"
                                                whileHover={{ scale: 1.05 }}
                                                transition={{ type: 'spring', stiffness: 300 }}
                                            >
                                                <div className="flex items-center space-x-2">
                                                    <Checkbox 
                                                        id={key}
                                                        checked={allSelectedContentTypes.includes(value)}
                                                        onCheckedChange={(checked) => {
                                                            setAllSelectedContentTypes(prev => checked ? [...prev, value] : prev.filter(item => item !== value))
                                                        }}
                                                    />
                                                    <Label htmlFor={key} className="flex-1 cursor-pointer font-medium">{value}</Label>
                                                </div>
                                                <div className="flex items-center space-x-2 pl-6">
                                                    <Checkbox 
                                                        id={`ads-${key}`}
                                                        checked={adsIncluded[value] || false}
                                                        onCheckedChange={(checked) => setAdsIncluded(prev => ({...prev, [value]: !!checked}))}
                                                        disabled={!allSelectedContentTypes.includes(value)}
                                                    />
                                                    <Label htmlFor={`ads-${key}`} className="flex-1 cursor-pointer text-sm text-muted-foreground">Include Ads</Label>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {step === "workspace" && (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center flex-wrap gap-4">
                                        <h3 className="font-semibold text-lg flex items-center gap-2"><TableIcon/> Step 3: Data Input Workspace</h3>
                                        <div className="flex gap-2">
                                            <OtherEventModal onSave={handleOtherEventSave} />
                                            <Button onClick={handleExport}><FileDown className="mr-2 h-4 w-4"/> Export to Excel</Button>
                                        </div>
                                    </div>
                                    <p className="text-sm text-muted-foreground">Click a content type to add or edit its data. Add other event types as needed. When finished, export your collection.</p>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                                        {allSelectedContentTypes.map((contentType) => {
                                            const isCompleted = completedContentTypes.includes(contentType);
                                            return (
                                                <motion.div 
                                                    key={contentType} 
                                                    onClick={() => setContentTypeToProcess(contentType)}
                                                    className="flex items-center justify-between space-x-2 p-3 rounded-md border transition-all cursor-pointer hover:border-primary"
                                                    whileHover={{ scale: 1.05, y: -5 }}
                                                >
                                                    <Label htmlFor={contentType} className="flex-1 cursor-pointer">{contentType}</Label>
                                                    {isCompleted 
                                                        ? <CheckCircle className="h-5 w-5 text-green-500" />
                                                        : <ArrowRight className="h-5 w-5 text-primary" />
                                                    }
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </CardContent>

                <CardFooter className="flex justify-between">
                     <Button variant="outline" onClick={handlePrevStep} disabled={step === 'platform_details'}>
                        <ArrowLeft className="mr-2"/> Back
                    </Button>

                    {step === "config" && (
                         <div className="flex items-center gap-4">
                            <Button variant="link" onClick={handleNextStep}>
                                Or Skip to Workspace
                            </Button>
                            <Button onClick={handleNextStep}>
                                Go to Workspace <ArrowRight className="ml-2"/>
                            </Button>
                        </div>
                    )}
                </CardFooter>
            </Card>
        </div>
    );
}

export default function CleverTapTrackerPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <CleverTapTrackerPageComponent />
        </Suspense>
    )
}
