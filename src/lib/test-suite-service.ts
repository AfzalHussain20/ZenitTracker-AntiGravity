import { db } from './firebaseConfig';
import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDocs,
    getDoc,
    query,
    where,
    serverTimestamp,
    Timestamp
} from 'firebase/firestore';

export interface TestPlan {
    id?: string;
    title: string;
    description: string;
    status: 'active' | 'archived' | 'draft';
    createdAt?: Timestamp;
}

export interface TestCase {
    id?: string;
    planId: string;
    title: string;
    steps: string;
    expectedResult: string;
    priority: 'P0' | 'P1' | 'P2';
    status: 'draft' | 'ready' | 'obsolete';
    createdAt?: Timestamp;
}

export const TestService = {
    // Test Plans
    createPlan: async (plan: Omit<TestPlan, 'id' | 'createdAt'>) => {
        if (!db) throw new Error("Firestore not initialized");
        return addDoc(collection(db, 'test_plans'), {
            ...plan,
            createdAt: serverTimestamp()
        });
    },

    getPlans: async () => {
        if (!db) return [];
        const q = query(collection(db, 'test_plans'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TestPlan));
    },

    getPlan: async (id: string) => {
        if (!db) throw new Error("Firestore not initialized");
        const docRef = doc(db, 'test_plans', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as TestPlan;
        }
        return null;
    },

    // Test Cases
    createTestCase: async (testCase: Omit<TestCase, 'id' | 'createdAt'>) => {
        if (!db) throw new Error("Firestore not initialized");
        return addDoc(collection(db, 'test_cases'), {
            ...testCase,
            createdAt: serverTimestamp()
        });
    },

    getTestCasesByPlan: async (planId: string) => {
        if (!db) return [];
        const q = query(collection(db, 'test_cases'), where('planId', '==', planId));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TestCase));
    }
};
