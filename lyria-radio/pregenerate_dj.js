const fs = require('fs');
const http = require('http');

const texts = [
  "That was Midnight Drift by Eric b. Absolutely beautiful. I have zero complaints about that. If you want that sound but with your own spin, just tap Remix and make it yours.",
  "That was Cyber Pulse created by user 3 — fresh from the Lyria community. It kind of sounds like if a beautiful sunset learned to write code. Deeply moving, maybe a little confusing, but definitely a ten out of ten. Your ears definitely deserved that treat.",
  "That was Neon Horizon from user 2. Which sounds like — and I mean this with total respect — a robot having a really profound moment at 2 AM. Absolutely beautiful. If you want that sound but with your own spin, just tap Remix and make it yours."
];

async function generate(text, filename) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ text });
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: '../api/dj-voice',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let chunks = '';
      res.on('data', chunk => chunks += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          const data = JSON.parse(chunks);
          if (data.audio && data.audio.data) {
            const buffer = Buffer.from(data.audio.data, 'base64');
            const fullPath = require('path').join(__dirname, filename);
            fs.writeFileSync(fullPath, buffer);
            console.log(`Saved ${fullPath}`);
            resolve();
          } else {
            reject(new Error('No audio data'));
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode} for text: ${text.substring(0,20)}...`));
        }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function main() {
  try {
    await generate(texts[0], 'tracks/dj_break_1.wav');
    await generate(texts[1], 'tracks/dj_break_2.wav');
    await generate(texts[2], 'tracks/dj_break_3.wav');
    console.log('All done!');
  } catch(e) {
    console.error('Failed:', e);
  }
}

main();
