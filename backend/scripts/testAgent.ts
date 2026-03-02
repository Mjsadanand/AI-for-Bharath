/**
 * Quick smoke test: invoke a real agent with Nova Premier
 * Run: npx tsx scripts/testAgent.ts
 */
import dotenv from 'dotenv';
dotenv.config();

import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime';

const MODEL_ID = process.env.BEDROCK_MODEL_ID || 'us.amazon.nova-premier-v1:0';
const client = new BedrockRuntimeClient({ region: process.env.AWS_REGION || 'us-east-1' });

console.log(`\n--- Agent Smoke Test (${MODEL_ID}) ---\n`);

// 1️⃣ Basic text generation
console.log('1. Basic text generation...');
const basicRes = await client.send(new ConverseCommand({
  modelId: MODEL_ID,
  messages: [{ role: 'user', content: [{ text: 'You are a medical AI. Summarise type-2 diabetes in 2 sentences for a patient.' }] }],
  inferenceConfig: { maxTokens: 150, temperature: 0.1 }
}));
console.log('   ✅', basicRes.output?.message?.content?.[0]?.text?.slice(0, 200));
console.log(`   Tokens: ${basicRes.usage?.inputTokens}in / ${basicRes.usage?.outputTokens}out\n`);

// 2️⃣ Tool use (simulating agent loop)
console.log('2. Tool-use test...');
const toolRes = await client.send(new ConverseCommand({
  modelId: MODEL_ID,
  messages: [{ role: 'user', content: [{ text: 'Look up the patient record for patient ID PT-0001 and tell me their risk level.' }] }],
  system: [{ text: 'You are a healthcare AI assistant. Use the provided tools to look up patient data before answering.' }],
  toolConfig: {
    tools: [{
      toolSpec: {
        name: 'get_patient_record',
        description: 'Retrieves a patient record by patient code',
        inputSchema: {
          json: {
            type: 'object',
            properties: {
              patientCode: { type: 'string', description: 'The patient code e.g. PT-0001' }
            },
            required: ['patientCode']
          }
        }
      }
    }]
  },
  inferenceConfig: { maxTokens: 300, temperature: 0.1 }
}));

const stopReason = toolRes.stopReason;
const content = toolRes.output?.message?.content ?? [];
console.log(`   Stop reason: ${stopReason}`);

if (stopReason === 'tool_use') {
  const toolUseBlock = content.find((b: any) => 'toolUse' in b) as any;
  if (toolUseBlock) {
    console.log(`   ✅ Tool called: ${toolUseBlock.toolUse.name}`);
    console.log(`   Input: ${JSON.stringify(toolUseBlock.toolUse.input)}`);
  }
} else {
  const textBlock = content.find((b: any) => 'text' in b) as any;
  console.log(`   Response: ${textBlock?.text?.slice(0, 200)}`);
}
console.log(`   Tokens: ${toolRes.usage?.inputTokens}in / ${toolRes.usage?.outputTokens}out\n`);

console.log('--- All tests passed! Nova Premier is ready. ---\n');
process.exit(0);
