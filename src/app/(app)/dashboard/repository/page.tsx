"use client";

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebaseConfig';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Search, Plus, Trash2, Layers,
    Smartphone, Monitor, Tv, CheckSquare, ListOrdered, Library,
    FileCheck, ArrowRight, MoreHorizontal, LayoutGrid, List,
    Sparkles, UploadCloud, DownloadCloud, FileText, Zap, ChevronLeft, BrainCircuit
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

// --- Interface ---
interface ManagedTestCase {
    id: string;
    title: string;
    preconditions: string;
    steps: string;
    expectedResult: string;
    platform: string;
    priority: 'High' | 'Medium' | 'Low';
    tags: string[];
    testBedId?: string;
    createdAt: any;
}

interface TestBed {
    id: string;
    name: string;
    description: string;
    createdAt: any;
}

// --- Universal Behavior Spec (UBS) Engine ---
// A deterministic, rule-based generator that converts structured intent into professional test cases.
// NO AI involved. Pure logic.

interface BehaviorSpec {
    actors: string[];
    actions: string[];
    inputs: { name: string; type: string; required: boolean }[];
    rules: string[];
}

const ADHOC_PAYLOADS = {
    text: ["<script>alert(1)</script>", "' OR 1=1 --", "${jndi:ldap://...}"],
    email: ["test@@mail.com", "user@.com", "abc"],
    number: ["-1", "0", "99999999999", "NaN"],
    general: ["Empty String", "Null Value", "Special Characters !@#$%"]
};

// Main Engine Function
const heuristicExtraction = (text: string) => {
    // 1. DECOMPOSITION: Parse English into a Feature Model
    const spec: BehaviorSpec = {
        actors: ['User'], // Default
        actions: [],
        inputs: [],
        rules: []
    };

    const lines = text.split(/[\n,.]+/).map(l => l.trim()).filter(l => l.length > 3);

    lines.forEach(line => {
        const lower = line.toLowerCase();

        // Detect Actors
        if (lower.match(/^(admin|manager|viewer|guest|system)/)) {
            spec.actors.push(line.split(' ')[0]);
        }

        // Detect Inputs
        if (lower.includes('input') || lower.includes('enter') || lower.includes('field') || lower.includes('type')) {
            const match = lower.match(/(?:enter|input|type)\s+(\w+)/);
            if (match) {
                spec.inputs.push({
                    name: match[1],
                    type: lower.includes('email') ? 'email' : lower.includes('number') ? 'number' : 'text',
                    required: !lower.includes('optional')
                });
            }
        }

        // Detect Actions/Rules
        if (lower.includes('should') || lower.includes('must') || lower.includes('verify') || lower.includes('click')) {
            spec.rules.push(line);
        } else if (spec.actions.length < 3) {
            // Treat short phrases as actions if flow-like
            spec.actions.push(line);
        }
    });

    // 2. GENERATION: Apply Deterministic Rules to create Test Cases
    const generatedCases = [];

    // A. FUNCTIONAL: Happy Paths for every Rule
    const featureName = spec.actions[0] ? spec.actions[0].substring(0, 20) : "Feature";

    spec.rules.forEach((rule, idx) => {
        generatedCases.push({
            title: `TC_FUNC_${String(idx + 1).padStart(3, '0')}: Verify that ${rule.replace(/^(verify|check|ensure|must|should)/i, '').trim()}`,
            steps: `1. Login as ${spec.actors[0]}.\n2. Navigate to relevant screen.\n3. Perform action to trigger: "${rule}"\n4. Observe output.`,
            expectedResult: "System should behave exactly as described: " + rule,
            platform: 'Web',
            priority: 'High',
            tags: ['functional', 'positive', 'ubs-generated']
        });
    });

    // B. INPUT VALIDATION & BOUNDARY (Deterministic)
    spec.inputs.forEach((field, idx) => {
        // Missing Required Field
        if (field.required) {
            generatedCases.push({
                title: `TC_VAL_${String(idx + 1).padStart(3, '0')}: Validate handling of missing '${field.name}'`,
                steps: `1. Navigate to screen.\n2. Leave '${field.name}' empty.\n3. Attempt to submit.`,
                expectedResult: "System should block submission and show 'Required Field' error.",
                platform: 'Web',
                priority: 'Medium',
                tags: ['negative', 'validation']
            });
        }

        // Type-Specific Adhoc Payloads
        const payloads = ADHOC_PAYLOADS[field.type as keyof typeof ADHOC_PAYLOADS] || ADHOC_PAYLOADS.general;
        const randomPayload = payloads[Math.floor(Math.random() * payloads.length)];

        generatedCases.push({
            title: `TC_SEC_${String(idx + 1).padStart(3, '0')}: Security/Adhoc test for '${field.name}' with payload`,
            steps: `1. Enter payload: "${randomPayload}" into '${field.name}'.\n2. Submit form.`,
            expectedResult: "System should sanitize input or reject invalid format. Should NOT crash or execute script.",
            platform: 'Web',
            priority: 'High',
            tags: ['security', 'adhoc', 'edge-case']
        });
    });

    // C. STATE / FLOW (Fallback if no inputs)
    if (spec.inputs.length === 0 && spec.rules.length === 0) {
        generatedCases.push({
            title: `TC_EXP_001: Exploratory Review of Features`,
            steps: `1. Review the requirement text: "${text.substring(0, 50)}..."\n2. Identify implicit actors and actions.\n3. Execute happy path flow for extracted entities.`,
            expectedResult: "System should match user intent.",
            platform: 'Web',
            priority: 'Medium',
            tags: ['exploratory']
        });
    }

    return generatedCases;
};


export default function RepositoryPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [testCases, setTestCases] = useState<ManagedTestCase[]>([]);
    const [testBeds, setTestBeds] = useState<TestBed[]>([]);
    const [selectedTestBedId, setSelectedTestBedId] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isAddBedDialogOpen, setIsAddBedDialogOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

    // Bed Form
    const [newBed, setNewBed] = useState({ name: '', description: '' });

    // --- New: Extraction Studio Mode ---
    const [isExtractionMode, setIsExtractionMode] = useState(false);
    const [prdText, setPrdText] = useState('');
    const [extractedCases, setExtractedCases] = useState<any[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    // -----------------------------------

    // Import/Export State
    const [importAnimation, setImportAnimation] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Form Stats
    const [newCase, setNewCase] = useState({
        title: '',
        preconditions: '',
        steps: '',
        expectedResult: '',
        platform: 'Android TV',
        priority: 'Medium' as const,
        tags: '',
        testBedId: ''
    });

    // --- Fetch Logic ---
    useEffect(() => {
        if (!user) return;
        setLoading(true);

        // Fetch Test Cases
        const qCases = query(collection(db, 'managedTestCases'), orderBy('createdAt', 'desc'));
        const unsubCases = onSnapshot(qCases, (snapshot) => {
            const fetched = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as ManagedTestCase));
            setTestCases(fetched);
            setLoading(false);
        });

        // Fetch Test Beds
        const qBeds = query(collection(db, 'testBeds'), orderBy('createdAt', 'desc'));
        const unsubBeds = onSnapshot(qBeds, (snapshot) => {
            const fetched = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as TestBed));
            setTestBeds(fetched);
        });

        return () => { unsubCases(); unsubBeds(); };
    }, [user]);

    // --- Actions ---
    const handleCreateTestCase = async (manualCase?: any) => {
        const caseToSave = manualCase || newCase;
        if (!caseToSave.title || !caseToSave.platform) return;

        try {
            await addDoc(collection(db, 'managedTestCases'), {
                ...caseToSave,
                tags: Array.isArray(caseToSave.tags) ? caseToSave.tags : (caseToSave.tags || '').split(',').map((t: string) => t.trim()).filter((t: string) => t),
                createdBy: user?.uid,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            if (!manualCase) {
                toast({ title: "Saved", description: "Master case added to Secure Library.", className: "bg-green-500/10 border-green-500 text-green-600 dark:text-green-400" });
                setIsAddDialogOpen(false);
                setNewCase({ title: '', preconditions: '', steps: '', expectedResult: '', platform: 'Android TV', priority: 'Medium', tags: '', testBedId: '' });
            }
        } catch (e) {
            toast({ title: "Error", description: "Failed to create test case.", variant: "destructive" });
        }
    };

    const handleCreateTestBed = async () => {
        if (!newBed.name) return;
        try {
            await addDoc(collection(db, 'testBeds'), {
                ...newBed,
                createdBy: user?.uid,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            toast({ title: "Created", description: "New Test Bed added successfully." });
            setIsAddBedDialogOpen(false);
            setNewBed({ name: '', description: '' });
        } catch (e) {
            toast({ title: "Error", description: "Failed to create test bed.", variant: "destructive" });
        }
    };

    const runExtraction = () => {
        if (!prdText) return;
        setIsGenerating(true);
        setTimeout(() => {
            const results = heuristicExtraction(prdText);
            setExtractedCases(results);
            setIsGenerating(false);
            toast({ title: "Analysis Complete", description: `Engine extracted ${results.length} potential scenarios.` });
        }, 1500);
    };

    const saveAllExtracted = async () => {
        if (extractedCases.length === 0) return;
        try {
            const batch = writeBatch(db);
            extractedCases.forEach(item => {
                const docRef = doc(collection(db, 'managedTestCases'));
                batch.set(docRef, {
                    ...item,
                    testBedId: newCase.testBedId,
                    createdBy: user?.uid,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                });
            });
            await batch.commit();
            toast({ title: "Import Complete", description: `Added ${extractedCases.length} AI-generated cases to ${testBeds.find(b => b.id === newCase.testBedId)?.name || 'library'}.` });
            setIsExtractionMode(false);
            setExtractedCases([]);
            setPrdText('');
        } catch (e) {
            console.error(e);
            toast({ title: "Error", description: "Batch save failed.", variant: "destructive" });
        }
    };

    const handleExport = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(testCases, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "master_library_export.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        toast({ title: "Exported", description: "Library downloaded as JSON." });
    };

    const handleImportClick = () => fileInputRef.current?.click();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const fileReader = new FileReader();
        if (e.target.files?.[0]) {
            setImportAnimation(true);
            fileReader.readAsText(e.target.files[0], "UTF-8");
            fileReader.onload = async (e) => {
                try {
                    const importedData = JSON.parse(e.target?.result as string);
                    if (Array.isArray(importedData)) {
                        const batch = writeBatch(db);
                        importedData.forEach((item: any) => {
                            if (item.title) {
                                const docRef = doc(collection(db, 'managedTestCases'));
                                batch.set(docRef, {
                                    title: item.title,
                                    preconditions: item.preconditions || '',
                                    steps: item.steps || '',
                                    expectedResult: item.expectedResult || '',
                                    platform: item.platform || 'Web',
                                    priority: item.priority || 'Medium',
                                    tags: item.tags || ['imported'],
                                    createdBy: user?.uid,
                                    createdAt: serverTimestamp(),
                                    updatedAt: serverTimestamp()
                                });
                            }
                        });
                        await batch.commit();
                        setTimeout(() => {
                            setImportAnimation(false);
                            toast({ title: "Import Successful", description: `Added ${importedData.length} cases to library.` });
                        }, 2000);
                    }
                } catch (err) {
                    setImportAnimation(false);
                    toast({ title: "Invalid File", description: "Could not parse JSON.", variant: "destructive" });
                }
            };
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Permanently delete this master case?")) return;
        try {
            await deleteDoc(doc(db, 'managedTestCases', id));
            toast({ title: "Archived", description: "Test case removed from library." });
        } catch (e) {
            toast({ title: "Error", description: "Could not delete.", variant: "destructive" });
        }
    };

    const filteredByBed = selectedTestBedId === 'all'
        ? testCases
        : testCases.filter(tc => tc.testBedId === selectedTestBedId);

    const filteredData = filteredByBed.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const getPlatformIcon = (p: string) => {
        if (p.includes('Mobile')) return <Smartphone className="w-4 h-4 text-pink-500 dark:text-pink-400" />;
        if (p.includes('Web')) return <Monitor className="w-4 h-4 text-blue-500 dark:text-blue-400" />;
        return <Tv className="w-4 h-4 text-purple-500 dark:text-purple-400" />;
    };

    const getPriorityColor = (p: string) => {
        switch (p) {
            case 'High': return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20';
            case 'Medium': return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20';
            default: return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
        }
    };

    // --- Render: Main Page or Extraction Studio? ---
    if (isExtractionMode) {
        return (
            <div className="min-h-screen p-4 md:p-8 space-y-6 max-w-[1700px] mx-auto text-foreground">
                <div className="flex items-center justify-between border-b border-border/50 pb-4">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" onClick={() => setIsExtractionMode(false)}>
                            <ChevronLeft className="w-6 h-6" />
                        </Button>
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500">
                            PRD Extraction Studio
                        </h1>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-200px)]">
                    {/* Left: Input */}
                    <Card className="glass-panel flex flex-col h-full bg-card/60">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-foreground"><FileText className="w-5 h-5 text-primary" /> Requirements / PRD</CardTitle>
                            <CardDescription>Paste your User Stories, ACs, or Documentation here.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col gap-4">
                            <Textarea
                                className="flex-1 resize-none font-mono text-sm bg-background/50 focus:ring-primary/50 text-foreground"
                                placeholder="Example: As a user, I want to login with email and password so that I can access my dashboard. The system should validate email format..."
                                value={prdText}
                                onChange={(e) => setPrdText(e.target.value)}
                            />
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-foreground">Component / Feature Name (for AI context)</Label>
                                    <Input
                                        placeholder="e.g. Authentication, Shopping Cart..."
                                        value={newCase.title}
                                        onChange={(e) => setNewCase({ ...newCase, title: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-foreground">Target Test Bed</Label>
                                    <Select value={newCase.testBedId} onValueChange={(v) => setNewCase({ ...newCase, testBedId: v })}>
                                        <SelectTrigger className="bg-background border-input"><SelectValue placeholder="Select Bed for target" /></SelectTrigger>
                                        <SelectContent>
                                            {testBeds.map(bed => (
                                                <SelectItem key={bed.id} value={bed.id}>{bed.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <Button
                                onClick={runExtraction}
                                disabled={isGenerating || !prdText}
                                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg"
                            >
                                {isGenerating ? <Zap className="animate-spin mr-2" /> : <BrainCircuit className="mr-2" />}
                                Generate Intelligence
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Right: Output */}
                    <Card className="glass-panel flex flex-col h-full bg-card/60 overflow-hidden">
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle className="flex items-center gap-2 text-foreground"><Sparkles className="w-5 h-5 text-purple-500" /> Generated Scenarios</CardTitle>
                                    <CardDescription>Identified {extractedCases.length} potential test cases.</CardDescription>
                                </div>
                                {extractedCases.length > 0 && (
                                    <Button size="sm" onClick={saveAllExtracted} className="bg-green-600 hover:bg-green-700 text-white">
                                        Save All into Library
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-y-auto space-y-3 p-4 bg-muted/20">
                            {extractedCases.length === 0 && !isGenerating && (
                                <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
                                    <List className="w-12 h-12 mb-2" />
                                    <p>Awaiting Input Analysis...</p>
                                </div>
                            )}
                            {extractedCases.map((item, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="bg-card border border-border p-4 rounded-lg shadow-sm group hover:border-primary/40 transition-colors"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-semibold text-sm text-foreground">{item.title}</h4>
                                        <Badge variant="outline" className={`${getPriorityColor(item.priority)} text-[10px]`}>{item.priority}</Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground font-mono mb-2 whitespace-pre-wrap">{item.steps}</p>
                                    <div className="flex items-center gap-2 text-xs bg-green-500/10 text-green-700 dark:text-green-400 p-2 rounded border border-green-500/20">
                                        <CheckSquare className="w-3 h-3 shrink-0" />
                                        {item.expectedResult}
                                    </div>
                                </motion.div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-4 md:p-8 space-y-8 max-w-[1700px] mx-auto text-foreground">
            <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden bg-background">
                <div className="absolute top-[20%] left-[10%] w-[800px] h-[800px] bg-blue-500/5 dark:bg-blue-900/10 blur-[150px] rounded-full mix-blend-multiply dark:mix-blend-screen" />
                <div className="absolute bottom-[20%] right-[10%] w-[600px] h-[600px] bg-purple-500/5 dark:bg-indigo-900/10 blur-[150px] rounded-full mix-blend-multiply dark:mix-blend-screen" />
            </div>

            {/* Import Overlay Animation */}
            <AnimatePresence>
                {importAnimation && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center"
                    >
                        <div className="flex flex-col items-center gap-4">
                            <UploadCloud className="w-16 h-16 text-primary animate-bounce" />
                            <h2 className="text-2xl font-bold text-foreground">Importing Library...</h2>
                            <p className="text-muted-foreground">Parsing JSON and syncing with Cloud Database.</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Premium Header */}
            <div className="flex flex-col xl:flex-row justify-between items-end gap-6 border-b border-border/40 pb-8">
                <div>
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-3 mb-2"
                    >
                        <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/20 text-white">
                            <Library className="w-8 h-8" />
                        </div>
                        <h1 className="text-4xl font-extrabold tracking-tight text-foreground">
                            Master Library
                        </h1>
                    </motion.div>
                    <p className="text-muted-foreground text-lg ml-1">
                        Secure Repository of <span className="text-primary font-semibold">{testCases.length}</span> standardized test protocols.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
                    {/* TestBed Filter */}
                    <div className="flex items-center gap-2">
                        <Label className="text-xs font-bold uppercase text-muted-foreground whitespace-nowrap">Test Bed:</Label>
                        <Select value={selectedTestBedId} onValueChange={setSelectedTestBedId}>
                            <SelectTrigger className="w-[180px] h-9 bg-background"><SelectValue placeholder="All Beds" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Beds</SelectItem>
                                {testBeds.map(bed => (
                                    <SelectItem key={bed.id} value={bed.id}>{bed.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Dialog open={isAddBedDialogOpen} onOpenChange={setIsAddBedDialogOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="icon" className="h-9 w-9" title="Create New Test Bed">
                                    <Plus className="w-4 h-4" />
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>New Test Bed</DialogTitle>
                                    <DialogDescription>Create a collection for specific features or modules.</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label>Bed Name</Label>
                                        <Input placeholder="e.g. Core Auth, Sanity Suite" value={newBed.name} onChange={e => setNewBed({ ...newBed, name: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Description</Label>
                                        <Textarea placeholder="What does this test bed cover?" value={newBed.description} onChange={e => setNewBed({ ...newBed, description: e.target.value })} />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button onClick={handleCreateTestBed}>Create Bed</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>

                    {/* View Toggles */}
                    <div className="flex items-center bg-muted/50 p-1 rounded-lg border border-border hidden lg:flex">
                        <Button variant="ghost" size="icon" onClick={() => setViewMode('table')} className={`h-8 w-8 rounded-md ${viewMode === 'table' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'}`}>
                            <List className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setViewMode('grid')} className={`h-8 w-8 rounded-md ${viewMode === 'grid' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'}`}>
                            <LayoutGrid className="w-4 h-4" />
                        </Button>
                    </div>

                    {/* Import/Export */}
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".json" />
                    <Button variant="outline" size="sm" onClick={handleImportClick} className="gap-2 border-dashed border-border hover:border-primary hover:bg-primary/5">
                        <UploadCloud className="w-4 h-4" /> Import
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
                        <DownloadCloud className="w-4 h-4" /> Export
                    </Button>

                    {/* Generator Button (Opens Studio) */}
                    <Button variant="secondary" onClick={() => setIsExtractionMode(true)} className="gap-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50 border border-purple-200 dark:border-purple-800">
                        <Sparkles className="w-4 h-4" /> PRD Extraction Studio.
                    </Button>

                    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/25 h-10 px-6 font-medium">
                                <Plus className="w-4 h-4" /> New Protocol
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-background border-border max-w-4xl max-h-[90vh] overflow-y-auto sm:rounded-2xl shadow-2xl">
                            <DialogHeader>
                                <DialogTitle className="text-xl flex items-center gap-2 text-foreground">
                                    <FileCheck className="text-primary w-6 h-6" /> Create Master Protocol
                                </DialogTitle>
                                <DialogDescription className="text-muted-foreground">Define standard operating procedure for this test case.</DialogDescription>
                            </DialogHeader>
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 py-6 text-foreground">
                                <div className="md:col-span-5 space-y-5">
                                    <div className="space-y-2">
                                        <Label className="text-foreground">Protocol Title</Label>
                                        <Input className="bg-background border-input" placeholder="Verify Login..." value={newCase.title} onChange={e => setNewCase({ ...newCase, title: e.target.value })} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-foreground">Target Platform</Label>
                                            <Select value={newCase.platform} onValueChange={v => setNewCase({ ...newCase, platform: v })}>
                                                <SelectTrigger className="bg-background border-input"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Android TV">Android TV</SelectItem>
                                                    <SelectItem value="Apple TV">Apple TV</SelectItem>
                                                    <SelectItem value="Web">Web</SelectItem>
                                                    <SelectItem value="Mobile (iOS)">Mobile (iOS)</SelectItem>
                                                    <SelectItem value="Mobile (Android)">Mobile (Android)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-foreground">Priority</Label>
                                            <Select value={newCase.priority} onValueChange={v => setNewCase({ ...newCase, priority: v as any })}>
                                                <SelectTrigger className="bg-background border-input"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="High">High</SelectItem>
                                                    <SelectItem value="Medium">Medium</SelectItem>
                                                    <SelectItem value="Low">Low</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-foreground">Preconditions</Label>
                                        <Textarea className="bg-background border-input resize-none" placeholder="Specific state required..." value={newCase.preconditions} onChange={e => setNewCase({ ...newCase, preconditions: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-foreground">Tags</Label>
                                        <Input className="bg-background border-input" placeholder="sanity, auth" value={newCase.tags} onChange={e => setNewCase({ ...newCase, tags: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-foreground">Assign to Test Bed</Label>
                                        <Select value={newCase.testBedId} onValueChange={v => setNewCase({ ...newCase, testBedId: v })}>
                                            <SelectTrigger className="bg-background border-input"><SelectValue placeholder="Select Bed (Optional)" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">No Bed</SelectItem>
                                                {testBeds.map(bed => (
                                                    <SelectItem key={bed.id} value={bed.id}>{bed.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="md:col-span-7 space-y-5">
                                    <div className="space-y-2">
                                        <Label className="text-foreground">Execution Steps</Label>
                                        <Textarea placeholder="1. Launch App..." value={newCase.steps} onChange={e => setNewCase({ ...newCase, steps: e.target.value })} className="h-48 font-mono text-sm bg-background border-input p-4 leading-relaxed" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-green-600 dark:text-green-400 font-medium">Expected Outcome</Label>
                                        <Textarea placeholder="User should..." value={newCase.expectedResult} onChange={e => setNewCase({ ...newCase, expectedResult: e.target.value })} className="border-green-500/30 bg-green-500/5 text-foreground placeholder:text-muted-foreground" />
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={() => handleCreateTestCase(undefined)} className="w-full sm:w-auto">Save Protocol</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Content Area */}
            <AnimatePresence mode="wait">
                {viewMode === 'table' ? (
                    <motion.div
                        key="table"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                    >
                        <Card className="glass-panel border-border/50 bg-card/60">
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader className="bg-muted/30">
                                        <TableRow className="hover:bg-transparent border-border/50">
                                            <TableHead className="w-[60px] text-center">#</TableHead>
                                            <TableHead className="w-[350px]">Protocol Specification</TableHead>
                                            <TableHead>Environment</TableHead>
                                            <TableHead>Expected Behavior</TableHead>
                                            <TableHead>Priority</TableHead>
                                            <TableHead className="text-right">Manage</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loading ? (
                                            Array.from({ length: 5 }).map((_, i) => (
                                                <TableRow key={i}>
                                                    <TableCell colSpan={6}><div className="h-8 bg-muted animate-pulse rounded" /></TableCell>
                                                </TableRow>
                                            ))
                                        ) : filteredData.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="h-60 text-center text-muted-foreground">
                                                    Library is empty.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredData.map((item, index) => (
                                                <TableRow key={item.id} className="group hover:bg-muted/40 transition-colors border-border/50">
                                                    <TableCell className="text-center font-mono text-xs text-muted-foreground">
                                                        {String(index + 1).padStart(2, '0')}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col gap-1.5 py-2">
                                                            <span className="font-semibold text-foreground text-base">{item.title}</span>
                                                            <div className="flex gap-2">
                                                                {item.tags.length > 0 && item.tags.slice(0, 3).map((tag, i) => (
                                                                    <Badge key={i} variant="outline" className="text-[10px] px-1.5 h-5">
                                                                        {tag}
                                                                    </Badge>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2 text-sm text-foreground/80 bg-secondary/50 px-2 py-1 rounded w-fit border border-border">
                                                            {getPlatformIcon(item.platform)}
                                                            {item.platform}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-start gap-2 max-w-[350px]">
                                                            <CheckSquare className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                                                            <span className="text-sm text-muted-foreground line-clamp-2" title={item.expectedResult}>
                                                                {item.expectedResult || 'No outcome defined.'}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge className={`${getPriorityColor(item.priority)} px-3 py-0.5 font-medium border`}>
                                                            {item.priority}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                                                    <MoreHorizontal className="w-4 h-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem>Edit Protocol</DropdownMenuItem>
                                                                <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDelete(item.id)}>Archive Case</DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </motion.div>
                ) : (
                    <motion.div
                        key="grid"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                    >
                        {filteredData.map((item, i) => (
                            <Card key={item.id} className="glass-panel border-border bg-card/60 hover:border-primary/50 transition-all hover:shadow-xl group cursor-pointer hover:-translate-y-1">
                                <CardContent className="p-5 flex flex-col h-full gap-4">
                                    <div className="flex justify-between items-start">
                                        <div className="p-2 rounded-lg bg-secondary border border-border group-hover:bg-primary/10 group-hover:border-primary/20 transition-colors">
                                            {getPlatformIcon(item.platform)}
                                        </div>
                                        <Badge className={`${getPriorityColor(item.priority)} px-2 py-0 border text-[10px]`}>
                                            {item.priority}
                                        </Badge>
                                    </div>

                                    <div>
                                        <h3 className="font-bold text-foreground mb-1 line-clamp-1 group-hover:text-primary transition-colors">{item.title}</h3>
                                        <p className="text-xs text-muted-foreground line-clamp-2 h-8">{item.expectedResult || 'No description.'}</p>
                                    </div>

                                    <div className="mt-auto pt-4 border-t border-border flex justify-between items-center text-xs text-muted-foreground">
                                        <span>#{String(i + 1).padStart(3, '0')}</span>
                                        <span className="flex items-center gap-1 group-hover:text-primary transition-colors">View Details <ArrowRight className="w-3 h-3" /></span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
