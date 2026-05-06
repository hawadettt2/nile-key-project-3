'use server';
/**
 * @fileOverview A flow to translate text with a diplomatic and professional tone.
 *
 * - diplomaticTranslate - A function that handles the translation process.
 * - DiplomaticTranslateInput - The input type for the diplomaticTranslate function.
 * - DiplomaticTranslateOutput - The return type for the diplomaticTranslate function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DiplomaticTranslateInputSchema = z.object({
  text: z.string().describe('The text to be translated.'),
  targetLanguage: z.string().describe('The target language for the translation (e.g., "English", "Arabic").'),
  context: z.string().describe('The context of the communication, e.g., "business email to a client", "contract negotiation clause".'),
});
export type DiplomaticTranslateInput = z.infer<typeof DiplomaticTranslateInputSchema>;

const DiplomaticTranslateOutputSchema = z.object({
  translatedText: z.string().describe('The translated text, phrased professionally and diplomatically.'),
});
export type DiplomaticTranslateOutput = z.infer<typeof DiplomaticTranslateOutputSchema>;

export async function diplomaticTranslate(input: DiplomaticTranslateInput): Promise<DiplomaticTranslateOutput> {
  return diplomaticTranslateFlow(input);
}

const prompt = ai.definePrompt({
  name: 'diplomaticTranslatePrompt',
  input: {schema: DiplomaticTranslateInputSchema},
  output: {schema: DiplomaticTranslateOutputSchema},
  prompt: `You are an expert diplomatic business translator. Your task is to translate the given text into {{targetLanguage}}.

It is crucial that you don't just provide a literal translation. You must rephrase the text to be highly professional, polite, and culturally appropriate for a business context. The goal is to facilitate successful international negotiations.

The context of the text is: {{context}}.

Original Text:
"{{text}}"

Translate the text into {{targetLanguage}} with a diplomatic and professional tone.
`,
});

const diplomaticTranslateFlow = ai.defineFlow(
  {
    name: 'diplomaticTranslateFlow',
    inputSchema: DiplomaticTranslateInputSchema,
    outputSchema: DiplomaticTranslateOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
