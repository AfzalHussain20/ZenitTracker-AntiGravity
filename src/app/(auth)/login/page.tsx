
"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '@/lib/firebaseConfig';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }).refine(email => email.endsWith('@sunnetwork.in'), { message: "Only @sunnetwork.in emails are allowed." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const GoogleIcon = () => (
    <svg viewBox="0 0 24 24" className="h-5 w-5 mr-2">
      <path fill="#4285F4" d="M22.56,12.25C22.56,11.47 22.49,10.72 22.36,10H12V14.5H18.38C18.19,15.99 17.45,17.27 16.28,18.09V21H20.2C21.78,19.38 22.56,17.03 22.56,14.25Z"/>
      <path fill="#34A853" d="M11,23C14.28,23 17.05,21.88 18.98,19.94L15.82,17.53C14.74,18.26 13.04,18.85 11,18.85C7.7,18.85 4.89,16.78 3.93,13.89L0.18,16.4C1.94,19.86 5.06,23 11,23Z"/>
      <path fill="#FBBC05" d="M3.93,13.89C3.74,13.35 3.64,12.76 3.64,12.15C3.64,11.54 3.74,10.95 3.93,10.41L0.18,7.91C-0.61,9.62 -1,11.53 -1,13.5C-1,15.47 -0.61,17.38 0.18,19.09L3.93,13.89Z"/>
      <path fill="#EA4335" d="M11,5.15C12.81,5.15 14.41,5.86 15.71,7.05L19.05,3.71C17.05,1.79 14.28,0.5 11,0.5C5.06,0.5 1.94,3.14 0.18,7.91L3.93,10.41C4.89,7.52 7.7,5.15 11,5.15Z"/>
    </svg>
  );

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
      document.cookie = "firebase-auth-session=true; path=/; max-age=3600"; // Set session cookie
      toast({ title: "Login Successful", description: "Welcome back!" });
      router.push('/dashboard');
    } catch (err: any) {
      let errorMessage = "An unexpected error occurred. Please try again.";
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        errorMessage = "Invalid email or password. Please try again.";
      }
      setError(errorMessage);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setError(null);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      if (!user.email || !user.email.endsWith('@sunnetwork.in')) {
        await auth.signOut();
        throw new Error("Access denied. Only @sunnetwork.in Google accounts are permitted.");
      }
      document.cookie = "firebase-auth-session=true; path=/; max-age=3600"; // Set session cookie
      toast({ title: "Login Successful", description: `Welcome back, ${user.displayName}!` });
      router.push('/dashboard');
    } catch (err: any) {
        if (err.code !== 'auth/popup-closed-by-user') {
            setError(err.message || "An error occurred during Google Sign-In.");
        }
    } finally {
      setIsGoogleLoading(false);
    }
  };


  return (
    <>
      <h2 className="text-2xl font-bold text-center text-foreground mb-6">Login to Your Account</h2>
      {error && (
         <Alert variant="destructive" className="mb-4">
         <AlertTriangle className="h-4 w-4" />
         <AlertTitle>Login Error</AlertTitle>
         <AlertDescription>{error}</AlertDescription>
       </Alert>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input id="email" type="email" placeholder="you@company.com" {...register("email")} autoComplete="email" />
          {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" placeholder="••••••••" {...register("password")} autoComplete="current-password" />
          {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
        </div>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Login
        </Button>
      </form>
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
        </div>
      </div>
      <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isSubmitting || isGoogleLoading}>
        {isGoogleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon />}
        Sign in with Google
      </Button>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Don't have an account?{' '}
        <Link href="/signup" className="font-medium text-primary hover:underline">
          Sign up
        </Link>
      </p>
    </>
  );
}
