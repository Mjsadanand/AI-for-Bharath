import dotenv from 'dotenv';
dotenv.config();
import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime';

const region = process.env.AWS_REGION || 'us-east-1';
const modelId = process.env.BEDROCK_MODEL_ID!;

console.log('--- Bedrock Diagnostic ---');
console.log('Region       :', region);
console.log('Model ID     :', modelId);
console.log('Access Key   :', process.env.AWS_ACCESS_KEY_ID?.slice(0, 8) + '...');
console.log('');

const client = new BedrockRuntimeClient({ region });

// Test 1: Primary model (Claude Sonnet 4 via inference profile)
const models = [
  'us.amazon.nova-premier-v1:0',        // Nova Premier (most capable, tool use)
  'us.amazon.nova-pro-v1:0',            // Nova Pro (strong, tool use)
  'us.amazon.nova-lite-v1:0',           // Nova Lite (balanced)
  'amazon.nova-pro-v1:0',               // Nova Pro (direct ID)
  'amazon.nova-lite-v1:0',              // Nova Lite (direct ID)
  'anthropic.claude-3-haiku-20240307-v1:0', // Haiku (known working)
];

for (const mid of models) {
  console.log(`Testing: ${mid}`);
  try {
    const res = await client.send(new ConverseCommand({
      modelId: mid,
      messages: [{ role: 'user', content: [{ text: 'Reply with only: OK' }] }],
      inferenceConfig: { maxTokens: 5 }
    }));
    console.log(`  ✅ SUCCESS: ${res.output?.message?.content?.[0]?.text}\n`);
  } catch (e: any) {
    console.log(`  ❌ ${e.name}: ${e.message?.slice(0, 200)}\n`);
  }
}

process.exit(0);
