"use client";

import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { updateProfile } from 'firebase/auth';
import { auth } from '@/lib/firebaseConfig';
import { useToast } from '@/hooks/use-toast';

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [isSaving, setIsSaving] = useState(false);

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'QA';
    const names = name.split(' ');
    if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSaving(true);
    try {
      await updateProfile(user, { displayName });
      toast({ title: "Profile Updated", description: "Your display name has been updated." });
      // Optionally, refresh user state if AuthContext doesn't auto-update displayName reactively
    } catch (error) {
      toast({ title: "Update Failed", description: "Could not update your profile.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  if (!user) {
    return <div className="text-center py-10 text-muted-foreground">Please log in to view your profile.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="shadow-xl">
        <CardHeader className="text-center">
          <Avatar className="h-24 w-24 mx-auto mb-4 ring-2 ring-primary ring-offset-2 ring-offset-background">
            <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'User'} />
            <AvatarFallback className="text-3xl">{getInitials(user.displayName)}</AvatarFallback>
          </Avatar>
          <CardTitle className="text-2xl font-headline">{user.displayName || 'QA Tester'}</CardTitle>
          <CardDescription>{user.email}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileUpdate} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" value={user.email || ''} disabled className="bg-muted/50" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input 
                id="displayName" 
                type="text" 
                value={displayName} 
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your full name" 
              />
            </div>
            <Button type="submit" className="w-full" disabled={isSaving || displayName === user.displayName}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
