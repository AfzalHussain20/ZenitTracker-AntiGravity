
import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

// Store logs and state
let currentProcess: any = null;
let commandOutput: string[] = [];
let isRunning = false;
let startTime: number = 0;

export async function POST(req: NextRequest) {
    if (isRunning) {
        return NextResponse.json({ message: 'A test is already running.', status: 'running' }, { status: 409 });
    }

    try {
        const body = await req.json();
        const count = body.count || 1;

        // Reset
        commandOutput = [];
        isRunning = true;
        startTime = Date.now();
        commandOutput.push(`Initializing Automation for ${count} account(s)...`);

        const automationDir = path.resolve(process.cwd(), 'automation');
        const toolsDir = path.resolve(process.cwd(), 'tools');
        const javaHome = path.join(toolsDir, 'java_home');
        const mavenHome = path.join(toolsDir, 'maven_home');

        // Path Construction
        const platformPathSeparator = process.platform === 'win32' ? ';' : ':';
        const newPath = `${path.join(mavenHome, 'bin')}${platformPathSeparator}${path.join(javaHome, 'bin')}${platformPathSeparator}${process.env.PATH}`;

        let env = { ...process.env };
        if (fs.existsSync(javaHome) && fs.existsSync(mavenHome)) {
            commandOutput.push(`[SYSTEM] Using Local Tools (Zenit Optimized)`);
            env.JAVA_HOME = javaHome;
            env.PATH = newPath;
        } else {
            commandOutput.push('[SYSTEM] Tools not found. Falling back to global system tools.');
        }

        const mvnCommand = process.platform === 'win32' ? 'mvn.cmd' : 'mvn';

        currentProcess = spawn(mvnCommand, ['test', `-Daccount.count=${count}`], {
            cwd: automationDir,
            shell: true,
            env: env
        });

        currentProcess.stdout.on('data', (data: any) => {
            const lines = data.toString().split('\n');
            lines.forEach((line: string) => {
                if (line.trim()) commandOutput.push(line.trim());
            });
        });

        currentProcess.stderr.on('data', (data: any) => {
            const lines = data.toString().split('\n');
            lines.forEach((line: string) => {
                if (line.trim()) commandOutput.push(`[ERROR] ${line.trim()}`);
            });
        });

        currentProcess.on('close', (code: number) => {
            isRunning = false;
            commandOutput.push(`Process exited with code ${code}`);
            saveReport(commandOutput, code === 0 ? 'SUCCESS' : 'FAILED');
            currentProcess = null;
        });

        return NextResponse.json({ message: 'Automation started successfully', status: 'started' });

    } catch (error: any) {
        isRunning = false;
        return NextResponse.json({ message: 'Failed to start automation', error: error.message }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    if (req.nextUrl.searchParams.get('action') === 'list_reports') {
        const reportsDir = path.resolve(process.cwd(), 'reports');
        if (!fs.existsSync(reportsDir)) return NextResponse.json({ reports: [] });

        const files = fs.readdirSync(reportsDir).filter(f => f.endsWith('.json')).reverse();
        const reports = files.map(file => {
            try {
                const content = fs.readFileSync(path.join(reportsDir, file), 'utf-8');
                return JSON.parse(content);
            } catch (e) { return null; }
        }).filter(Boolean);

        return NextResponse.json({ reports });
    }

    return NextResponse.json({
        isRunning,
        logs: commandOutput
    });
}

function saveReport(logs: string[], status: string) {
    try {
        const reportsDir = path.resolve(process.cwd(), 'reports');
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir);
        }

        // Parse logs for insights
        const steps = logs.filter(l => l.startsWith('[STEP'));
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);

        const report = {
            id: `run-${Date.now()}`,
            timestamp: new Date().toISOString(),
            status,
            duration: `${duration}s`,
            stepsCovered: steps,
            totalLogs: logs.length,
            fullLogs: logs
        };

        fs.writeFileSync(path.join(reportsDir, `${report.id}.json`), JSON.stringify(report, null, 2));
    } catch (e) {
        console.error("Failed to save report", e);
    }
}
