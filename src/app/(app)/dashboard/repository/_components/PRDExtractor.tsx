"use client";

import React, { useState } from "react";
import { storage } from "@/lib/firebaseConfig";
import { ref, uploadBytesResumable } from "firebase/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle, FileUp, Loader2, ListTree, Milestone } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

type Props = {
  repoId: string;
  userEmail?: string | null;
  onExtractionComplete: (count: number) => void;
};

type Status = 'idle' | 'uploading' | 'parsing' | 'selectingPhase' | 'generating' | 'success' | 'error';

export default function PRDExtractor({ repoId, userEmail, onExtractionComplete }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [status, setStatus] = useState<Status>('idle');
  const [phases, setPhases] = useState<string[] | null>(null);
  const [selectedPhase, setSelectedPhase] = useState<string>("");
  const [generatedTestCases, setGeneratedTestCases] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastStoragePath, setLastStoragePath] = useState<string>("");
  const { toast } = useToast();

  const statusMap: Record<Status, { text: string; icon: React.ReactNode }> = {
    idle: { text: "Select a PRD file to begin.", icon: <FileUp className="h-4 w-4" /> },
    uploading: { text: "Uploading file...", icon: <Loader2 className="h-4 w-4 animate-spin" /> },
    parsing: { text: "File uploaded. Parsing content...", icon: <Loader2 className="h-4 w-4 animate-spin" /> },
    selectingPhase: { text: "Multiple phases detected. Please pick one.", icon: <Milestone className="h-4 w-4" /> },
    generating: { text: "Generating test cases...", icon: <Loader2 className="h-4 w-4 animate-spin" /> },
    success: { text: "Test cases generated successfully!", icon: <CheckCircle className="h-4 w-4 text-green-500" /> },
    error: { text: error || "An unknown error occurred.", icon: <AlertCircle className="h-4 w-4 text-destructive" /> },
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    resetState();
  };

  const resetState = () => {
    setProgress(0);
    setStatus('idle');
    setPhases(null);
    setGeneratedTestCases(null);
    setError(null);
    setLastStoragePath("");
    setSelectedPhase("");
  };

  const handleUploadAndProcess = async () => {
    if (!file) {
      setError("No file selected.");
      setStatus('error');
      return;
    }
    setError(null);
    setStatus('uploading');
    
    const storagePath = `prd_uploads/${repoId}/${Date.now()}_${file.name}`;
    setLastStoragePath(storagePath);

    const storageRef = ref(storage, storagePath);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        setProgress(pct);
      },
      (err) => {
        console.error("Upload error:", err);
        setError("Upload failed: " + err.message);
        setStatus('error');
      },
      () => {
        setStatus('parsing');
        processFile(storagePath);
      }
    );
  };

  const processFile = async (storagePath: string, phase?: string) => {
    try {
      const res = await fetch("/api/extract-prd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storagePath, repoId, userEmail, phase }),
      });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "An unknown server error occurred.");
      }

      if (json.needPhase) {
        setPhases(json.phases || []);
        setStatus('selectingPhase');
      } else if (json.testcases) {
        setGeneratedTestCases(json.testcases);
        setStatus('success');
        onExtractionComplete(json.testcases.length);
        toast({
          title: "Extraction Complete",
          description: `${json.testcases.length} test cases were generated and added to the repository.`,
        });
      } else {
        throw new Error("No test cases were generated from the document.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message);
      setStatus('error');
    }
  };

  const handlePhaseSelectAndGenerate = async () => {
    if (!selectedPhase) {
        setError("Please select a phase.");
        setStatus('error');
        return;
    }
    setError(null);
    setStatus('generating');
    await processFile(lastStoragePath, selectedPhase);
  };

  const isProcessing = ['uploading', 'parsing', 'generating'].includes(status);

  return (
    <>
      <DialogHeader>
        <DialogTitle>Extract Test Cases from PRD</DialogTitle>
        <DialogDescription>
          Upload a Product Requirement Document (.pdf, .docx, .xlsx, .txt) to automatically generate and add test cases to this repository.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="flex items-center gap-4">
          <Input type="file" onChange={handleFileChange} accept=".pdf,.doc,.docx,.xlsx,.txt" className="flex-grow"/>
          <Button onClick={handleUploadAndProcess} disabled={!file || isProcessing}>
            {isProcessing ? <Loader2 className="animate-spin" /> : <FileUp />}
            Extract
          </Button>
        </div>

        {(status !== 'idle' || progress > 0) && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {statusMap[status].icon}
                <span>{statusMap[status].text}</span>
            </div>
            {status === 'uploading' && <Progress value={progress} />}
          </div>
        )}

        {status === 'selectingPhase' && phases && (
          <div className="space-y-2 pt-2 border-t">
              <Select onValueChange={setSelectedPhase} value={selectedPhase}>
                  <SelectTrigger><SelectValue placeholder="Select a phase to extract from" /></SelectTrigger>
                  <SelectContent>
                      {phases.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
              </Select>
              <Button onClick={handlePhaseSelectAndGenerate} disabled={!selectedPhase || isProcessing} className="w-full">
                  {isProcessing ? <Loader2 className="animate-spin" /> : "Generate for Selected Phase"}
              </Button>
          </div>
        )}

        {status === 'success' && generatedTestCases && (
            <div className="space-y-2 pt-4 border-t">
                <h4 className="font-semibold flex items-center gap-2"><ListTree /> Generated Test Cases ({generatedTestCases.length})</h4>
                <ScrollArea className="h-48 w-full rounded-md border p-2">
                    <ul className="space-y-1">
                        {generatedTestCases.map((tc: any) => (
                            <li key={tc.id} className="text-sm p-1 rounded hover:bg-accent">
                                <span className="font-mono text-xs text-muted-foreground mr-2">{tc.id || 'TC_NEW'}</span>
                                {tc.title}
                                <Badge variant="outline" className="ml-2">{tc.module}</Badge>
                            </li>
                        ))}
                    </ul>
                </ScrollArea>
            </div>
        )}
      </div>
      {status !== 'idle' && (
        <CardFooter>
            <Button variant="ghost" onClick={resetState}>Start Over</Button>
        </CardFooter>
      )}
    </>
  );
}
