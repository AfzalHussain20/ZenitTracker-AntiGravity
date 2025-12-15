
# Zenit Tracker: Application Documentation

## 1. Introduction

Welcome to Zenit Tracker, a professional Quality Assurance (QA) management application designed to streamline the manual testing process. It allows testers to import test cases from Excel, run through testing sessions on various platforms, and export detailed, professional reports.

This document provides a complete overview of the application's features, user workflows, and technical architecture.

---

## 2. Core Features & User Workflows

### 2.1. Authentication
- **Secure Sign-up & Login:** Users can create an account or log in using either an email/password combination or their Google account.
- **Domain Restriction:** For security, user registration is restricted to `@sunnetwork.in` email addresses.

### 2.2. The Dashboard
The Dashboard is the central hub for all testing activities.
- **Tester Profile:** Displays the logged-in user's name and email.
- **Overall Test Results:** A clean bar chart showing the aggregate results (Pass, Fail, N/A, etc.) of all test cases ever executed, providing a high-level view of product quality.
- **Session Lists:** Sessions are neatly organized into two categories:
  - **Active Sessions:** Includes sessions currently "In Progress" or those that were paused ("Aborted"). Testers can easily find and resume their work from here.
  - **Completed Sessions:** A list of all finished sessions for historical review.
- **Export All Data:** A one-click button to download a complete, professionally formatted Excel report of all test data.

### 2.3. Creating a New Test Session (Step-by-Step)
1.  **Start a New Session:** From the Dashboard, click the "New Session" button.
2.  **Step 1: Platform Details:**
    -   Select the platform you are testing (e.g., "Web", "Android TV", "Roku").
    -   Fill in relevant details like OS Version, App Version, or Browser Version. These details are crucial for bug reporting and will appear in the final report.
3.  **Step 2: Import Test Cases:**
    -   Click "Select Excel File" to upload an `.xlsx` file.
    -   **Required Columns:** The importer requires columns named `Test Case`, `Test Steps`, and `Expected Result`. Column names are case-insensitive.
    -   **Optional Column:** You can include a `Test Bed` column for more specific environment details.
4.  **Step 3: Review & Confirm:**
    -   The app will show a preview of the imported test cases.
    -   Click "Create Session & Start Testing" to begin.

### 2.4. Running a Test Session
This is the main testing interface where testers execute test cases.
- **Navigation:** Use the "Previous" and "Next" buttons to navigate through the list of test cases.
- **Test Case Details:** The current test case's title, steps, and expected result are clearly displayed.
- **Action Buttons:** For each test case, the tester chooses an outcome:
  - **Pass:** Marks the case as successful.
  - **Fail:** Opens a dialog to log failure details. The tester can optionally add a **Bug ID** (e.g., from Jira or another bug tracker) and mark if it's a **Known Issue**.
  - **N/A (Not Applicable):** Opens a dialog to select a reason why the case cannot be tested (e.g., "Feature not available," "Blocked by another bug").
- **Notes & Actual Result:** Testers can add free-form notes and document the actual result for any test case. These fields save automatically.

### 2.5. Completing or Pausing a Session
- **Complete Session Button:** A prominent button is always available.
  - **If all cases are done:** Clicking it marks the session "Completed" and redirects to the detailed results page.
  - **If cases are untested:** Clicking it opens a dialog asking for a reason for pausing (e.g., "Session paused, will resume later"). The session is marked "Aborted" and appears on the dashboard to be resumed later.

### 2.6. Viewing Session Results
-   Completed or Aborted sessions can be viewed from the dashboard.
-   The results page provides a full summary of the session, including platform details, final pass/fail counts, and total duration.
-   It also includes a detailed table of every single test case and its outcome from that session.

### 2.7. Exporting Professional Excel Reports
-   The "Export All Data" button on the dashboard generates a multi-sheet `.xlsx` file.
-   **"Sessions Summary" Sheet:** A high-level overview of every session, including tester name, platform, duration, and summary counts.
-   **"All Test Cases" Sheet:** A detailed, row-by-row log of every single test case from all sessions.
    -   **Professional Styling:** Features themed headers and frozen panes for easy scrolling.
    -   **Conditional Formatting:** Each row is color-coded based on its status (green for Pass, red for Fail, etc.) for excellent readability.
    -   **Filtering Enabled:** Users can sort and filter data by any column directly in Excel.

### 2.8. Progressive Web App (PWA)
- **Installable:** The application can be installed on desktop and mobile devices directly from a compatible browser (like Chrome or Edge) for an app-like experience.
- **Offline Capabilities:** The foundation is in place for future offline support.

---

## 3. Technical Overview
- **Framework:** Next.js (React)
- **Styling:** Tailwind CSS with ShadCN UI components for a modern, responsive interface.
- **Backend & Database:** Google Firebase (Firestore for database, Firebase Authentication for users).
- **Deployment:** Configured for easy deployment with Firebase Hosting.

This architecture is robust, scalable, and cost-effective, making it an excellent foundation for a commercial product.

---

## 4. Next Steps & Monetization Path
To turn this into a revenue-generating product, the following features would be the logical next steps in development:

1.  **User & Team Management:** Allow a primary user (account owner) to invite other testers to their organization.
2.  **Payment Integration:** Integrate a service like **Stripe** to handle subscriptions and manage different pricing tiers.
3.  **Advanced Dashboards:** Create dashboards that provide analytics on tester performance, bug trends, and platform stability over time.
4.  **Third-Party Integrations:** Allow linking Zenit Tracker to tools like Jira, Slack, or GitHub to automatically create bug reports or send notifications.

By building out these features, you can offer tiered subscription plans and build a powerful, commercially viable QA tool.
