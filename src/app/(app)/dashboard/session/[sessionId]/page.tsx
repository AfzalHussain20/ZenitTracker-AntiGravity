"use client";

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import type { TestSession, TestCase } from '@/types';
import { db } from '@/lib/firebaseConfig';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  CheckCircle2, XCircle, AlertOctagon, ChevronLeft, ChevronRight,
  Menu, PlayCircle, StopCircle, CornerDownRight, Bug, Ghost, Activity, Rocket
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { motion, AnimatePresence } from 'framer-motion';

const naReasonOptions = [
  "Feature not available in this region",
  "Environment configuration issue",
  "Feature temporarily disabled",
  "Device specific incompatibility",
  "Blocked by critical bug",
  "UI element not interactable",
  "Other",
];

const incompleteReasonOptions = [
  "Session paused",
  "Blocked by bug",
  "Time constraints",
  "Environment unavailable",
  "Other",
];

export default function TestSessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  const { user } = useAuth();
  const { toast } = useToast();

  const [session, setSession] = useState<TestSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showEntrance, setShowEntrance] = useState(true);

  // Modals
  const [failModalOpen, setFailModalOpen] = useState(false);
  const [naModalOpen, setNaModalOpen] = useState(false);
  const [completeModalOpen, setCompleteModalOpen] = useState(false);

  // Form States
  const [incompleteReason, setIncompleteReason] = useState('');
  const [bugId, setBugId] = useState('');
  const [bugDescription, setBugDescription] = useState('');
  const [naReason, setNaReason] = useState('');
  const [isKnownFail, setIsKnownFail] = useState(false);

  const [currentTestCaseIndex, setCurrentTestCaseIndex] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Default closed on mobile

  // Entrance Animation effect
  useEffect(() => {
    const timer = setTimeout(() => setShowEntrance(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  // Load Session
  useEffect(() => {
    if (!sessionId || !user) return;
    const fetchSessionData = async () => {
      setIsLoading(true);
      try {
        const sessionDocRef = doc(db, 'testSessions', sessionId);
        const sessionSnap = await getDoc(sessionDocRef);
        if (!sessionSnap.exists() || sessionSnap.data()?.userId !== user.uid) {
          router.replace('/dashboard'); return;
        }
        const data = sessionSnap.data();
        const sessionData = {
          id: sessionSnap.id, ...data,
          createdAt: (data.createdAt as Timestamp)?.toDate ? (data.createdAt as Timestamp).toDate() : new Date(),
          testCases: (data.testCases || []).map((tc: any) => ({
            ...tc,
            lastModified: (tc.lastModified as Timestamp)?.toDate ? (tc.lastModified as Timestamp).toDate() : new Date()
          }))
        } as TestSession;

        if (sessionData.status === 'Completed') {
          router.replace(`/dashboard/session/${sessionId}/results`); return;
        }
        setSession(sessionData);
        // Find first untested
        const firstUntested = sessionData.testCases.findIndex(tc => tc.status === 'Untested');
        setCurrentTestCaseIndex(firstUntested !== -1 ? firstUntested : 0);
      } catch (error) { toast({ title: "Error", description: "Failed to load session." }); } finally { setIsLoading(false); }
    };
    fetchSessionData();
  }, [sessionId, user, router, toast]);

  const currentTestCase = session?.testCases[currentTestCaseIndex];
  const untestedCasesCount = session?.testCases.filter(tc => tc.status === 'Untested').length || 0;

  const progressPercent = session ? Math.round(((session.testCases.length - untestedCasesCount) / session.testCases.length) * 100) : 0;

  // Sync Logic
  const handleUpdateSession = useCallback(async (updatedSessionData: Partial<TestSession>) => {
    try {
      const sanitizedData = JSON.parse(JSON.stringify(updatedSessionData));
      const sessionDocRef = doc(db, 'testSessions', sessionId);
      await updateDoc(sessionDocRef, sanitizedData);
      setSession(prev => {
        if (!prev) return null;
        return { ...prev, ...updatedSessionData, updatedAt: new Date() } as TestSession;
      });
    } catch (error) {
      console.error(error);
      toast({ title: "Save Error", description: "Cloud sync failed.", variant: "destructive" });
    }
  }, [sessionId, toast]);

  const handleCompleteSession = async (reason?: string) => {
    if (!session) return;
    const newStatus = untestedCasesCount > 0 ? 'Aborted' : 'Completed';
    await handleUpdateSession({
      status: newStatus,
      updatedAt: new Date(),
      completedAt: new Date(),
      reasonForIncompletion: reason || undefined
    });
    router.replace(`/dashboard/session/${sessionId}/results`);
  };

  const updateTestCaseStatus = async (baseStatus: 'Pass' | 'Fail' | 'N/A', details?: any) => {
    if (!session || !currentTestCase) return;
    const status: 'Pass' | 'Fail' | 'N/A' | 'Fail (Known)' = baseStatus === 'Fail' && details?.isKnown ? 'Fail (Known)' : baseStatus;

    const updatedTestCases = [...session.testCases];
    const updatedTestCase = {
      ...currentTestCase,
      status,
      lastModified: new Date(),
      bugId: details?.bugId || null,
      naReason: details?.naReason || null,
      notes: details?.bugDescription ? (currentTestCase.notes || '') + `\nBug: ${details.bugDescription}` : currentTestCase.notes,
      actualResult: status === 'Pass' ? currentTestCase.expectedResult : (currentTestCase.actualResult || '')
    };

    updatedTestCases[currentTestCaseIndex] = updatedTestCase;

    // Recalculate Summary
    const summary = {
      pass: updatedTestCases.filter(tc => tc.status === 'Pass').length,
      fail: updatedTestCases.filter(tc => tc.status === 'Fail').length,
      failKnown: updatedTestCases.filter(tc => tc.status === 'Fail (Known)').length,
      na: updatedTestCases.filter(tc => tc.status === 'N/A').length,
      untested: updatedTestCases.filter(tc => tc.status === 'Untested').length,
      total: updatedTestCases.length,
    };

    await handleUpdateSession({ testCases: updatedTestCases, summary, updatedAt: new Date() });

    // Auto-advance
    if (currentTestCaseIndex < session.testCases.length - 1) {
      setCurrentTestCaseIndex(currentTestCaseIndex + 1);
    } else {
      setCompleteModalOpen(true);
    }
    setFailModalOpen(false); setNaModalOpen(false); setBugId(''); setBugDescription(''); setIsKnownFail(false); setNaReason('');
  };

  const handleManualFieldChange = (field: keyof TestCase, value: string) => {
    if (!session || !currentTestCase) return;
    const updated = [...session.testCases];
    updated[currentTestCaseIndex] = { ...currentTestCase, [field]: value };
    setSession({ ...session, testCases: updated });
  };

  const saveCurrentCase = async () => {
    if (!session) return;
    await handleUpdateSession({ testCases: session.testCases });
  }

  if (!session || !currentTestCase) return null;

  return (
    <div className="flex bg-background text-foreground font-sans h-screen w-screen overflow-hidden">

      {/* ENTRANCE ANIMATION */}
      <AnimatePresence>
        {showEntrance && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1, filter: "blur(20px)" }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-3xl flex flex-col items-center justify-center text-foreground"
          >
            <motion.div
              initial={{ scale: 0.8, y: 50, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              transition={{ type: 'spring', damping: 20 }}
              className="flex flex-col items-center"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full animate-pulse" />
                <div className="relative p-8 rounded-full bg-background border border-border/50 shadow-2xl mb-8">
                  <Rocket className="w-16 h-16 text-primary animate-bounce-slow" />
                </div>
              </div>
              <h2 className="text-3xl font-black tracking-tighter uppercase mb-2 bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">
                System Initialization
              </h2>
              <p className="text-muted-foreground font-mono text-xs uppercase tracking-[0.2em] animate-pulse">
                Sequence: {session.id.substring(0, 8)}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LEFT SIDEBAR: MISSION LOG - PUSH MENU */}
      <motion.div
        initial={false}
        animate={{
          width: isSidebarOpen ? 320 : 0,
          opacity: isSidebarOpen ? 1 : 0
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="relative h-full shrink-0 bg-card border-r border-border overflow-hidden whitespace-nowrap"
      >
        <div className="p-4 h-16 border-b border-border flex items-center justify-between">
          <h2 className="font-bold text-lg">Mission Log</h2>
          <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(false)}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
        </div>
        <ScrollArea className="h-[calc(100vh-4rem)] bg-muted/10">
          <div className="p-3 space-y-2">
            {session.testCases.map((tc, idx) => (
              <div
                key={tc.id}
                onClick={() => { setCurrentTestCaseIndex(idx); setIsSidebarOpen(false); }}
                className={`
             group relative flex items-start gap-4 p-4 rounded-xl text-sm cursor-pointer border transition-all
             ${currentTestCaseIndex === idx
                    ? 'bg-background border-primary/50 shadow-md scale-[1.02] z-10'
                    : 'bg-card border-transparent hover:bg-card/80 hover:border-border/50 text-muted-foreground'
                  }
          `}
              >
                <div className={`mt-1 w-2.5 h-2.5 rounded-full shrink-0 ${tc.status === 'Pass' ? 'bg-green-500' : tc.status.includes('Fail') ? 'bg-red-500' : tc.status === 'N/A' ? 'bg-gray-400' : 'bg-muted-foreground/30'}`} />
                <div className="flex-1 min-w-0">
                  <p className={`font-medium leading-tight line-clamp-2 ${currentTestCaseIndex === idx ? 'text-foreground' : 'text-muted-foreground'}`}>{tc.testCaseTitle}</p>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground/60">#{idx + 1} • {tc.status}</span>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </motion.div>

      {/* MAIN SEQUENCER AREA - Takes full width minus sidebar if open? No, sidebar is overlay now for simplicity to ensure fit */}
      <div className="flex-1 flex flex-col h-full relative bg-muted/5 w-full">

        {/* HEADER */}
        <header className="h-16 border-b border-border bg-background/80 backdrop-blur-md flex items-center justify-between px-4 shrink-0 z-10">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(true)} className="rounded-full">
              <Menu className="w-5 h-5 text-foreground" />
            </Button>
            <div>
              <h1 className="font-bold text-lg leading-tight line-clamp-1">{session.platformDetails.platformName} Mission</h1>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono">
                {session.platformDetails.deviceModel && <span>{session.platformDetails.deviceModel}</span>}
                {session.platformDetails.osVersion && <span>• {session.platformDetails.osVersion}</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-[10px] uppercase font-bold text-muted-foreground">{untestedCasesCount} Steps Left</span>
              <Progress value={progressPercent} className="h-1.5 w-24 rounded-full bg-muted" />
            </div>
            <Button
              size="sm"
              variant={untestedCasesCount === 0 ? "default" : "secondary"}
              className="rounded-full px-4 font-bold text-xs"
              onClick={() => setCompleteModalOpen(true)}
            >
              {untestedCasesCount === 0 ? "Finish" : "Abort"}
            </Button>
          </div>
        </header>

        {/* WORKSPACE - FIXED HEIGHT SCROLLABLE IF NEEDED BUT TRY TO FIT */}
        <div className="flex-1 flex flex-col p-4 md:p-6 overflow-hidden relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentTestCase.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col h-full gap-4 pb-20" // pb-20 for footer space
            >
              {/* TITLE TAGS */}
              <div className="flex items-center gap-2 mb-1 shrink-0">
                <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-mono text-muted-foreground rounded-md">{currentTestCase.platform}</Badge>
                <Badge className={`text-[10px] h-5 px-1.5 border ${currentTestCase.priority === 'High' ? 'bg-red-500/10 text-red-600 border-red-200' : 'bg-blue-500/10 text-blue-600 border-blue-200'
                  }`}>{currentTestCase.priority}</Badge>
              </div>

              {/* TITLE */}
              <h2 className="text-xl md:text-2xl font-bold text-foreground leading-tight shrink-0 mb-2">
                {currentTestCase.testCaseTitle}
              </h2>

              {/* SPLIT VIEW INSTRUCTIONS & EXPECTED - USE FLEX-1 TO FILL SPACE */}
              <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0">
                {/* INSTRUCTIONS */}
                <Card className="flex-1 border border-border/60 shadow-sm bg-background/50 rounded-2xl flex flex-col min-h-0 overflow-hidden">
                  <div className="px-4 py-3 border-b bg-muted/20 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground shrink-0">
                    <CornerDownRight className="w-4 h-4" /> Steps
                  </div>
                  <CardContent className="p-4 overflow-y-auto flex-1 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                    {currentTestCase.testSteps}
                  </CardContent>
                </Card>

                {/* EXPECTED */}
                <Card className="flex-1 border border-green-500/20 shadow-sm bg-green-50/10 rounded-2xl flex flex-col min-h-0 overflow-hidden">
                  <div className="px-4 py-3 border-b border-green-500/10 bg-green-500/5 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-green-700 shrink-0">
                    <CheckCircle2 className="w-4 h-4" /> Expected
                  </div>
                  <CardContent className="p-4 overflow-y-auto flex-1 text-sm leading-relaxed whitespace-pre-wrap font-medium text-foreground/90">
                    {currentTestCase.expectedResult}
                  </CardContent>
                </Card>
              </div>

              {/* OBSERVATION - SMALLER HEIGHT AT BOTTOM */}
              <div className="shrink-0 h-24 md:h-32 mt-2">
                <Textarea
                  placeholder="Log observations..."
                  value={currentTestCase.actualResult || ''}
                  onChange={(e) => handleManualFieldChange('actualResult', e.target.value)}
                  onBlur={saveCurrentCase}
                  className="h-full rounded-2xl border-border bg-card resize-none shadow-sm focus:ring-1 focus:ring-primary/20 text-sm font-mono"
                />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* COMMAND DECK - FLOATING BOTTOM BAR */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[95%] max-w-xl bg-background/90 backdrop-blur-xl border border-border/50 shadow-2xl rounded-full p-2 flex items-center justify-between gap-2 z-30">

          {/* Prev */}
          <Button variant="ghost" size="icon" className="rounded-full w-10 h-10 text-muted-foreground hover:bg-muted shrink-0" onClick={() => setCurrentTestCaseIndex(Math.max(0, currentTestCaseIndex - 1))} disabled={currentTestCaseIndex === 0}>
            <ChevronLeft className="w-5 h-5" />
          </Button>

          <Separator orientation="vertical" className="h-6 bg-border/50" />

          {/* ACTION BUTTONS */}
          <div className="flex-1 flex items-center justify-center gap-2">
            <Dialog open={failModalOpen} onOpenChange={setFailModalOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive" className="flex-1 h-10 rounded-full font-bold text-sm shadow-lg shadow-red-500/20 max-w-[120px]">
                  <Bug className="w-3.5 h-3.5 mr-2" /> FAIL
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Report Defect</DialogTitle></DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="flex items-center space-x-2"><Checkbox id="known" checked={isKnownFail} onCheckedChange={(c) => setIsKnownFail(c as boolean)} /><Label htmlFor="known">Known Issue</Label></div>
                  <Input placeholder="Issue ID" value={bugId} onChange={(e) => setBugId(e.target.value)} />
                  <Textarea placeholder="Describe defect (required)..." value={bugDescription} onChange={(e) => setBugDescription(e.target.value)} />
                </div>
                <DialogFooter><Button variant="destructive" disabled={!bugDescription} onClick={() => updateTestCaseStatus('Fail', { bugId, bugDescription, isKnown: isKnownFail })}>Confirm Failure</Button></DialogFooter>
              </DialogContent>
            </Dialog>

            <Button onClick={() => updateTestCaseStatus('Pass')} className="flex-1 h-10 rounded-full font-bold text-sm bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/20 max-w-[120px]">
              <CheckCircle2 className="w-3.5 h-3.5 mr-2" /> PASS
            </Button>

            <Dialog open={naModalOpen} onOpenChange={setNaModalOpen}>
              <DialogTrigger asChild>
                <Button variant="secondary" className="w-10 h-10 rounded-full p-0 flex items-center justify-center border border-border text-muted-foreground" title="N/A">
                  <Ghost className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Mark N/A</DialogTitle></DialogHeader>
                <Select onValueChange={setNaReason}><SelectTrigger><SelectValue placeholder="Reason" /></SelectTrigger><SelectContent>{naReasonOptions.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select>
                <DialogFooter className="mt-4"><Button onClick={() => updateTestCaseStatus('N/A', { naReason })} disabled={!naReason}>Confirm</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Separator orientation="vertical" className="h-6 bg-border/50" />

          {/* Next */}
          <Button variant="ghost" size="icon" className="rounded-full w-10 h-10 text-muted-foreground hover:bg-muted shrink-0" onClick={() => setCurrentTestCaseIndex(Math.min(session.testCases.length - 1, currentTestCaseIndex + 1))} disabled={currentTestCaseIndex === session.testCases.length - 1}>
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        {/* COMPLETION DIALOG */}
        <Dialog open={completeModalOpen} onOpenChange={setCompleteModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{untestedCasesCount === 0 ? "Mission Complete" : "Abort Mission?"}</DialogTitle>
              <DialogDescription>{untestedCasesCount > 0 ? "The sequence isn't finished. Provide a reason to abort." : "All protocols executed. Ready to compile report."}</DialogDescription>
            </DialogHeader>
            {untestedCasesCount > 0 && (
              <Select onValueChange={setIncompleteReason}><SelectTrigger><SelectValue placeholder="Reason..." /></SelectTrigger><SelectContent>{incompleteReasonOptions.map(r => (<SelectItem key={r} value={r}>{r}</SelectItem>))}</SelectContent></Select>
            )}
            <DialogFooter><Button onClick={() => handleCompleteSession(incompleteReason)}>Generate Report</Button></DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}
