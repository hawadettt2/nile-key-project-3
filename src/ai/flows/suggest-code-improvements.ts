
'use server';

/**
 * @fileOverview Suggests improvements to the codebase, such as refactoring opportunities or more efficient algorithms.
 *
 * - suggestCodeImprovements - A function that handles the code improvement suggestion process.
 * - SuggestCodeImprovementsInput - The input type for the suggestCodeImprovements function.
 * - SuggestCodeImprovementsOutput - The return type for the suggestCodeImprovements function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestCodeImprovementsInputSchema = z.object({
  codebase: z
    .string()
    .describe('The codebase to analyze for potential improvements.'),
  programmingLanguage: z
    .string()
    .describe('The programming language of the codebase.'),
});
export type SuggestCodeImprovementsInput = z.infer<
  typeof SuggestCodeImprovementsInputSchema
>;

const SuggestCodeImprovementsOutputSchema = z.object({
  improvements: z
    .array(z.string())
    .describe('A list of suggested improvements for the codebase.'),
});
export type SuggestCodeImprovementsOutput = z.infer<
  typeof SuggestCodeImprovementsOutputSchema
>;

export async function suggestCodeImprovements(
  input: SuggestCodeImprovementsInput
): Promise<SuggestCodeImprovementsOutput> {
  return suggestCodeImprovementsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestCodeImprovementsPrompt',
  input: {schema: SuggestCodeImprovementsInputSchema},
  output: {schema: SuggestCodeImprovementsOutputSchema},
  prompt: `You are an AI expert in software development, specializing in code quality and performance optimization.

  You will analyze the provided codebase and suggest improvements, such as refactoring opportunities, more efficient algorithms, or potential bug fixes.
  The suggestions should be specific and actionable.

  Consider the programming language when making suggestions.

  Codebase in {{programmingLanguage}}:
  \`\`\`{{programmingLanguage}}
  {{{codebase}}}
  \`\`\`

  Suggestions:
  `,
});

const suggestCodeImprovementsFlow = ai.defineFlow(
  {
    name: 'suggestCodeImprovementsFlow',
    inputSchema: SuggestCodeImprovementsInputSchema,
    outputSchema: SuggestCodeImprovementsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

