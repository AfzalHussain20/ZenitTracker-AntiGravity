
"use client";
import { useMemo } from "react";
import { Bar, BarChart as RechartsBarChart, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip, Cell } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from 'lucide-react';
import type { TestSession } from '@/types';


interface OverallStatsChartProps {
    sessions: TestSession[];
}

const chartConfig = {
  pass: { label: "Pass", color: "hsl(var(--chart-2))" },
  fail: { label: "Fail (New)", color: "hsl(var(--destructive))" },
  failKnown: { label: "Fail (Known)", color: "hsl(var(--chart-4))" },
  na: { label: "N/A", color: "hsl(var(--muted-foreground))" },
} satisfies ChartConfig;

export default function OverallStatsChart({ sessions }: OverallStatsChartProps) {
  const overallStats = useMemo(() => {
    return sessions.reduce(
        (acc, session) => {
          acc.pass += session.summary?.pass || 0;
          acc.fail += session.summary?.fail || 0;
          acc.failKnown += session.summary?.failKnown || 0;
          acc.na += session.summary?.na || 0;
          acc.untested += session.summary?.untested || 0;
          acc.total += session.summary?.total || 0;
          return acc;
        },
        { pass: 0, fail: 0, failKnown: 0, na: 0, untested: 0, total: 0 }
      );
  }, [sessions]);


  const chartData = [
      { name: 'Pass', value: overallStats.pass, fill: chartConfig.pass.color },
      { name: 'Fail (New)', value: overallStats.fail, fill: chartConfig.fail.color },
      { name: 'Fail (Known)', value: overallStats.failKnown, fill: chartConfig.failKnown.color },
      { name: 'N/A', value: overallStats.na, fill: chartConfig.na.color },
  ].filter(item => item.value > 0);
  
  const hasData = overallStats.total > 0;

  return (
    <Card className="transition-all hover:shadow-lg hover:-translate-y-1">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <TrendingUp /> Overall Test Results
        </CardTitle>
        <CardDescription>
            A summary of all test cases across all your sessions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
            {hasData ? (
                 <ChartContainer config={chartConfig} className="w-full h-full">
                    <RechartsBarChart accessibilityLayer data={chartData} layout="vertical" margin={{ left: 20, right: 20, top: 0, bottom: 0 }}>
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }} dx={-10} width={80} />
                        <RechartsTooltip cursor={false} content={<ChartTooltipContent hideLabel indicator="line" />} />
                        <Bar dataKey="value" layout="vertical" radius={5} barSize={16} isAnimationActive={true} animationDuration={800}>
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                        </Bar>
                    </RechartsBarChart>
                </ChartContainer>
            ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                    <p>No test results yet. Start a session to see stats.</p>
                </div>
            )}
        </div>
      </CardContent>
    </Card>
  );
}

    
