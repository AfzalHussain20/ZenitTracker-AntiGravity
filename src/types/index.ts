import { Timestamp } from "firebase/firestore";

export type Platform = 
  | "Android TV" 
  | "Apple TV" 
  | "Fire TV"
  | "LG TV"
  | "Samsung TV"
  | "Roku" 
  | "Web" 
  | "Mobile (Android)" 
  | "Mobile (iOS)" 
  | "Other";

export interface PlatformDetails {
  platformName: Platform;
  deviceModel?: string;
  osVersion?: string;
  appVersion?: string;
  browserName?: string; // For Web
  browserVersion?: string; // For Web
  customPlatformName?: string; // If Platform is "Other"
}

export type TestCaseStatus = "Pass" | "Fail" | "N/A" | "Untested" | "Fail (Known)";

export interface TestCase {
  id: string; // Will be a unique ID within the session, e.g., a timestamp-based string
  orderIndex: number; // To preserve original order from Excel
  testBed: string;
  testCaseTitle: string; // "Test Case" from Excel
  testSteps: string;
  expectedResult: string;
  actualResult?: string;
  notes?: string;
  status: TestCaseStatus;
  bugId?: string; // If status is "Fail" or "Fail (Known)"
  naReason?: string; // If status is "N/A"
  attachments?: string[]; // URLs to attachments if any
  lastModified: Date | Timestamp;
}

export interface TestSession {
  id: string; // Firestore document ID
  userId: string;
  userName: string; // Name of the tester
  platformDetails: PlatformDetails;
  testCases: TestCase[]; // Test cases are now an array within the session document
  status: "In Progress" | "Completed" | "Aborted";
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
  completedAt?: Date | Timestamp; // To track total session time
  summary?: {
    total: number;
    pass: number;
    fail: number;
    na: number;
    untested: number;
    failKnown: number;
  };
  reasonForIncompletion?: string;
}

export interface UserProfile {
    uid: string;
    email: string;
    displayName: string;
    createdAt: Date | Timestamp;
    role: 'tester' | 'lead';
    photoURL?: string;
}

export type ManagedTestCasePriority = "High" | "Medium" | "Low";
export type ManagedTestCaseStatus = 'Pass' | 'Fail' | 'Blocked' | 'Not Run';

export interface ManagedTestCase {
  id: string;
  title: string;
  module: string;
  priority: ManagedTestCasePriority;
  status: ManagedTestCaseStatus;
  preconditions?: string;
  testData?: string;
  testSteps: string[];
  expectedResult: string;
  automationTag?: string;
  lastUpdatedBy: string;
  lastUpdatedByUid: string;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
  // Fields for PRD extraction
  source?: 'PRD' | 'Manual' | 'AI';
  phase?: string;
}
