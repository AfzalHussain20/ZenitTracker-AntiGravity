'use client';

import { PageShell } from '@/components/ui/page-shell';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { TestService } from '@/lib/test-suite-service';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';

const formSchema = z.object({
    title: z.string().min(2, {
        message: "Title must be at least 2 characters.",
    }),
    description: z.string().optional(),
});

export default function CreateTestPlanPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: "",
            description: "",
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setLoading(true);
        try {
            await TestService.createPlan({
                title: values.title,
                description: values.description || "",
                status: 'active'
            });
            router.push('/test-suite/plans');
            router.refresh();
        } catch (error) {
            console.error("Failed to create plan", error);
            // Ideally show toast here
        } finally {
            setLoading(false);
        }
    }

    return (
        <PageShell
            title="Create Test Plan"
            description="Define a new scope for your testing activities."
        >
            <div className="max-w-2xl mx-auto">
                <Card className="glass-panel p-6">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                            <FormField
                                control={form.control}
                                name="title"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Plan Title</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g., Q1 Release Regression" {...field} className="glass-input text-lg" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Description</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Describe the scope and objectives..."
                                                className="glass-input min-h-[120px] resize-none"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="flex justify-end gap-4">
                                <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
                                <Button type="submit" disabled={loading} className="min-w-[120px]">
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                    {loading ? "Creating..." : "Create Plan"}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </Card>
            </div>
        </PageShell>
    );
}
