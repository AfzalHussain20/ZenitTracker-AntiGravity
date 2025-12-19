"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import type { TestSession, TestCase } from '@/types';
import { db } from '@/lib/firebaseConfig';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, CheckCircle2, XCircle, AlertTriangle, Printer, Download, Clock, BarChart3, Calendar } from 'lucide-react';
import { format, formatDistanceStrict } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

export default function TestSessionResultPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  const { user } = useAuth();
  const [session, setSession] = useState<TestSession | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper to ensure dates are valid objects
  const getValidDate = (d: any): Date | null => {
    if (!d) return null;
    if (d instanceof Date) return d;
    if (d?.toDate) return d.toDate(); // Firestore Timestamp
    const date = new Date(d);
    return isNaN(date.getTime()) ? null : date;
  };

  useEffect(() => {
    if (!sessionId || !user) return;
    const fetchSessionData = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, 'testSessions', sessionId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          setSession({
            id: snap.id,
            ...data,
            createdAt: getValidDate(data.createdAt),
            completedAt: getValidDate(data.completedAt),
            testCases: (data.testCases || []).map((tc: any) => ({
              ...tc, lastModified: getValidDate(tc.lastModified)
            }))
          } as TestSession);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchSessionData();
  }, [sessionId, user]);

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div>;
  if (!session) return <div className="p-8 text-center text-muted-foreground">Report unavailable.</div>;

  // --- REAL-TIME CALCULATION (Fixes Data Sync Issues) ---
  const passed = session.testCases.filter(tc => tc.status === 'Pass').length;
  const failed = session.testCases.filter(tc => tc.status.includes('Fail')).length;
  const na = session.testCases.filter(tc => tc.status === 'N/A').length;
  const total = session.testCases.length;
  const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;

  const duration = session.createdAt && session.completedAt
    ? formatDistanceStrict(session.completedAt as Date, session.createdAt as Date)
    : "Ongoing";

  const chartData = [
    { name: 'Passed', value: passed, color: '#22c55e' },
    { name: 'Failed', value: failed, color: '#ef4444' },
    { name: 'N/A', value: na, color: '#94a3b8' },
  ].filter(x => x.value > 0);

  return (
    <div className="min-h-screen bg-muted/10 p-4 md:p-8 font-sans text-foreground">

      {/* Header */}
      <div className="max-w-[1400px] mx-auto space-y-8">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-background p-6 rounded-xl border border-border shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')} className="-ml-2 h-8">
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </Button>
              <Badge variant="outline" className="font-mono text-xs text-muted-foreground">ID: {session.id.substring(0, 8)}</Badge>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">{session.platformDetails.platformName} Report</h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
              <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {session.createdAt ? format(session.createdAt as Date, 'PPP') : 'N/A'}</span>
              <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> Duration: {duration}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.print()}><Printer className="w-4 h-4 mr-2" /> Print</Button>
            <Button variant="default"><Download className="w-4 h-4 mr-2" /> Export PDF</Button>
          </div>
        </header>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-green-500 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Success Rate</CardTitle></CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{passRate}%</div>
              <p className="text-xs text-green-600 mt-1">Overall Quality Score</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-blue-500 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Executed</CardTitle></CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{total}</div>
              <p className="text-xs text-muted-foreground mt-1">Test Cases</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-red-500 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Defects Found</CardTitle></CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{failed}</div>
              <p className="text-xs text-red-500 mt-1">Critical Issues</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-gray-500 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Ignored / N/A</CardTitle></CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{na}</div>
              <p className="text-xs text-muted-foreground mt-1">Skipped Scenarios</p>
            </CardContent>
          </Card>
        </div>

        {/* Analytics & Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Detailed Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]">ID</TableHead>
                    <TableHead>Test Scenario</TableHead>
                    <TableHead className="w-[120px]">Status</TableHead>
                    <TableHead>Remarks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {session.testCases.map((tc, i) => (
                    <TableRow key={tc.id}>
                      <TableCell className="font-mono text-xs text-muted-foreground">{String(i + 1).padStart(2, '0')}</TableCell>
                      <TableCell>
                        <div className="font-medium text-sm">{tc.testCaseTitle}</div>
                        {tc.bugId && <Badge variant="outline" className="mt-1 text-xs border-red-200 text-red-500">Bug: {tc.bugId}</Badge>}
                      </TableCell>
                      <TableCell>
                        {tc.status === 'Pass' && <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-none px-2 shadow-none"><CheckCircle2 className="w-3 h-3 mr-1" /> Pass</Badge>}
                        {tc.status.includes('Fail') && <Badge className="bg-red-100 text-red-700 hover:bg-red-200 border-none px-2 shadow-none"><XCircle className="w-3 h-3 mr-1" /> Fail</Badge>}
                        {(tc.status === 'N/A' || tc.status === 'Untested') && <Badge variant="secondary" className="bg-gray-100 text-gray-600 px-2 shadow-none"><AlertTriangle className="w-3 h-3 mr-1" /> {tc.status}</Badge>}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                        {tc.notes || tc.naReason || tc.actualResult || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="shadow-sm bg-card">
            <CardHeader><CardTitle>Distribution</CardTitle></CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%" cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    strokeWidth={5}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="hsl(var(--card))" />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
