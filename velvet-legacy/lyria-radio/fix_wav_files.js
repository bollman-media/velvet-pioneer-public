const fs = require('fs');
const path = require('path');

const files = ['dj_break_1.wav', 'dj_break_2.wav', 'dj_break_3.wav'];

files.forEach(file => {
  const fullPath = path.join(__dirname, 'tracks', file);
  if (!fs.existsSync(fullPath)) {
    console.log(`Not found: ${fullPath}`);
    return;
  }
  
  const rawData = fs.readFileSync(fullPath);
  
  // Check if it already has a RIFF header
  if (rawData.toString('ascii', 0, 4) === 'RIFF') {
    console.log(`${file} already has a WAV header.`);
    return;
  }
  
  const dataLength = rawData.length;
  
  const SAMPLE_RATE = 24000;
  const CHANNELS = 1;
  const BIT_DEPTH = 16;
  const byteRate = SAMPLE_RATE * CHANNELS * (BIT_DEPTH / 8);
  const blockAlign = CHANNELS * (BIT_DEPTH / 8);
  
  const wavHeader = Buffer.alloc(44);
  wavHeader.write('RIFF', 0);
  wavHeader.writeUInt32LE(36 + dataLength, 4);
  wavHeader.write('WAVE', 8);
  wavHeader.write('fmt ', 12);
  wavHeader.writeUInt32LE(16, 16);
  wavHeader.writeUInt16LE(1, 20);
  wavHeader.writeUInt16LE(CHANNELS, 22);
  wavHeader.writeUInt32LE(SAMPLE_RATE, 24);
  wavHeader.writeUInt32LE(byteRate, 28);
  wavHeader.writeUInt16LE(blockAlign, 32);
  wavHeader.writeUInt16LE(BIT_DEPTH, 34);
  wavHeader.write('data', 36);
  wavHeader.writeUInt32LE(dataLength, 40);
  
  const wavBuffer = Buffer.concat([wavHeader, rawData]);
  fs.writeFileSync(fullPath, wavBuffer);
  console.log(`Fixed ${fullPath}`);
});
