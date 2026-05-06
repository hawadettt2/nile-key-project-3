'use server';
/**
 * @fileOverview A flow to search for potential customers online.
 *
 * - searchCustomers - A function that handles the customer search process.
 * - SearchCustomersInput - The input type for the searchCustomers function.
 * - SearchCustomersOutput - The return type for the searchCustomers function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
// import { googleSearch } from '@genkit-ai/google-cloud'; // Temporarily disabled

const SearchCustomersInputSchema = z.object({
  query: z.string().describe('Search query for potential customers (e.g., "fruit importers in Jordan").'),
});
export type SearchCustomersInput = z.infer<typeof SearchCustomersInputSchema>;

const CustomerSchema = z.object({
    clientName: z.string().describe("The name of the trader or customer company."),
    country: z.string().describe("The target country, e.g., Jordan."),
    details: z.string().describe("Additional details about the customer, including potential products of interest."),
    source: z.string().describe("The source URL where the information was found.")
});

const SearchCustomersOutputSchema = z.object({
  customers: z.array(CustomerSchema).describe('A list of potential customers found.'),
});
export type SearchCustomersOutput = z.infer<typeof SearchCustomersOutputSchema>;


export async function searchCustomers(input: SearchCustomersInput): Promise<SearchCustomersOutput> {
  return searchCustomersFlow(input);
}

const prompt = ai.definePrompt({
  name: 'searchCustomersPrompt',
  input: {schema: SearchCustomersInputSchema},
  output: {schema: SearchCustomersOutputSchema},
  // tools: [googleSearch], // Temporarily disabled to prevent crashes
  prompt: `You are an expert research assistant specializing in international trade for the agricultural sector. Your primary task is to find potential customers (importers, traders, distributors) based on a user's search query. You must use your internal knowledge as live web search is temporarily disabled.

When searching for customers that match the query "{{query}}", follow these principles:
1.  **Prioritize Business Directories & Trade Portals:** Focus on results from B2B platforms, official trade directories, and associations related to food and agriculture.
2.  **Verify Information:** Look for company websites to confirm their business. Be skeptical of generic or outdated lists.
3.  **Extract Actionable Data:** For each potential customer you identify, you must provide:
    - The company's name (\`clientName\`).
    - Their country (\`country\`).
    - A brief summary of relevant details, such as the types of products they import or their market focus (\`details\`).
    - The specific URL of the webpage where you found the information (\`source\`).

Return a structured list of the customers you find.`,
});

const searchCustomersFlow = ai.defineFlow(
  {
    name: 'searchCustomersFlow',
    inputSchema: SearchCustomersInputSchema,
    outputSchema: SearchCustomersOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
