
"use client";

import { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, FlaskConical, Code, Clipboard, Globe, Wand2, ArrowLeft, ChevronRight, Copy, Tag, Hash, Eye, Sparkles, MousePointerClick, FileJson, ListTree } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { generateLocatorsFromHtml, type GenerateLocatorsFromHtmlInput } from './_actions/generate-locators-from-html';
import { scrapeUrl } from './_actions/scrape-url';
import type { GenerateLocatorsOutput, GeneratedElement } from './_actions/generate-locators-from-html';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';


const locatorSchema = z.object({
  htmlContent: z.string().min(50, 'HTML content must be at least 50 characters.'),
  framework: z.string().min(1, 'Please select a framework.'),
  language: z.string().min(1, 'Please select a language.'),
});

type LocatorFormValues = z.infer<typeof locatorSchema>;

const frameworks = ['Selenium', 'Playwright', 'Cypress'];
const languagesPerFramework: Record<string, string[]> = {
  Selenium: ['Java', 'Python', 'C#', 'JavaScript'],
  Playwright: ['TypeScript', 'JavaScript'],
  Cypress: ['JavaScript'],
};

export default function LocatorStudioPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [output, setOutput] = useState<GenerateLocatorsOutput | null>(null);
  const [url, setUrl] = useState('');
  const [openCollapsible, setOpenCollapsible] = useState<string | null>(null);
  const [isInspectMode, setIsInspectMode] = useState(false);
  const [activeLocator, setActiveLocator] = useState<string | null>(null);

  const { control, register, handleSubmit, watch, setValue, formState: { errors } } = useForm<LocatorFormValues>({
    resolver: zodResolver(locatorSchema),
    defaultValues: {
      htmlContent: '',
      framework: 'Selenium',
      language: 'Java',
    },
  });

  const selectedFramework = watch('framework');

  useEffect(() => {
    const supportedLanguages = languagesPerFramework[selectedFramework];
    if (!supportedLanguages.includes(watch('language'))) {
      setValue('language', supportedLanguages[0]);
    }
  }, [selectedFramework, watch, setValue]);

  const handleFetchHtml = async () => {
      if (!url) {
          toast({ title: 'URL Required', description: 'Please enter a URL to fetch.', variant: 'destructive'});
          return;
      }
      setIsFetching(true);
      setOutput(null);
      const result = await scrapeUrl(url);
      setIsFetching(false);

      if (result.error || !result.html) {
          toast({ title: 'Fetch Failed', description: result.error || 'No HTML content was returned.', variant: 'destructive'});
      } else {
          setValue('htmlContent', result.html, { shouldValidate: true });
          toast({ title: 'Success', description: 'HTML content fetched and ready for generation.' });
      }
  };

  const onSubmit = async (data: LocatorFormValues) => {
    setIsGenerating(true);
    setOutput(null);
    try {
      const result = await generateLocatorsFromHtml(data as GenerateLocatorsFromHtmlInput);
      if (result.error || !result.output) {
        throw new Error(result.error || "An unknown error occurred.");
      }
      setOutput(result.output);
      toast({ title: 'Success', description: `Generated ${result.output?.elements.length} locators.` });
    } catch (error) {
      toast({ title: 'Generation Failed', description: (error as Error).message, variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({ description: 'Copied to clipboard!' });
  };
  
  const getBadgeVariant = (type: string) => {
      switch (type) {
          case 'ID': return 'destructive';
          case 'Data-TestID': return 'destructive';
          case 'CSS': return 'secondary';
          case 'XPath': return 'outline';
          case 'Text': return 'default';
          default: return 'outline';
      }
  }

  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  const postMessageToIframe = (message: any) => {
      if (iframeRef.current?.contentWindow) {
          iframeRef.current.contentWindow.postMessage(message, '*');
      }
  };

  const onValidateLocator = (locatorValue: string, locatorType: string) => {
      const fullLocatorId = `${locatorValue}-${locatorType}`;
      setActiveLocator(fullLocatorId);
      postMessageToIframe({ type: 'highlight', selector: locatorValue, locatorType });
  };

  const toggleInspectMode = (checked: boolean) => {
      setIsInspectMode(checked);
      postMessageToIframe({ type: 'inspectMode', enabled: checked });
  }

  useEffect(() => {
    const handleIframeMessage = (event: MessageEvent) => {
        if (event.source !== iframeRef.current?.contentWindow) return;
        const { type, xpath } = event.data;
        if (type === 'elementClicked' && xpath) {
             const matchingElement = output?.elements.find(el => {
                const relativeXpath = el.locators.find(l => l.type === 'XPath')?.value;
                return relativeXpath === xpath;
            });
            
            if (matchingElement) {
                setOpenCollapsible(matchingElement.elementName);
                setTimeout(() => {
                    const rowElement = document.getElementById(`row-${matchingElement.elementName}`);
                    rowElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    rowElement?.classList.add('bg-primary/10', 'transition-colors', 'duration-1000');
                    setTimeout(() => rowElement?.classList.remove('bg-primary/10'), 1000);
                }, 100);
            }
        }
    };
    window.addEventListener('message', handleIframeMessage);
    return () => {
        window.removeEventListener('message', handleIframeMessage);
    };
  }, [output]);
  
  const htmlContent = watch('htmlContent');

  const NEON_COLOR = "#39FF14"; // Neon Green

  const validatorScript = `
    <style>
        body.inspect-mode-active * { cursor: crosshair !important; }
        body.inspect-mode-active *:hover { outline: 2px solid ${NEON_COLOR} !important; outline-offset: 2px; }
        .locator-highlight {
            outline: 3px solid ${NEON_COLOR} !important;
            box-shadow: 0 0 20px ${NEON_COLOR}, inset 0 0 10px ${NEON_COLOR} !important;
            background-color: ${NEON_COLOR}26 !important; /* 15% opacity */
            transition: all 0.2s ease-in-out; border-radius: 4px; position: relative; scroll-margin: 5rem;
        }
        .locator-highlight-label {
            position: absolute; top: 0; left: 0; background-color: ${NEON_COLOR};
            color: #000; font-weight: bold; padding: 4px 8px; font-size: 12px; font-family: monospace;
            border-radius: 4px; z-index: 10000; white-space: nowrap; transform: translateY(-100%);
            box-shadow: 0 0 10px ${NEON_COLOR};
        }
    </style>
    <script>
        let currentHighlight = null; let currentLabel = null; let inspectMode = false;
        function clearHighlight() {
            if (currentHighlight) { currentHighlight.classList.remove('locator-highlight'); currentHighlight = null; }
            if (currentLabel) { currentLabel.remove(); currentLabel = null; }
        }
        function getRelativeXPath(element) {
            if (!element || element.nodeType !== 1) return '';
            const id = element.getAttribute('id');
            if (id) return \`//\${element.tagName.toLowerCase()}[@id='\${id}']\`;
            const dataTestId = element.getAttribute('data-testid');
            if (dataTestId) return \`//\${element.tagName.toLowerCase()}[@data-testid='\${dataTestId}']\`;
            const text = element.textContent.trim();
            if (text && text.length > 0 && text.length < 50) {
                 const isUniqueAmongSiblings = Array.from(element.parentNode.children).filter(sib => sib.textContent.trim() === text).length === 1;
                 if (isUniqueAmongSiblings) return \`//\${element.tagName.toLowerCase()}[.='\${text}']\`;
            }
            const className = element.getAttribute('class');
            if(className) return \`//\${element.tagName.toLowerCase()}[@class='\${className}']\`;
            const tagName = element.tagName.toLowerCase();
            let index = 1; let sibling = element.previousElementSibling;
            while(sibling){ if(sibling.tagName.toLowerCase() === tagName){ index++; } sibling = sibling.previousElementSibling; }
            return \`//\${tagName}[\${index}]\`;
        }
        document.addEventListener('click', function(e) {
            if (inspectMode) { e.preventDefault(); e.stopPropagation(); const path = getRelativeXPath(e.target); window.parent.postMessage({ type: 'elementClicked', xpath: path }, '*'); }
        }, true);
        window.addEventListener('message', function(event) {
            const { type, selector, locatorType, enabled } = event.data;
            if (type === 'highlight') {
                clearHighlight(); if (!selector) return;
                let element = null;
                try {
                    if (locatorType && (locatorType.toLowerCase().includes('xpath'))) {
                        element = document.evaluate(selector, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                    } else { element = document.querySelector(selector); }
                    if (element) {
                        element.classList.add('locator-highlight'); element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        currentHighlight = element;
                        currentLabel = document.createElement('div'); currentLabel.className = 'locator-highlight-label';
                        currentLabel.textContent = selector; document.body.appendChild(currentLabel);
                        const rect = element.getBoundingClientRect(); currentLabel.style.position = 'absolute';
                        currentLabel.style.left = (window.scrollX + rect.left) + 'px'; currentLabel.style.top = (window.scrollY + rect.top) + 'px';
                    }
                } catch (e) { console.error('Invalid selector for validation:', selector, e); }
            } else if (type === 'inspectMode') {
                inspectMode = enabled; document.body.classList.toggle('inspect-mode-active', enabled);
            }
        });
    <\/script>
  `;


  return (
    <TooltipProvider>
    <div className="flex flex-col h-[calc(100vh-8rem)] w-full mx-auto space-y-4">
      {/* Header Card */}
      <Card className="shadow-md flex-shrink-0">
        <form onSubmit={handleSubmit(onSubmit)}>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                         <Tooltip>
                           <TooltipTrigger asChild>
                              <Button variant="outline" size="icon" onClick={() => router.back()}>
                                <ArrowLeft />
                                <span className="sr-only">Back</span>
                              </Button>
                           </TooltipTrigger>
                           <TooltipContent><p>Back to Dashboard</p></TooltipContent>
                         </Tooltip>
                         <h1 className="flex items-center gap-3 font-headline text-2xl text-primary">
                             <FlaskConical className="h-7 w-7" />
                             Locator Lab
                         </h1>
                    </div>
                    <Button type="submit" size="lg" disabled={isGenerating}>
                      {isGenerating ? <Loader2 className="animate-spin" /> : <Wand2 />}
                      Generate Locators
                  </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    <div className="space-y-1.5 md:col-span-2">
                        <Label htmlFor="urlInput">Fetch from URL</Label>
                        <div className="flex gap-2">
                          <Input id="urlInput" placeholder="https://example.com" value={url} onChange={(e) => setUrl(e.target.value)} />
                          <Button onClick={handleFetchHtml} disabled={isFetching} type="button">
                              {isFetching ? <Loader2 className="animate-spin" /> : <Globe />}
                              Fetch
                          </Button>
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <Label>Framework</Label>
                        <Controller name="framework" control={control} render={({ field }) => (
                          <Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{frameworks.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent></Select>
                        )} />
                    </div>
                    <div className="space-y-1.5">
                        <Label>Language</Label>
                        <Controller name="language" control={control} render={({ field }) => (
                          <Select onValueChange={field.onChange} value={field.value} key={selectedFramework}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{languagesPerFramework[selectedFramework]?.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent></Select>
                        )} />
                    </div>
                </div>
                 <div className="space-y-1.5">
                     <Label htmlFor="htmlContent">Or Paste HTML</Label>
                     <Textarea
                        id="htmlContent" rows={2} placeholder="Paste your HTML content here..."
                        {...register('htmlContent')}
                        className={cn("transition-all text-xs focus:min-h-[120px]", errors.htmlContent && 'border-destructive')}
                     />
                       {errors.htmlContent && <p className="text-sm text-destructive mt-1">{errors.htmlContent.message}</p>}
                </div>
            </CardContent>
        </form>
      </Card>
      
      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">
        {/* Left Column for Results */}
        <Card className="shadow-md flex flex-col">
            <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl"><ListTree/> Results</CardTitle>
                <CardDescription>All generated locators and code snippets will appear here.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col min-h-0">
                <AnimatePresence mode="wait">
                  {output ? (
                    <motion.div key="output" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="flex-1 flex flex-col min-h-0">
                      <Tabs defaultValue="list" className="w-full flex-1 flex flex-col min-h-0">
                        <TabsList className="grid w-full grid-cols-3"><TabsTrigger value="list"><ListTree/> List</TabsTrigger><TabsTrigger value="code"><Code/> Code</TabsTrigger><TabsTrigger value="json"><FileJson/> JSON</TabsTrigger></TabsList>
                        <TabsContent value="list" className="mt-4 flex-1 min-h-0">
                           <ScrollArea className="h-full">
                              <Table>
                                <TableHeader><TableRow><TableHead className="w-10"></TableHead><TableHead>Element</TableHead><TableHead>Best Locator</TableHead></TableRow></TableHeader>
                                <TableBody>
                                  {output.elements.map((element) => (
                                    <Collapsible asChild key={element.elementName} open={openCollapsible === element.elementName} onOpenChange={(isOpen) => setOpenCollapsible(isOpen ? element.elementName : null)}>
                                      <>
                                        <TableRow id={`row-${element.elementName}`} className={cn("group transition-colors", openCollapsible === element.elementName && 'bg-accent')}>
                                          <TableCell>
                                            <CollapsibleTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 transition-transform duration-300 ease-in-out group-data-[state=open]:rotate-90">
                                                    <ChevronRight className="h-4 w-4" />
                                                </Button>
                                            </CollapsibleTrigger>
                                          </TableCell>
                                          <TableCell className="font-medium">
                                              <div className="flex flex-col"><span className="font-mono text-primary">{element.elementName}</span><span className="text-xs text-muted-foreground">{element.tagName.toUpperCase()}</span></div>
                                          </TableCell>
                                          <TableCell>
                                              <div className="flex items-center gap-2"><Badge variant={getBadgeVariant(element.locators[0].type)}>{element.locators[0].type}</Badge><span className="font-mono text-xs truncate">{element.locators[0].value}</span></div>
                                          </TableCell>
                                        </TableRow>
                                        <CollapsibleContent asChild>
                                            <tr className="bg-muted/30"><td colSpan={3} className="p-0">
                                                  <div className="p-4 bg-background/50"><div className="space-y-2">
                                                        {element.locators.map((locator, idx) => (
                                                            <div key={idx} className="flex items-center justify-between p-2 bg-muted/50 rounded-md border">
                                                                <div className="flex items-center gap-3 flex-1 overflow-hidden">
                                                                    <Badge variant={getBadgeVariant(locator.type)} className="w-28 justify-center shrink-0">{locator.type}</Badge>
                                                                    <code className="text-xs truncate">{locator.value}</code>
                                                                </div>
                                                                <div className="flex items-center shrink-0">
                                                                     <Tooltip><TooltipTrigger asChild>
                                                                             <Button variant="ghost" size="icon" className={cn("h-7 w-7", activeLocator === `${locator.value}-${locator.type}` && 'text-primary ring-2 ring-primary')} style={activeLocator === `${locator.value}-${locator.type}` ? {color: NEON_COLOR, 'box-shadow': `0 0 8px ${NEON_COLOR}, inset 0 0 4px ${NEON_COLOR}`} : {}} onClick={() => onValidateLocator(locator.value, locator.type)}><Eye /></Button>
                                                                        </TooltipTrigger><TooltipContent><p>Validate Locator</p></TooltipContent>
                                                                    </Tooltip>
                                                                    <Tooltip><TooltipTrigger asChild>
                                                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleCopy(locator.value)}><Copy className="h-3.5 w-3.5" /></Button>
                                                                        </TooltipTrigger><TooltipContent><p>Copy Locator</p></TooltipContent>
                                                                    </Tooltip>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div></div></td></tr>
                                        </CollapsibleContent>
                                      </>
                                    </Collapsible>
                                  ))}
                                </TableBody>
                              </Table>
                            </ScrollArea>
                        </TabsContent>
                        <TabsContent value="code" className="mt-4 relative flex-1"><ScrollArea className="h-full"><pre className="bg-muted p-4 rounded-md text-sm"><code>{output.formattedCode}</code></pre></ScrollArea><Button size="icon" variant="ghost" className="absolute top-1 right-1 h-7 w-7" onClick={() => output && handleCopy(output.formattedCode)}><Clipboard /></Button></TabsContent>
                        <TabsContent value="json" className="mt-4 relative flex-1"><ScrollArea className="h-full"><pre className="bg-muted p-4 rounded-md text-sm"><code>{output.raw}</code></pre></ScrollArea><Button size="icon" variant="ghost" className="absolute top-1 right-1 h-7 w-7" onClick={() => output && handleCopy(output.raw)}><Clipboard /></Button></TabsContent>
                      </Tabs>
                    </motion.div>
                  ) : (
                     <motion.div key="placeholder" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8"><Sparkles className="h-16 w-16 mb-4 text-primary/30" /><h3 className="font-semibold text-lg text-foreground">Awaiting Generation</h3><p>Your generated locators will appear here.</p></motion.div>
                  )}
                </AnimatePresence>
            </CardContent>
        </Card>
        
        {/* Right Column for Validator */}
        <Card className="shadow-md flex flex-col">
            <CardHeader>
                <div className="flex justify-between items-center">
                     <CardTitle className="flex items-center gap-3 text-xl"><Eye/> Validator</CardTitle>
                     <div className="flex items-center space-x-2">
                         <Label htmlFor="inspect-mode" className={cn("flex items-center gap-2 cursor-pointer text-sm font-medium transition-colors", isInspectMode && "text-primary")} style={isInspectMode ? {color: NEON_COLOR, textShadow: `0 0 8px ${NEON_COLOR}`}: {}}>
                             <MousePointerClick /> Inspect Mode
                         </Label>
                         <Switch id="inspect-mode" checked={isInspectMode} onCheckedChange={toggleInspectMode} />
                     </div>
                </div>
                <CardDescription>A live preview of your HTML to validate locators instantly.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 min-h-0">
                {htmlContent ? (
                     <iframe ref={iframeRef} srcDoc={htmlContent + validatorScript} title="HTML Content Validator" className="w-full h-full border rounded-md bg-white" sandbox="allow-scripts allow-same-origin" />
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8 border-dashed border-2 rounded-lg"><Eye className="h-16 w-16 mb-4 text-primary/30" /><h3 className="font-semibold text-lg text-foreground">Live Preview</h3><p>Fetch or paste HTML to see a live preview.</p></div>
                )}
            </CardContent>
         </Card>
      </div>
    </div>
    </TooltipProvider>
  );
}

    