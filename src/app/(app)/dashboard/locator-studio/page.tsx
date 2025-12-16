"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Cpu, Globe, Copy, Zap, Layers, FileCode, MousePointerClick,
  Type, Image as ImageIcon, Link as LinkIcon, Power, FormInput
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchUrlSource } from '@/app/actions';

const extractInteractiveElements = (html: string) => {
  const candidates: { tag: string, attrStr: string, content: string, label: string, icon: any }[] = [];
  const tagRegex = /<(button|input|a|select|textarea|img|div|span)([^>]*)>(.*?)<\/\1>|<(input|img)([^>]*)\/>/gi;
  let match;
  let count = 0;

  while ((match = tagRegex.exec(html)) !== null && count < 300) {
    const tagName = (match[1] || match[4]).toLowerCase();
    const attrs = (match[2] || match[5] || '').trim();
    const content = match[3] || '';

    if (attrs && (attrs.match(/(id|class|name|href|data-|role|placeholder|aria-label)=/))) {
      let label = "";
      const cleanContent = content.replace(/<[^>]*>/g, '').trim();
      const aria = attrs.match(/aria-label=["']([^"']+)["']/i)?.[1];
      const placeholder = attrs.match(/placeholder=["']([^"']+)["']/i)?.[1];
      const title = attrs.match(/(title|alt)=["']([^"']+)["']/i)?.[2];
      const innerText = cleanContent.length > 0 && cleanContent.length < 40 ? cleanContent : "";
      const name = attrs.match(/(name|id|data-testid)=["']([^"']+)["']/i)?.[2];

      if (aria) label = aria;
      else if (placeholder) label = placeholder;
      else if (innerText) label = innerText;
      else if (title) label = title;
      else if (name) label = name;
      else label = `Unnamed ${tagName}`;

      let Icon = MousePointerClick;
      if (tagName === 'input') Icon = FormInput;
      if (tagName === 'a') Icon = LinkIcon;
      if (tagName === 'img') Icon = ImageIcon;
      if (tagName === 'span' || tagName === 'div') Icon = Type;
      if (attrs.includes('submit')) Icon = Power;

      candidates.push({
        tag: tagName,
        attrStr: attrs,
        content: content.substring(0, 50).trim(),
        label: label,
        icon: Icon
      });
      count++;
    }
  }
  return candidates;
};

const getBestStrategy = (tag: string, attrs: string, content: string) => {
  const idMatch = attrs.match(/id=["']([^"']+)["']/i);
  if (idMatch) return { type: 'ID', val: `#${idMatch[1]}`, score: 100, color: 'text-green-600 dark:text-green-400' };

  const testIdMatch = attrs.match(/data-test.*?=["']([^"']+)["']/i);
  if (testIdMatch) return { type: 'TestID', val: `[data-testid="${testIdMatch[1]}"]`, score: 95, color: 'text-green-600 dark:text-green-400' };

  const nameMatch = attrs.match(/name=["']([^"']+)["']/i);
  if (nameMatch) return { type: 'Name', val: `[name="${nameMatch[1]}"]`, score: 85, color: 'text-blue-600 dark:text-blue-400' };

  const hrefMatch = attrs.match(/href=["']([^"']+)["']/i);
  if (tag === 'a' && hrefMatch && hrefMatch[1] !== '#' && !hrefMatch[1].startsWith('javascript')) {
    return { type: 'Href', val: `//a[@href='${hrefMatch[1]}']`, score: 80, color: 'text-blue-600 dark:text-blue-400' };
  }

  const cleanText = content.replace(/<[^>]*>/g, '').trim();
  if (cleanText.length > 2 && cleanText.length < 40) {
    return { type: 'Text', val: `//${tag}[contains(text(), '${cleanText}')]`, score: 70, color: 'text-yellow-600 dark:text-yellow-400' };
  }

  const classMatch = attrs.match(/class=["']([^"']+)["']/i);
  if (classMatch) {
    const classes = classMatch[1].split(' ').filter(c => c && !c.includes('hover') && !c.includes('active'));
    if (classes.length > 0) {
      return { type: 'Class', val: `.${classes[classes.length - 1]}`, score: 50, color: 'text-orange-600 dark:text-orange-400' };
    }
  }
  return null;
};

export default function LocatorStudioPage() {
  const [targetUrl, setTargetUrl] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [foundElements, setFoundElements] = useState<any[]>([]);

  const handleQuickScan = async () => {
    if (!targetUrl) return;
    setIsScanning(true);
    setFoundElements([]);
    try {
      const result = await fetchUrlSource(targetUrl);
      if (result.success && result.data) {
        const rawElements = extractInteractiveElements(result.data as string);
        const processed = rawElements.map(el => {
          const strategy = getBestStrategy(el.tag, el.attrStr, el.content);
          return strategy ? { ...strategy, tag: el.tag, label: el.label, Icon: el.icon } : null;
        }).filter(Boolean);
        const unique = Array.from(new Map(processed.map(item => [item?.val, item])).values());
        setFoundElements(unique);
        toast({ title: "Scan Complete", description: `Identified ${unique.length} elements.` });
      } else {
        toast({ title: "Fetch Failed", description: result.error, variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Error", description: "Failed to process URL.", variant: "destructive" });
    } finally {
      setIsScanning(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied" });
  };

  return (
    <div className="min-h-screen p-4 md:p-8 space-y-8 max-w-[1600px] mx-auto text-foreground bg-background">
      {/* Search Header */}
      <div className="flex flex-col items-center justify-center text-center space-y-4 py-8">
        <div className="flex items-center gap-3">
          <Cpu className="w-10 h-10 text-primary" />
          <h1 className="text-4xl font-extrabold tracking-tight">
            Locator Studio <span className="text-primary">Fast Scan</span>
          </h1>
        </div>
        <p className="text-muted-foreground max-w-xl text-lg">
          Paste a URL to instantly extract robust automation selectors.
        </p>
      </div>

      <div className="max-w-3xl mx-auto relative z-10 mb-8">
        <div className="flex items-center bg-card border border-border rounded-xl p-2 shadow-lg">
          <Globe className="ml-4 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="https://example.com"
            className="border-0 bg-transparent text-lg h-12 focus-visible:ring-0 placeholder:text-muted-foreground/50 text-foreground font-mono shadow-none"
            value={targetUrl}
            onChange={(e) => setTargetUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleQuickScan()}
          />
          <Button
            size="lg"
            onClick={handleQuickScan}
            disabled={isScanning || !targetUrl}
            className="h-10 px-8 rounded-lg font-bold"
          >
            {isScanning ? <Zap className="w-4 h-4 animate-spin" /> : "Fetch"}
          </Button>
        </div>
      </div>

      <div className="mt-8">
        <AnimatePresence>
          {foundElements.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {foundElements.map((el, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.02 }}
                >
                  <div className="group bg-card border border-border rounded-xl p-4 hover:border-primary/50 transition-all shadow-sm hover:shadow-md h-full flex flex-col">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2 max-w-[80%]">
                        <div className="p-1.5 rounded-md bg-muted text-muted-foreground group-hover:text-primary transition-colors">
                          <el.Icon className="w-4 h-4" />
                        </div>
                        <h3 className="font-semibold text-foreground text-sm truncate w-full" title={el.label}>
                          {el.label || `Unnamed ${el.tag}`}
                        </h3>
                      </div>
                      <Badge variant="outline" className={`text-[10px] px-1.5 uppercase font-mono`}>
                        {el.tag}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 bg-muted/50 rounded p-2 border border-border group-hover:border-primary/20 transition-colors mt-auto">
                      <FileCode className="w-3 h-3 text-muted-foreground shrink-0" />
                      <code className={`flex-1 text-[11px] font-mono truncate ${el.color}`} title={el.val}>
                        {el.val}
                      </code>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 hover:bg-background shrink-0"
                        onClick={() => copyToClipboard(el.val)}
                      >
                        <Copy className="w-3 h-3 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>

        {!isScanning && foundElements.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 opacity-30">
            <Layers className="w-16 h-16 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">Waiting for URL input...</p>
          </div>
        )}
      </div>
    </div>
  );
}
