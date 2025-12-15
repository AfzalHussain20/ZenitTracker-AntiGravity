
// This file is no longer used for test case generation but is kept for other potential AI flows.
// If it's not needed, it can be safely removed.

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { config } from 'dotenv';

config();

export const ai = genkit({
  plugins: [googleAI()],
});
