
"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, db } from '@/lib/firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const signupSchema = z.object({
  displayName: z.string().min(2, { message: "Display name must be at least 2 characters" }),
  email: z.string().email({ message: "Invalid email address" }).refine(email => email.endsWith('@sunnetwork.in'), { message: "Only @sunnetwork.in emails are allowed." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormValues) => {
    setError(null);
    try {
      // Step 1: Create the user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;
      
      // Step 2: Update the user's profile (displayName)
      await updateProfile(user, { displayName: data.displayName });
      
      // Step 3: Create a corresponding user document in Firestore with a default role.
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, {
        uid: user.uid,
        email: user.email,
        displayName: data.displayName,
        createdAt: new Date(),
        role: 'tester', // Assign a default role of 'tester'
      });

      // Step 4: Now that all data is saved, sign the user out to force a clean login.
      await auth.signOut();

      // Step 5: Inform the user and redirect to login page.
      toast({ title: "Account Created", description: "Welcome to Zenit Tracker! Please log in to continue." });
      router.push('/login');

    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError("This email address is already in use. Please try logging in instead.");
      } else {
        console.error("Signup error:", err);
        setError("Failed to create account. Please try again.");
      }
    }
  };
  
  return (
    <>
      <h2 className="text-2xl font-bold text-center text-foreground mb-6">Create Your Account</h2>
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Signup Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="displayName">Full Name</Label>
          <Input 
            id="displayName" 
            type="text" 
            placeholder="Your Name" 
            {...register("displayName")} 
            className={errors.displayName ? 'border-destructive focus-visible:ring-destructive' : ''}
            aria-invalid={errors.displayName ? "true" : "false"}
            autoComplete="name"
          />
          {errors.displayName && <p className="text-xs text-destructive">{errors.displayName.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email Address</Label>
          <Input 
            id="email" 
            type="email" 
            placeholder="you@company.com" 
            {...register("email")} 
            className={errors.email ? 'border-destructive focus-visible:ring-destructive' : ''}
            aria-invalid={errors.email ? "true" : "false"}
            autoComplete="email"
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input 
            id="password" 
            type="password" 
            placeholder="••••••••" 
            {...register("password")} 
            className={errors.password ? 'border-destructive focus-visible:ring-destructive' : ''}
            aria-invalid={errors.password ? "true" : "false"}
            autoComplete="new-password"
          />
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>
        <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Account
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Log in
        </Link>
      </p>
    </>
  );
}
