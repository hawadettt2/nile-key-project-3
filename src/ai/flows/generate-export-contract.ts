'use server';
/**
 * @fileOverview A flow to generate a proforma invoice for an export shipment.
 *
 * - generateExportContract - A function that handles the contract generation process.
 * - GenerateExportContractInput - The input type for the generateExportContract function.
 * - GenerateExportContractOutput - The return type for the generateExportContract function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateExportContractInputSchema = z.object({
  language: z.enum(['Arabic', 'English']).describe('The language for the contract.'),
});
export type GenerateExportContractInput = z.infer<typeof GenerateExportContractInputSchema>;


const GenerateExportContractOutputSchema = z.object({
  contractText: z.string().describe('The generated proforma invoice text in markdown format.'),
});
export type GenerateExportContractOutput = z.infer<typeof GenerateExportContractOutputSchema>;

export async function generateExportContract(input: GenerateExportContractInput): Promise<GenerateExportContractOutput> {
  return generateExportContractFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateExportContractPrompt',
  input: {schema: GenerateExportContractInputSchema},
  output: {schema: GenerateExportContractOutputSchema},
  prompt: `You are an expert in international trade and logistics, specializing in agricultural exports from Egypt to Jordan. Your name is "Nile Key AI Assistant".

  Your task is to generate a professional Proforma Invoice for a shipment of fresh produce. The invoice must be in {{language}}.

  **Company:** شركة مفتاح النيل للاستثمار والتجارة الدولية (ذ.م.م) (Nile Key for Investment and International Trade LLC)
  **Client:** (A client in Amman, Jordan)
  **Shipment:** Fresh Lettuce and Cabbage
  **Incoterms:** FOB (Free on Board)

  Please generate a detailed Proforma Invoice in {{language}}. The invoice should include:
  1.  Header with the company name "شركة مفتاح النيل للاستثمار والتجارة الدولية (ذ.م.م)". If the language is English, also include "(Nile Key for Investment and International Trade LLC)".
  2.  A section for Buyer and Seller details (leave Buyer details blank for now).
  3.  A table with the following columns: Description, Quantity (kg), Unit Price ($), Total Price ($).
  4.  Populate the table with two items. In Arabic: 'خس طازج' and 'كرنب (كابوتشا)'. In English: 'Fresh Lettuce' and 'Cabbage'. Leave quantity and prices blank for manual entry, represented by '______'.
  5.  A section for estimated costs including:
      - In Arabic: تكلفة الشحن الجوي المقدرة (Estimated Air Freight Cost): Leave blank '______'.
      - In Arabic: تكلفة التخليص الجمركي المقدرة (Estimated Customs Clearance Cost): Leave blank '______'.
      - In English: Estimated Air Freight Cost: Leave blank '______'.
      - In English: Estimated Customs Clearance Cost: Leave blank '______'.
  6.  A section for bank details for payment. Use placeholder information.
  7.  A signature section for the exporter.
  8.  The document should be titled "فاتورة مبدئية (Proforma Invoice)" in Arabic, and "Proforma Invoice" in English.
  9.  Use Markdown for formatting, especially for the table.
  `,
});

const generateExportContractFlow = ai.defineFlow(
  {
    name: 'generateExportContractFlow',
    inputSchema: GenerateExportContractInputSchema,
    outputSchema: GenerateExportContractOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
