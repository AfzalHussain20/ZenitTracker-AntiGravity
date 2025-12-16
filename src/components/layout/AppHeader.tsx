
"use client";

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
import { LogOut, UserCircle, LayoutDashboard, TestTubeDiagonal, Users, Wand2, Library, Info, Sun, Moon, Monitor, FlaskConical } from 'lucide-react';

import { LogoIcon } from '@/components/ui/Logo';

export default function AppHeader() {
  const { user, userRole } = useAuth();
  const { setTheme } = useTheme();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut(auth);
    // Clear the session cookie to ensure middleware recognizes the logout state
    document.cookie = "firebase-auth-session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.push('/login');
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'QA';
    const names = name.split(' ');
    if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <LogoIcon className="h-8 w-8" />
          <span className="font-headline text-xl font-bold text-foreground">Zenit Tracker</span>
        </Link>

        <div className="flex items-center space-x-4">
          <div className="hidden sm:flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/repository')}>
              <Library className="mr-2 h-4 w-4" />
              Repository
            </Button>
            <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/locator-studio')}>
              <FlaskConical className="mr-2 h-4 w-4" />
              Locator Lab
            </Button>
            <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/new-session')}>
              <TestTubeDiagonal className="mr-2 h-4 w-4" />
              New Session
            </Button>
          </div>

          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'User'} />
                    <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.displayName || "QA User"}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/dashboard')}>
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  <span>Dashboard</span>
                </DropdownMenuItem>

                {userRole === 'lead' && (
                  <DropdownMenuItem onClick={() => router.push('/team')}>
                    <Users className="mr-2 h-4 w-4" />
                    <span>Team Performance</span>
                  </DropdownMenuItem>
                )}

                <DropdownMenuItem onClick={() => router.push('/dashboard/repository')}>
                  <Library className="mr-2 h-4 w-4" />
                  <span>Test Repository</span>
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => router.push('/dashboard/locator-studio')}>
                  <FlaskConical className="mr-2 h-4 w-4" />
                  <span>Locator Lab</span>
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => router.push('/dashboard/clevertap-tracker')}>
                  <Wand2 className="mr-2 h-4 w-4" />
                  <span>CleverTap Tracker</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={() => router.push('/profile')}>
                  <UserCircle className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/about')}>
                  <Info className="mr-2 h-4 w-4" />
                  <span>About</span>
                </DropdownMenuItem>

                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Sun className="mr-2 h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute mr-2 h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    <span>Toggle theme</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent>
                      <DropdownMenuItem onClick={() => setTheme("light")}>
                        <Sun className="mr-2 h-4 w-4" />
                        <span>Light</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setTheme("dark")}>
                        <Moon className="mr-2 h-4 w-4" />
                        <span>Dark</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setTheme("system")}>
                        <Monitor className="mr-2 h-4 w-4" />
                        <span>System</span>
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>

                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:bg-destructive/30 focus:text-destructive-foreground">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}

