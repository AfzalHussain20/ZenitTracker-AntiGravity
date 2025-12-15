
'use server';

import { collection, getDocs, query } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { generateLocatorsFromTestCases } from "@/ai/flows/generate-locators-flow";
import type { ManagedTestCase } from "@/types";

interface GenerationResult {
    locators?: Record<string, string>;
    error?: string;
    count: number;
}

/**
 * Fetches all managed test cases from Firestore and generates deterministic locators for them.
 * This is a server action and is safe to use in client components.
 */
export async function performLocatorGeneration(): Promise<GenerationResult> {
    try {
        const testCasesQuery = query(collection(db, "managedTestCases"));
        const querySnapshot = await getDocs(testCasesQuery);

        if (querySnapshot.empty) {
            return { count: 0 };
        }

        const testCases = querySnapshot.docs.map(doc => ({
            id: doc.id,
            title: (doc.data() as ManagedTestCase).title,
        }));

        const locators = generateLocatorsFromTestCases(testCases);
        
        return { locators, count: testCases.length };

    } catch (error: any) {
        console.error("Error during locator generation:", error);
        // This is a common error if the Firestore rules are not set up correctly.
        if (error.code === 'permission-denied') {
            return { error: "Firebase permission denied. Please ensure security rules allow reading the 'managedTestCases' collection.", count: 0 };
        }
        return { error: "An unexpected error occurred while generating locators.", count: 0 };
    }
}
