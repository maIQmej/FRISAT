// src/ai/flows/analyze-sensor-data.ts
'use server';

/**
 * @fileOverview An AI agent for analyzing sensor data and providing insights.
 *
 * - analyzeSensorData - A function that handles the sensor data analysis process.
 * - AnalyzeSensorDataInput - The input type for the analyzeSensorData function.
 * - AnalyzeSensorDataOutput - The return type for the analyzeSensorData function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeSensorDataInputSchema = z.object({
  sensorData: z.array(
    z.object({
      tiempo: z.number().describe('Time in seconds'),
      muestrasPorSegundo: z.number().describe('Samples per second'),
      sensor1: z.number().optional().describe('Sensor 1 reading'),
      sensor2: z.number().optional().describe('Sensor 2 reading'),
      sensor3: z.number().optional().describe('Sensor 3 reading'),
      sensor4: z.number().optional().describe('Sensor 4 reading'),
      sensor5: z.number().optional().describe('Sensor 5 reading'),
    })
  ).describe('Array of sensor data objects'),
  nombreArchivo: z.string().describe('Name of the file the sensor data came from.'),
});

export type AnalyzeSensorDataInput = z.infer<typeof AnalyzeSensorDataInputSchema>;

const AnalyzeSensorDataOutputSchema = z.object({
  summary: z.string().describe('A summary of the sensor data analysis.'),
  anomalies: z.array(
    z.object({
      sensor: z.string().describe('The sensor where the anomaly was detected.'),
      time: z.number().describe('The time the anomaly occurred.'),
      description: z.string().describe('A description of the anomaly.'),
    })
  ).describe('Array of anomalies detected in the sensor data.'),
  correlations: z.array(
    z.object({
      sensors: z.array(z.string()).describe('The sensors that are correlated.'),
      correlation: z.string().describe('Description of the correlation between the sensors.'),
    })
  ).describe('Array of correlations between sensor readings.'),
  predictiveInsights: z.string().describe('Predictive insights based on the sensor data.'),
});

export type AnalyzeSensorDataOutput = z.infer<typeof AnalyzeSensorDataOutputSchema>;

export async function analyzeSensorData(input: AnalyzeSensorDataInput): Promise<AnalyzeSensorDataOutput> {
  return analyzeSensorDataFlow(input);
}

const analyzeSensorDataPrompt = ai.definePrompt({
  name: 'analyzeSensorDataPrompt',
  input: {schema: AnalyzeSensorDataInputSchema},
  output: {schema: AnalyzeSensorDataOutputSchema},
  prompt: `You are an expert data analyst specializing in sensor data analysis. Analyze the provided sensor data and provide insights such as potential anomalies or correlations between sensor readings. Provide predictive insights based on the sensor data.

Sensor Data: {{{JSON.stringify(sensorData)}}}
File Name: {{{nombreArchivo}}}

Your analysis should include a summary of the data, any anomalies detected, correlations between sensor readings, and predictive insights.

Make sure to include anomalies and correlations if there are any.`, 
});

const analyzeSensorDataFlow = ai.defineFlow(
  {
    name: 'analyzeSensorDataFlow',
    inputSchema: AnalyzeSensorDataInputSchema,
    outputSchema: AnalyzeSensorDataOutputSchema,
  },
  async input => {
    const {output} = await analyzeSensorDataPrompt(input);
    return output!;
  }
);

