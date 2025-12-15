
"use client";

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Wand2 } from 'lucide-react';
import type { ManagedTestCase } from '@/types';
import { generateTestCases } from '@/ai/flows/generate-test-cases-flow';
import { Slider } from '@/components/ui/slider';

interface AIGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (cases: Omit<ManagedTestCase, 'id' | 'createdAt' | 'updatedAt' | 'lastUpdatedBy' | 'lastUpdatedByUid'>[]) => void;
}

const generatorSchema = z.object({
  featureDescription: z.string().min(10, 'Please provide a more detailed description.'),
  caseCount: z.number().min(1).max(10),
});

type GeneratorFormValues = z.infer<typeof generatorSchema>;

export function AIGeneratorModal({ isOpen, onClose, onGenerate }: AIGeneratorModalProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [caseCount, setCaseCount] = useState(5);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<GeneratorFormValues>({
    resolver: zodResolver(generatorSchema),
    defaultValues: {
      featureDescription: '',
      caseCount: 5,
    },
  });
  
  useEffect(() => {
      setValue('caseCount', 5);
  }, [setValue]);

  const onSubmit = async (data: GeneratorFormValues) => {
    setIsGenerating(true);
    try {
      const result = await generateTestCases({
          featureDescription: data.featureDescription,
          count: data.caseCount
      });

      if (!result || !result.testCases) {
        throw new Error('AI did not return valid test cases.');
      }

      const formattedCases = result.testCases.map(tc => ({
          ...tc,
          status: 'Not Run' as const,
          testSteps: tc.testSteps.length > 0 ? tc.testSteps : ['TBD'],
      }));

      onGenerate(formattedCases);
      onClose();
    } catch (error) {
      console.error('Error generating test cases:', error);
      toast({
        title: 'AI Generation Failed',
        description: (error as Error).message || 'Could not generate test cases. The AI may be temporarily unavailable.',
        variant: 'destructive',
        duration: 9000,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 /> AI Test Scenario Composer
          </DialogTitle>
          <DialogDescription>
            Describe a user story or feature, and the AI will generate relevant test cases for you.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
          <div>
            <Label htmlFor="featureDescription">Feature Description or User Story</Label>
            <Textarea
              id="featureDescription"
              rows={5}
              placeholder="e.g., 'As a user, I want to be able to reset my password using a link sent to my email so that I can regain access to my account.'"
              {...register('featureDescription')}
            />
            {errors.featureDescription && (
              <p className="text-destructive text-sm mt-1">{errors.featureDescription.message}</p>
            )}
          </div>
          <div>
             <Label htmlFor="caseCount">Number of Test Cases to Generate: {caseCount}</Label>
            <Slider
                id="caseCount"
                min={1}
                max={10}
                step={1}
                value={[caseCount]}
                onValueChange={(value) => {
                    setCaseCount(value[0]);
                    setValue('caseCount', value[0]);
                }}
            />
             <Controller
                name="caseCount"
                control={control}
                render={({ field }) => <input {...field} type="hidden" />}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Generate Cases
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
