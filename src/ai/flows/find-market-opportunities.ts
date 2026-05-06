'use server';
/**
 * @fileOverview A flow to find global market opportunities for agricultural products.
 *
 * - findMarketOpportunities - A function that handles the market analysis.
 * - FindMarketOpportunitiesInput - The input type for the findMarketOpportunities function.
 * - FindMarketOpportunitiesOutput - The return type for the findMarketOpportunities function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FindMarketOpportunitiesInputSchema = z.object({
  crop: z.string().describe('The agricultural crop, e.g., "Egyptian Garlic", "Spunta Potatoes".'),
  exportingCountry: z.string().describe('The country the goods are exported from, e.g., "Egypt".'),
  language: z.string().describe('The language for the response (e.g., "Arabic", "English").'),
});
export type FindMarketOpportunitiesInput = z.infer<typeof FindMarketOpportunitiesInputSchema>;

const MarketOpportunitySchema = z.object({
    region: z.string().describe("The target country or region for the opportunity, e.g., 'Germany', 'GCC Countries'."),
    window: z.string().describe("The specific time window for the opportunity, e.g., 'April-June'."),
    opportunity: z.string().describe("A concise description of the market opportunity."),
    reasoning: z.string().describe("The underlying reason for the opportunity, such as 'End of local harvest, creating an import gap' or 'High demand for Ramadan festivities'."),
    confidenceScore: z.number().min(0).max(1).describe("A confidence score from 0.0 to 1.0 on the viability of this opportunity based on available data."),
});

const FindMarketOpportunitiesOutputSchema = z.object({
  opportunities: z.array(MarketOpportunitySchema).describe('A list of potential market opportunities.'),
});
export type FindMarketOpportunitiesOutput = z.infer<typeof FindMarketOpportunitiesOutputSchema>;

export async function findMarketOpportunities(input: FindMarketOpportunitiesInput): Promise<FindMarketOpportunitiesOutput> {
  return findMarketOpportunitiesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'findMarketOpportunitiesPrompt',
  input: {schema: FindMarketOpportunitiesInputSchema},
  output: {schema: FindMarketOpportunitiesOutputSchema},
  prompt: `You are a world-class international trade analyst for the agricultural sector, with a specialization in exports from {{exportingCountry}}. Your task is to identify high-potential market opportunities for a specific crop.

You must analyze global trade flows, seasonal production gaps, consumption trends, and import regulations from your internal knowledge base to identify the most promising export windows.

The response must be in the following language: {{language}}.

**User Request:**
- Crop: {{crop}}
- Exporting from: {{exportingCountry}}

**Your analysis must identify at least 3 distinct market opportunities and for each one, provide:**
1.  **Region/Country:** The specific target market.
2.  **Window:** The optimal time frame to target this market.
3.  **Opportunity:** A brief, clear description of the market gap or demand driver.
4.  **Reasoning:** A data-driven explanation for why this is an opportunity (e.g., "Local production in the EU ends in March, but consumer demand remains high until May," "Reduced competition from Spain during this period due to weather events," "Lower import tariffs during this window.").
5.  **Confidence Score:** Your confidence in this opportunity on a scale of 0.0 to 1.0.

Present the results as a structured list of opportunities.`,
});

const findMarketOpportunitiesFlow = ai.defineFlow(
  {
    name: 'findMarketOpportunitiesFlow',
    inputSchema: FindMarketOpportunitiesInputSchema,
    outputSchema: FindMarketOpportunitiesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
