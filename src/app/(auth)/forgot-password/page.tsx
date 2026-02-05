"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebaseConfig';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowLeft, Mail, CheckCircle2 } from 'lucide-react';

const forgotPasswordSchema = z.object({
    email: z.string().email({ message: "Invalid email address" }).refine(email => email.endsWith('@sunnetwork.in'), { message: "Only @sunnetwork.in emails are allowed." }),
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
    const { toast } = useToast();
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ForgotPasswordValues>({
        resolver: zodResolver(forgotPasswordSchema),
    });

    const onSubmit = async (data: ForgotPasswordValues) => {
        setError(null);
        try {
            const actionCodeSettings = {
                url: window.location.origin + '/login',
                handleCodeInApp: true,
            };
            await sendPasswordResetEmail(auth, data.email, actionCodeSettings);
            setIsSubmitted(true);
            toast({
                title: "Reset Email Sent",
                description: "Please check your inbox for instructions."
            });
        } catch (err: any) {
            let errorMessage = "Failed to send reset email. Please try again.";
            if (err.code === 'auth/user-not-found') {
                errorMessage = "No account found with this email.";
            }
            setError(errorMessage);
            toast({
                title: "Error",
                description: errorMessage,
                variant: "destructive"
            });
        }
    };


    if (isSubmitted) {
        return (
            <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-center mb-6">
                    <div className="p-4 rounded-full bg-green-50 dark:bg-green-900/10">
                        <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-500" />
                    </div>
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-4">Check Your Email</h2>
                <p className="text-muted-foreground mb-8 text-sm max-w-[280px] mx-auto">
                    We&apos;ve sent a password reset link to your email. Please follow the instructions to create a new password.
                </p>
                <Link href="/login">
                    <Button variant="outline" className="w-full">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Login
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <>
            <div className="flex items-center gap-2 mb-2">
                <Link href="/login" className="text-muted-foreground hover:text-primary transition-colors">
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <h2 className="text-2xl font-bold text-center text-foreground">Reset Password</h2>
            </div>
            <p className="text-muted-foreground text-sm mb-6">
                Enter your @sunnetwork.in email and we&apos;ll send you a link to reset your password.
            </p>

            {error && (
                <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-2">
                    <Mail className="h-4 w-4 mt-0.5 shrink-0" />
                    <p>{error}</p>
                </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                        <Input
                            id="email"
                            type="email"
                            placeholder="you@sunnetwork.in"
                            {...register("email")}
                            autoComplete="email"
                            className="pl-10"
                        />
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                    {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Mail className="mr-2 h-4 w-4" />
                    )}
                    Send Reset Link
                </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
                Remember your password?{' '}
                <Link href="/login" className="font-medium text-primary hover:underline">
                    Sign back in
                </Link>
            </p>
        </>
    );
}
