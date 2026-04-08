#!/usr/bin/env node
/**
 * Generate cheesy elevator / hold music for the DJ Lyria loading screen.
 * Uses Lyria RealTime to produce a 30-second loopable WAV.
 * Output: assets/tracks/elevator-music.wav
 */

const { GoogleGenAI } = require('@google/genai');
const fs = require('fs');
const path = require('path');

const API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyBB_UX81p6Cm_Y8MMvTdgySZKdD-R2oItA';
const OUTPUT_DIR = path.join(__dirname, 'assets', 'tracks');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'elevator-music.wav');

const SAMPLE_RATE = 48000;
const CHANNELS = 2;
const BIT_DEPTH = 16;
const DURATION_SECONDS = 30;

const ELEVATOR_PROMPT =
  'Smooth cheesy elevator music, light jazz muzak, gentle bossa nova feel, ' +
  'soft electric piano, muted trumpet, brushed drums, warm upright bass, ' +
  'easy listening, relaxed and pleasant, lounge background music, ' +
  'slightly nostalgic, professional hold music. No vocals.';

const BPM = 100;

function writeWavHeader(buffer, dataLength) {
  const byteRate = SAMPLE_RATE * CHANNELS * (BIT_DEPTH / 8);
  const blockAlign = CHANNELS * (BIT_DEPTH / 8);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataLength, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(CHANNELS, 22);
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(BIT_DEPTH, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataLength, 40);
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  console.log('\n  🎵 Elevator Music Generator');
  console.log('  ===========================\n');

  // Skip if already exists with reasonable size
  if (fs.existsSync(OUTPUT_FILE)) {
    const stat = fs.statSync(OUTPUT_FILE);
    if (stat.size > 100000) {
      console.log(`  ✅ elevator-music.wav already exists (${(stat.size / 1024 / 1024).toFixed(1)}MB)`);
      console.log('  Delete the file and re-run to regenerate.\n');
      process.exit(0);
    }
  }

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log(`  Prompt: "${ELEVATOR_PROMPT.substring(0, 80)}..."`);
  console.log(`  BPM: ${BPM}`);
  console.log(`  Duration: ${DURATION_SECONDS}s`);
  console.log(`  Output: ${OUTPUT_FILE}\n`);

  const client = new GoogleGenAI({ apiKey: API_KEY, apiVersion: 'v1alpha' });
  const targetBytes = SAMPLE_RATE * CHANNELS * (BIT_DEPTH / 8) * DURATION_SECONDS;

  for (let attempt = 1; attempt <= 3; attempt++) {
    if (attempt > 1) {
      console.log(`  ⟳ Retry attempt ${attempt}/3...`);
      await delay(2000);
    }

    const result = await new Promise(async (resolve) => {
      const audioChunks = [];
      let totalBytes = 0;
      let resolved = false;

      function saveAndResolve(reason) {
        if (resolved) return;
        resolved = true;

        if (totalBytes === 0) {
          console.log(`  ❌ No audio received (${reason})`);
          resolve(false);
          return;
        }

        const audioData = Buffer.concat(audioChunks);
        const dataLength = Math.min(audioData.length, targetBytes);

        const wavHeader = Buffer.alloc(44);
        writeWavHeader(wavHeader, dataLength);
        const wavBuffer = Buffer.concat([wavHeader, audioData.slice(0, dataLength)]);

        fs.writeFileSync(OUTPUT_FILE, wavBuffer);
        const actualDuration = dataLength / (SAMPLE_RATE * CHANNELS * (BIT_DEPTH / 8));
        console.log(`  ✅ Saved elevator-music.wav (${(wavBuffer.length / 1024 / 1024).toFixed(1)}MB, ${actualDuration.toFixed(1)}s) [${reason}]`);
        resolve(true);
      }

      const timeout = setTimeout(() => saveAndResolve('timeout'), 90000);

      try {
        const session = await client.live.music.connect({
          model: 'models/lyria-realtime-exp',
          callbacks: {
            onmessage: (message) => {
              if (message.serverContent?.audioChunks) {
                for (const chunk of message.serverContent.audioChunks) {
                  const audioBuffer = Buffer.from(chunk.data, 'base64');
                  audioChunks.push(audioBuffer);
                  totalBytes += audioBuffer.length;
                }
                // Progress
                const pct = Math.min(100, Math.round((totalBytes / targetBytes) * 100));
                process.stdout.write(`\r  🎶 Generating... ${pct}% (${(totalBytes / 1024).toFixed(0)}KB)`);
                if (totalBytes >= targetBytes) {
                  process.stdout.write('\n');
                  clearTimeout(timeout);
                  try { session.stop(); } catch(e) {}
                  saveAndResolve('complete');
                }
              }
            },
            onerror: (error) => {
              console.error(`\n  ⚠ Error: ${error}`);
              clearTimeout(timeout);
              saveAndResolve('error');
            },
            onclose: () => {
              console.log(`\n  🔌 Stream closed (${(totalBytes / 1024).toFixed(0)}KB received)`);
              clearTimeout(timeout);
              saveAndResolve('closed');
            },
          },
        });

        await session.setWeightedPrompts({
          weightedPrompts: [{ text: ELEVATOR_PROMPT, weight: 1.0 }],
        });
        console.log('  ↳ Prompt set');

        await session.setMusicGenerationConfig({
          musicGenerationConfig: { bpm: BPM, temperature: 1.0 },
        });
        console.log(`  ↳ Config set (BPM: ${BPM})`);

        await delay(500);

        await session.play();
        console.log('  ↳ Playing...');

      } catch (err) {
        console.error(`  ❌ Connection error: ${err.message}`);
        clearTimeout(timeout);
        resolve(false);
      }
    });

    if (result) {
      console.log('\n  🎵 Elevator music generated successfully!');
      console.log(`  📁 ${OUTPUT_FILE}\n`);
      process.exit(0);
    }
  }

  console.error('\n  ❌ Failed to generate after 3 attempts.\n');
  process.exit(1);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
