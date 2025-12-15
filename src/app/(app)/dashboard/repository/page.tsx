
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebaseConfig';
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { Library, Loader2, PlusCircle, Wand2, FlaskConical, Copy, ArrowLeft, FileUp } from 'lucide-react';
import type { ManagedTestCase } from '@/types';
import { Button } from '@/components/ui/button';
import { RepositoryDataTable } from './_components/repository-data-table';
import { columns } from './_components/repository-columns';
import { TestCaseModal } from './_components/repository-modal';
import { AIGeneratorModal } from './_components/ai-generator-modal';
import { useToast } from '@/hooks/use-toast';
import { performLocatorGeneration } from './_actions/generate-locators';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useRouter } from 'next/navigation';
import PRDExtractor from './_components/PRDExtractor';

export default function RepositoryPage() {
    const { user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [testCases, setTestCases] = useState<ManagedTestCase[]>([]);
    const [loading, setLoading] = useState(true);
    const [isManualModalOpen, setIsManualModalOpen] = useState(false);
    const [isAIModalOpen, setIsAIModalOpen] = useState(false);
    const [isPRDModalOpen, setIsPRDModalOpen] = useState(false);
    const [selectedTestCase, setSelectedTestCase] = useState<ManagedTestCase | null>(null);

    const [isGeneratingLocators, setIsGeneratingLocators] = useState(false);
    const [locatorResults, setLocatorResults] = useState<Record<string, string> | null>(null);
    const [isLocatorModalOpen, setIsLocatorModalOpen] = useState(false);


    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        setLoading(true);
        const q = query(collection(db, "managedTestCases"), orderBy("updatedAt", "desc"));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const cases = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    createdAt: (data.createdAt as Timestamp)?.toDate ? (data.createdAt as Timestamp).toDate() : new Date(),
                    updatedAt: (data.updatedAt as Timestamp)?.toDate ? (data.updatedAt as Timestamp).toDate() : new Date(),
                } as ManagedTestCase;
            });
            setTestCases(cases);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching managed test cases:", error);
            if (error.code === 'permission-denied') {
                 toast({
                    title: "Permission Denied",
                    description: "You do not have permission to view the test repository. Check Firestore security rules.",
                    variant: "destructive",
                    duration: 7000,
                });
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, toast]);

    const handleOpenManualModal = (testCase: ManagedTestCase | null = null) => {
        setSelectedTestCase(testCase);
        setIsManualModalOpen(true);
    };

    const handleCloseManualModal = () => {
        setIsManualModalOpen(false);
        setSelectedTestCase(null);
    };

    const handleAddMultipleCases = async (cases: Omit<ManagedTestCase, 'id' | 'createdAt' | 'updatedAt' | 'lastUpdatedBy' | 'lastUpdatedByUid'>[]) => {
        if (!user) return;
        try {
            const collectionRef = collection(db, "managedTestCases");
            for (const caseData of cases) {
                await addDoc(collectionRef, {
                    ...caseData,
                    lastUpdatedBy: user.displayName || 'AI Assistant',
                    lastUpdatedByUid: user.uid,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                });
            }
            toast({
                title: "Success!",
                description: `${cases.length} test cases have been generated and added to the repository.`,
            });
        } catch (error) {
            console.error("Error batch-adding test cases:", error);
            toast({
                title: "Error",
                description: "Could not add the generated test cases.",
                variant: "destructive",
            });
        }
    };

    const handleGenerateLocators = async () => {
        setIsGeneratingLocators(true);
        setLocatorResults(null);
        const result = await performLocatorGeneration();

        if (result.error) {
            toast({ title: "Generation Failed", description: result.error, variant: "destructive" });
        } else if (result.locators && result.count > 0) {
            setLocatorResults(result.locators);
            setIsLocatorModalOpen(true);
            toast({ title: "Generation Complete", description: `Generated ${Object.keys(result.locators).length} locators.` });
        } else {
            toast({ title: "No Test Cases", description: "No test cases were found to generate locators from.", variant: "default" });
        }

        setIsGeneratingLocators(false);
    };

    const handleCopyLocator = (locator: string) => {
        navigator.clipboard.writeText(locator);
        toast({ description: "Locator copied to clipboard!" });
    }
    
    const handleExtractionComplete = (count: number) => {
        // This will trigger a re-fetch of the data table due to the onSnapshot listener
        setIsPRDModalOpen(false);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[calc(100vh-20rem)]">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="ml-4">Loading Test Repository...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                 <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => router.push('/dashboard')}>
                       <ArrowLeft />
                       <span className="sr-only">Back to Dashboard</span>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-headline font-bold text-foreground flex items-center gap-3">
                            <Library className="h-8 w-8 text-primary"/> Test Case Repository
                        </h1>
                        <p className="text-muted-foreground">A central place to create, manage, and track all test cases.</p>
                    </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                     <Button onClick={() => setIsPRDModalOpen(true)} variant="outline">
                        <FileUp className="mr-2 h-4 w-4" />
                        Extract from PRD
                    </Button>
                    <Button onClick={() => setIsAIModalOpen(true)} variant="outline">
                        <Wand2 className="mr-2 h-4 w-4" />
                        Generate with AI
                    </Button>
                    <Button onClick={() => handleOpenManualModal()}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        New Test Case
                    </Button>
                </div>
            </div>

            <RepositoryDataTable columns={columns({ onEdit: handleOpenManualModal })} data={testCases} />

            {isManualModalOpen && (
                <TestCaseModal
                    isOpen={isManualModalOpen}
                    onClose={handleCloseManualModal}
                    testCase={selectedTestCase}
                />
            )}

            <AIGeneratorModal 
                isOpen={isAIModalOpen}
                onClose={() => setIsAIModalOpen(false)}
                onGenerate={handleAddMultipleCases}
            />

            <Dialog open={isPRDModalOpen} onOpenChange={setIsPRDModalOpen}>
                <DialogContent className="max-w-2xl">
                    <PRDExtractor repoId="default-repo" userEmail={user?.email} onExtractionComplete={handleExtractionComplete} />
                </DialogContent>
            </Dialog>

             <Dialog open={isLocatorModalOpen} onOpenChange={setIsLocatorModalOpen}>
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2"><FlaskConical/> Generated Locators</DialogTitle>
                        <DialogDescription>
                            Unique automation tags have been generated for each test case.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                       {locatorResults && Object.keys(locatorResults).length > 0 ? (
                            <ScrollArea className="h-96">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Test Case ID</TableHead>
                                            <TableHead>Generated Locator</TableHead>
                                            <TableHead className="text-right">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {Object.entries(locatorResults).map(([id, locator]) => (
                                            <TableRow key={id}>
                                                <TableCell className="font-mono text-xs">{id}</TableCell>
                                                <TableCell className="font-mono text-primary">{locator}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="icon" onClick={() => handleCopyLocator(locator)}>
                                                        <Copy className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </ScrollArea>
                        ) : (
                            <p className="text-muted-foreground text-center">No locators were generated.</p>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

        </div>
    );
}
