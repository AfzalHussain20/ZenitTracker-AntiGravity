
"use client";

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import type { TestSession, TestCase, TestCaseStatus } from '@/types';
import { db } from '@/lib/firebaseConfig';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, XCircle, AlertCircle, FileText, ChevronLeft, ChevronRight, Save, Rocket, Edit3, Clock, Flag, AlertTriangle, ExternalLink } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { format, formatDistanceToNow } from 'date-fns';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

const RocketProgress = ({ current, total }: { current: number, total: number }) => {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
  return (
    <div className="flex items-center space-x-3 my-4 p-4 bg-card rounded-lg shadow">
      <Rocket className="h-10 w-10 text-primary animate-pulse" />
      <div className="flex-1">
        <div className="flex justify-between mb-1">
          <span className="text-sm font-medium text-primary">Session Progress</span>
          <span className="text-sm font-medium text-primary">{percentage}%</span>
        </div>
        <Progress value={percentage} className="w-full h-3" />
        <p className="text-xs text-muted-foreground mt-1">{current} of {total} test cases actioned</p>
      </div>
    </div>
  );
};

const naReasonOptions = [
  "Feature not available in this region/plan",
  "Content not available for this profile/device",
  "Test environment configuration issue",
  "Feature temporarily disabled by backend",
  "Test case deprecated or obsolete",
  "Blocked by an unresolved critical bug",
  "Device/OS specific incompatibility not covered by scope",
  "Network conditions prevent testing this case",
  "Prerequisite test case failed",
  "Data issue specific to this test account",
  "UI element not interactable or missing",
  "App crash or ANR (Application Not Responding)",
  "Other (Please specify in notes section)",
];

const incompleteReasonOptions = [
    "Session paused, will resume later",
    "Blocked by a critical bug",
    "Test environment unavailable",
    "Leaving early for the day",
    "Reached end of scheduled testing time",
    "Other (Please specify in notes)",
];

export default function TestSessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  const { user } = useAuth();
  const { toast } = useToast();

  const [session, setSession] = useState<TestSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);

  // Modal states
  const [failModalOpen, setFailModalOpen] = useState(false);
  const [naModalOpen, setNaModalOpen] = useState(false);
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [incompleteReason, setIncompleteReason] = useState('');
  
  // Form fields for modals
  const [bugId, setBugId] = useState('');
  const [bugDescription, setBugDescription] = useState('');
  const [naReason, setNaReason] = useState('');
  const [isKnownFail, setIsKnownFail] = useState(false);
  
  // Local state for inline editing and navigation
  const [currentTestCaseIndex, setCurrentTestCaseIndex] = useState(0);
  const [editingNotes, setEditingNotes] = useState(false);
  const [editingActualResult, setEditingActualResult] = useState(false);

  useEffect(() => {
    if (!sessionId || !user) return;

    const fetchSessionData = async () => {
      setIsLoading(true);
      setLoadingError(null);
      try {
        const sessionDocRef = doc(db, 'testSessions', sessionId);
        const sessionSnap = await getDoc(sessionDocRef);

        if (!sessionSnap.exists() || sessionSnap.data()?.userId !== user.uid) {
          toast({ title: "Error", description: "Test session not found or access denied.", variant: "destructive" });
          router.push('/dashboard');
          return;
        }
        
        const data = sessionSnap.data();
        const sessionData = { 
            id: sessionSnap.id, 
            ...data,
            // Ensure all date fields are JS Date objects
            createdAt: (data.createdAt as Timestamp)?.toDate ? (data.createdAt as Timestamp).toDate() : new Date(),
            testCases: (data.testCases || []).map((tc: any) => ({
              ...tc,
              lastModified: (tc.lastModified as Timestamp)?.toDate ? (tc.lastModified as Timestamp).toDate() : new Date()
            }))
        } as TestSession;


        if (sessionData.status === 'Completed') {
             toast({ title: "Session Completed", description: "This session is finished and cannot be modified. Viewing results instead.", variant: "default" });
             router.push(`/dashboard/session/${sessionId}/results`);
             return;
        }

        setSession(sessionData);

        const firstUntestedIndex = sessionData.testCases.findIndex(tc => tc.status === 'Untested');
        setCurrentTestCaseIndex(firstUntestedIndex !== -1 ? firstUntestedIndex : 0);

      } catch (error: any) {
        console.error("Error fetching session data:", error);
        setLoadingError("Could not load test session. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchSessionData();
  }, [sessionId, user, router, toast]);

  const currentTestCase = session?.testCases[currentTestCaseIndex];
  const untestedCasesCount = session?.testCases.filter(tc => tc.status === 'Untested').length || 0;

  const handleUpdateSession = useCallback(async (updatedSessionData: Partial<TestSession>) => {
      try {
          const sessionDocRef = doc(db, 'testSessions', sessionId);
          await updateDoc(sessionDocRef, updatedSessionData);

          // Optimistically update local state.
          // Note: server timestamps won't be reflected immediately but will be correct on next fetch.
          setSession(prev => {
              if (!prev) return null;
              const newSession = {...prev, ...updatedSessionData, updatedAt: new Date() };
              if (updatedSessionData.testCases) {
                newSession.testCases = updatedSessionData.testCases.map(tc => ({
                    ...tc,
                    lastModified: (tc.lastModified as any)?.toDate ? (tc.lastModified as any).toDate() : new Date()
                }))
              }
              return newSession;
          });

      } catch (error) {
          console.error("Error updating session:", error);
          toast({ title: "Save Error", description: `Could not update session data.`, variant: "destructive" });
      }
  }, [sessionId, toast]);

  const handleCompleteSession = async (reason?: string) => {
    if (!session) return;
    setIsSaving(true);
    
    try {
        if (untestedCasesCount > 0 && !reason) {
            toast({ title: "Reason Required", description: "Please provide a reason for ending an incomplete session.", variant: "destructive" });
            setIsSaving(false);
            return;
        }

        const newStatus = untestedCasesCount > 0 ? 'Aborted' : 'Completed';
        
        const sessionUpdate: Partial<TestSession> = {
            status: newStatus,
            updatedAt: new Date(),
            completedAt: new Date(),
        };

        if (newStatus === 'Aborted') {
            sessionUpdate.reasonForIncompletion = reason;
        }
        
        await handleUpdateSession(sessionUpdate);

        toast({ title: "Session Saved!", description: `The session has been marked as ${newStatus}.` });
        router.push(`/dashboard/session/${sessionId}/results`);
    } catch(error) {
        console.error("Error completing session:", error);
        toast({ title: "Error", description: "Could not save the session.", variant: "destructive" });
    } finally {
        setIsSaving(false);
    }
  };

  const updateTestCaseStatus = async (baseStatus: 'Pass' | 'Fail' | 'N/A', details?: { bugId?: string; bugDescription?: string; naReason?: string; isKnown?: boolean }) => {
    if (!session || !currentTestCase) return;
    setIsSaving(true);
    
    let status: TestCaseStatus = baseStatus;
    if (baseStatus === 'Fail') {
      status = details?.isKnown ? 'Fail (Known)' : 'Fail';
    }

    const updatedTestCases = [...session.testCases];
    const updatedTestCase: TestCase = { 
        ...currentTestCase, 
        status, 
        lastModified: new Date()
    };

    if (status === 'Pass') {
      updatedTestCase.actualResult = updatedTestCase.actualResult || updatedTestCase.expectedResult || '';
    }
    
    if (status === 'Fail' || status === 'Fail (Known)') {
      updatedTestCase.bugId = details?.bugId || '';
      if (details?.bugDescription) {
        const currentNotes = updatedTestCase.notes || '';
        updatedTestCase.notes = `${currentNotes}\nBug Description: ${details.bugDescription}`.trim();
      }
    }
    if (status === 'N/A' && details) {
      updatedTestCase.naReason = details.naReason || '';
    }

    updatedTestCases[currentTestCaseIndex] = updatedTestCase;
    
    const summary = {
        pass: updatedTestCases.filter(tc => tc.status === 'Pass').length,
        fail: updatedTestCases.filter(tc => tc.status === 'Fail').length,
        failKnown: updatedTestCases.filter(tc => tc.status === 'Fail (Known)').length,
        na: updatedTestCases.filter(tc => tc.status === 'N/A').length,
        untested: updatedTestCases.filter(tc => tc.status === 'Untested').length,
        total: updatedTestCases.length,
    };
    
    const updatedSessionData: Partial<TestSession> = {
        testCases: updatedTestCases,
        summary,
        status: session.status === 'Aborted' ? 'In Progress' : session.status,
        updatedAt: new Date(),
    };
    
    await handleUpdateSession(updatedSessionData);
    
    if (currentTestCaseIndex < session.testCases.length - 1) {
      setCurrentTestCaseIndex(currentTestCaseIndex + 1);
    } else {
      toast({ title: "All Done!", description: "You've reviewed all test cases. Click 'Complete Session' to finish." });
    }

    setIsSaving(false);
    setFailModalOpen(false);
    setNaModalOpen(false);
    setBugId('');
    setBugDescription('');
    setNaReason('');
    setIsKnownFail(false);
  };
  
  const handleFieldChange = (field: keyof TestCase, value: string) => {
    if (!session || !currentTestCase) return;
    
    const updatedTestCases = [...session.testCases];
    updatedTestCases[currentTestCaseIndex] = { ...currentTestCase, [field]: value };
    
    setSession({ ...session, testCases: updatedTestCases });
  };

  const saveNotesAndActualResult = async () => {
    if (!session || !currentTestCase) return;
    setIsSaving(true);
    
    const updatedTestCases = [...session.testCases];
    updatedTestCases[currentTestCaseIndex] = { 
        ...currentTestCase, 
        lastModified: new Date()
    };

    const updatedSessionData = { testCases: updatedTestCases, updatedAt: new Date() };
    await handleUpdateSession(updatedSessionData);

    toast({ title: "Saved", description: "Notes and actual results updated." });
    setEditingNotes(false);
    setEditingActualResult(false);
    setIsSaving(false);
  }


  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  if (loadingError) {
    return (
        <Alert variant="destructive" className="max-w-2xl mx-auto">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error Loading Session Data</AlertTitle>
            <AlertDescription>
                <p>{loadingError}</p>
            </AlertDescription>
        </Alert>
    );
  }

  if (!session || !currentTestCase) {
    return <div className="text-center py-10 text-muted-foreground">Test session or test case not found.</div>;
  }

  const actionedCases = session.testCases.filter(tc => tc.status !== 'Untested').length;

  return (
    <>
      <TooltipProvider>
      <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex justify-between items-center">
              <Card className="flex-grow">
                <CardHeader>
                  <CardTitle className="text-2xl font-headline">Testing: {session.platformDetails.platformName}</CardTitle>
                  <CardDescription>
                    {session.platformDetails.deviceModel && `${session.platformDetails.deviceModel} | `} 
                    {session.platformDetails.osVersion && `OS: ${session.platformDetails.osVersion} | `} 
                    {session.platformDetails.appVersion && `App: ${session.platformDetails.appVersion}`}
                    {session.platformDetails.browserName && `Browser: ${session.platformDetails.browserName} ${session.platformDetails.browserVersion || ''}`}
                    {session.platformDetails.customPlatformName && `Platform: ${session.platformDetails.customPlatformName}`}
                  </CardDescription>
                </CardHeader>
              </Card>
               <Dialog open={completeModalOpen} onOpenChange={setCompleteModalOpen}>
                  <DialogTrigger asChild>
                      <Button size="lg" className="ml-6 h-full text-lg">
                          <Flag className="mr-2" /> Complete Session
                      </Button>
                  </DialogTrigger>
                  <DialogContent>
                      <DialogHeader>
                          <DialogTitle>Complete Testing Session</DialogTitle>
                          <DialogDescription>
                              {untestedCasesCount > 0 
                              ? `You have ${untestedCasesCount} untested case(s). Please provide a reason for stopping early.`
                              : "You have actioned all test cases. Ready to complete this session?"}
                          </DialogDescription>
                      </DialogHeader>
                      {untestedCasesCount > 0 && (
                          <div className="py-4">
                              <Label htmlFor="incompleteReason">Reason</Label>
                              <Select onValueChange={setIncompleteReason} value={incompleteReason}>
                                  <SelectTrigger id="incompleteReason"><SelectValue placeholder="Select a reason..." /></SelectTrigger>
                                  <SelectContent>{incompleteReasonOptions.map(r => (<SelectItem key={r} value={r}>{r}</SelectItem>))}</SelectContent>
                              </Select>
                          </div>
                      )}
                      <DialogFooter>
                          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                          <Button 
                              onClick={() => handleCompleteSession(incompleteReason)} 
                              disabled={isSaving || (untestedCasesCount > 0 && !incompleteReason)}
                          >
                              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                              {untestedCasesCount > 0 ? "Submit as Aborted" : "Submit as Completed"}
                          </Button>
                      </DialogFooter>
                  </DialogContent>
              </Dialog>
          </div>


          <RocketProgress current={actionedCases} total={session.testCases.length} />

          <Card className="shadow-lg">
            <CardHeader className="flex flex-row justify-between items-start">
                <div>
                    <CardTitle className="flex items-center">
                        <FileText className="mr-3 h-6 w-6 text-primary" />
                        Test Case {currentTestCase.orderIndex + 1} of {session.testCases.length}
                    </CardTitle>
                    <CardDescription className="mt-1 ml-9">{currentTestCase.testCaseTitle}</CardDescription>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <Badge variant={
                        currentTestCase.status === 'Pass' ? 'default' : 
                        currentTestCase.status === 'Fail' ? 'destructive' :
                        currentTestCase.status === 'Fail (Known)' ? 'destructive' :
                        currentTestCase.status === 'N/A' ? 'secondary' : 'outline'
                    } className="text-sm px-3 py-1">
                        {currentTestCase.status === 'Fail (Known)' ? 'Fail (Known)' : currentTestCase.status}
                    </Badge>
                    {currentTestCase.status !== 'Untested' && (
                      <Tooltip>
                        <TooltipTrigger>
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Clock className="mr-1 h-3 w-3" />
                            {formatDistanceToNow(new Date(currentTestCase.lastModified), { addSuffix: true })}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Last Modified: {format(new Date(currentTestCase.lastModified), "PPP p")}</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentTestCase.testBed && currentTestCase.testBed !== "N/A" && (
                <div>
                  <Label className="font-semibold text-sm">Test Bed</Label>
                  <p className="text-sm text-muted-foreground p-2 bg-muted/50 rounded-md">{currentTestCase.testBed}</p>
                </div>
              )}
              <div>
                <Label className="font-semibold text-sm">Test Steps</Label>
                <div className="text-sm text-foreground p-3 bg-muted/50 rounded-md whitespace-pre-wrap min-h-[60px]">{currentTestCase.testSteps}</div>
              </div>
              <div>
                <Label className="font-semibold text-sm">Expected Result</Label>
                <div className="text-sm text-foreground p-3 bg-muted/50 rounded-md whitespace-pre-wrap min-h-[40px]">{currentTestCase.expectedResult}</div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <Label htmlFor="actualResult" className="font-semibold text-sm">Actual Result</Label>
                  {!editingActualResult && (<Button variant="ghost" size="sm" onClick={() => setEditingActualResult(true)}><Edit3 className="mr-1 h-3 w-3" /> Edit</Button>)}
                </div>
                {editingActualResult ? (
                  <Textarea id="actualResult" value={currentTestCase.actualResult || ''} onChange={(e) => handleFieldChange('actualResult', e.target.value)} placeholder="Describe what actually happened..."/>
                ) : (
                  <div onClick={() => setEditingActualResult(true)} className="text-sm text-foreground p-3 bg-muted/50 rounded-md whitespace-pre-wrap min-h-[40px] cursor-text">
                    {currentTestCase.actualResult || <span className="text-muted-foreground italic">Click to add actual result...</span>}
                  </div>
                )}
              </div>
              
              <div>
                 <div className="flex justify-between items-center mb-1">
                    <Label htmlFor="notes" className="font-semibold text-sm">Notes</Label>
                    {!editingNotes && (<Button variant="ghost" size="sm" onClick={() => setEditingNotes(true)}><Edit3 className="mr-1 h-3 w-3" /> Edit</Button>)}
                 </div>
                 {editingNotes ? (
                    <Textarea id="notes" value={currentTestCase.notes || ''} onChange={(e) => handleFieldChange('notes', e.target.value)} placeholder="Add any relevant notes..."/>
                 ) : (
                    <div onClick={() => setEditingNotes(true)} className="text-sm text-foreground p-3 bg-muted/50 rounded-md whitespace-pre-wrap min-h-[40px] cursor-text">
                        {currentTestCase.notes || <span className="text-muted-foreground italic">Click to add notes...</span>}
                    </div>
                 )}
              </div>
              {(editingNotes || editingActualResult) && (
                <Button onClick={saveNotesAndActualResult} disabled={isSaving} size="sm" className="mt-2">
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save Details
                </Button>
              )}

            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6">
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setCurrentTestCaseIndex(prev => Math.max(0, prev - 1))} disabled={currentTestCaseIndex === 0 || isSaving}><ChevronLeft /> Previous</Button>
                <Button variant="outline" onClick={() => setCurrentTestCaseIndex(prev => Math.min(session.testCases.length - 1, prev + 1))} disabled={currentTestCaseIndex === session.testCases.length - 1 || isSaving}>Next <ChevronRight /></Button>
              </div>
              <div className="flex gap-2 flex-wrap justify-center sm:justify-end">
                <Button onClick={() => updateTestCaseStatus('Pass')} className="bg-green-600 hover:bg-green-700 text-white" disabled={isSaving}><CheckCircle className="mr-2"/> Pass</Button>
                
                <Dialog open={failModalOpen} onOpenChange={setFailModalOpen}>
                  <DialogTrigger asChild><Button variant="destructive" disabled={isSaving}><XCircle className="mr-2"/> Fail</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Log Failure Details</DialogTitle>
                      <DialogDescription>Provide Bug ID and select if this is a known issue.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                       <div className="flex items-center space-x-2">
                          <Checkbox id="known-fail" checked={isKnownFail} onCheckedChange={(checked) => setIsKnownFail(checked as boolean)} />
                          <Label htmlFor="known-fail" className="text-sm font-medium leading-none">This is a known, existing bug.</Label>
                       </div>
                      <div>
                        <Label htmlFor="bugId">Bug ID (Optional)</Label>
                        <Input id="bugId" value={bugId} onChange={(e) => setBugId(e.target.value)} placeholder="e.g., ZEN-1234" />
                      </div>
                      <div>
                        <Label htmlFor="bugDescription">Bug Description (Optional)</Label>
                        <Textarea id="bugDescription" value={bugDescription} onChange={(e) => setBugDescription(e.target.value)} placeholder="Briefly describe the bug..."/>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setFailModalOpen(false)}>Cancel</Button>
                      <Button onClick={() => updateTestCaseStatus('Fail', { bugId, bugDescription, isKnown: isKnownFail })} disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Submit Fail
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Dialog open={naModalOpen} onOpenChange={setNaModalOpen}>
                  <DialogTrigger asChild><Button variant="secondary" disabled={isSaving}><AlertCircle className="mr-2"/> N/A</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Mark as N/A</DialogTitle><DialogDescription>Provide a reason why this test case is Not Applicable.</DialogDescription></DialogHeader>
                    <div className="py-2"><Select onValueChange={setNaReason} value={naReason}><SelectTrigger><SelectValue placeholder="Select a reason" /></SelectTrigger><SelectContent>{naReasonOptions.map(r => (<SelectItem key={r} value={r}>{r}</SelectItem>))}</SelectContent></Select></div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setNaModalOpen(false)}>Cancel</Button>
                      <Button onClick={() => updateTestCaseStatus('N/A', { naReason })} disabled={isSaving || !naReason}>{isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Submit N/A</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardFooter>
          </Card>
        </div>
      </TooltipProvider>
    </>
  );
}
