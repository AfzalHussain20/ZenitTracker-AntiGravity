"use client";

import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Fingerprint, Shield, Mail, User, Save, Edit3, Radar, Zap } from 'lucide-react';
import { useState } from 'react';
import { updateProfile } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { PageShell } from '@/components/ui/page-shell';
import { motion } from 'framer-motion';

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'QA';
    const names = name.split(' ');
    if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
    return (names[0][0] + (names[names.length - 1]?.[0] || '')).toUpperCase();
  };

  const handleProfileUpdate = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      await updateProfile(user, { displayName });
      toast({ title: "Identity Updated", description: "Agent profile synced with mainframe." });
      setIsEditing(false);
    } catch (error) {
      toast({ title: "Sync Failed", description: "Could not update identity.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  if (!user) return <div className="text-center py-20">Access Denied</div>;

  return (
    <PageShell title="Agent Dossier" description="Personnel identity and clearance management.">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

        {/* Left: ID Card Panel */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="md:col-span-1"
        >
          <Card className="glass-panel overflow-hidden border-primary/20 relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-purple-500" />
            <div className="absolute top-4 right-4 animate-pulse">
              <Shield className="w-5 h-5 text-primary" />
            </div>

            <div className="p-8 flex flex-col items-center text-center">
              <div className="relative mb-6">
                <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse-slow" />
                <Avatar className="h-32 w-32 ring-4 ring-background shadow-2xl relative z-10">
                  <AvatarImage src={user.photoURL || undefined} />
                  <AvatarFallback className="text-4xl font-bold bg-primary/10 text-primary">{getInitials(user.displayName)}</AvatarFallback>
                </Avatar>
                <div className="absolute bottom-0 right-0 bg-background rounded-full p-2 border border-border shadow-lg z-20">
                  <Fingerprint className="w-5 h-5 text-green-500" />
                </div>
              </div>

              <h2 className="text-2xl font-headline font-bold mb-1">{user.displayName || 'Unknown Agent'}</h2>
              <div className="px-3 py-1 bg-primary/10 rounded-full border border-primary/20 text-xs font-mono text-primary mb-6">
                LEVEL 5 CLEARANCE
              </div>

              <div className="w-full grid grid-cols-2 gap-4 text-left border-t border-border/50 pt-6">
                <div>
                  <span className="text-[10px] uppercase text-muted-foreground font-semibold">Role</span>
                  <p className="font-medium text-sm">QA Engineer</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-muted-foreground font-semibold">Status</span>
                  <p className="font-medium text-sm text-green-500 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> Active</p>
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] uppercase text-muted-foreground font-semibold">ID Hash</span>
                  <p className="font-mono text-xs opacity-70 truncate">{user.uid}</p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Right: Edit & Stats */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="md:col-span-2 space-y-6"
        >
          {/* Edit Profile */}
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Identity Configuration</CardTitle>
                <CardDescription>Update your personal designation.</CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsEditing(!isEditing)}>
                <Edit3 className="w-4 h-4 text-muted-foreground" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label className="text-xs uppercase font-semibold text-muted-foreground flex items-center gap-2">
                    <Mail className="w-3 h-3" /> Digital Contact
                  </Label>
                  <Input value={user.email || ''} disabled className="bg-muted/50 font-mono text-sm" />
                </div>

                <div className="grid gap-2">
                  <Label className="text-xs uppercase font-semibold text-muted-foreground flex items-center gap-2">
                    <User className="w-3 h-3" /> Designation
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      disabled={!isEditing}
                      className={`bg-background transition-all ${isEditing ? 'ring-2 ring-primary/20 border-primary' : ''}`}
                    />
                    {isEditing && (
                      <Button onClick={handleProfileUpdate} disabled={isSaving}>
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats / Skills */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="bg-background/40 backdrop-blur border border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500"><Zap className="w-5 h-5" /></div>
                  <h3 className="font-bold">Efficiency Rating</h3>
                </div>
                <div className="text-3xl font-headline font-bold">94.2%</div>
                <p className="text-xs text-muted-foreground mt-1">Top 5% of operatives</p>
                <div className="mt-4 h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 w-[94.2%]" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-background/40 backdrop-blur border border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-500"><Radar className="w-5 h-5" /></div>
                  <h3 className="font-bold">Test Coverage</h3>
                </div>
                <div className="text-3xl font-headline font-bold">1,204</div>
                <p className="text-xs text-muted-foreground mt-1">Cases execution lifetime</p>
                <div className="mt-4 h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 w-[78%]" />
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    </PageShell>
  );
}
