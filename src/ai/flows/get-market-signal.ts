'use server';
/**
 * @fileOverview A flow to generate a market signal for an agricultural product.
 *
 * - getMarketSignal - A function that handles the market signal generation.
 * - GetMarketSignalInput - The input type for the getMarketSignal function.
 * - GetMarketSignalOutput - The return type for the getMarketSignal function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GetMarketSignalInputSchema = z.object({
  crop: z.string().describe('The agricultural crop, e.g., "Egyptian Garlic", "Spunta Potatoes".'),
  exportingCountry: z.string().describe('The country the goods are exported from, e.g., "Egypt".'),
  language: z.string().describe('The language for the response (e.g., "Arabic", "English").'),
});
export type GetMarketSignalInput = z.infer<typeof GetMarketSignalInputSchema>;

const MarketSignalEnum = z.enum(['SELL_NOW', 'MONITOR', 'WAIT']);
export type MarketSignal = z.infer<typeof MarketSignalEnum>;

const GetMarketSignalOutputSchema = z.object({
  signal: MarketSignalEnum.describe("The market signal: 'SELL_NOW' for high prices, 'MONITOR' for stable/uncertain markets, 'WAIT' for low prices."),
  reasoning: z.string().describe("A concise reason for the signal, e.g., 'Supply gap in the EU market before the Spanish harvest begins.'"),
  confidenceScore: z.number().min(0).max(1).describe("A confidence score from 0.0 to 1.0 on the accuracy of this signal."),
});
export type GetMarketSignalOutput = z.infer<typeof GetMarketSignalOutputSchema>;

export async function getMarketSignal(input: GetMarketSignalInput): Promise<GetMarketSignalOutput> {
  return getMarketSignalFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getMarketSignalPrompt',
  input: {schema: GetMarketSignalInputSchema},
  output: {schema: GetMarketSignalOutputSchema},
  prompt: `You are a world-class commodities trader specializing in agricultural products from {{exportingCountry}}. Your task is to provide a clear, actionable market signal for a specific crop.

Analyze your internal knowledge base of global supply chains, production cycles, weather events, and geopolitical factors to determine the current market state.

The response must be in the following language: {{language}}.

**User Request:**
- Crop: {{crop}}
- Exporting from: {{exportingCountry}}

**Your analysis must produce a single, clear signal:**
-   **SELL_NOW**: Use this signal if there is a clear and immediate opportunity to sell at high prices due to a supply gap, a demand surge, or competitors being out of the market.
-   **MONITOR**: Use this signal if the market is stable, uncertain, or if a potential opportunity is emerging but is not yet confirmed. Advise on what to watch for.
-   **WAIT**: Use this signal if the market is currently saturated, prices are low, or major competitors are at their peak production.

Provide a concise, data-driven reasoning for your signal and a confidence score.
`,
});

const getMarketSignalFlow = ai.defineFlow(
  {
    name: 'getMarketSignalFlow',
    inputSchema: GetMarketSignalInputSchema,
    outputSchema: GetMarketSignalOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
