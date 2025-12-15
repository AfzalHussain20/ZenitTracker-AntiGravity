
import type { ReactNode } from 'react';
import Image from 'next/image';

const ZenitAuthLogo = () => (
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="w-20 h-20 mb-4">
    <defs>
      <linearGradient id="purpleGradientAuth" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="hsl(var(--accent))" />
        <stop offset="100%" stopColor="hsl(var(--primary))" />
      </linearGradient>
    </defs>
    <path d="M 15 25 H 80 L 30 80 H 65" 
          stroke="url(#purpleGradientAuth)" 
          strokeWidth="8" 
          fill="none" 
          strokeLinecap="round" 
          strokeLinejoin="round"/>
    <circle cx="75" cy="28" r="5" fill="hsl(var(--primary))" />
  </svg>
);

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <div className="mb-8 flex flex-col items-center">
        <ZenitAuthLogo />
        <h1 className="text-4xl font-headline font-bold text-foreground">Zenit Tracker</h1>
        <p className="text-muted-foreground mt-2">Precision in Every Test.</p>
      </div>
      <div className="w-full max-w-md p-8 bg-card rounded-xl shadow-2xl">
        {children}
      </div>
    </div>
  );
}
