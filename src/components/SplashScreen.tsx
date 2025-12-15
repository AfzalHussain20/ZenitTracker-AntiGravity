
"use client";

// This component is purely for the visual display of the splash screen.
// All logic is handled by the page that uses it.
export default function SplashScreen() {
  return (
    <div className="splash-container">
       <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="w-[120px] h-[120px]">
        <defs>
          <linearGradient id="blueGradientSplash" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(var(--accent))" />
          </linearGradient>
        </defs>
        <path 
              className="z-path"
              d="M 15 25 H 80 L 30 80 H 65" 
              stroke="url(#blueGradientSplash)" 
              strokeWidth="8" 
              fill="none" 
              strokeLinecap="round" 
              strokeLinejoin="round"/>
        <circle 
              className="z-dot"
              cx="75" cy="28" r="5" fill="hsl(var(--accent))" />
      </svg>
      <h1 className="text-4xl font-headline font-bold text-foreground mt-4">
        Zenit Tracker
      </h1>
      <p className="text-muted-foreground mt-2">
        Precision in Every Test.
      </p>
    </div>
  );
}
