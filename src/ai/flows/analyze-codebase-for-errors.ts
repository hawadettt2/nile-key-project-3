'use server';
/**
 * @fileOverview Analyzes a codebase for potential errors, security vulnerabilities, and areas for improvement.
 *
 * - analyzeCodebaseForErrors - A function that analyzes the codebase for errors.
 * - AnalyzeCodebaseForErrorsInput - The input type for the analyzeCodebaseForErrors function.
 * - AnalyzeCodebaseForErrorsOutput - The return type for the analyzeCodebaseForErrors function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeCodebaseForErrorsInputSchema = z.object({
  codebase: z.string().describe('The codebase to analyze.'),
});
export type AnalyzeCodebaseForErrorsInput = z.infer<typeof AnalyzeCodebaseForErrorsInputSchema>;

const AnalyzeCodebaseForErrorsOutputSchema = z.object({
  errors: z.array(z.string()).describe('A list of errors found in the codebase.'),
  vulnerabilities: z.array(z.string()).describe('A list of security vulnerabilities found in the codebase.'),
  improvements: z.array(z.string()).describe('A list of potential improvements for the codebase.'),
});
export type AnalyzeCodebaseForErrorsOutput = z.infer<typeof AnalyzeCodebaseForErrorsOutputSchema>;

export async function analyzeCodebaseForErrors(input: AnalyzeCodebaseForErrorsInput): Promise<AnalyzeCodebaseForErrorsOutput> {
  return analyzeCodebaseForErrorsFlow(input);
}

const analyzeCodebaseForErrorsPrompt = ai.definePrompt({
  name: 'analyzeCodebaseForErrorsPrompt',
  input: {schema: AnalyzeCodebaseForErrorsInputSchema},
  output: {schema: AnalyzeCodebaseForErrorsOutputSchema},
  prompt: `You are a senior software engineer. Analyze the following codebase for potential errors, security vulnerabilities, and areas for improvement. Provide a list of errors, vulnerabilities, and improvements.

Codebase:
{{codebase}}`,
});

const analyzeCodebaseForErrorsFlow = ai.defineFlow(
  {
    name: 'analyzeCodebaseForErrorsFlow',
    inputSchema: AnalyzeCodebaseForErrorsInputSchema,
    outputSchema: AnalyzeCodebaseForErrorsOutputSchema,
  },
  async input => {
    const {output} = await analyzeCodebaseForErrorsPrompt(input);
    return output!;
  }
);
