"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import type { Platform, PlatformDetails, TestCase, TestSession } from '@/types';
import { db } from '@/lib/firebaseConfig';
import { doc, collection, setDoc } from 'firebase/firestore';
import { Loader2, UploadCloud, FileText, ListChecks } from 'lucide-react';
import * as XLSX from 'xlsx';

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

export default function NewTestSessionPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();

  const [isCreating, setIsCreating] = useState(false);
  const [isFileLoading, setIsFileLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<'platform' | 'import' | 'review'>('platform');
  const [platformData, setPlatformData] = useState<PlatformDetails | null>(null);
  const [importedCases, setImportedCases] = useState<TestCase[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);

  const { control, handleSubmit, watch, formState: { errors } } = useForm<PlatformFormValues>({
    resolver: zodResolver(platformDetailsSchema),
    defaultValues: { platformName: undefined }
  });

  const selectedPlatform = watch("platformName");

  const handlePlatformSubmit = (data: PlatformFormValues) => {
    setPlatformData(data);
    setCurrentStep('import');
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
        if (!data) {
          toast({ title: "Error reading file", description: "Could not read file data.", variant: "destructive" });
          setIsFileLoading(false);
          return;
        }
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];

        if (json.length < 2) {
          toast({ title: "Empty or invalid file", description: "The Excel file seems to be empty or incorrectly formatted.", variant: "destructive" });
          setIsFileLoading(false);
          return;
        }
        
        const headers = (json[0] || []).map(h => String(h).toLowerCase().trim().replace(/\s+/g, ' '));
        const testBedIndex = headers.indexOf("test bed");
        const testCaseIndex = headers.indexOf("test case");
        const testStepsIndex = headers.indexOf("test steps");
        const expectedResultIndex = headers.indexOf("expected result");

        if (testCaseIndex === -1 || testStepsIndex === -1 || expectedResultIndex === -1) {
             toast({ title: "Invalid Headers", description: "Required columns ('Test Case', 'Test Steps', 'Expected Result') not found. Please check your Excel file.", variant: "destructive", duration: 7000 });
             setIsFileLoading(false);
             return;
        }

        const cases: TestCase[] = json.slice(1).map((row, index) => ({
          id: `case-${Date.now()}-${index}`,
          orderIndex: index,
          testBed: testBedIndex !== -1 ? (row[testBedIndex] || 'N/A') : 'N/A',
          testCaseTitle: row[testCaseIndex] || '',
          testSteps: row[testStepsIndex] || '',
          expectedResult: row[expectedResultIndex] || '',
          status: 'Untested',
          lastModified: new Date(),
        })).filter(tc => tc.testCaseTitle || tc.testSteps || tc.expectedResult); 

        setImportedCases(cases);
        if (cases.length > 0) {
          setCurrentStep('review');
          toast({ title: "File Processed", description: `${cases.length} test cases imported.` });
        } else {
           toast({ title: "No Test Cases Found", description: "The file was processed, but no valid test cases were extracted.", variant: "destructive" });
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error("Error processing file:", error);
      toast({ title: "File Processing Error", description: "An unexpected error occurred while processing the file.", variant: "destructive" });
    } finally {
      setIsFileLoading(false);
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const handleCreateSession = async () => {
    if (!user || !platformData || importedCases.length === 0) {
      toast({
        title: "Error Creating Session",
        description: "Missing user data, platform details, or test cases. Please ensure you are logged in and all steps are completed.",
        variant: "destructive",
      });
      return;
    }
    
    setIsCreating(true);

    try {
      const newSessionDocRef = doc(collection(db, 'testSessions'));

      const newSession: TestSession = {
        id: newSessionDocRef.id,
        userId: user.uid,
        userName: user.displayName || 'Anonymous User',
        platformDetails: platformData,
        status: 'In Progress',
        createdAt: new Date(),
        updatedAt: new Date(),
        summary: {
          total: importedCases.length,
          pass: 0,
          fail: 0,
          failKnown: 0,
          na: 0,
          untested: importedCases.length,
        },
        testCases: importedCases,
      };

      await setDoc(newSessionDocRef, newSession);

      toast({ title: "Session Created!", description: "Your new test session is ready." });
      router.push(`/dashboard/session/${newSessionDocRef.id}`);

    } catch (error) {
      console.error("Error creating session:", error);
      if (error instanceof Error && (error as any).code === 'permission-denied') {
        toast({ 
          title: "Permission Denied", 
          description: "Could not create the test session. Please check your Firestore security rules and ensure they allow writes to the 'testSessions' collection based on your userId.", 
          variant: "destructive",
          duration: 9000,
        });
      } else {
        toast({ title: "Session Creation Failed", description: "An unexpected error occurred. Check the console for details.", variant: "destructive" });
      }
    } finally {
        setIsCreating(false);
    }
  };
  
  const isPageReady = user && !isCreating;
  const isProcessing = isCreating || isFileLoading;

  const renderStepContent = () => {
    switch (currentStep) {
      case 'platform':
        return (
          <form onSubmit={handleSubmit(handlePlatformSubmit)} className="space-y-6">
            <Controller
              name="platformName"
              control={control}
              render={({ field }) => (
                <div className="space-y-1.5">
                  <Label htmlFor="platformName">Platform</Label>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger id="platformName" className={errors.platformName ? 'border-destructive focus-visible:ring-destructive' : ''}>
                      <SelectValue placeholder="Select a testing platform" />
                    </SelectTrigger>
                    <SelectContent>
                      {platformOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {errors.platformName && <p className="text-xs text-destructive">{errors.platformName.message}</p>}
                </div>
              )}
            />
            {selectedPlatform === "Other" && (
              <div className="space-y-1.5">
                <Label htmlFor="customPlatformName">Custom Platform Name</Label>
                <Input id="customPlatformName" {...control.register("customPlatformName")} placeholder="E.g., Smart Fridge X1" className={errors.customPlatformName ? 'border-destructive focus-visible:ring-destructive' : ''} />
                {errors.customPlatformName && <p className="text-xs text-destructive">{errors.customPlatformName.message}</p>}
              </div>
            )}
            {(selectedPlatform === "Web") && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="browserName">Browser Name</Label>
                  <Input id="browserName" {...control.register("browserName")} placeholder="e.g., Chrome, Firefox, Safari" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="browserVersion">Browser Version</Label>
                  <Input id="browserVersion" {...control.register("browserVersion")} placeholder="e.g., 120.0.1, 115 ESR" />
                </div>
              </>
            )}
             {(selectedPlatform && selectedPlatform !== "Web" && selectedPlatform !== "Other") && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="deviceModel">Device Model (Optional)</Label>
                  <Input id="deviceModel" {...control.register("deviceModel")} placeholder="e.g., Chromecast with Google TV, iPhone 15 Pro" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="osVersion">OS Version (Optional)</Label>
                  <Input id="osVersion" {...control.register("osVersion")} placeholder="e.g., Android TV 12, iOS 17.1" />
                </div>
              </>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="appVersion">App Version (Optional)</Label>
              <Input id="appVersion" {...control.register("appVersion")} placeholder="e.g., 1.2.3, build 45" />
            </div>
            <Button type="submit" className="w-full" disabled={isProcessing}>
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Next: Import Test Cases
            </Button>
          </form>
        );
      case 'import':
        return (
          <div className="space-y-6 text-center">
            <UploadCloud className="mx-auto h-16 w-16 text-primary" />
            <h3 className="text-xl font-semibold">Import Test Cases</h3>
            <p className="text-muted-foreground">
              Upload an Excel (.xlsx) file containing your test cases. <br/>
              Required columns: <strong>Test Case, Test Steps, Expected Result</strong>.<br/>
              Optional column: <strong>Test Bed</strong>.
            </p>
            <div className="flex justify-center">
                <Input id="file-upload" type="file" accept=".xlsx" onChange={handleFileChange} className="hidden" />
                <Button type="button" onClick={() => document.getElementById('file-upload')?.click()} disabled={isProcessing} variant="outline">
                    {isFileLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
                    Select Excel File
                </Button>
            </div>
             <Button variant="link" onClick={() => setCurrentStep('platform')}>Back to Platform Selection</Button>
          </div>
        );
      case 'review':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-xl font-semibold">Review Imported Test Cases</h3>
                    <p className="text-muted-foreground">Found {importedCases.length} test cases in <span className="font-medium text-primary">{fileName}</span>.</p>
                </div>
                <Button variant="outline" onClick={() => setCurrentStep('import')} disabled={isProcessing}>
                    <UploadCloud className="mr-2 h-4 w-4" /> Change File
                </Button>
            </div>
            
            <div className="max-h-96 overflow-y-auto border rounded-md p-4 space-y-3 bg-background/50">
              {importedCases.slice(0, 5).map((tc, index) => ( 
                <Card key={tc.id || index} className="bg-card">
                  <CardHeader className="p-3">
                    <CardTitle className="text-sm flex items-center">
                        <FileText className="mr-2 h-4 w-4 text-primary"/> 
                        {tc.testCaseTitle || "Untitled Test Case"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 text-xs">
                    <p><strong>Steps:</strong> {tc.testSteps?.substring(0,100)}{tc.testSteps && tc.testSteps.length > 100 ? '...' : ''}</p>
                    <p><strong>Expected:</strong> {tc.expectedResult?.substring(0,100)}{tc.expectedResult && tc.expectedResult.length > 100 ? '...' : ''}</p>
                  </CardContent>
                </Card>
              ))}
              {importedCases.length > 5 && <p className="text-center text-sm text-muted-foreground p-2">...and {importedCases.length - 5} more test cases.</p>}
            </div>
            <Button onClick={handleCreateSession} className="w-full" disabled={!isPageReady}>
              {isCreating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ListChecks className="mr-2 h-4 w-4" />
              )}
              {isCreating ? 'Creating...' : 'Create Session & Start Testing'}
            </Button>
          </div>
        );
      default: return null;
    }
  };

  const progressPercentage = currentStep === 'platform' ? 0 : currentStep === 'import' ? 33 : currentStep === 'review' ? 66 : 100;

  return (
    <div className="max-w-3xl mx-auto">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-headline text-center">Create New Test Session</CardTitle>
          <CardDescription className="text-center">
            Step {currentStep === 'platform' ? 1 : currentStep === 'import' ? 2 : 3} of 3: 
            {currentStep === 'platform' ? ' Platform Details' : currentStep === 'import' ? ' Import Cases' : ' Review & Confirm'}
          </CardDescription>
          <div className="w-full bg-muted rounded-full h-2.5 mt-2">
            <div className="bg-primary h-2.5 rounded-full transition-all duration-500 ease-out" style={{ width: `${progressPercentage}%` }}></div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {renderStepContent()}
        </CardContent>
      </Card>
    </div>
  );
}
