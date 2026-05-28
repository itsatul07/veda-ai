import 'dotenv/config';
import https from 'https';
import http from 'http';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const HF_API_KEY = process.env.HF_API_KEY;
const HF_URL = 'https://api-inference.huggingface.co/models/gpt2';

async function testHF(): Promise<void> {
  console.log('Testing HuggingFace API...\n');
  console.log('API Key:', HF_API_KEY ? 'present' : 'MISSING');

  // Using agent to skip SSL verification
  const agent = new https.Agent({
    rejectUnauthorized: false,
    keepAlive: true,
  });

  try {
    const response = await fetch(HF_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${HF_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: 'Explain Redis in one line: Redis is',
      }),
      // @ts-ignore - agent option
      agent,
    });

    console.log('Response status:', response.status);
    const text = await response.text();
    console.log('Raw response:', text.substring(0, 500));
  } catch (error: any) {
    console.error('Error:', error.message);
  }
}

testHF();