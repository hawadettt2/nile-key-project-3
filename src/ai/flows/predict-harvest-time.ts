'use server';
/**
 * @fileOverview A flow to predict optimal harvest times for crops.
 *
 * - predictHarvestTime - A function that handles the prediction.
 * - PredictHarvestTimeInput - The input type for the predictHarvestTime function.
 * - PredictHarvestTimeOutput - The return type for the predictHarvestTime function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PredictHarvestTimeInputSchema = z.object({
  crop: z.string().describe('The agricultural crop, e.g., "Navel Oranges", "Strawberries".'),
  location: z.string().describe('The geographical location of the farm, e.g., "Minya, Egypt".'),
  language: z.string().describe('The language for the response (e.g., "Arabic", "English").'),
});
export type PredictHarvestTimeInput = z.infer<typeof PredictHarvestTimeInputSchema>;

const PredictHarvestTimeOutputSchema = z.object({
  optimalWindow: z.string().describe('The predicted optimal harvest window, e.g., "Late December to February".'),
  keyFactors: z.array(z.string()).describe('A list of key factors influencing this prediction, like climate, soil type, and daylight hours.'),
  strategicAdvice: z.string().describe('Actionable advice based on the prediction, such as monitoring specific weather patterns or soil conditions.'),
});
export type PredictHarvestTimeOutput = z.infer<typeof PredictHarvestTimeOutputSchema>;

export async function predictHarvestTime(input: PredictHarvestTimeInput): Promise<PredictHarvestTimeOutput> {
  return predictHarvestTimeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'predictHarvestTimePrompt',
  input: {schema: PredictHarvestTimeInputSchema},
  output: {schema: PredictHarvestTimeOutputSchema},
  prompt: `You are an expert agronomist and data scientist specializing in predictive agricultural analytics. Your task is to predict the optimal harvest window for a specific crop in a given location.

You must use your extensive knowledge base, which includes climate data, satellite imagery analysis, and crop-specific growth models, to provide a precise prediction.

The response must be in the following language: {{language}}.

**User Request:**
- Crop: {{crop}}
- Location: {{location}}

**Your analysis must include:**
1.  **Optimal Harvest Window:** Provide a clear time frame (e.g., "the last two weeks of May," "from early January to mid-February").
2.  **Key Factors:** List the primary environmental and agricultural factors that determine this window in the specified location (e.g., "Accumulated Growing Degree Days (GDD)," "soil moisture levels typical for the Nile Delta," "required daylight hours for fruit maturation").
3.  **Strategic Advice:** Offer concise, actionable advice for the farmer or exporter. This should include what to monitor as the harvest approaches (e.g., "Monitor nighttime temperatures closely, as a sudden drop can accelerate sugar development," "Begin soil moisture testing weekly starting in December").

**Disclaimer:** Your prediction is based on historical data and regional models. Advise the user to combine this prediction with on-the-ground field observations.`,
});

const predictHarvestTimeFlow = ai.defineFlow(
  {
    name: 'predictHarvestTimeFlow',
    inputSchema: PredictHarvestTimeInputSchema,
    outputSchema: PredictHarvestTimeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
