'use server';
/**
 * @fileOverview A flow to search for potential suppliers online.
 *
 * - searchSuppliers - A function that handles the supplier search process.
 * - SearchSuppliersInput - The input type for the searchSuppliers function.
 * - SearchSuppliersOutput - The return type for the searchSuppliers function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
// import { googleSearch } from '@genkit-ai/google-cloud'; // Temporarily disabled

const SearchSuppliersInputSchema = z.object({
  query: z.string().describe('Search query for agricultural suppliers (e.g., "lettuce farms in Egypt").'),
});
export type SearchSuppliersInput = z.infer<typeof SearchSuppliersInputSchema>;

const SupplierSchema = z.object({
    farmName: z.string().describe("The name of the farm or supplier."),
    cropVarieties: z.string().describe("The types of crops they supply."),
    location: z.string().describe("Geographical location of the supplier."),
    contactNumber: z.string().describe("Contact phone number for the supplier (if available)."),
    source: z.string().describe("The source URL where the information was found.")
});

const SearchSuppliersOutputSchema = z.object({
  suppliers: z.array(SupplierSchema).describe('A list of potential suppliers found.'),
});
export type SearchSuppliersOutput = z.infer<typeof SearchSuppliersOutputSchema>;


export async function searchSuppliers(input: SearchSuppliersInput): Promise<SearchSuppliersOutput> {
  return searchSuppliersFlow(input);
}

const prompt = ai.definePrompt({
  name: 'searchSuppliersPrompt',
  input: {schema: SearchSuppliersInputSchema},
  output: {schema: SearchSuppliersOutputSchema},
  // tools: [googleSearch], // Temporarily disabled to prevent crashes
  prompt: `You are an expert research assistant for the Egyptian agricultural import/export industry. Your task is to find potential suppliers based on a search query, with a strong emphasis on reliability and official sources. You must use your internal knowledge as live web search is temporarily disabled.

When you search for agricultural suppliers that match the query: "{{query}}", you must follow these principles:

1.  **Prioritize Official & Reliable Sources:** Give highest priority to information from official bodies like the Agricultural Export Council (AEC), records from major trade exhibitions like Food Africa, and established industry directories.
2.  **Look for Proof of Legitimacy:** Actively search for mentions of a supplier's "Codification Certificate" (شهادة التكويد) from the Central Administration of Plant Quarantine (CAPQ). Suppliers who list this certificate are more likely to be legitimate and active.
3.  **Be Skeptical of Outdated Lists:** General web directories or old articles can be unreliable. Cross-reference any findings and favor recent information. If a source looks old, treat its information with caution.
4.  **Extract Key Information:** For each potential supplier you identify, provide their farm name, the specific crops they supply, their location, a contact number if available, and critically, the source URL where you found the information.

Present the results as a structured list.`,
});

const searchSuppliersFlow = ai.defineFlow(
  {
    name: 'searchSuppliersFlow',
    inputSchema: SearchSuppliersInputSchema,
    outputSchema: SearchSuppliersOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
