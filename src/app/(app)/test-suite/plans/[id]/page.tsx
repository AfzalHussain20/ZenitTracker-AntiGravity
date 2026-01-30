'use client';

import { PageShell } from '@/components/ui/page-shell';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, FileText, CheckCircle2, BrainCircuit, Activity, History, Zap, AlertTriangle, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { TestService, TestPlan, TestCase } from '@/lib/test-suite-service';
import { useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
import { Progress } from '@/components/ui/progress';

export default function PlanDetailsPage() {
    const params = useParams();
    const id = params?.id as string;
    const [plan, setPlan] = useState<TestPlan | null>(null);
    const [cases, setCases] = useState<TestCase[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            if (!id) return;
            try {
                const planData = await TestService.getPlan(id);
                const casesData = await TestService.getTestCasesByPlan(id);
                setPlan(planData);
                setCases(casesData);
            } catch (error) {
                console.error("Failed to fetch plan details", error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [id]);

    if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
    if (!plan) return <div className="text-center py-20">Plan not found</div>;

    // Use 'status' instead of 'type' for metrics since 'type' is not in the interface
    const readyCount = cases.filter(c => c.status === 'ready').length;
    const readyRate = cases.length > 0 ? Math.round((readyCount / cases.length) * 100) : 0;

    const listVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <PageShell
            title={plan.title}
            description="Strategic testing protocol and architecture."
            actions={
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium px-6 rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95">
                    <Plus className="w-4 h-4 mr-2" />
                    New Definition
                </Button>
            }
        >
            <Tabs defaultValue="architecture" className="space-y-8">
                <TabsList className="bg-background/40 backdrop-blur border border-white/10 p-1 rounded-xl h-auto">
                    <TabsTrigger value="architecture" className="rounded-lg data-[state=active]:bg-primary/20 data-[state=active]:text-primary py-2 px-4">
                        <FileText className="w-4 h-4 mr-2" /> Architecture
                    </TabsTrigger>
                    <TabsTrigger value="intelligence" className="rounded-lg data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400 py-2 px-4">
                        <BrainCircuit className="w-4 h-4 mr-2" /> Zenit Intelligence
                    </TabsTrigger>
                    <TabsTrigger value="execution" className="rounded-lg data-[state=active]:bg-green-500/20 data-[state=active]:text-green-500 py-2 px-4">
                        <Activity className="w-4 h-4 mr-2" /> Live Execution
                    </TabsTrigger>
                </TabsList>

                {/* Architecture Tab */}
                <TabsContent value="architecture" className="space-y-6">
                    <div className="flex items-center gap-4 mb-4">
                        <Card className="glass-panel px-4 py-2 flex items-center gap-3 border-primary/20 bg-primary/5">
                            <div className="p-2 bg-primary/20 rounded-full"><CheckCircle2 className="w-4 h-4 text-primary" /></div>
                            <div>
                                <p className="text-xs text-muted-foreground uppercase font-bold">Coverage</p>
                                <p className="font-mono font-bold text-lg">{cases.length} Nodes</p>
                            </div>
                        </Card>
                        <Card className="glass-panel px-4 py-2 flex items-center gap-3 border-blue-500/20 bg-blue-500/5">
                            <div className="p-2 bg-blue-500/20 rounded-full"><Zap className="w-4 h-4 text-blue-500" /></div>
                            <div>
                                <p className="text-xs text-muted-foreground uppercase font-bold">Ready State</p>
                                <p className="font-mono font-bold text-lg">{readyRate}%</p>
                            </div>
                        </Card>
                    </div>

                    {cases.length === 0 ? (
                        <div className="text-center py-20 border-2 border-dashed border-white/10 rounded-3xl bg-white/5">
                            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-semibold">Protocol Empty</h3>
                            <p className="text-muted-foreground mb-4">Initialize the first test definition for this plan.</p>
                            <Button variant="outline">Initialize</Button>
                        </div>
                    ) : (
                        <motion.div
                            variants={listVariants}
                            initial="hidden"
                            animate="show"
                            className="grid gap-3"
                        >
                            {cases.map((testCase) => (
                                <motion.div key={testCase.id} variants={itemVariants}>
                                    <div className="glass-card-interactive p-4 rounded-xl flex items-center justify-between group cursor-pointer hover:bg-white/5 border border-white/5 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="text-muted-foreground font-mono text-xs opacity-50 text-right w-8">
                                                {/* ID Simulator */}
                                                0{testCase.id?.substring(0, 2) || '00'}
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-base group-hover:text-primary transition-colors">{testCase.title}</h4>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                                    <Badge variant="outline" className="text-[10px] h-5 px-1 bg-white/5 border-white/10">{testCase.priority}</Badge>
                                                    <span>• Last edit: 2 days ago</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            {testCase.status === 'ready' && <Zap className="w-4 h-4 text-blue-400" />}
                                            <div className={`w-2 h-2 rounded-full ${testCase.status === 'ready' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-yellow-500'}`} />
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </TabsContent>

                {/* Intelligence Tab (Next Gen) */}
                <TabsContent value="intelligence">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="glass-panel border-purple-500/20 bg-purple-500/5 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10"><BrainCircuit className="w-32 h-32 text-purple-500" /></div>
                            <CardHeader>
                                <CardTitle className="text-purple-400 flex items-center gap-2"><Sparkles className="w-5 h-5" /> Predictive Failure Analysis</CardTitle>
                                <CardDescription>AI-driven estimation of regression risks.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center text-sm">
                                        <span>Risk Score</span>
                                        <span className="font-mono text-red-400">HIGH (72%)</span>
                                    </div>
                                    <Progress value={72} className="h-2 bg-purple-950" />
                                    <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
                                        Based on recent code commits in `auth-module`, 3 test cases in this plan have a high probability of failure. Recommended action: Run sanity check.
                                    </p>
                                    <Button size="sm" variant="secondary" className="w-full mt-2">Run Smart Sanity</Button>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="glass-panel border-white/10">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><TrendingUp className="w-5 h-5 text-blue-400" /> Optimization Suggestions</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="p-3 rounded-lg bg-white/5 border border-white/5 flex gap-3">
                                    <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                                    <div>
                                        <h5 className="text-sm font-semibold">Redundant Coverage</h5>
                                        <p className="text-xs text-muted-foreground">Cases #12 and #19 cover 90% overlapping logic. Consider merging.</p>
                                    </div>
                                </div>
                                <div className="p-3 rounded-lg bg-white/5 border border-white/5 flex gap-3">
                                    <Zap className="w-5 h-5 text-blue-500 shrink-0" />
                                    <div>
                                        <h5 className="text-sm font-semibold">Automation Candidate</h5>
                                        <p className="text-xs text-muted-foreground">&quot;Login Validation&quot; has been stable for 30 runs. Ready for auto-scripting.</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Execution Tab */}
                <TabsContent value="execution">
                    <Card className="glass-panel">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><History className="w-5 h-5" /> Recent Executions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2 h-10 rounded-full ${i === 1 ? 'bg-red-500' : 'bg-green-500'}`} />
                                            <div>
                                                <p className="font-semibold text-sm">Manual Run #{1000 + i}</p>
                                                <p className="text-xs text-muted-foreground">Executed by: Agent Cooper</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-mono text-sm">24/24 Processed</p>
                                            <p className="text-xs text-muted-foreground opacity-50">2h ago</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </PageShell>
    );
}

function Sparkles({ className }: { className?: string }) {
    return <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /><path d="M5 3v4" /><path d="M9 3v4" /><path d="M3 5h4" /><path d="M3 9h4" /></svg>;
}
