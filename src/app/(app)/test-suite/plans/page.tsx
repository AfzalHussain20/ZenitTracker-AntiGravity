'use client';

import { PageShell } from '@/components/ui/page-shell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, FolderOpen, Calendar, MoreVertical } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { TestService, TestPlan } from '@/lib/test-suite-service';
import { format } from 'date-fns';

export default function TestPlansPage() {
    const [plans, setPlans] = useState<TestPlan[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchPlans() {
            try {
                const data = await TestService.getPlans();
                setPlans(data);
            } catch (error) {
                console.error("Failed to fetch plans", error);
            } finally {
                setLoading(false);
            }
        }
        fetchPlans();
    }, []);

    const container = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <PageShell
            title="Test Plans"
            description="Organize your testing efforts into comprehensive plans."
            actions={
                <Link href="/test-suite/plans/new">
                    <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl shadow-lg shadow-primary/20">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Plan
                    </Button>
                </Link>
            }
        >
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-40 rounded-xl bg-muted/50 animate-pulse" />
                    ))}
                </div>
            ) : plans.length === 0 ? (
                <div className="text-center py-20 bg-muted/20 rounded-2xl border border-dashed border-muted-foreground/20">
                    <FolderOpen className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                    <h3 className="text-xl font-semibold mb-2">No Test Plans Yet</h3>
                    <p className="text-muted-foreground mb-6">Create your first test plan to get started.</p>
                    <Link href="/test-suite/plans/new">
                        <Button variant="outline">Create Plan</Button>
                    </Link>
                </div>
            ) : (
                <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                    {plans.map((plan) => (
                        <motion.div key={plan.id} variants={item}>
                            <Link href={`/test-suite/plans/${plan.id}`}>
                                <Card className="glass-card h-full flex flex-col justify-between group cursor-pointer border-l-4 border-l-transparent hover:border-l-primary transition-all">
                                    <CardHeader>
                                        <div className="flex justify-between items-start">
                                            <div className="p-2 bg-primary/10 rounded-lg text-primary mb-3">
                                                <FolderOpen className="w-5 h-5" />
                                            </div>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 -mt-2 -mr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <MoreVertical className="w-4 h-4" />
                                            </Button>
                                        </div>
                                        <CardTitle className="line-clamp-1 group-hover:text-primary transition-colors">{plan.title}</CardTitle>
                                        <CardDescription className="line-clamp-2">{plan.description}</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center text-xs text-muted-foreground gap-2 pt-4 border-t border-border/50">
                                            <Calendar className="w-3 h-3" />
                                            {plan.createdAt ? format(plan.createdAt.toDate(), 'PPP') : 'Just now'}
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        </motion.div>
                    ))}
                </motion.div>
            )}
        </PageShell>
    );
}
