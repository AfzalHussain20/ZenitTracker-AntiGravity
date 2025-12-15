
"use client";

import type { User } from 'firebase/auth';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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
    <Card className="transition-all hover:shadow-lg hover:-translate-y-1">
      <CardHeader className="items-center text-center p-4">
        <Avatar className="h-16 w-16 mb-3 ring-2 ring-primary ring-offset-2 ring-offset-background">
          <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'User'} />
          <AvatarFallback className="text-2xl bg-card">
             { getInitials(user.displayName) }
          </AvatarFallback>
        </Avatar>
        <CardTitle className="text-lg font-headline">{user.displayName || 'QA Tester'}</CardTitle>
        <CardDescription className="text-xs">{user.email}</CardDescription>
      </CardHeader>
    </Card>
  );
}
