// src/components/service-worker-registrar.tsx
'use client';

import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export default function ServiceWorkerRegistrar() {
  const { toast } = useToast(); 

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('Service Worker registered with scope:', registration.scope);
          })
          .catch((error) => {
            console.error('Service Worker registration failed:', error);
            // This error often happens in dev environments and doesn't break the app,
            // so we can choose to not show a toast for it to reduce noise.
            // toast({
            //   title: 'Offline Mode Notice',
            //   description: 'Could not register service worker for offline capabilities. The app will work online.',
            //   variant: 'default',
            // });
          });
      });
    }
  }, []); // Empty dependency array ensures this runs once on mount

  return null; // This component does not render anything
}
