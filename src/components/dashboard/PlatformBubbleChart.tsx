
"use client";

import * as React from 'react';
import { useMemo } from "react";
import type { TestSession } from "@/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Shapes,
  Tv,
  Smartphone,
  Monitor,
  Router,
  type LucideProps,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
} from "recharts";

interface PlatformStats {
  platformName: string;
  total: number;
  pass: number;
  fail: number;
  failKnown: number;
  na: number;
  untested: number;
}

interface PlatformBubbleChartProps {
  sessions: TestSession[];
}

const COLORS = {
    pass: 'hsl(var(--chart-2))',
    fail: 'hsl(var(--destructive))',
    failKnown: 'hsl(var(--chart-4))',
    na: 'hsl(var(--muted-foreground))',
    untested: 'hsl(var(--border))',
};

const getPlatformIcon = (platformName: string): React.ComponentType<LucideProps> => {
  const lower = platformName.toLowerCase();
  if (lower.includes("tv")) return Tv;
  if (lower.includes("mobile")) return Smartphone;
  if (lower.includes("web")) return Monitor;
  if (lower.includes("roku") || lower.includes("fire")) return Router;
  return Shapes;
};

const CustomTooltip = ({ active, payload, coordinate }: any) => {
    if (!active || !payload || !payload.length || !coordinate) {
        return null;
    }
    
    // We get the specific platform data from the first segment of the pie chart
    const platformData = payload[0].payload.platformData as PlatformStats;
    if (!platformData) return null;

    const statsToShow = [
        { label: 'Pass', value: platformData.pass, color: COLORS.pass },
        { label: 'Fail (New)', value: platformData.fail, color: COLORS.fail },
        { label: 'Fail (Known)', value: platformData.failKnown, color: COLORS.failKnown },
        { label: 'N/A', value: platformData.na, color: COLORS.na },
        { label: 'Untested', value: platformData.untested, color: COLORS.untested },
    ].filter(stat => stat.value > 0);

    const tooltipStyle: React.CSSProperties = {
        position: 'fixed',
        top: coordinate.y,
        left: coordinate.x,
        transform: 'translate(-50%, -100%)', // Center above the point
        zIndex: 9999,
        pointerEvents: 'none',
        paddingBottom: '10px' // Add some space so it doesn't touch the bubble
    };

    return (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          style={tooltipStyle}
          className="p-3 w-48 bg-card border border-border/50 shadow-2xl rounded-lg text-card-foreground"
        >
            <p className="font-bold text-base text-primary mb-2 truncate">{platformData.platformName}</p>
            <div className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-1 text-xs">
                {statsToShow.map(stat => (
                    <React.Fragment key={stat.label}>
                        <span className="font-semibold flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stat.color }}></div>
                          {stat.label}:
                        </span>
                        <span className="font-mono text-right">{stat.value}</span>
                    </React.Fragment>
                ))}
            </div>
            <div className="font-bold mt-2 border-t border-border/50 pt-1.5 flex justify-between text-sm">
                <span>Total:</span>
                <span className="font-mono">{platformData.total}</span>
            </div>
        </motion.div>
    );
};


export default function PlatformBubbleChart({ sessions }: PlatformBubbleChartProps) {
  const platformData = useMemo(() => {
    const stats: { [key: string]: PlatformStats } = {};

    sessions.forEach(session => {
        if (!session.summary) return;
        const name = session.platformDetails.platformName;
        if (!stats[name]) {
            stats[name] = { platformName: name, total: 0, pass: 0, fail: 0, failKnown: 0, na: 0, untested: 0 };
        }
        stats[name].total += session.summary.total;
        stats[name].pass += session.summary.pass;
        stats[name].fail += session.summary.fail;
        stats[name].failKnown += session.summary.failKnown;
        stats[name].na += session.summary.na;
        stats[name].untested += session.summary.untested;
    });

    return Object.values(stats).filter(p => p.total > 0).sort((a,b) => b.total - a.total);
  }, [sessions]);

  if (platformData.length === 0) {
     return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Shapes /> Platform Health</CardTitle>
                <CardDescription>Test results breakdown by platform.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center min-h-[250px]">
                <p className="text-muted-foreground">No platform data yet.</p>
            </CardContent>
        </Card>
     );
  }
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 150,
        damping: 20,
      },
    },
  };

  return (
    <Card className="transition-all hover:shadow-lg hover:-translate-y-1 h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <Shapes /> Platform Health
        </CardTitle>
        <CardDescription>
            Hover over a platform to see its test result breakdown.
        </CardDescription>
      </CardHeader>
      <CardContent className="min-h-[300px]">
          <motion.div 
            className="flex flex-wrap gap-x-4 gap-y-12 items-center justify-center p-4 min-h-[250px]"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {platformData.map((platform) => {
              // We inject the platform data into each slice of the pie for the tooltip
              const chartData = [
                { name: 'Pass', value: platform.pass, color: COLORS.pass },
                { name: 'Fail', value: platform.fail, color: COLORS.fail },
                { name: 'Fail (Known)', value: platform.failKnown, color: COLORS.failKnown },
                { name: 'N/A', value: platform.na, color: COLORS.na },
                { name: 'Untested', value: platform.untested, color: COLORS.untested },
              ].filter(d => d.value > 0).map(d => ({ ...d, platformData: platform }));


              const size = Math.max(70, Math.min(120, Math.sqrt(platform.total) * 12));
              const Icon = getPlatformIcon(platform.platformName);

              return (
                <motion.div
                  key={platform.platformName}
                  variants={itemVariants}
                  whileHover={{ scale: 1.1, zIndex: 10, filter: 'drop-shadow(0 0 10px hsl(var(--primary)/0.5))', transition: { duration: 0.2 } }}
                  className="relative flex flex-col items-center justify-center cursor-pointer"
                  style={{ width: size, height: size }}
                >
                    <PieChart width={size} height={size}>
                        <RechartsTooltip 
                            content={<CustomTooltip />} 
                            cursor={{ fill: 'transparent' }}
                            wrapperStyle={{ zIndex: 9999 }}
                            position={{ x: 0, y: 0 }}
                            isAnimationActive={false}
                        />
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={size * 0.35}
                            outerRadius={size * 0.5}
                            dataKey="value"
                            stroke="hsl(var(--card))"
                            strokeWidth={3}
                            paddingAngle={chartData.length > 1 ? 3 : 0}
                            isAnimationActive={true}
                            animationDuration={800}
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} className="focus:outline-none transition-all" />
                            ))}
                        </Pie>
                    </PieChart>
                    
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <Icon className="text-foreground/80" style={{ width: size * 0.4, height: size * 0.4, strokeWidth: 1.5 }}/>
                    </div>
                    
                    <div className="text-center mt-3 absolute -bottom-10 w-full">
                       <p className="text-sm font-medium text-foreground truncate w-full">{platform.platformName}</p>
                       <p className="text-xs text-muted-foreground">{platform.total} cases</p>
                    </div>

                </motion.div>
              );
            })}
          </motion.div>
      </CardContent>
    </Card>
  );
}
