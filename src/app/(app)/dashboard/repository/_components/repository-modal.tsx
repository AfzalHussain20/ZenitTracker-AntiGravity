"use client";

import { useEffect, useState } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebaseConfig';
import { collection, doc, setDoc, updateDoc, serverTimestamp, addDoc, Timestamp } from 'firebase/firestore';
import type { ManagedTestCase, ManagedTestCasePriority, ManagedTestCaseStatus } from '@/types';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PlusCircle, Trash2 } from 'lucide-react';

interface TestCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  testCase: ManagedTestCase | null;
}

const testCaseSchema = z.object({
  title: z.string().min(1, "Title is required."),
  module: z.string().min(1, "Module/Feature is required."),
  priority: z.enum(['High', 'Medium', 'Low'], { required_error: "Priority is required."}),
  status: z.enum(['Pass', 'Fail', 'Blocked', 'Not Run'], { required_error: "Status is required." }),
  preconditions: z.string().optional(),
  testData: z.string().optional(),
  testSteps: z.array(z.string().min(1, "Test step cannot be empty.")).min(1, "At least one test step is required."),
  expectedResult: z.string().min(1, "Expected Result is required."),
  automationTag: z.string().optional(),
});

type TestCaseFormValues = z.infer<typeof testCaseSchema>;

export function TestCaseModal({ isOpen, onClose, testCase }: TestCaseModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const { control, register, handleSubmit, reset, formState: { errors } } = useForm<TestCaseFormValues>({
    resolver: zodResolver(testCaseSchema),
    defaultValues: {
        title: '',
        module: '',
        priority: 'Medium',
        status: 'Not Run',
        preconditions: '',
        testData: '',
        testSteps: [''],
        expectedResult: '',
        automationTag: 'No',
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "testSteps"
  });

  useEffect(() => {
    if (testCase) {
      reset({
        ...testCase,
        testSteps: testCase.testSteps.length > 0 ? testCase.testSteps : [''],
      });
    } else {
      reset({
        title: '',
        module: '',
        priority: 'Medium',
        status: 'Not Run',
        preconditions: '',
        testData: '',
        testSteps: [''],
        expectedResult: '',
        automationTag: 'No',
      });
    }
  }, [testCase, reset]);

  const onSubmit = async (data: TestCaseFormValues) => {
    if (!user) {
      toast({ title: "Authentication Error", description: "You must be logged in.", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      if (testCase) {
        // Update existing test case
        const docRef = doc(db, "managedTestCases", testCase.id);
        await updateDoc(docRef, {
            ...data,
            lastUpdatedBy: user.displayName || 'Unknown User',
            lastUpdatedByUid: user.uid,
            updatedAt: serverTimestamp(),
        });
        toast({ title: "Success", description: "Test case updated successfully." });
      } else {
        // Create new test case
        const collectionRef = collection(db, "managedTestCases");
        await addDoc(collectionRef, {
            ...data,
            lastUpdatedBy: user.displayName || 'Unknown User',
            lastUpdatedByUid: user.uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        toast({ title: "Success", description: "Test case created successfully." });
      }
      onClose();
    } catch (error) {
      console.error("Error saving test case:", error);
      toast({ title: "Error", description: "Failed to save test case.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{testCase ? 'Edit Test Case' : 'Create New Test Case'}</DialogTitle>
          <DialogDescription>
            {testCase ? `Editing TC-${testCase.id.substring(0, 5)}` : 'Fill in the details for the new test case.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="max-h-[70vh] overflow-y-auto p-1 pr-4 space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input id="title" {...register("title")} />
              {errors.title && <p className="text-destructive text-sm mt-1">{errors.title.message}</p>}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <Label htmlFor="module">Module/Feature</Label>
                    <Input id="module" {...register("module")} />
                    {errors.module && <p className="text-destructive text-sm mt-1">{errors.module.message}</p>}
                </div>
                <div>
                    <Label>Priority</Label>
                    <Controller
                        control={control}
                        name="priority"
                        render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="High">High</SelectItem>
                                    <SelectItem value="Medium">Medium</SelectItem>
                                    <SelectItem value="Low">Low</SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                    />
                </div>
                 <div>
                    <Label>Status</Label>
                    <Controller
                        control={control}
                        name="status"
                        render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Not Run">Not Run</SelectItem>
                                    <SelectItem value="Pass">Pass</SelectItem>
                                    <SelectItem value="Fail">Fail</SelectItem>
                                    <SelectItem value="Blocked">Blocked</SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                    />
                </div>
            </div>

            <div>
              <Label htmlFor="preconditions">Preconditions</Label>
              <Textarea id="preconditions" {...register("preconditions")} />
            </div>

            <div>
              <Label htmlFor="testData">Test Data</Label>
              <Textarea id="testData" {...register("testData")} />
            </div>

            <div>
              <Label>Test Steps</Label>
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-center gap-2 mb-2">
                  <span className="text-muted-foreground">{index + 1}.</span>
                  <Input {...register(`testSteps.${index}`)} className="flex-grow"/>
                  <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= 1}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
               {errors.testSteps && <p className="text-destructive text-sm mt-1">{errors.testSteps.message || errors.testSteps.root?.message}</p>}
              <Button type="button" size="sm" variant="outline" onClick={() => append("")} className="mt-2">
                <PlusCircle className="mr-2 h-4 w-4" /> Add Step
              </Button>
            </div>

            <div>
                <Label htmlFor="expectedResult">Expected Result</Label>
                <Textarea id="expectedResult" {...register("expectedResult")} />
                {errors.expectedResult && <p className="text-destructive text-sm mt-1">{errors.expectedResult.message}</p>}
            </div>

            <div>
                <Label htmlFor="automationTag">Automation Tag</Label>
                <Input id="automationTag" {...register("automationTag")} placeholder="e.g., No, Yes, or script_name.py"/>
            </div>

          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {testCase ? 'Save Changes' : 'Create Test Case'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
