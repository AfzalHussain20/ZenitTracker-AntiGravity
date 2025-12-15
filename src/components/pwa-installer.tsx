
"use client";

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Download } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function PwaInstaller() {
  const { toast } = useToast();
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Install prompt handling
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      // Check if the app is already installed.
      if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
          setIsInstalled(true);
      } else {
          setInstallPrompt(e as BeforeInstallPromptEvent);
      }
    };
    
    const handleAppInstalled = () => {
        setIsInstalled(true);
        setInstallPrompt(null);
        toast({
            title: 'Installation Complete!',
            description: 'Zenit Tracker has been added to your device.',
        });
    };
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Initial check on component mount
    if (typeof window !== 'undefined' && (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone)) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [toast]);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }
    setInstallPrompt(null);
  };
  
  if (isInstalled || !installPrompt) {
     return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button onClick={handleInstallClick} size="lg">
        <Download className="mr-2 h-5 w-5" />
        Install App
      </Button>
    </div>
  );
}
