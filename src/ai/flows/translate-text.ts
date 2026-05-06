'use server';
/**
 * @fileOverview A flow to translate a JSON object of strings into a target language.
 *
 * - translateText - A function that handles the translation.
 * - TranslateTextInput - The input type for the translateText function.
 * - TranslateTextOutput - The return type for the translateText function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TranslateTextInputSchema = z.object({
  content: z.record(z.string()),
  targetLanguage: z.string().describe('The target language for the translation (e.g., "Spanish", "Arabic", "French"). Provide the language name in English.'),
});
export type TranslateTextInput = z.infer<typeof TranslateTextInputSchema>;

// The output schema is a record of strings to strings.
const TranslateTextOutputSchema = z.record(z.string());
export type TranslateTextOutput = z.infer<typeof TranslateTextOutputSchema>;


export async function translateText(input: TranslateTextInput): Promise<TranslateTextOutput> {
  return translateTextFlow(input);
}

const prompt = ai.definePrompt({
  name: 'translateObjectPrompt',
  input: {schema: z.object({
    jsonContent: z.string(),
    targetLanguage: z.string(),
  })},
  output: {schema: TranslateTextOutputSchema},
  prompt: `Translate the string values of the following JSON object into {{targetLanguage}}.
The keys must remain unchanged. Only translate the values.
Your response MUST be ONLY the translated JSON object, without any surrounding text, explanations, or markdown code blocks.

Example:
If the target language is "Spanish" and the input is:
{ "greeting": "Hello", "farewell": "Goodbye" }

Your response should be:
{ "greeting": "Hola", "farewell": "Adiós" }

Now, translate this object into {{targetLanguage}}:
{{jsonContent}}
`,
});

const translateTextFlow = ai.defineFlow(
  {
    name: 'translateTextFlow',
    inputSchema: TranslateTextInputSchema,
    outputSchema: TranslateTextOutputSchema,
  },
  async ({ content, targetLanguage }) => {
    const { output } = await prompt({
      jsonContent: JSON.stringify(content, null, 2),
      targetLanguage,
    });
    return output!;
  }
);
