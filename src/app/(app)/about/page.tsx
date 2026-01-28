'use client';

import { PageShell } from '@/components/ui/page-shell';
import { Card, CardContent } from '@/components/ui/card';
import { Activity, Brain, Shield, Zap, LayoutGrid, Terminal, Cpu, Globe, Server, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AboutPage() {
  const stats = [
    { label: "System Uptime", value: "99.99%", icon: Activity, color: "text-green-500" },
    { label: "Execution Speed", value: "< 50ms", icon: Zap, color: "text-amber-500" },
    { label: "Security Level", value: "Tier 1", icon: Shield, color: "text-blue-500" }
  ];

  const technologies = [
    { name: "Next.js 14", icon: Globe, desc: "React Framework" },
    { name: "Firebase", icon: Server, desc: "Real-time Backend" },
    { name: "Tailwind CSS", icon: LayoutGrid, desc: "Styling Engine" },
    { name: "Framer Motion", icon: Zap, desc: "Animation Library" },
    { name: "TypeScript", icon: Terminal, desc: "Type Safety" },
    { name: "Zenit AI", icon: Brain, desc: "Intelligence Core" }
  ];

  const features = [
    {
      title: "Universal Behavior Spec",
      description: "Generate professional, exhaustive test cases (Functional, Security, Edge) from any raw requirement text without AI dependency.",
      icon: Brain
    },
    {
      title: "Mission Control Runner",
      description: "Execute manual tests with a high-performance runner featuring split-screen navigation, instant sync, and bug tracking integration.",
      icon: Zap
    },
    {
      title: "Locator Deep Scan",
      description: "Instantly scan any URL to extract interactive elements and generate robust CSS/XPath selectors automatically.",
      icon: LayoutGrid
    },
    {
      title: "Secure Auth & RBAC",
      description: "Role-based access control ensuring restricted viewing rights for Leaders vs. Members. Firebase Integration.",
      icon: Shield
    }
  ];

  return (
    <PageShell
      title="System Status"
      description="Operational parameters and core directives of the Zenit Antigravity platform."
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Column: Mission & Stats */}
        <div className="lg:col-span-2 space-y-8">
          {/* Hero Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative overflow-hidden rounded-3xl p-8 bg-gradient-to-br from-indigo-900/50 via-purple-900/50 to-background border border-white/10 shadow-2xl"
          >
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.05]" />
            <h2 className="text-3xl font-headline font-bold text-white mb-4">Elite Mission Control</h2>
            <p className="text-lg text-indigo-100/80 leading-relaxed max-w-2xl">
              Zenit Antigravity is the pinnacle of QA Orchestration. Designed for precision, speed, and seamless integration, it serves as the central nervous system for high-velocity engineering teams.
            </p>
          </motion.div>

          {/* Directives Grid */}
          <div>
            <h3 className="text-xl font-headline font-semibold mb-6 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-primary" /> Core Directives
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {features.map((feature, i) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="glass-card hover:bg-white/5 border-white/5 h-full">
                    <CardContent className="p-6">
                      <div className="mb-4 p-3 bg-primary/10 w-fit rounded-xl text-primary">
                        <feature.icon className="w-6 h-6" />
                      </div>
                      <h4 className="font-bold text-lg mb-2">{feature.title}</h4>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Vitals & Tech */}
        <div className="space-y-8">
          {/* Vitals */}
          <Card className="glass-panel border-white/10">
            <div className="p-6 space-y-6">
              <h3 className="font-headline font-semibold text-lg flex items-center gap-2">
                <Activity className="w-5 h-5 text-green-500" /> Live Vitals
              </h3>
              <div className="space-y-4">
                {stats.map((stat, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                    <div className="flex items-center gap-3">
                      <stat.icon className={`w-4 h-4 ${stat.color}`} />
                      <span className="text-sm font-medium">{stat.label}</span>
                    </div>
                    <span className="font-mono font-bold">{stat.value}</span>
                  </div>
                ))}
              </div>
              <div className="pt-4 border-t border-white/10">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                  <span>System Load</span>
                  <span>12%</span>
                </div>
                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 w-[12%] rounded-full animate-pulse" />
                </div>
              </div>
            </div>
          </Card>

          {/* Tech Stack */}
          <div className="bg-background/40 backdrop-blur-md rounded-3xl p-6 border border-white/10">
            <h3 className="font-headline font-semibold text-lg mb-4 flex items-center gap-2">
              <Terminal className="w-5 h-5 text-purple-500" /> Technology Stack
            </h3>
            <div className="space-y-3">
              {technologies.map((tech, i) => (
                <div key={i} className="flex items-center gap-3 group">
                  <div className="p-2 rounded-lg bg-white/5 group-hover:bg-primary/20 transition-colors">
                    <tech.icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold group-hover:text-primary transition-colors">{tech.name}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">{tech.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center">
            <p className="text-xs text-muted-foreground/50 font-mono">
              ZENIT OS v3.1.0 (Build 4920) <br />
              &copy; 2024 Sun Network Digital
            </p>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
