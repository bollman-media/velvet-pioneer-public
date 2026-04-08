const http = require('http');
const fs = require('fs');
const path = require('path');

const prompts = [
  "Chill lo-fi tracks on Mars",
  "Synthwave beats",
  "Cyberpunk beats",
  "Ambient solar drones",
  "Slow space ambient",
  "Fast cosmic sweep",
  "Funky space beat",
  "Deep space lo-fi",
  "Complex synth arps",
  "Fading echoes"
];

async function generateTrack(prompt, index) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ prompt, bpm: 90 });
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: '../api/generate-track',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.audio) {
            const buffer = Buffer.from(json.audio, 'base64');
            const filename = path.join('/Users/bollman/Documents/Jetski/velvet-pioneer/lyria-radio', `track_${index + 1}.wav`);
            fs.writeFileSync(filename, buffer);
            console.log(`Saved ${filename}`);
            resolve();
          } else {
            console.error(`Error generating track ${index + 1}:`, json.error || 'No audio data');
            resolve(); // proceed anyway
          }
        } catch (e) {
          console.error(`Parse error for track ${index + 1}:`, e.message);
          resolve();
        }
      });
    });

    req.on('error', (e) => {
      console.error(`Request error for track ${index + 1}:`, e.message);
      resolve();
    });

    req.write(postData);
    req.end();
  });
}

async function run() {
  for (let i = 0; i < prompts.length; i++) {
    console.log(`Starting track ${i + 1}/${prompts.length}...`);
    await generateTrack(prompts[i], i);
  }
  console.log('All tracks generated.');
}

run();
