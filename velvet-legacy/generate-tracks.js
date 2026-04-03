#!/usr/bin/env node
/**
 * Generate 14 unique 30-second music tracks using Lyria RealTime.
 * Each track gets a unique prompt matching the album cover themes.
 * Outputs WAV files to assets/tracks/
 */

const { GoogleGenAI } = require('@google/genai');
const fs = require('fs');
const path = require('path');

const API_KEY = process.env.GEMINI_API_KEY;
const OUTPUT_DIR = path.join(__dirname, 'assets', 'tracks');
const SAMPLE_RATE = 48000;   // Lyria outputs 48kHz
const CHANNELS = 2;
const BIT_DEPTH = 16;
const DURATION_SECONDS = 30;

// Each track has a unique Lyria prompt
const TRACKS = [
  { file: 'ctrl-z',          bpm: 90,  prompt: '90s boom bap hip hop beat with dusty vinyl samples, punchy kicks, snapping snares, and a jazzy piano loop. Aggressive and confident energy.' },
  { file: 'pixel-pusher',    bpm: 75,  prompt: 'Lo-fi hip hop chill beat with warm vinyl crackle, mellow Rhodes piano, soft kick and snare, tape hiss, relaxed and melancholic vibe.' },
  { file: 'figma-diss',      bpm: 95,  prompt: 'East coast hip hop beat with hard-hitting drums, menacing piano stabs, gritty bass line, and scratching turntables. Raw and aggressive.' },
  { file: 'neural-drip',     bpm: 140, prompt: 'Dark trap beat with heavy 808 bass, hi-hat rolls, eerie synth pads, distorted vocal chops, and a sinister atmospheric vibe.' },
  { file: 'gradient-descent', bpm: 110, prompt: 'Synthwave hip hop beat with retro analog synthesizers, arpeggiated bass, electronic drums, and nostalgic 80s vibes. Dreamy and energetic.' },
  { file: 'fork-repo',       bpm: 85,  prompt: 'Conscious hip hop beat with soulful vocal samples, organic drums, jazzy guitar, upright bass, and introspective mood.' },
  { file: 'kerning',         bpm: 80,  prompt: 'Jazz rap beat with live-sounding drums, walking bass line, saxophone melody, warm Rhodes chords, and smooth sophisticated groove.' },
  { file: 'hallucination',   bpm: 70,  prompt: 'Cloud rap ethereal beat with reverb-drenched synths, floating pads, slow trap drums, dreamy bells, and psychedelic atmosphere.' },
  { file: 'whiteboard',      bpm: 100, prompt: 'Raw freestyle hip hop beat with simple boom bap drums, vinyl scratches, funky bass, and energetic party vibe for freestyling.' },
  { file: 'token',           bpm: 98,  prompt: 'G-funk west coast hip hop beat with funky synth leads, deep sub bass, talk box, smooth whistling, and laid-back California groove.' },
  { file: 'design-system',   bpm: 130, prompt: 'Hardcore industrial hip hop beat with distorted drums, heavy bass drops, aggressive synth stabs, and chaotic dark energy.' },
  { file: 'prompt-eng',      bpm: 88,  prompt: 'Abstract experimental hip hop beat with glitchy electronic textures, unconventional rhythms, ambient pads, and futuristic sound design.' },
  { file: 'latent-space',    bpm: 105, prompt: 'Cyberpunk electronic beat with pulsing bass synths, rapid hi-hats, digital glitch effects, dark futuristic atmosphere and tension.' },
  { file: 'lorem-ipsum',     bpm: 92,  prompt: 'Old school 90s hip hop beat with classic drum machine sounds, dusty breakbeats, funky bass sample, and golden era East Coast vibes.' },
];

// Write WAV header
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

async function generateTrack(trackConfig, index) {
  const { file, bpm, prompt } = trackConfig;
  const outputPath = path.join(OUTPUT_DIR, `${file}.wav`);

  // Skip if already generated
  if (fs.existsSync(outputPath)) {
    const stat = fs.statSync(outputPath);
    if (stat.size > 100000) {
      console.log(`  [${index + 1}/14] ✅ ${file}.wav already exists (${(stat.size / 1024 / 1024).toFixed(1)}MB), skipping`);
      return true;
    }
  }

  console.log(`  [${index + 1}/14] 🎵 Generating "${file}" — BPM: ${bpm}`);
  console.log(`           Prompt: "${prompt.substring(0, 70)}..."`);

  const client = new GoogleGenAI({ apiKey: API_KEY, apiVersion: 'v1alpha' });
  const targetBytes = SAMPLE_RATE * CHANNELS * (BIT_DEPTH / 8) * DURATION_SECONDS;

  return new Promise(async (resolve) => {
    const audioChunks = [];
    let totalBytes = 0;
    let resolved = false;

    function saveAndResolve(reason) {
      if (resolved) return;
      resolved = true;

      if (totalBytes === 0) {
        console.log(`  [${index + 1}/14] ❌ No audio received for ${file} (${reason})`);
        resolve(false);
        return;
      }

      const audioData = Buffer.concat(audioChunks);
      const dataLength = Math.min(audioData.length, targetBytes);

      const wavHeader = Buffer.alloc(44);
      writeWavHeader(wavHeader, dataLength);
      const wavBuffer = Buffer.concat([wavHeader, audioData.slice(0, dataLength)]);

      fs.writeFileSync(outputPath, wavBuffer);
      const durationActual = dataLength / (SAMPLE_RATE * CHANNELS * (BIT_DEPTH / 8));
      console.log(`  [${index + 1}/14] ✅ Saved ${file}.wav (${(wavBuffer.length / 1024 / 1024).toFixed(1)}MB, ${durationActual.toFixed(1)}s) [${reason}]`);
      resolve(true);
    }

    // Safety timeout
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
              if (totalBytes >= targetBytes) {
                clearTimeout(timeout);
                try { session.stop(); } catch(e) {}
                saveAndResolve('complete');
              }
            }
          },
          onerror: (error) => {
            console.error(`  [${index + 1}/14] ⚠ Error: ${error}`);
            clearTimeout(timeout);
            saveAndResolve('error');
          },
          onclose: () => {
            console.log(`  [${index + 1}/14] 🔌 Stream closed (${(totalBytes / 1024).toFixed(0)}KB received)`);
            clearTimeout(timeout);
            saveAndResolve('closed');
          },
        },
      });

      // Sequence: prompts first, then config, then a small delay, then play
      await session.setWeightedPrompts({
        weightedPrompts: [{ text: prompt, weight: 1.0 }],
      });
      console.log(`  [${index + 1}/14]   ↳ Prompt set`);

      await session.setMusicGenerationConfig({
        musicGenerationConfig: {
          bpm: bpm,
          temperature: 1.0,
        },
      });
      console.log(`  [${index + 1}/14]   ↳ Config set (BPM: ${bpm})`);

      // Small delay before play
      await delay(500);

      await session.play();
      console.log(`  [${index + 1}/14]   ↳ Playing...`);

    } catch (err) {
      console.error(`  [${index + 1}/14] ❌ Connection error: ${err.message}`);
      clearTimeout(timeout);
      resolve(false);
    }
  });
}

async function main() {
  console.log('\n  🎵 Lyria RealTime Track Generator');
  console.log('  ================================\n');
  console.log(`  Generating ${TRACKS.length} tracks (${DURATION_SECONDS}s each)`);
  console.log(`  Output: ${OUTPUT_DIR}\n`);

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  let success = 0;
  for (let i = 0; i < TRACKS.length; i++) {
    const result = await generateTrack(TRACKS[i], i);
    if (result) success++;
    if (i < TRACKS.length - 1) await delay(3000);
  }

  console.log(`\n  ✅ Done! ${success}/${TRACKS.length} tracks generated`);
  console.log(`  📁 Output: ${OUTPUT_DIR}\n`);
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
