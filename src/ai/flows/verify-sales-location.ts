'use server';
/**
 * @fileOverview A sales location verification AI agent.
 *
 * - verifySalesLocation - A function that verifies if a sales rep is at the assigned location.
 * - VerifySalesLocationInput - The input type for the verifySalesLocation function.
 * - VerifySalesLocationOutput - The return type for the verifySalesLocation function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';
import {Location} from '@/services/geolocation';

const VerifySalesLocationInputSchema = z.object({
  assignedLocation: z
    .object({
      lat: z.number().describe('The latitude of the assigned location.'),
      lng: z.number().describe('The longitude of the assigned location.'),
    })
    .describe('The assigned location for the sales task.'),
  currentLocation: z
    .object({
      lat: z.number().describe('The latitude of the current location.'),
      lng: z.number().describe('The longitude of the current location.'),
    })
    .describe('The current location of the sales rep.'),
  taskDescription: z.string().describe('The description of the sales task.'),
});
export type VerifySalesLocationInput = z.infer<typeof VerifySalesLocationInputSchema>;

const VerifySalesLocationOutputSchema = z.object({
  isLocationVerified: z
    .boolean()
    .describe('Whether the sales rep is at the assigned location.'),
  verificationExplanation: z.string().describe('The explanation of the location verification result.'),
});
export type VerifySalesLocationOutput = z.infer<typeof VerifySalesLocationOutputSchema>;

export async function verifySalesLocation(
  input: VerifySalesLocationInput
): Promise<VerifySalesLocationOutput> {
  return verifySalesLocationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'verifySalesLocationPrompt',
  input: {
    schema: z.object({
      assignedLocation: z
        .object({
          lat: z.number().describe('The latitude of the assigned location.'),
          lng: z.number().describe('The longitude of the assigned location.'),
        })
        .describe('The assigned location for the sales task.'),
      currentLocation: z
        .object({
          lat: z.number().describe('The latitude of the current location.'),
          lng: z.number().describe('The longitude of the current location.'),
        })
        .describe('The current location of the sales rep.'),
      taskDescription: z.string().describe('The description of the sales task.'),
    }),
  },
  output: {
    schema: z.object({
      isLocationVerified: z
        .boolean()
        .describe('Whether the sales rep is at the assigned location.'),
      verificationExplanation: z.string().describe('The explanation of the location verification result.'),
    }),
  },
  prompt: `You are an AI assistant specialized in verifying sales rep locations for assigned tasks.

You are given the assigned location for a sales task, the current location of the sales rep, and a description of the task.

Your goal is to determine if the sales rep is at the assigned location and provide an explanation for your reasoning.

Assigned Location: Latitude: {{{assignedLocation.lat}}}, Longitude: {{{assignedLocation.lng}}}
Current Location: Latitude: {{{currentLocation.lat}}}, Longitude: {{{currentLocation.lng}}}
Task Description: {{{taskDescription}}}

Consider factors such as the distance between the locations and the context of the sales task.

Provide a clear and concise explanation for your verification result.`,
});

const verifySalesLocationFlow = ai.defineFlow<
  typeof VerifySalesLocationInputSchema,
  typeof VerifySalesLocationOutputSchema
>(
  {
    name: 'verifySalesLocationFlow',
    inputSchema: VerifySalesLocationInputSchema,
    outputSchema: VerifySalesLocationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
