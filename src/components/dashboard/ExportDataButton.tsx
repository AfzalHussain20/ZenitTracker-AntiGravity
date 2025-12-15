
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebaseConfig';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import type { TestSession, TestCase, PlatformDetails, TestCaseStatus } from '@/types';
import * as XLSX from 'xlsx';
import { FileDown, Loader2 } from 'lucide-react';
import { format, formatDistanceStrict } from 'date-fns';

interface ExportDataButtonProps {
  userId: string | null;
}

interface SessionExportRow {
  "Session ID": string;
  "Session Date": string;
  "Tester Name": string;
  "Session Duration": string;
  "Platform": PlatformDetails['platformName'];
  "Device Model"?: string;
  "OS Version"?: string;
  "App Version"?: string;
  "Browser Name"?: string;
  "Browser Version"?: string;
  "Custom Platform"?: string;
  "Total Cases": number;
  "Passed": number;
  "Failed (New)": number;
  "Failed (Known)": number;
  "N/A": number;
  "Untested": number;
}

interface TestCaseExportRow {
  "Session ID": string;
  "Tester Name": string;
  "Platform": PlatformDetails['platformName'];
  "Order": number;
  "Test Bed": string;
  "Test Case Title": string;
  "Test Steps": string;
  "Expected Result": string;
  "Actual Result"?: string;
  "Status": TestCase['status'];
  "Bug ID"?: string;
  "N/A Reason"?: string;
  "Notes"?: string;
  "Test Case Last Modified": string;
}

// Helper to calculate column widths
const getColumnWidths = (rows: any[], headers: string[]) => {
  return headers.map(header => {
    const headerWidth = header.length;
    const maxWidth = Math.max(headerWidth, ...rows.map(row => String(row[header] || '').length));
    return { wch: Math.min(Math.max(maxWidth, 10), 80) + 2 }; // Min 10, Max 80 width + padding
  });
};


const styleAndCreateSheet = (rows: any[], headers: string[], sheetType: 'summary' | 'testcases') => {
  const ws = XLSX.utils.json_to_sheet(rows, { header: headers, skipHeader: false });
  const range = XLSX.utils.decode_range(ws['!ref']!);

  const headerStyle = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "2563EB" } }, // A rich, professional blue from Tailwind's blue-600
      alignment: { horizontal: "center", vertical: "center" },
      border: { bottom: { style: 'medium', color: { rgb: "000000" } } }
  };

  const defaultCellStyle = {
      alignment: { vertical: 'top', wrapText: true },
      border: {
          top: { style: 'thin', color: { rgb: "D3D3D3" } },
          bottom: { style: 'thin', color: { rgb: "D3D3D3" } },
          left: { style: 'thin', color: { rgb: "D3D3D3" } },
          right: { style: 'thin', color: { rgb: "D3D3D3" } },
      }
  };
  
  const getRowStyle = (status: TestCaseStatus) => {
      const baseStyle = JSON.parse(JSON.stringify(defaultCellStyle));
      let statusStyle = {};
      switch(status) {
        case 'Pass':
          statusStyle = { fill: { fgColor: { rgb: "C6EFCE" } }, font: { color: { rgb: "006100" } } };
          break;
        case 'Fail':
          statusStyle = { fill: { fgColor: { rgb: "FFC7CE" } }, font: { color: { rgb: "9C0006" }, bold: true } };
          break;
        case 'Fail (Known)':
          statusStyle = { fill: { fgColor: { rgb: "FFEB9C" } }, font: { color: { rgb: "9C5700" } } };
          break;
        case 'N/A':
          statusStyle = { fill: { fgColor: { rgb: "E7E6E6" } }, font: { color: { rgb: "3A3A3A" }, italic: true } };
          break;
        case 'Untested':
          statusStyle = { font: { color: { rgb: "808080" } }};
          break;
        default:
          break;
      }
      return {...baseStyle, ...statusStyle};
  };

  const statusColIndex = sheetType === 'testcases' ? headers.indexOf("Status") : -1;

  for (let R = range.s.r; R <= range.e.r; ++R) {
    let rowStyle: any = null;
    if (sheetType === 'testcases' && R > 0 && statusColIndex !== -1) {
      const statusCellAddress = XLSX.utils.encode_cell({ c: statusColIndex, r: R });
      const status = ws[statusCellAddress]?.v as TestCaseStatus;
      if (status) {
        rowStyle = getRowStyle(status);
      }
    }

    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cell_ref = XLSX.utils.encode_cell({ c: C, r: R });
      if (!ws[cell_ref]) continue;

      if (R === 0) {
        ws[cell_ref].s = headerStyle;
      } else {
        // Apply row-level style for test cases, or default for summary
        ws[cell_ref].s = rowStyle || JSON.parse(JSON.stringify(defaultCellStyle));
      }
    }
  }

  ws['!cols'] = getColumnWidths(rows, headers);
  ws['!autofilter'] = { ref: XLSX.utils.encode_range(range) };
  ws['!views'] = [{state: 'frozen', ySplit: 1}]; // Freeze top row

  return ws;
};


export default function ExportDataButton({ userId }: ExportDataButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    if (!userId) {
      toast({ title: "Error", description: "You must be logged in to export data.", variant: "destructive" });
      return;
    }
    setIsExporting(true);
    try {
      const getValidDate = (d: any): Date | null => {
          if (!d) return null;
          const date = (d as Timestamp).toDate ? (d as Timestamp).toDate() : new Date(d);
          return date instanceof Date && !isNaN(date.getTime()) ? date : null;
      };

      const sessionsQuery = query(collection(db, 'testSessions'), where('userId', '==', userId));
      const sessionsSnapshot = await getDocs(sessionsQuery);
      
      const sessionDocs = sessionsSnapshot.docs;
      sessionDocs.sort((a, b) => {
        const dateA = getValidDate(a.data().createdAt) || new Date(0);
        const dateB = getValidDate(b.data().createdAt) || new Date(0);
        return dateB.getTime() - dateA.getTime();
      });

      const sessionSummaryRows: SessionExportRow[] = [];
      const allTestCaseRows: TestCaseExportRow[] = [];
      
      const summaryHeaders = ["Session ID", "Session Date", "Tester Name", "Session Duration", "Platform", "Device Model", "OS Version", "App Version", "Browser Name", "Browser Version", "Custom Platform", "Total Cases", "Passed", "Failed (New)", "Failed (Known)", "N/A", "Untested"];
      const testCaseHeaders = ["Session ID", "Tester Name", "Platform", "Order", "Test Bed", "Test Case Title", "Test Steps", "Expected Result", "Actual Result", "Status", "Bug ID", "N/A Reason", "Notes", "Test Case Last Modified"];

      for (const sessionDoc of sessionDocs) {
        const sessionData = sessionDoc.data() as TestSession;
        
        const sessionCreatedAt = getValidDate(sessionData.createdAt);
        const sessionCompletedAt = getValidDate(sessionData.completedAt);
        const sessionDuration = sessionCreatedAt && sessionCompletedAt ? formatDistanceStrict(sessionCompletedAt, sessionCreatedAt) : "In Progress";

        sessionSummaryRows.push({
            "Session ID": sessionDoc.id,
            "Session Date": sessionCreatedAt ? format(sessionCreatedAt, "yyyy-MM-dd HH:mm") : "N/A",
            "Tester Name": sessionData.userName,
            "Session Duration": sessionDuration,
            "Platform": sessionData.platformDetails.platformName,
            "Device Model": sessionData.platformDetails.deviceModel,
            "OS Version": sessionData.platformDetails.osVersion,
            "App Version": sessionData.platformDetails.appVersion,
            "Browser Name": sessionData.platformDetails.browserName,
            "Browser Version": sessionData.platformDetails.browserVersion,
            "Custom Platform": sessionData.platformDetails.customPlatformName,
            "Total Cases": sessionData.summary?.total || 0,
            "Passed": sessionData.summary?.pass || 0,
            "Failed (New)": sessionData.summary?.fail || 0,
            "Failed (Known)": sessionData.summary?.failKnown || 0,
            "N/A": sessionData.summary?.na || 0,
            "Untested": sessionData.summary?.untested || 0,
        });

        const sortedTestCases = (sessionData.testCases || []).sort((a,b) => a.orderIndex - b.orderIndex);

        sortedTestCases.forEach(tcData => {
          const tcLastModified = getValidDate(tcData.lastModified);
          
          const row: TestCaseExportRow = {
            "Session ID": sessionDoc.id,
            "Tester Name": sessionData.userName,
            "Platform": sessionData.platformDetails.platformName,
            "Order": tcData.orderIndex + 1,
            "Test Bed": tcData.testBed,
            "Test Case Title": tcData.testCaseTitle,
            "Test Steps": tcData.testSteps,
            "Expected Result": tcData.expectedResult,
            "Actual Result": tcData.actualResult,
            "Status": tcData.status,
            "Bug ID": tcData.bugId,
            "N/A Reason": tcData.naReason,
            "Notes": tcData.notes,
            "Test Case Last Modified": tcLastModified ? format(tcLastModified, "yyyy-MM-dd HH:mm:ss") : "N/A",
          };
          allTestCaseRows.push(row);
        });
      }

      if (sessionSummaryRows.length === 0) {
        toast({ title: "No Data", description: "No test data found to export."});
        setIsExporting(false);
        return;
      }
      
      const workbook = XLSX.utils.book_new();
      
      const summarySheet = styleAndCreateSheet(sessionSummaryRows, summaryHeaders, 'summary');
      XLSX.utils.book_append_sheet(workbook, summarySheet, "Sessions Summary");

      if(allTestCaseRows.length > 0){
        const testCaseSheet = styleAndCreateSheet(allTestCaseRows, testCaseHeaders, 'testcases');
        XLSX.utils.book_append_sheet(workbook, testCaseSheet, "All Test Cases");
      }

      XLSX.writeFile(workbook, `Zenit_QA_Tracker_Report_${format(new Date(), "yyyy-MM-dd")}.xlsx`);

      toast({ title: "Export Successful", description: "Test data has been downloaded." });

    } catch (error) {
      console.error("Error exporting data:", error);
      toast({ title: "Export Failed", description: "An error occurred during export.", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button variant="outline" onClick={handleExport} disabled={isExporting || !userId}>
      {isExporting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <FileDown className="mr-2 h-5 w-5" />}
      Export All Data
    </Button>
  );
}
