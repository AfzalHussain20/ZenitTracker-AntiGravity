import type { ReactNode } from 'react';
import { Logo } from '@/components/ui/Logo';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-[#3ea8ff]/10 blur-[120px] rounded-full mix-blend-screen animate-pulse duration-[4s]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#266bff]/10 blur-[120px] rounded-full mix-blend-screen animate-pulse duration-[5s]" />
      </div>

      <div className="mb-8 flex flex-col items-center relative z-10">
        <Logo className="w-24 h-24 mb-4 drop-shadow-[0_0_15px_rgba(38,107,255,0.5)]" />
        <h1 className="text-4xl font-headline font-bold text-foreground tracking-tight">Zenit Tracker</h1>
        <p className="text-muted-foreground mt-2 font-medium tracking-wide text-sm uppercase opacity-80">Precision in Every Test.</p>
      </div>
      <div className="w-full max-w-md p-8 bg-card/60 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl relative z-10 transition-all hover:shadow-[0_0_40px_rgba(0,0,0,0.3)]">
        {children}
      </div>
    </div>
  );
}
