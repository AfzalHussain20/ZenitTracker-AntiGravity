
# How to Sync & Deploy Your Zenit Tracker App

This guide provides the step-by-step process to get the corrected code from this cloud development environment, update your local project, and deploy it to the web.

---

## Syncing The Corrected Code to Your Local Machine

The code in this cloud environment has been fixed. The code on your local computer at `D:\Zenit-Tracker` is outdated. The following commands will sync the corrected code from the cloud repository directly to your local folder.

**Run these commands in your local terminal (like PowerShell or VS Code terminal) inside your `D:\Zenit-Tracker` folder.**

1.  **Add the Cloud Repo as a "Remote":**
    *   This command tells your local Git about the cloud repository. You only need to do this once. Give it a name like `firebase-studio`.

    ```bash
    # Replace the URL with the actual URL of your Firebase Studio Git repository
    git remote add firebase-studio YOUR_STUDIO_GIT_REPOSITORY_URL 
    ```
    *   *Note: If you get an error that `firebase-studio` already exists, you can skip this step.*

2.  **Fetch the Code from the Cloud Repo:**
    *   This downloads all the latest branches and commits from the cloud environment without touching your local files yet.

    ```bash
    git fetch firebase-studio
    ```

3.  **Merge the Fixes into Your Main Branch:**
    *   This command merges the changes from the cloud environment's `main` branch into your local `main` branch.

    ```bash
    # Make sure you are on your main branch first
    git checkout main

    # Now, merge the changes
    git merge firebase-studio/main
    ```

Your local code is now up-to-date with all the fixes we have made. You can now proceed with the standard setup and deployment steps from your own computer.

---

## Phase 1: Set Up Your Free Backend (Firebase)

If you have already done this, you can skip to Phase 2. Your app needs a database and user authentication. Firebase's free "Spark Plan" is perfect for this.

1.  **Create Firebase Project:** Go to the [Firebase Console](https://console.firebase.google.com/) and click "Add project". Follow the on-screen steps.

2.  **Enable Authentication Providers:**
    *   In your new project, go to the **Authentication** section -> **Sign-in method** tab.
    *   **Enable Email/Password** and **Enable Google**.

3.  **Authorize Your Domains:**
    *   In the **Authentication** section -> **Settings** tab -> **Authorized domains**.
    *   Click **"Add domain"** and add `localhost`.
    *   Add your development URL (from the browser bar of this environment).
    *   Later, add your production URL from Vercel.

4.  **Set Up Firestore Database & Rules (CRITICAL UPDATE):**
    *   Go to the **Firestore Database** section, create a database in **Production mode**.
    *   Go to the **Rules** tab and replace the existing rules with the following. This update is **required** for the new Team Performance feature and the Test Repository to work correctly.

        ```
        rules_version = '2';
        service cloud.firestore {
          match /databases/{database}/documents {
            
            function isLead() {
                return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'lead';
            }

            match /users/{userId} {
              allow read: if request.auth.uid == userId || isLead();
              allow write: if request.auth.uid == userId;
            }
            
            match /testSessions/{sessionId} {
              allow read: if request.auth.uid == resource.data.userId || isLead();
              allow create, update, delete: if request.auth.uid == request.resource.data.userId;
            }

            match /managedTestCases/{testCaseId} {
                allow read, write: if request.auth != null;
            }
          }
        }
        ```
    *   Click **Publish**.

5.  **Get Your Firebase Keys:**
    *   In your Firebase project, click the gear icon ⚙️ and select **Project settings**.
    *   Scroll down to "Your apps" and click **</>** to register a web app.
    *   Copy the `firebaseConfig` values (`apiKey`, `authDomain`, `projectId`).

## Phase 2: Run the App on Your Computer

1.  **Create `.env.local` File:** In VS Code, create a file named `.env.local` and paste your keys:
    ```
    NEXT_PUBLIC_FIREBASE_API_KEY=YOUR_API_KEY_FROM_FIREBASE
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=YOUR_AUTH_DOMAIN_FROM_FIREBASE
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID_FROM_FIREBASE
    ```
    And if you are using the AI features:
    ```
    HF_API_TOKEN=YOUR_HUGGING_FACE_READ_TOKEN
    ```


2.  **Install & Run:** Open a terminal in VS Code and run `npm install`, then `npm run dev`.

## Phase 3: How to Test the New "Team Performance" Page

1.  **Sign up a new user** in your application. This user will have the default role of 'tester'.
2.  Go to your **Firebase Console** -> **Firestore Database**.
3.  Find the `users` collection.
4.  Click on the document ID that corresponds to the user you want to make a lead.
5.  Find the `role` field and change its value from `"tester"` to `"lead"`. Click **Update**.
6.  Log in to your application as that user. You should now see the "Team Performance" link in the dropdown menu.

You have successfully deployed and configured your application!
