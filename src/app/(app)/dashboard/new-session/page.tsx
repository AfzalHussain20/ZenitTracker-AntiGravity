"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import type { Platform, PlatformDetails, TestCase, TestSession } from '@/types';
import { db } from '@/lib/firebaseConfig';
import { doc, collection, setDoc, query, getDocs, orderBy } from 'firebase/firestore';
import {
  Loader2, UploadCloud, ChevronRight, CheckCircle2, Rocket,
  Tv, Smartphone, Monitor, Globe, Gamepad2, Laptop, Tablet, Box
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'framer-motion';

// --- Configuration ---
const platformOptions: Platform[] = [
  "Android TV", "Apple TV", "Fire TV", "LG TV", "Samsung TV", "Roku", "Web", "Mobile (Android)", "Mobile (iOS)", "Other"
];

const platformDetailsSchema = z.object({
  platformName: z.custom<Platform>(val => platformOptions.includes(val as Platform), { message: "Please select a valid platform" }),
  deviceModel: z.string().optional(),
  osVersion: z.string().optional(),
  appVersion: z.string().optional(),
  browserName: z.string().optional(),
  browserVersion: z.string().optional(),
  customPlatformName: z.string().optional(),
}).refine(data => data.platformName !== "Other" || (data.platformName === "Other" && data.customPlatformName && data.customPlatformName.trim() !== ''), {
  message: "Custom platform name is required if 'Other' is selected.",
  path: ["customPlatformName"],
});

type PlatformFormValues = z.infer<typeof platformDetailsSchema>;

// --- Components ---

// Reusable "Cute" Icon Component with Gradient
const GradientIcon = ({ icon: Icon, className }: { icon: any, className?: string }) => (
  <div className={`relative flex items-center justify-center p-4 rounded-2xl bg-gradient-to-tr from-indigo-50/50 to-purple-50/50 dark:from-indigo-900/10 dark:to-purple-900/10 group-hover:from-indigo-100 group-hover:to-purple-100 dark:group-hover:from-indigo-800/20 dark:group-hover:to-purple-800/20 transition-colors ${className}`}>
    <Icon strokeWidth={2} className="w-8 h-8 text-indigo-600 dark:text-indigo-400 drop-shadow-sm" />
  </div>
);

export default function NewTestSessionPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();

  const [isCreating, setIsCreating] = useState(false);
  const [isFileLoading, setIsFileLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<'platform' | 'import' | 'review'>('platform');
  const [platformData, setPlatformData] = useState<PlatformDetails | null>(null);
  const [importedCases, setImportedCases] = useState<TestCase[]>([]);
  const [testBeds, setTestBeds] = useState<any[]>([]);
  const [selectedTestBedId, setSelectedTestBedId] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [showLaunchAnimation, setShowLaunchAnimation] = useState(false);

  const { control, handleSubmit, watch, setValue } = useForm<PlatformFormValues>({
    resolver: zodResolver(platformDetailsSchema),
    defaultValues: { platformName: undefined }
  });

  const selectedPlatform = watch("platformName");

  const handlePlatformSubmit = (data: PlatformFormValues) => {
    setPlatformData(data);
    setCurrentStep('import');
    fetchTestBeds();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsFileLoading(true);
    setFileName(file.name);
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = e.target?.result;
        if (!data) return;
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];

        if (json.length < 2) {
          setIsFileLoading(false); return;
        }

        const headers = (json[0] || []).map(h => String(h).toLowerCase().trim().replace(/\s+/g, ' '));
        const testCaseIndex = headers.indexOf("test case");
        const testStepsIndex = headers.indexOf("test steps");
        const expectedResultIndex = headers.indexOf("expected result");

        if (testCaseIndex === -1 || testStepsIndex === -1 || expectedResultIndex === -1) {
          toast({ title: "Invalid Columns", description: "Need 'Test Case', 'Test Steps', 'Expected Result'.", variant: "destructive" });
          setIsFileLoading(false); return;
        }

        const cases: TestCase[] = json.slice(1).map((row, index) => ({
          id: `case-${Date.now()}-${index}`,
          orderIndex: index,
          testBed: 'N/A',
          testCaseTitle: row[testCaseIndex] || '',
          testSteps: row[testStepsIndex] || '',
          expectedResult: row[expectedResultIndex] || '',
          status: 'Untested' as const,
          lastModified: new Date(),
        })).filter(tc => tc.testCaseTitle);

        setImportedCases(cases);
        if (cases.length > 0) setCurrentStep('review');
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      toast({ title: "Error", description: "File parse error.", variant: "destructive" });
    } finally {
      setIsFileLoading(false);
      if (event.target) event.target.value = '';
    }
  };

  const fetchTestBeds = async () => {
    if (!user) return;
    try {
      const q = query(collection(db, 'testBeds'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const beds = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTestBeds(beds);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelectTestBed = async (bedId: string) => {
    setSelectedTestBedId(bedId);
    setIsFileLoading(true);
    try {
      // Fetch cases associated with this bed
      const q = query(collection(db, 'managedTestCases'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const allCases = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const bedCases = (allCases as any[]).filter(c => c.testBedId === bedId);

      const cases: TestCase[] = bedCases.map((tc, index) => ({
        id: tc.id,
        orderIndex: index,
        testBed: bedId,
        testCaseTitle: tc.title,
        testSteps: tc.steps,
        expectedResult: tc.expectedResult,
        status: 'Untested' as const,
        lastModified: new Date(),
      }));

      setImportedCases(cases);
      setFileName(testBeds.find(b => b.id === bedId)?.name || 'Test Bed');
      if (cases.length > 0) {
        setCurrentStep('review');
      } else {
        toast({ title: "Empty Bed", description: "No test cases found in this test bed.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to fetch bed cases.", variant: "destructive" });
    } finally {
      setIsFileLoading(false);
    }
  };

  const handleCreateSession = async () => {
    if (!user || !platformData || importedCases.length === 0) return;

    setShowLaunchAnimation(true);
    setIsCreating(true);

    try {
      await new Promise(r => setTimeout(r, 1500));
      const newSessionDocRef = doc(collection(db, 'testSessions'));
      const newSession: TestSession = {
        id: newSessionDocRef.id,
        userId: user.uid,
        userName: user.displayName || 'Anonymous User',
        platformDetails: platformData,
        status: 'In Progress',
        createdAt: new Date(),
        updatedAt: new Date(),
        summary: { total: importedCases.length, pass: 0, fail: 0, failKnown: 0, na: 0, untested: importedCases.length },
        testCases: importedCases,
      };
      await setDoc(newSessionDocRef, newSession);
      router.push(`/dashboard/session/${newSessionDocRef.id}`);
    } catch (error) {
      setShowLaunchAnimation(false);
      setIsCreating(false);
      toast({ title: "Failed", description: "Aborted launch.", variant: "destructive" });
    }
  };

  const getPlatformIcon = (p: string) => {
    switch (p) {
      case "Android TV": return Tv;
      case "Apple TV": return Monitor;
      case "Fire TV": return Box; // Lucide Box as 'Fire TV box' metaphor or just generic
      case "LG TV": return Tv;
      case "Samsung TV": return Tv;
      case "Roku": return Gamepad2; // often associated with remote/gaming
      case "Web": return Laptop;
      case "Mobile (Android)": return Smartphone;
      case "Mobile (iOS)": return Smartphone;
      default: return Globe;
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8 bg-background relative overflow-hidden font-sans">

      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-[20%] -right-[10%] w-[600px] h-[600px] bg-purple-100 dark:bg-purple-900/10 rounded-full blur-[100px]" />
        <div className="absolute -bottom-[20%] -left-[10%] w-[600px] h-[600px] bg-indigo-100 dark:bg-indigo-900/10 rounded-full blur-[100px]" />
      </div>

      {/* Launch Animation */}
      <AnimatePresence>
        {showLaunchAnimation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl flex flex-col items-center justify-center text-foreground"
          >
            <motion.div
              initial={{ scale: 0.5, y: 100 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: 'spring', bounce: 0.5 }}
              className="relative mb-8"
            >
              <Rocket className="w-24 h-24 text-primary animate-bounce-slow" />
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-24 h-6 bg-primary/20 blur-xl rounded-full" />
            </motion.div>
            <h2 className="text-2xl font-bold tracking-tight">Initiating Mission...</h2>
            <p className="text-muted-foreground mt-2">Preparing environment sequence</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-5xl z-10"
      >
        <div className="text-center mb-12 space-y-4">
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2 }}
            className="inline-flex p-4 rounded-full bg-white dark:bg-card shadow-lg shadow-purple-500/10 mb-2"
          >
            <Rocket className="w-8 h-8 text-primary" />
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
            {currentStep === 'platform' && 'Select Environment'}
            {currentStep === 'import' && 'Upload Mission Data'}
            {currentStep === 'review' && 'Ready for Launch'}
          </h1>
          <p className="text-lg text-muted-foreground uppercase tracking-widest font-medium text-xs">
            Phase {currentStep === 'platform' ? '1' : currentStep === 'import' ? '2' : '3'} of 3: Initialize Sequence
          </p>
        </div>

        <AnimatePresence mode="wait">
          {/* STEP 1: PLATFORM SELECTION */}
          {currentStep === 'platform' && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <form onSubmit={handleSubmit(handlePlatformSubmit)}>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                  {platformOptions.map((opt, i) => (
                    <motion.div
                      key={opt}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <div
                        onClick={() => setValue("platformName", opt)}
                        className={`
                                            group relative cursor-pointer flex flex-col items-center justify-center
                                            bg-card hover:bg-white dark:hover:bg-card/80
                                            border-2 rounded-[2rem] p-4 h-32
                                            transition-all duration-300 ease-out
                                            ${selectedPlatform === opt
                            ? 'border-primary shadow-xl shadow-primary/10 ring-4 ring-primary/10 scale-105'
                            : 'border-border/40 hover:border-primary/30 hover:shadow-lg shadow-sm'
                          }
                                        `}
                      >
                        <GradientIcon icon={getPlatformIcon(opt)} className="scale-75 mb-2" />
                        <span className={`
                                            mt-2 text-xs font-bold text-center
                                            ${selectedPlatform === opt ? 'text-primary' : 'text-foreground/80 group-hover:text-foreground'}
                                        `}>

                          {opt}
                        </span>

                        {/* Selection Checkmark */}
                        {selectedPlatform === opt && (
                          <div className="absolute top-4 right-4 text-primary">
                            <CheckCircle2 className="w-5 h-5 fill-primary text-white" />
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>

                {selectedPlatform && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="mt-12 w-full max-w-4xl mx-auto bg-card/40 backdrop-blur-sm border border-border/50 p-8 rounded-[2.5rem]"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase text-muted-foreground ml-2">App Version</Label>
                        <Input {...control.register("appVersion")} placeholder="v1.0.0" className="h-10 rounded-xl bg-background/50 border-transparent focus:bg-background focus:border-primary/50 transition-all font-medium text-sm" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase text-muted-foreground ml-2">Device Model</Label>
                        <Input {...control.register("deviceModel")} placeholder="e.g. Fire TV Stick 4K" className="h-10 rounded-xl bg-background/50 border-transparent focus:bg-background focus:border-primary/50 transition-all font-medium text-sm" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase text-muted-foreground ml-2">OS Version</Label>
                        <Input {...control.register("osVersion")} placeholder="e.g. Android 12" className="h-10 rounded-xl bg-background/50 border-transparent focus:bg-background focus:border-primary/50 transition-all font-medium text-sm" />
                      </div>
                      <div className="flex items-end">
                        <Button className="w-full h-10 rounded-xl text-sm font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform">
                          Next <ChevronRight className="ml-2 w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </form>
            </motion.div>
          )}

          {currentStep === 'import' && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto space-y-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Upload Section */}
                <Card className="rounded-[2.5rem] border-2 border-dashed border-muted-foreground/20 overflow-hidden bg-card/50 hover:bg-card transition-colors">
                  <CardContent className="p-12 flex flex-col items-center justify-center text-center space-y-6 cursor-pointer" onClick={() => document.getElementById('file-upload')?.click()}>
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <UploadCloud className="w-8 h-8 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold text-foreground">Upload Brief</h3>
                      <p className="text-muted-foreground text-sm">Use .xlsx mission file</p>
                    </div>
                    <Input id="file-upload" type="file" accept=".xlsx" onChange={handleFileChange} className="hidden" />
                    {isFileLoading && !selectedTestBedId && <Loader2 className="animate-spin text-primary w-6 h-6" />}
                  </CardContent>
                </Card>

                {/* Test Bed Section */}
                <Card className="rounded-[2.5rem] border-2 border-border/50 overflow-hidden bg-card/50">
                  <CardContent className="p-8 space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-500">
                        <Rocket className="w-5 h-5" />
                      </div>
                      <h3 className="text-xl font-bold text-foreground">Select Test Bed</h3>
                    </div>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                      {testBeds.length === 0 ? (
                        <p className="text-muted-foreground text-sm py-4">No test beds available in library.</p>
                      ) : (
                        testBeds.map(bed => (
                          <div
                            key={bed.id}
                            onClick={() => handleSelectTestBed(bed.id)}
                            className="p-4 rounded-2xl border border-border/50 bg-background/50 hover:bg-white dark:hover:bg-card hover:border-primary/30 transition-all cursor-pointer group"
                          >
                            <div className="flex justify-between items-center text-left">
                              <div>
                                <p className="font-bold text-sm group-hover:text-primary transition-colors">{bed.name}</p>
                                <p className="text-[10px] text-muted-foreground">{bed.description || 'No description'}</p>
                              </div>
                              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-all" />
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    {isFileLoading && selectedTestBedId && <Loader2 className="animate-spin text-primary w-6 h-6 mx-auto" />}
                  </CardContent>
                </Card>
              </div>
              <div className="mt-8 flex justify-center gap-4">
                <Button variant="ghost" className="rounded-full px-8" onClick={() => setCurrentStep('platform')}>Back</Button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: REVIEW */}
          {currentStep === 'review' && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="max-w-md mx-auto text-center space-y-8"
            >
              <div className="bg-card rounded-[2rem] p-8 border border-border shadow-xl">
                <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6 text-green-600">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-2">Systems Ready</h3>
                <p className="text-muted-foreground mb-6">
                  Prepared to sequence <strong className="text-foreground">{importedCases.length} protocols</strong> from <span className="underline decoration-muted-foreground/30">{fileName}</span>
                </p>
                <div className="grid grid-cols-2 gap-4 text-left bg-muted/30 p-4 rounded-xl mb-6">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Platform</p>
                    <p className="font-bold">{platformDetailsSchema.safeParse(platformData).success ? platformData?.platformName : 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Target</p>
                    <p className="font-bold">{platformData?.appVersion || 'Latest'}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Button
                  onClick={handleCreateSession}
                  disabled={isCreating}
                  className="w-full h-12 rounded-xl text-base font-bold bg-primary hover:bg-primary/90 shadow-xl shadow-primary/25 hover:scale-[1.02] transition-all"
                >
                  {isCreating ? <Loader2 className="animate-spin mr-2" /> : <Rocket className="mr-2 w-5 h-5" />}
                  Initiate Launch
                </Button>
                <Button variant="ghost" onClick={() => setCurrentStep('import')} className="rounded-full text-muted-foreground">Cancel</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
