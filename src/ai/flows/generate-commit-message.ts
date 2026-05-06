'use server';

/**
 * @fileOverview A flow to generate commit messages based on code changes.
 *
 * - generateCommitMessage - A function that generates a commit message.
 * - GenerateCommitMessageInput - The input type for the generateCommitMessage function.
 * - GenerateCommitMessageOutput - The return type for the generateCommitMessage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateCommitMessageInputSchema = z.object({
  diff: z
    .string()
    .describe('The diff of the code changes.'),
});
export type GenerateCommitMessageInput = z.infer<typeof GenerateCommitMessageInputSchema>;

const GenerateCommitMessageOutputSchema = z.object({
  commitMessage: z.string().describe('The generated commit message.'),
});
export type GenerateCommitMessageOutput = z.infer<typeof GenerateCommitMessageOutputSchema>;

export async function generateCommitMessage(input: GenerateCommitMessageInput): Promise<GenerateCommitMessageOutput> {
  return generateCommitMessageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateCommitMessagePrompt',
  input: {schema: GenerateCommitMessageInputSchema},
  output: {schema: GenerateCommitMessageOutputSchema},
  prompt: `You are an AI that generates commit messages based on the provided code diff.

  Generate a concise and informative commit message that summarizes the changes.

  Code Diff:
  {{diff}}`,
});

const generateCommitMessageFlow = ai.defineFlow(
  {
    name: 'generateCommitMessageFlow',
    inputSchema: GenerateCommitMessageInputSchema,
    outputSchema: GenerateCommitMessageOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
