'use server';

/**
 * @fileOverview A flow that suggests acquisition parameters based on a description of the experiment or process.
 *
 * - suggestAcquisitionParameters - A function that suggests acquisition parameters.
 * - SuggestAcquisitionParametersInput - The input type for the suggestAcquisitionParameters function.
 * - SuggestAcquisitionParametersOutput - The return type for the suggestAcquisitionParameters function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestAcquisitionParametersInputSchema = z.object({
  experimentDescription: z
    .string()
    .describe('A description of the experiment or process being monitored.'),
});
export type SuggestAcquisitionParametersInput = z.infer<
  typeof SuggestAcquisitionParametersInputSchema
>;

const SuggestAcquisitionParametersOutputSchema = z.object({
  acquisitionTime: z
    .number()
    .describe('The suggested acquisition time in seconds.'),
  samplesPerSecond: z
    .number()
    .describe('The suggested number of samples per second.'),
  sensorSelection: z
    .array(z.string())
    .describe('The suggested list of sensors to activate.'),
});
export type SuggestAcquisitionParametersOutput = z.infer<
  typeof SuggestAcquisitionParametersOutputSchema
>;

export async function suggestAcquisitionParameters(
  input: SuggestAcquisitionParametersInput
): Promise<SuggestAcquisitionParametersOutput> {
  return suggestAcquisitionParametersFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestAcquisitionParametersPrompt',
  input: {schema: SuggestAcquisitionParametersInputSchema},
  output: {schema: SuggestAcquisitionParametersOutputSchema},
  prompt: `You are an expert in data acquisition. Given the following description of an experiment or process, suggest appropriate acquisition parameters, including acquisition time, samples per second, and a list of sensors to activate.

Description: {{{experimentDescription}}}

Your suggestions should be based on the information provided in the description. Return the results as a JSON object.
`,
});

const suggestAcquisitionParametersFlow = ai.defineFlow(
  {
    name: 'suggestAcquisitionParametersFlow',
    inputSchema: SuggestAcquisitionParametersInputSchema,
    outputSchema: SuggestAcquisitionParametersOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
