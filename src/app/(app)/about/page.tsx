import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Zap, Shield, Database, LayoutGrid, BrainCircuit } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="p-4 md:p-8 space-y-8 max-w-5xl mx-auto font-sans text-foreground">

      {/* Hero Section */}
      <div className="text-center space-y-4 mb-16">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
          Zenit Antigravity
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          The elite mission control system for QA Orchestration. Designed for precision, speed, and seamless integration.
        </p>
      </div>

      {/* Core Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="shadow-sm hover:shadow-md transition-all border-l-4 border-l-indigo-500">
          <CardHeader>
            <BrainCircuit className="w-8 h-8 text-indigo-500 mb-2" />
            <CardTitle>Universal Behavior Spec</CardTitle>
            <CardDescription>Deterministic Intelligence</CardDescription>
          </CardHeader>
          <CardContent>
            Generate professional, exhaustive test cases (Functional, Security, Edge) from any raw requirement text without AI dependency.
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-all border-l-4 border-l-purple-500">
          <CardHeader>
            <Zap className="w-8 h-8 text-purple-500 mb-2" />
            <CardTitle>Mission Control Runner</CardTitle>
            <CardDescription>Elite Execution Environment</CardDescription>
          </CardHeader>
          <CardContent>
            Execute manual tests with a high-performance runner featuring split-screen navigation, instant sync, and bug tracking integration.
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-all border-l-4 border-l-pink-500">
          <CardHeader>
            <LayoutGrid className="w-8 h-8 text-pink-500 mb-2" />
            <CardTitle>Locator Deep Scan</CardTitle>
            <CardDescription>Heuristic Analysis</CardDescription>
          </CardHeader>
          <CardContent>
            Instantly scan any URL to extract interactive elements and generate robust CSS/XPath selectors automatically.
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-all border-l-4 border-l-blue-500">
          <CardHeader>
            <Database className="w-8 h-8 text-blue-500 mb-2" />
            <CardTitle>Master Library</CardTitle>
            <CardDescription>Secure Repository</CardDescription>
          </CardHeader>
          <CardContent>
            Centralized storage for standardized test protocols using Cloud Firestore. Import/Export JSON support included.
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-all border-l-4 border-l-green-500">
          <CardHeader>
            <Shield className="w-8 h-8 text-green-500 mb-2" />
            <CardTitle>Secure Auth & RBAC</CardTitle>
            <CardDescription>Enterprise Grade</CardDescription>
          </CardHeader>
          <CardContent>
            Role-based access control ensuring restricted viewing rights for Leaders vs. Members. Firebase Integration.
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-all border-l-4 border-l-amber-500">
          <CardHeader>
            <CheckCircle2 className="w-8 h-8 text-amber-500 mb-2" />
            <CardTitle>Real-Time Reporting</CardTitle>
            <CardDescription>Instant Analytics</CardDescription>
          </CardHeader>
          <CardContent>
            Live dashboarding of Pass/Fail metrics, duration tracking, and downloadable PDF reports with visual charts.
          </CardContent>
        </Card>
      </div>

      <div className="mt-16 border-t border-border pt-8 text-center text-muted-foreground text-sm">
        <p>&copy; 2024 Sun Network Digital QA Team. All systems nominal.</p>
        <p className="mt-2 font-mono text-xs opacity-50">Version 3.1.0 build_stable</p>
      </div>
    </div>
  );
}
