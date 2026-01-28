"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebaseConfig';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from 'next-themes';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal
} from '@/components/ui/dropdown-menu';
import { LogOut, UserCircle, LayoutDashboard, TestTubeDiagonal, Users, Wand2, Library, Info, Sun, Moon, Monitor, FlaskConical, Clock, Shield, Sparkles, ClipboardCheck, ChevronRight, Fingerprint, Activity, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { LogoIcon } from '@/components/ui/Logo';

export default function AppHeader() {
  const { user, userRole } = useAuth();
  const { setTheme } = useTheme();
  const router = useRouter();

  const [quoteIndex, setQuoteIndex] = useState(0);
  const quotes = [
    "Quality is not an act, it is a habit. – Aristotle",
    "Testing shows the presence, not the absence of bugs. – Dijkstra",
    "First, solve the problem. Then, write the code. – John Johnson",
    "Code is like humor. When you have to explain it, it’s bad.",
    "Fix the cause, not the symptom. – Steve Maguire",
    "Optimism is an occupational hazard of programming.",
    "Simplicity is the soul of efficiency. – Austin Freeman",
    "Make it work, make it right, make it fast. – Kent Beck",
    "Testing leads to failure, and failure leads to understanding.",
    "The best error message is the one that never shows up.",
    "Automation does not do what testers used to do.",
    "A good tester isn't the one who finds the most bugs.",
    "Precision beats power. Timing beats speed.",
    "If you don't like testing your product, your customers won't like it either.",
    "Discovering the unexpected is more important than confirming the known.",
    "Software never was perfect and won't ever be.",
    "The bitterness of poor quality remains long after the sweetness of low price is forgotten.",
    "Eliminate the impossible, whatever remains must be the truth.",
    "Think twice, code once.",
    "It works on my machine... said no great engineer ever."
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % quotes.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    document.cookie = "firebase-auth-session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.push('/login');
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'QA';
    const names = name.split(' ');
    if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
    return (names[0][0] + (names[names.length - 1]?.[0] || '')).toUpperCase();
  };

  const menuVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { staggerChildren: 0.05, delayChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { x: -10, opacity: 0 },
    visible: { x: 0, opacity: 1 }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-4 sm:px-8">
        {/* Logo Section */}
        <Link href="/dashboard" className="flex items-center space-x-3 group min-w-fit">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/40 rounded-full blur-md group-hover:blur-lg transition-all" />
            <LogoIcon className="h-8 w-8 relative z-10 text-primary-foreground" />
          </div>
          <span className="font-headline text-lg md:text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-zinc-900 via-zinc-700 to-zinc-500 dark:from-white dark:via-white/90 dark:to-white/70">
            Zenit<span className="text-primary font-black">Tracker</span>
          </span>
        </Link>

        {/* Center: Dynamic Quote Ticker */}
        <div className="hidden lg:flex flex-1 mx-8 items-center justify-center max-w-xl">
          <div className="relative flex items-center gap-3 w-full px-4 py-1.5 rounded-full bg-white/5 border border-white/5 overflow-hidden">
            <Sparkles className="w-3 h-3 text-amber-500 animate-pulse-slow" />
            <div className="h-4 w-[1px] bg-white/10" />
            <div className="relative h-5 w-full overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.p
                  key={quoteIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.4 }}
                  className="absolute inset-0 flex items-center text-[11px] font-medium text-muted-foreground/80 truncate w-full"
                >
                  {quotes[quoteIndex]}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center space-x-2 md:space-x-4">

          {/* Quick Access Bar (Pinned Apps) */}
          <div className="hidden md:flex items-center px-2 py-1 bg-white/5 border border-white/10 rounded-full">
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-primary/20 hover:text-primary transition-all" onClick={() => router.push('/test-suite')}>
                    <ClipboardCheck className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="bg-background/90 backdrop-blur-md border-border">Test Suite</TooltipContent>
              </Tooltip>

              <div className="h-4 w-[1px] bg-white/10 mx-1" />

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-indigo-500/20 hover:text-indigo-400" onClick={() => router.push('/dashboard/repository')}>
                    <Library className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="bg-background/90 backdrop-blur-md border-border">Repository</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-pink-500/20 hover:text-pink-400" onClick={() => router.push('/dashboard/locator-studio')}>
                    <FlaskConical className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="bg-background/90 backdrop-blur-md border-border">Locator Lab</TooltipContent>
              </Tooltip>

              <div className="h-4 w-[1px] bg-white/10 mx-1" />

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-blue-500/20 hover:text-blue-400" onClick={() => router.push('/automation')}>
                    <Bot className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="bg-background/90 backdrop-blur-md border-border">Automation Hub</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full ring-2 ring-transparent hover:ring-primary/50 transition-all">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'User'} />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">{getInitials(user.displayName)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-80 p-0 bg-background/95 backdrop-blur-2xl border-white/10 shadow-2xl rounded-2xl mt-2 overflow-hidden"
                align="end"
                forceMount
                asChild
              >
                <motion.div initial="hidden" animate="visible" variants={menuVariants}>
                  <div className="relative p-4 bg-gradient-to-b from-primary/10 via-primary/5 to-transparent border-b border-white/5">
                    <div className="absolute top-0 right-0 p-3 opacity-20"><Fingerprint className="w-16 h-16 text-primary" /></div>
                    <div className="relative z-10 flex gap-4 items-center">
                      <Avatar className="h-12 w-12 border-2 border-primary/20 bg-background">
                        <AvatarImage src={user.photoURL || undefined} />
                        <AvatarFallback className="text-primary font-bold bg-primary/10">{getInitials(user.displayName)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-bold text-base leading-tight">{user.displayName || "Operative"}</h4>
                        <p className="text-xs text-muted-foreground font-mono">{user.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] bg-green-500/20 text-green-600 dark:text-green-400 px-1.5 py-0.5 rounded border border-green-500/20 flex items-center gap-1">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> ONLINE
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-2 grid grid-cols-2 gap-2">
                    <motion.div variants={itemVariants}>
                      <DropdownMenuItem className="flex flex-col items-center justify-center p-3 gap-2 bg-white/5 hover:bg-primary/20 hover:text-primary transition-colors rounded-xl cursor-pointer" onClick={() => router.push('/dashboard')}>
                        <LayoutDashboard className="w-6 h-6 opacity-70" />
                        <span className="text-xs font-medium">Mission Control</span>
                      </DropdownMenuItem>
                    </motion.div>
                    <motion.div variants={itemVariants}>
                      <DropdownMenuItem className="flex flex-col items-center justify-center p-3 gap-2 bg-white/5 hover:bg-primary/20 hover:text-primary transition-colors rounded-xl cursor-pointer" onClick={() => router.push('/test-suite')}>
                        <ClipboardCheck className="w-6 h-6 opacity-70" />
                        <span className="text-xs font-medium">Test Suite</span>
                      </DropdownMenuItem>
                    </motion.div>
                    <motion.div variants={itemVariants}>
                      <DropdownMenuItem className="flex flex-col items-center justify-center p-3 gap-2 bg-white/5 hover:bg-indigo-500/20 hover:text-indigo-400 transition-colors rounded-xl cursor-pointer" onClick={() => router.push('/dashboard/repository')}>
                        <Library className="w-6 h-6 opacity-70" />
                        <span className="text-xs font-medium">Library</span>
                      </DropdownMenuItem>
                    </motion.div>
                    <motion.div variants={itemVariants}>
                      <DropdownMenuItem className="flex flex-col items-center justify-center p-3 gap-2 bg-white/5 hover:bg-pink-500/20 hover:text-pink-400 transition-colors rounded-xl cursor-pointer" onClick={() => router.push('/dashboard/locator-studio')}>
                        <FlaskConical className="w-6 h-6 opacity-70" />
                        <span className="text-xs font-medium">Locator Lab</span>
                      </DropdownMenuItem>
                    </motion.div>
                  </div>

                  <DropdownMenuSeparator className="bg-white/10" />

                  <div className="px-2 py-1">
                    <motion.div variants={itemVariants}>
                      <DropdownMenuItem onClick={() => router.push('/profile')} className="group flex items-center justify-between p-2 rounded-lg cursor-pointer focus:bg-white/5">
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 rounded-md bg-white/5 group-hover:bg-primary/20 transition-colors"><UserCircle className="w-4 h-4 text-muted-foreground group-hover:text-primary" /></div>
                          <span className="text-sm font-medium">Identity</span>
                        </div>
                        <ChevronRight className="w-3 h-3 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                      </DropdownMenuItem>
                    </motion.div>

                    <motion.div variants={itemVariants}>
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger className="group flex items-center justify-between p-2 rounded-lg cursor-pointer focus:bg-white/5 w-full">
                          <div className="flex items-center gap-3">
                            <div className="p-1.5 rounded-md bg-white/5 group-hover:bg-primary/20 transition-colors"><Sun className="w-4 h-4 text-muted-foreground group-hover:text-primary" /></div>
                            <span className="text-sm font-medium">Appearance</span>
                          </div>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                          <DropdownMenuSubContent className="bg-background/95 backdrop-blur-xl border-white/10 ml-2 rounded-xl p-1">
                            <DropdownMenuItem onClick={() => setTheme("light")} className="gap-2 cursor-pointer"><Sun className="w-4 h-4" /> Light</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setTheme("dark")} className="gap-2 cursor-pointer"><Moon className="w-4 h-4" /> Dark</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setTheme("system")} className="gap-2 cursor-pointer"><Monitor className="w-4 h-4" /> System</DropdownMenuItem>
                          </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                      </DropdownMenuSub>
                    </motion.div>

                    <motion.div variants={itemVariants}>
                      <DropdownMenuItem onClick={() => router.push('/about')} className="group flex items-center justify-between p-2 rounded-lg cursor-pointer focus:bg-white/5">
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 rounded-md bg-white/5 group-hover:bg-primary/20 transition-colors"><Info className="w-4 h-4 text-muted-foreground group-hover:text-primary" /></div>
                          <span className="text-sm font-medium">About System</span>
                        </div>
                      </DropdownMenuItem>
                    </motion.div>
                  </div>

                  <div className="p-2 mt-1 bg-red-500/5 border-t border-red-500/10">
                    <motion.div variants={itemVariants}>
                      <DropdownMenuItem onClick={handleLogout} className="flex items-center justify-center gap-2 p-2 text-red-500 hover:bg-red-500/10 hover:text-red-600 rounded-lg cursor-pointer focus:bg-red-500/10 focus:text-red-600 transition-all">
                        <LogOut className="w-4 h-4" />
                        <span className="font-semibold text-xs uppercase tracking-wider">Terminate Session</span>
                      </DropdownMenuItem>
                    </motion.div>
                  </div>
                </motion.div>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}

