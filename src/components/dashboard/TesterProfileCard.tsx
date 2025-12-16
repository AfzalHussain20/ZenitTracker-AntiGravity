"use client";

import type { User } from 'firebase/auth';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck } from 'lucide-react';

interface TesterProfileCardProps {
  user: User;
}

export default function TesterProfileCard({ user }: TesterProfileCardProps) {
  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'QA';
    const names = name.split(' ');
    if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  };

  return (
    <Card className="glass-panel overflow-hidden relative">
      <div className="h-24 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 dark:from-blue-900/40 dark:to-purple-900/40 absolute top-0 w-full" />
      <CardContent className="pt-16 pb-6 flex flex-col items-center relative z-10">
        <div className="relative">
          <Avatar className="h-24 w-24 ring-4 ring-background shadow-xl">
            <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'User'} />
            <AvatarFallback className="text-3xl bg-primary/10 text-primary font-bold">
              {getInitials(user.displayName)}
            </AvatarFallback>
          </Avatar>
          <div className="absolute bottom-0 right-0 bg-background rounded-full p-1 ring-2 ring-background">
            <ShieldCheck className="w-5 h-5 text-green-500 fill-green-500/20" />
          </div>
        </div>

        <div className="mt-4 text-center">
          <h2 className="text-xl font-bold tracking-tight">{user.displayName || 'QA Commander'}</h2>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>

        <div className="mt-4 flex gap-2">
          <Badge variant="secondary" className="px-3 py-1 bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
            Level 1 Agent
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
