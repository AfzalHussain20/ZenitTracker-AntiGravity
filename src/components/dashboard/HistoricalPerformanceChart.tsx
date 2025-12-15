"use client";

import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays, isValid } from 'date-fns';
import type { TestSession } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { motion } from 'framer-motion';

interface HistoricalPerformanceChartProps {
    sessions: TestSession[];
}

const chartConfig = {
  pass: { label: "Pass", color: "hsl(var(--chart-2))" },
  fail: { label: "Fail", color: "hsl(var(--destructive))" },
} satisfies ChartConfig;


export default function HistoricalPerformanceChart({ sessions }: HistoricalPerformanceChartProps) {
    const historicalData = useMemo(() => {
        const last30Days = Array.from({ length: 30 }).map((_, i) => subDays(new Date(), i)).reverse();

        return last30Days.map(day => {
            const dayString = day.toDateString();
            const daySessions = sessions.filter(s => {
                const createdAt = s.createdAt as any;
                if (!createdAt) return false;
                const sessionDate = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
                return isValid(sessionDate) && sessionDate.toDateString() === dayString;
            });
            
            const pass = daySessions.reduce((acc, s) => acc + (s.summary?.pass || 0), 0);
            const fail = daySessions.reduce((acc, s) => acc + (s.summary?.fail || 0) + (s.summary?.failKnown || 0), 0);
            
            return {
                date: format(day, 'MMM d'),
                pass,
                fail,
            };
        });
    }, [sessions]);

    const hasData = historicalData.some(d => d.pass > 0 || d.fail > 0);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
        >
            <Card className="transition-all hover:shadow-lg hover:-translate-y-1">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Calendar /> Historical Performance</CardTitle>
                    <CardDescription>Pass vs. Fail trend over the last 30 days.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[250px]">
                        {hasData ? (
                            <ChartContainer config={chartConfig} className="w-full h-full">
                                <AreaChart accessibilityLayer data={historicalData} margin={{ top: 5, right: 20, left: -10, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorPass" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.8}/>
                                            <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0}/>
                                        </linearGradient>
                                        <linearGradient id="colorFail" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.8}/>
                                            <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <XAxis 
                                        dataKey="date" 
                                        tickLine={false} 
                                        axisLine={false} 
                                        stroke="hsl(var(--muted-foreground))" 
                                        fontSize={12}
                                        interval={4} // Show a tick roughly every 5 days
                                    />
                                    <YAxis tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
                                    <ChartTooltip 
                                        cursor={{ stroke: 'hsl(var(--border))', strokeWidth: 1, strokeDasharray: '3 3' }} 
                                        content={<ChartTooltipContent indicator="dot" />} 
                                    />
                                    <Area type="monotone" dataKey="pass" stroke="hsl(var(--chart-2))" strokeWidth={2} fill="url(#colorPass)" isAnimationActive={true} animationDuration={800} />
                                    <Area type="monotone" dataKey="fail" stroke="hsl(var(--destructive))" strokeWidth={2} fill="url(#colorFail)" isAnimationActive={true} animationDuration={800} />
                                </AreaChart>
                            </ChartContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                                <p>Not enough session data to display a trend.</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
