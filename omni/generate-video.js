#!/usr/bin/env node
// generate-video.js — Generate a Veo placeholder via Google AI Python SDK
// Uses the @google/genai Node SDK

const { GoogleGenAI } = require('@google/genai');
const fs = require('fs');
const path = require('path');

const API_KEY = process.env.GEMINI_API_KEY || 'AQ.Ab8RN6LJuyFjpxrD20wyrUYon4Mok4N0iPJXIQSL_rYwbB30ZA';
const OUTPUT  = path.join(__dirname, 'placeholder.mp4');
const PROMPT  = 'Cinematic aerial drone shot of a futuristic city at golden hour, smooth slow camera pan, photorealistic, 16:9';

async function main() {
  const ai = new GoogleGenAI({ apiKey: API_KEY });

  console.log('🎬 Generating Veo video...');
  console.log('📝 Prompt:', PROMPT);

  let op = await ai.models.generateVideos({
    model: 'veo-2.0-generate-001',
    prompt: PROMPT,
    config: { aspectRatio: '16:9', durationSeconds: 8 },
  });

  console.log('⏳ Waiting for generation to complete...');
  let elapsed = 0;
  while (!op.done) {
    await new Promise(r => setTimeout(r, 5000));
    elapsed += 5;
    process.stdout.write(`   ${elapsed}s...\r`);
    op = await ai.operations.getVideosOperation({ operation: op });
  }

  console.log('\n✅ Done!');

  const video = op.response?.generatedSamples?.[0]?.video;
  if (!video) {
    console.error('No video in response:', JSON.stringify(op.response, null, 2));
    process.exit(1);
  }

  if (video.videoBytes) {
    fs.writeFileSync(OUTPUT, Buffer.from(video.videoBytes, 'base64'));
    console.log('💾 Saved to', OUTPUT);
  } else {
    console.error('Unexpected video shape:', JSON.stringify(video));
    process.exit(1);
  }
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
