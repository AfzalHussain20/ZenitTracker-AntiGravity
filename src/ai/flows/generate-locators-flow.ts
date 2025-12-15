'use server';
/**
 * @fileOverview A deterministic, logic-based locator generator.
 * This file replaces the previous AI-based implementation to ensure reliability and performance.
 */

interface TestCaseTitle {
  id: string;
  title: string;
}

/**
 * Generates a unique, deterministic locator string from a test case title.
 * This creates a simple, readable ID based on the title's content.
 * e.g., "User Login with Valid Credentials" -> "user-login-with-valid-credentials"
 * @param title The title of the test case.
 * @returns A slug-cased string to be used as a locator.
 */
function generateDeterministicLocator(title: string): string {
  return title
    .toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w-]+/g, '') // Remove all non-word chars
    .replace(/--+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, ''); // Trim - from end of text
}


/**
 * Generates locators for a list of test case titles.
 * @param testCases An array of objects, each with an id and title.
 * @returns A record mapping each test case ID to its generated locator.
 */
export async function generateLocatorsFromTestCases(testCases: TestCaseTitle[]): Promise<Record<string, string>> {
  const locators: Record<string, string> = {};

  testCases.forEach(({ id, title }) => {
    if (title) {
        // We append the first 5 chars of the ID to ensure uniqueness in case of duplicate titles
        const uniqueSuffix = id.substring(0, 5);
        locators[id] = `${generateDeterministicLocator(title)}-${uniqueSuffix}`;
    }
  });

  return locators;
}
