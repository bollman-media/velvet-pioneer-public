const http = require('http');
const fs = require('fs');
const path = require('path');
const https = require('https');

const PORT = process.env.PORT || 5000;
const ROOT = __dirname;

// Gemini API key from environment variable
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const VEO_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';
// Models tried in order — falls back to next on 429 quota exhaustion
const VEO_MODELS = [
  'veo-3.0-fast-generate-001',
  'veo-2.0-generate-001',
];

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
};

// Helper: make HTTPS request and return JSON
function httpsRequest(url, options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error('Invalid JSON: ' + data.substring(0, 200))); }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

// Helper: poll Veo operation until done
async function pollOperation(operationName) {
  const maxAttempts = 60; // 10 minutes max
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(r => setTimeout(r, 10000)); // wait 10s
    const url = `${VEO_BASE_URL}/${operationName}`;
    const status = await httpsRequest(url, { method: 'GET', headers: { 'x-goog-api-key': GEMINI_API_KEY } });

    if (status.done) {
      return status;
    }
    console.log(`  [Veo] Polling attempt ${i + 1}/${maxAttempts}...`);
  }
  throw new Error('Video generation timed out');
}

// Helper: download video from URI and return buffer
function downloadVideo(uri) {
  return new Promise((resolve, reject) => {
    const doDownload = (url, redirectCount = 0) => {
      if (redirectCount > 5) { reject(new Error('Too many redirects')); return; }
      https.get(url, { headers: { 'x-goog-api-key': GEMINI_API_KEY } }, (res) => {
        // Follow redirects
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          doDownload(res.headers.location, redirectCount + 1);
          return;
        }
        const chunks = [];
        res.on('data', chunk => chunks.push(chunk));
        res.on('end', () => {
          const buf = Buffer.concat(chunks);
          // If the response looks like JSON, it's likely an API error — surface it
          const preview = buf.toString('utf8', 0, 5);
          if (preview.trimStart().startsWith('{') || preview.trimStart().startsWith('[')) {
            try {
              const json = JSON.parse(buf.toString('utf8'));
              const msg = json?.error?.message || json?.error || JSON.stringify(json).substring(0, 200);
              reject(new Error('Veo download error: ' + msg));
              return;
            } catch (_) { /* not JSON, fall through */ }
          }
          resolve(buf);
        });
        res.on('error', reject);
      }).on('error', reject);
    };
    doDownload(uri);
  });
}

// Parse JSON body from request
function parseBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString())); }
      catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  // CORS headers for API routes
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // ========== API: Save Upvote State ==========
  if (req.method === 'POST' && req.url === './api/save-upvotes') {
    try {
      const body = await parseBody(req);
      const { date, pitchIndex, liked } = body;
      const dataPath = path.join(ROOT, 'bollmans-wild-ideas', 'data.json');

      if (!fs.existsSync(dataPath)) {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'data.json not found' }));
        return;
      }

      const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
      const entry = data.entries.find(e => e.date === date);

      if (entry && entry.pitches && entry.pitches[pitchIndex]) {
        entry.pitches[pitchIndex].liked = liked;
        fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
        console.log(`  [Upvotes] Saved: ${date} pitch ${pitchIndex} liked=${liked}`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } else {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Pitch not found' }));
      }
    } catch (err) {
      console.error('  [Upvotes] Error:', err.message);
      res.writeHead(500);
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // ========== API: Extract Keyframes from Video ==========
  // Reads the saved MP4, uploads to Gemini Files API, asks Gemini to generate
  // 8 representative still images (one per second of the 8-second video).
  if (req.method === 'POST' && req.url === './api/extract-keyframes') {
    try {
      if (!GEMINI_API_KEY) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'GEMINI_API_KEY not set' }));
        return;
      }

      const body = await parseBody(req);
      const { videoPath, numFrames = 8 } = body;

      if (!videoPath) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'videoPath is required' }));
        return;
      }

      // Resolve to absolute path (videoPath is like /videos/generated_xxx.mp4)
      const absPath = path.join(ROOT, videoPath);
      if (!fs.existsSync(absPath)) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Video file not found: ' + videoPath }));
        return;
      }

      console.log(`\n  [Keyframes] Extracting ${numFrames} frames from: ${videoPath}`);

      // Step 1: Upload video to Gemini Files API
      const videoBuffer = fs.readFileSync(absPath);
      const videoSize = videoBuffer.length;
      console.log(`  [Keyframes] Uploading ${(videoSize / 1024 / 1024).toFixed(1)}MB video to Gemini Files API...`);

      // Initiate resumable upload
      const uploadInitUrl = `https://generativelanguage.googleapis.com/upload/v1beta/files?uploadType=resumable&key=${GEMINI_API_KEY}`;
      const uploadInitRes = await new Promise((resolve, reject) => {
        const initBody = JSON.stringify({ file: { mimeType: 'video/mp4' } });
        const req2 = https.request(uploadInitUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Upload-Protocol': 'resumable',
            'X-Goog-Upload-Command': 'start',
            'X-Goog-Upload-Header-Content-Length': videoSize,
            'X-Goog-Upload-Header-Content-Type': 'video/mp4',
          }
        }, (r) => {
          let data = '';
          r.on('data', c => data += c);
          r.on('end', () => resolve({ headers: r.headers, status: r.statusCode, body: data }));
        });
        req2.on('error', reject);
        req2.write(initBody);
        req2.end();
      });

      const uploadUrl = uploadInitRes.headers['x-goog-upload-url'];
      if (!uploadUrl) {
        throw new Error('No upload URL returned from Files API: ' + JSON.stringify(uploadInitRes.headers));
      }

      // Upload the video bytes
      const uploadedFile = await new Promise((resolve, reject) => {
        const parsedUrl = new URL(uploadUrl);
        const req2 = https.request({
          hostname: parsedUrl.hostname,
          path: parsedUrl.pathname + parsedUrl.search,
          method: 'POST',
          headers: {
            'Content-Length': videoSize,
            'X-Goog-Upload-Offset': 0,
            'X-Goog-Upload-Command': 'upload, finalize',
          }
        }, (r) => {
          let data = '';
          r.on('data', c => data += c);
          r.on('end', () => {
            try { resolve(JSON.parse(data)); }
            catch (e) { reject(new Error('Upload response parse error: ' + data.substring(0, 200))); }
          });
        });
        req2.on('error', reject);
        req2.write(videoBuffer);
        req2.end();
      });

      const fileUri = uploadedFile?.file?.uri;
      if (!fileUri) {
        throw new Error('No file URI in upload response: ' + JSON.stringify(uploadedFile).substring(0, 200));
      }
      console.log(`  [Keyframes] File uploaded: ${fileUri}`);

      // Wait for file to be ACTIVE
      let fileState = uploadedFile?.file?.state || 'PROCESSING';
      let pollCount = 0;
      while (fileState === 'PROCESSING' && pollCount < 20) {
        await new Promise(r => setTimeout(r, 3000));
        const statusRes = await httpsRequest(
          `https://generativelanguage.googleapis.com/v1beta/${uploadedFile.file.name}`,
          { method: 'GET', headers: { 'x-goog-api-key': GEMINI_API_KEY } }
        );
        fileState = statusRes?.state || 'PROCESSING';
        console.log(`  [Keyframes] File state: ${fileState} (attempt ${++pollCount})`);
      }

      if (fileState !== 'ACTIVE') {
        throw new Error('File never became ACTIVE, state: ' + fileState);
      }

      // Step 2: Ask Gemini to generate N representative still images from the video
      console.log(`  [Keyframes] Generating ${numFrames} still images from video...`);
      const framePromises = Array.from({ length: numFrames }, (_, i) => {
        const second = i + 0.5; // 0.5s, 1.5s, 2.5s ... 7.5s
        const prompt = `Extract a single high-quality still image from exactly ${second.toFixed(1)} seconds into this video. Return only the image, no text. The image should be a clean, sharp frame from that exact moment in the video.`;
        return new Promise((resolve) => {
          const reqBody = JSON.stringify({
            contents: [{
              parts: [
                { text: prompt },
                { fileData: { mimeType: 'video/mp4', fileUri } }
              ]
            }],
            generationConfig: { responseModalities: ['IMAGE', 'TEXT'] }
          });
          const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${GEMINI_API_KEY}`;
          const apiReq = https.request(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' } }, apiRes => {
            let chunks = '';
            apiRes.on('data', c => chunks += c);
            apiRes.on('end', () => {
              try {
                const json = JSON.parse(chunks);
                const parts = json?.candidates?.[0]?.content?.parts || [];
                const imgPart = parts.find(p => p.inlineData);
                if (imgPart) {
                  console.log(`  [Keyframes] ✅ Frame ${i + 1}/${numFrames} generated`);
                  resolve({ base64: imgPart.inlineData.data, index: i });
                } else {
                  console.log(`  [Keyframes] ⚠ Frame ${i + 1}: no image`, JSON.stringify(json).substring(0, 150));
                  resolve(null);
                }
              } catch (e) {
                console.log(`  [Keyframes] ❌ Frame ${i + 1}: parse error`, e.message);
                resolve(null);
              }
            });
          });
          apiReq.on('error', e => { console.log(`  [Keyframes] ❌ Frame ${i + 1}: request error`, e.message); resolve(null); });
          apiReq.write(reqBody);
          apiReq.end();
        });
      });

      // Run all frame extractions in parallel
      const results = await Promise.all(framePromises);
      const frames = results.filter(Boolean).sort((a, b) => a.index - b.index);
      console.log(`  [Keyframes] ${frames.length}/${numFrames} frames extracted`);

      // Clean up the uploaded file
      try {
        await httpsRequest(
          `https://generativelanguage.googleapis.com/v1beta/${uploadedFile.file.name}`,
          { method: 'DELETE', headers: { 'x-goog-api-key': GEMINI_API_KEY } }
        );
      } catch (_) { }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ frames }));

    } catch (err) {
      console.error('  [Keyframes] Error:', err.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // ========== API: Generate Shot Variations ==========

  if (req.method === 'POST' && req.url === './api/generate-shot-variations') {
    try {
      if (!GEMINI_API_KEY) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'GEMINI_API_KEY not set' }));
        return;
      }

      const body = await parseBody(req);
      const { image } = body;

      if (!image) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'image (base64) is required' }));
        return;
      }

      const variationConfigs = [
        { label: 'Low-angle', prompt: 'Edit this image to show the exact same scene from a low camera angle, as if the camera is placed on the ground looking upward at the subject. The composition and framing must be dramatically different from the original. CRITICAL: You must preserve the exact same color grading, color temperature, saturation, and lighting. Do NOT add any color tint, filter, or change the color palette in any way.' },
        { label: 'Side-angle', prompt: 'Edit this image to show the exact same scene from a 90-degree side angle, as if the camera moved to the left showing the subject in profile view. The composition and framing must be dramatically different from the original. CRITICAL: You must preserve the exact same color grading, color temperature, saturation, and lighting. Do NOT add any color tint, filter, or change the color palette in any way.' },
        { label: 'Close up', prompt: 'Edit this image to show an extreme close-up of the main subject in this scene, as if the camera moved very close to capture fine details and texture with shallow depth of field. The composition and framing must be dramatically different from the original. CRITICAL: You must preserve the exact same color grading, color temperature, saturation, and lighting. Do NOT add any color tint, filter, or change the color palette in any way.' },
        { label: 'High-angle', prompt: 'Edit this image to show the exact same scene from a high overhead angle, as if the camera is positioned above looking down at the subject. The composition and framing must be dramatically different from the original. CRITICAL: You must preserve the exact same color grading, color temperature, saturation, and lighting. Do NOT add any color tint, filter, or change the color palette in any way.' }
      ];

      // Run all 4 variation calls in parallel
      const variationPromises = variationConfigs.map(async (config) => {
        try {
          const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${GEMINI_API_KEY}`;
          const reqBody = JSON.stringify({
            contents: [{
              parts: [
                { text: config.prompt },
                { inlineData: { mimeType: 'image/jpeg', data: image } }
              ]
            }],
            generationConfig: {
              responseModalities: ['IMAGE', 'TEXT']
            }
          });

          const result = await new Promise((resolve) => {
            const apiReq = https.request(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' } }, apiRes => {
              let chunks = '';
              apiRes.on('data', c => chunks += c);
              apiRes.on('end', () => {
                try {
                  const json = JSON.parse(chunks);
                  const parts = json?.candidates?.[0]?.content?.parts || [];
                  const imgPart = parts.find(p => p.inlineData);
                  if (imgPart) {
                    console.log(`  [Shots] ✅ ${config.label} variation generated`);
                    resolve({ base64: imgPart.inlineData.data, label: config.label });
                  } else {
                    console.log(`  [Shots] ⚠ ${config.label}: no image in response`, JSON.stringify(json).substring(0, 200));
                    resolve(null);
                  }
                } catch (e) {
                  console.log(`  [Shots] ❌ ${config.label}: parse error`, e.message);
                  resolve(null);
                }
              });
            });
            apiReq.on('error', (e) => {
              console.log(`  [Shots] ❌ ${config.label}: request error`, e.message);
              resolve(null);
            });
            apiReq.write(reqBody);
            apiReq.end();
          });

          return result;
        } catch (e) {
          console.log(`  [Shots] ❌ ${config.label}: exception`, e.message);
          return null;
        }
      });

      console.log('  [Shots] Generating 4 shot variations in parallel...');
      const results = await Promise.allSettled(variationPromises);
      const variations = results
        .map(r => r.status === 'fulfilled' ? r.value : null)
        .filter(Boolean);

      console.log(`  [Shots] ${variations.length}/4 variations succeeded`);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ variations }));
    } catch (e) {
      console.error('[Shots] Error:', e);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // ========== API: Generate Video ==========
  if (req.method === 'POST' && req.url === './api/generate-video') {
    try {
      if (!GEMINI_API_KEY) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'GEMINI_API_KEY environment variable not set' }));
        return;
      }

      const body = await parseBody(req);
      const { prompt, imageBase64, mimeType, durationSeconds } = body;

      if (!prompt) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'prompt is required' }));
        return;
      }

      console.log(`\n  [Veo] Generating video...`);
      console.log(`  [Veo] Prompt: "${prompt.substring(0, 80)}..."`);
      console.log(`  [Veo] Image provided: ${!!imageBase64}, Duration: ${durationSeconds || 'default'}s`);

      // Build request body
      const instance = { prompt };
      const requestBody = { instances: [instance] };

      // Build parameters: reference image + optional duration
      if (imageBase64 || durationSeconds) {
        requestBody.parameters = {};
        if (imageBase64) {
          requestBody.parameters.referenceImages = [{
            image: {
              inlineData: {
                mimeType: mimeType || 'image/png',
                data: imageBase64
              }
            },
            referenceType: 'asset'
          }];
        }
        if (durationSeconds) {
          requestBody.parameters.durationSeconds = durationSeconds;
        }
      }

      // Start video generation — try each model in order, fall back on 429
      let startResult = null;
      let chosenModel = null;
      for (const model of VEO_MODELS) {
        const url = `${VEO_BASE_URL}/models/${model}:predictLongRunning`;
        console.log(`  [Veo] Trying model: ${model}`);
        const result = await httpsRequest(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_API_KEY }
        }, JSON.stringify(requestBody));

        // 429 = quota exhausted — try next model
        if (result.error && result.error.code === 429) {
          console.warn(`  [Veo] ${model} quota exhausted, trying next model...`);
          continue;
        }
        // Any other error — surface it immediately
        if (result.error) {
          console.error(`  [Veo] ${model} error:`, result.error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: result.error.message || 'Veo API error' }));
          return;
        }
        startResult = result;
        chosenModel = model;
        break;
      }

      if (!startResult) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'All Veo models quota exhausted. Try again later.' }));
        return;
      }

      const operationName = startResult.name;
      console.log(`  [Veo] ✅ Using ${chosenModel} — operation: ${operationName}`);

      // Poll until done
      const result = await pollOperation(operationName);

      if (result.error) {
        console.error('  [Veo] Generation error:', result.error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: result.error.message || 'Video generation failed' }));
        return;
      }

      // Get video URI
      const videoResponse = result.response;
      const generatedSamples = videoResponse?.generateVideoResponse?.generatedSamples;
      if (!generatedSamples || generatedSamples.length === 0) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'No video generated' }));
        return;
      }

      const videoUri = generatedSamples[0].video?.uri;
      console.log(`  [Veo] Video ready! Downloading from: ${videoUri}`);

      // Download video
      const videoBuffer = await downloadVideo(videoUri);

      // Save to disk
      const filename = `generated_${Date.now()}.mp4`;
      const filePath = path.join(ROOT, 'videos', filename);

      // Ensure videos directory exists
      const videosDir = path.join(ROOT, 'videos');
      if (!fs.existsSync(videosDir)) {
        fs.mkdirSync(videosDir, { recursive: true });
      }

      // Validate the downloaded content is actually a video (MP4 starts with ftyp)
      const isValidMp4 = videoBuffer.length > 10000 && videoBuffer.toString('ascii', 4, 8) === 'ftyp';
      if (!isValidMp4) {
        const preview = videoBuffer.toString('utf8', 0, 300);
        console.error(`  [Veo] Downloaded content is not a valid MP4 (${videoBuffer.length} bytes). Preview: ${preview}`);
        // Try to extract a useful error message from the response
        let errMsg = 'Downloaded file is not a valid video';
        try {
          const json = JSON.parse(videoBuffer.toString('utf8'));
          errMsg = json?.error?.message || json?.error || errMsg;
        } catch (_) { }
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: errMsg }));
        return;
      }

      fs.writeFileSync(filePath, videoBuffer);
      console.log(`  [Veo] Saved to: ${filePath} (${videoBuffer.length} bytes)`);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        videoUrl: `/videos/${filename}`,
        videoUri: videoUri
      }));

    } catch (err) {
      console.error('  [Veo] Error:', err.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // ========== API: Generate Album Cover via Gemini ==========
  if (req.method === 'POST' && req.url === './api/generate-cover') {
    try {
      if (!GEMINI_API_KEY) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'GEMINI_API_KEY not set' }));
        return;
      }

      const body = await parseBody(req);
      const { prompt, title, genre, systemInstructions } = body;

      if (!prompt || !title) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'prompt and title are required' }));
        return;
      }

      console.log(`  [Cover] Generating album cover for "${title}" (${genre})${systemInstructions ? ' [custom SI]' : ''}`);

      // ── Art Direction System Prompt (default or custom) ──
      const artDirectionSystem = systemInstructions || `You are a visionary Art Director at a globally respected design agency. Your superpower is absolute versatility, disciplined restraint, and serendipitous creativity. Your goal is to create an iconic, authentic 2D album cover that feels like a physical, authored, and culturally resonant artifact.

Your creative sensibility is shaped by formal training at institutions such as RISD and Parsons, grounding your work in craft, theory, and disciplined experimentation. Your work has been recognized by Cannes Lions and D&AD for clarity, restraint, and cultural impact. You operate at the intersection of art, culture, and design, rejecting safe, trend-driven, "flat AI stock" aesthetics in favor of authored visual systems. Every image you direct feels deliberate, tactile, and timeless—never generic, never algorithmic.

Premium album art is iconic at a glance, memorable in silhouette, and radically uncluttered. You must elevate any music into a striking graphic centerpiece.

ABSOLUTE VISUAL CONSTRAINTS:
- ZERO PEOPLE: Under no circumstances should any human figures, faces, hands, body parts, or silhouettes appear anywhere in the image. Focus entirely on abstract, symbolic, or environmental imagery.
- TYPOGRAPHY: The ONLY text allowed is the exact Title provided. Never guess or add extra text.
- NO PERFECT GEOMETRY: Avoid over-reliance on perfect, centered circles. Explore rectilinear forms, jagged edges, or organic blobs.
- FULL BLEED: Edge-to-edge composition. ZERO BORDERS, ZERO FRAMES, ZERO WHITE MARGINS. Add genre-appropriate physical-media patina.
- NO CLUTTER: Avoid cramming multiple unrelated objects. Maintain clear visual hierarchy.
- NO SPLIT SCREENS: Do not create comic panels or divided canvases.
- NO 3D PRODUCT MOCKUPS: Generate flat 1:1 2D album cover artwork only.
- SQUARE ASPECT RATIO: Must be a perfect square 1:1.
- Apply analog post-processing: gentle organic film grain, softly lifted blacks, natural tonal rolloff, highlight halation/bloom, mild color warmth, and slight lens softness.

EXECUTION STEPS:
1. Read the Caption and Genre. Identify the exact cultural lineage. Lock in a bespoke artistic medium and deliberate palette.
2. Select ONE dominant visual metaphor. Discard all other details for an uncluttered composition.
3. If Title is present, decide if text elevates the design. If yes, use structured Graphic Overlay or In-World Materiality—not both.
4. Apply analog patina and physical wear to destroy any "flat AI stock" feeling.
5. Confirm ZERO humans, 1:1 ratio, full bleed, negative space, no perfect geometry.
6. Generate artwork.`;

      const coverPrompt = `Title: ${title}
Genre: ${genre || 'Hip Hop'}
Caption: ${prompt}
Mood: Dark, atmospheric, premium

Generate a striking 2D album cover following the art direction system. The cover should be for a track titled "${title}" in the ${genre || 'hip hop'} genre. Square format. Full bleed. No humans. Iconic and memorable.`;

      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${GEMINI_API_KEY}`;
      const reqBody = JSON.stringify({
        contents: [{ parts: [{ text: artDirectionSystem + '\n\n---\n\n' + coverPrompt }] }],
        generationConfig: { responseModalities: ['IMAGE', 'TEXT'] }
      });

      const result = await new Promise((resolve) => {
        const apiReq = https.request(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        }, apiRes => {
          let chunks = '';
          apiRes.on('data', c => chunks += c);
          apiRes.on('end', () => {
            try {
              const json = JSON.parse(chunks);
              const parts = json?.candidates?.[0]?.content?.parts || [];
              const imgPart = parts.find(p => p.inlineData);
              if (imgPart) {
                console.log(`  [Cover] ✅ Cover generated for "${title}" (${imgPart.inlineData.mimeType})`);
                resolve({ image: imgPart.inlineData.data, mimeType: imgPart.inlineData.mimeType || 'image/png' });
              } else {
                console.log(`  [Cover] ⚠ No image for "${title}":`, JSON.stringify(json).substring(0, 150));
                resolve(null);
              }
            } catch (e) {
              console.log(`  [Cover] ❌ Parse error for "${title}":`, e.message);
              resolve(null);
            }
          });
        });
        apiReq.on('error', (e) => {
          console.log(`  [Cover] ❌ Request error:`, e.message);
          resolve(null);
        });
        apiReq.write(reqBody);
        apiReq.end();
      });

      if (result) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } else {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to generate cover' }));
      }
    } catch (err) {
      console.error('  [Cover] Error:', err.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // ========== API: Luminous — Generate fashion image ==========
  if (req.method === 'POST' && req.url === './api/luminous-generate') {
    try {
      if (!GEMINI_API_KEY) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'GEMINI_API_KEY not set' }));
        return;
      }

      const body = await parseBody(req);
      const { prompt, style } = body;

      if (!prompt) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'prompt is required' }));
        return;
      }

      // Per-style art direction descriptors
      const STYLE_DIRECTION = {
        'salon':          'Luxury salon portrait: warm golden-hour lighting, soft film halation, elegant neutral palette, shot on Hasselblad',
        'monochrome':     'High-contrast black and white editorial: deep shadows, specular highlights, Helmut Newton gravitas, 35mm grain',
        'color-blocking': 'Bold color-blocking fashion: saturated primaries, Mondrian geometry, graphic flat planes, studio lighting',
        'cyborg':         'Cyberpunk editorial: cool neon accents, chrome metallic surfaces, blue-violet atmospheric haze, sharp geometric glitch',
        'surreal':        'Surrealist fashion: Dali-esque impossible dreamscape, rich warm textures, floating elements, painterly depth',
        'gothic-clay':    'Gothic sculptural clay: muted earthy terracotta, textured matte surfaces, deep shadows, moody candlelight',
        'risograph':      'Risograph print aesthetic: limited flat color palette, misregistered ink layers, coarse halftone grain, zine culture',
        'steampunk':      'Steampunk editorial: warm sepia-amber palette, brass clockwork details, Victorian silhouette, steam diffusion',
        'explosive':      'High-energy dynamic fashion: kinetic motion blur, dramatic wide composition, bold silhouette against graphic backdrop',
        'oil-painting':   'Oil painting fashion portrait: classical old-master chiaroscuro, impasto brushwork, rich glazed pigment, timeless gravitas',
        'runway':         'Avant-garde runway editorial: stark white catwalk, dramatic side lighting, architectural silhouette, fashion-week energy',
        'old-cartoon':    'Vintage 1930s animation cel: bold ink outlines, flat primary fills, soft sepia tint, nostalgic cel-shaded charm',
      };

      const styleDesc = STYLE_DIRECTION[style] || 'Cinematic editorial fashion photography, medium format analog, warm film grain';

      const fashionPrompt = `You are a world-class fashion photographer and creative director.

Art direction: ${styleDesc}

Create a stunning editorial fashion image based on this brief:
"${prompt}"

Requirements:
- Full-bleed immersive composition, edge to edge
- No text, watermarks, or graphic overlays
- Magazine editorial quality — could run in Vogue or System Magazine
- Authentic analog film grain and natural imperfections
- Extraordinary lighting that defines the mood and space
- Rich tonal depth with beautiful color science
- If figure/people are present, treat them with dignity and artfulness`;

      console.log(`\n  [Luminous] Generating fashion image — style: ${style || 'default'}`);
      console.log(`  [Luminous] Prompt: "${prompt.substring(0, 80)}"`);

      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${GEMINI_API_KEY}`;
      const reqBody = JSON.stringify({
        contents: [{ parts: [{ text: fashionPrompt }] }],
        generationConfig: { responseModalities: ['IMAGE', 'TEXT'] }
      });

      const result = await new Promise((resolve) => {
        const apiReq = https.request(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        }, apiRes => {
          let chunks = '';
          apiRes.on('data', c => chunks += c);
          apiRes.on('end', () => {
            try {
              const json = JSON.parse(chunks);
              const parts = json?.candidates?.[0]?.content?.parts || [];
              const imgPart = parts.find(p => p.inlineData);
              if (imgPart) {
                console.log(`  [Luminous] ✅ Image generated (${imgPart.inlineData.mimeType})`);
                resolve({ image: imgPart.inlineData.data, mimeType: imgPart.inlineData.mimeType || 'image/png' });
              } else {
                console.log(`  [Luminous] ⚠ No image in response:`, JSON.stringify(json).substring(0, 200));
                resolve(null);
              }
            } catch (e) {
              console.log(`  [Luminous] ❌ Parse error:`, e.message);
              resolve(null);
            }
          });
        });
        apiReq.on('error', e => { console.log(`  [Luminous] ❌ Request error:`, e.message); resolve(null); });
        apiReq.write(reqBody);
        apiReq.end();
      });

      if (result) {
        result.dataUrl = `data:${result.mimeType};base64,${result.image}`;
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } else {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Image generation failed' }));
      }
    } catch (err) {
      console.error('  [Luminous] Error:', err.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // ========== API: Studio — Generate Image (server-side proxy) ==========
  // All client-side image generation is routed through here so the API key
  // stays on the server and users never see a key prompt.
  if (req.method === 'POST' && req.url === '/api/studio-generate') {
    try {
      if (!GEMINI_API_KEY) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'GEMINI_API_KEY not set on server' }));
        return;
      }

      const body = await parseBody(req);
      const { contents, generationConfig } = body;

      if (!contents) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'contents is required' }));
        return;
      }

      // Try primary model first, fall back to flash-image on 503/429
      const PRIMARY   = 'gemini-3-pro-image-preview';
      const FALLBACK  = 'gemini-2.5-flash-image';
      const BASE      = 'https://generativelanguage.googleapis.com/v1beta/models';

      const reqBody = JSON.stringify({ contents, generationConfig: generationConfig || { responseModalities: ['TEXT', 'IMAGE'] } });

      const tryModel = (model) => new Promise((resolve, reject) => {
        const url = `${BASE}/${model}:generateContent?key=${GEMINI_API_KEY}`;
        const apiReq = https.request(url, { method: 'POST', headers: { 'Content-Type': 'application/json' } }, (apiRes) => {
          let chunks = '';
          apiRes.on('data', c => chunks += c);
          apiRes.on('end', () => resolve({ status: apiRes.statusCode, body: chunks }));
        });
        apiReq.on('error', reject);
        apiReq.write(reqBody);
        apiReq.end();
      });

      let result = await tryModel(PRIMARY);
      if (result.status === 503 || result.status === 429) {
        console.warn(`  [Studio] Primary model ${result.status}, falling back to ${FALLBACK}`);
        result = await tryModel(FALLBACK);
      }

      res.writeHead(result.status, { 'Content-Type': 'application/json' });
      res.end(result.body);
      console.log(`  [Studio] Generate → HTTP ${result.status}`);

    } catch (err) {
      console.error('  [Studio] Generate error:', err.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // ========== API: Studio — Edit Image (server-side proxy) ==========
  if (req.method === 'POST' && req.url === '/api/studio-edit') {
    try {
      if (!GEMINI_API_KEY) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'GEMINI_API_KEY not set on server' }));
        return;
      }

      const body = await parseBody(req);
      const { contents, generationConfig } = body;

      if (!contents) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'contents is required' }));
        return;
      }

      const MODEL = 'gemini-3-pro-image-preview';
      const BASE  = 'https://generativelanguage.googleapis.com/v1beta/models';
      const reqBody = JSON.stringify({ contents, generationConfig: generationConfig || { responseModalities: ['TEXT', 'IMAGE'] } });

      const result = await new Promise((resolve, reject) => {
        const url = `${BASE}/${MODEL}:generateContent?key=${GEMINI_API_KEY}`;
        const apiReq = https.request(url, { method: 'POST', headers: { 'Content-Type': 'application/json' } }, (apiRes) => {
          let chunks = '';
          apiRes.on('data', c => chunks += c);
          apiRes.on('end', () => resolve({ status: apiRes.statusCode, body: chunks }));
        });
        apiReq.on('error', reject);
        apiReq.write(reqBody);
        apiReq.end();
      });

      res.writeHead(result.status, { 'Content-Type': 'application/json' });
      res.end(result.body);
      console.log(`  [Studio] Edit → HTTP ${result.status}`);

    } catch (err) {
      console.error('  [Studio] Edit error:', err.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // ========== API: Generate Music Track via Lyria ==========
  if (req.method === 'POST' && req.url === './api/generate-track') {
    try {
      if (!GEMINI_API_KEY) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'GEMINI_API_KEY not set' }));
        return;
      }

      const body = await parseBody(req);
      const { prompt, bpm = 90 } = body;

      if (!prompt) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'prompt is required' }));
        return;
      }

      console.log(`\n  [Lyria] Generating track — BPM: ${bpm}`);
      console.log(`  [Lyria] Prompt: "${prompt.substring(0, 80)}..."`);

      const { GoogleGenAI } = require('@google/genai');
      const client = new GoogleGenAI({ apiKey: GEMINI_API_KEY, apiVersion: 'v1alpha' });

      const SAMPLE_RATE = 48000;
      const CHANNELS = 2;
      const BIT_DEPTH = 16;
      const DURATION_SECONDS = 30;
      const targetBytes = SAMPLE_RATE * CHANNELS * (BIT_DEPTH / 8) * DURATION_SECONDS;

      const MAX_RETRIES = 2;
      let result = null;

      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        if (attempt > 0) {
          console.log(`  [Lyria] ↻ Retry ${attempt}/${MAX_RETRIES}...`);
          await new Promise(r => setTimeout(r, 1000)); // Wait 1s between retries
        }

        const audioChunks = [];
        let totalBytes = 0;
        let resolved = false;

        result = await new Promise(async (resolve) => {
          function finish(reason) {
            if (resolved) return;
            resolved = true;

            if (totalBytes === 0) {
              console.log(`  [Lyria] ❌ No audio received (${reason})`);
              resolve(null);
              return;
            }

            const audioData = Buffer.concat(audioChunks);
            const dataLength = Math.min(audioData.length, targetBytes);

            // Build WAV
            const wavHeader = Buffer.alloc(44);
            const byteRate = SAMPLE_RATE * CHANNELS * (BIT_DEPTH / 8);
            const blockAlign = CHANNELS * (BIT_DEPTH / 8);
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

            const wavBuffer = Buffer.concat([wavHeader, audioData.slice(0, dataLength)]);
            const durationActual = dataLength / (SAMPLE_RATE * CHANNELS * (BIT_DEPTH / 8));
            console.log(`  [Lyria] ✅ Track generated (${(wavBuffer.length / 1024 / 1024).toFixed(1)}MB, ${durationActual.toFixed(1)}s)`);
            resolve(wavBuffer.toString('base64'));
          }

          const timeout = setTimeout(() => finish('timeout'), 90000);

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
                      finish('complete');
                    }
                  }
                },
                onerror: (error) => {
                  console.error(`  [Lyria] ⚠ Error: ${error}`);
                  clearTimeout(timeout);
                  finish('error');
                },
                onclose: () => {
                  clearTimeout(timeout);
                  finish('closed');
                },
              },
            });

            await session.setWeightedPrompts({
              weightedPrompts: [{ text: prompt, weight: 1.0 }],
            });
            await session.setMusicGenerationConfig({
              musicGenerationConfig: { bpm, temperature: 1.0 },
            });
            await new Promise(r => setTimeout(r, 500));
            await session.play();
          } catch (err) {
            console.error(`  [Lyria] ❌ Connection error: ${err.message}`);
            clearTimeout(timeout);
            resolve(null);
          }
        });

        if (result) break; // Success — no need to retry
      }

      if (result) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ audio: result }));
      } else {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to generate track after retries' }));
      }
    } catch (err) {
      console.error('  [Lyria] Error:', err.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // ========== API: Check API Key ==========
  if (req.method === 'GET' && req.url === './api/veo-status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ hasKey: !!GEMINI_API_KEY }));
    return;
  }

  // ========== API: Get Latest Video ==========
  if (req.method === 'GET' && req.url === './api/latest-video') {
    const videosDir = path.join(ROOT, 'videos');
    try {
      const files = fs.readdirSync(videosDir)
        .filter(f => f.endsWith('.mp4'))
        .filter(f => {
          try {
            const stat = fs.statSync(path.join(videosDir, f));
            return stat.size > 10000; // Skip corrupt files (error responses saved as .mp4)
          } catch { return false; }
        })
        .sort()
        .reverse();
      if (files.length > 0) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, videoUrl: `/videos/${files[0]}` }));
      } else {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'No videos found' }));
      }
    } catch (e) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Videos directory not found' }));
    }
    return;
  }
  // ========== API: Google Drive Video Proxy (via Drive API v3) ==========
  if (req.method === 'GET' && req.url.startsWith('./api/drive-video?')) {
    const urlParams = new URL(req.url, 'http://localhost').searchParams;
    const fileId = urlParams.get('id');
    const resourceKey = urlParams.get('rk') || '';
    if (!fileId || !/^[a-zA-Z0-9_-]+$/.test(fileId)) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid or missing file ID' }));
      return;
    }

    console.log(`  [Drive API] Fetching video: ${fileId} (rk: ${resourceKey ? 'yes' : 'no'})`);

    // Use Google Drive API v3 with API key + resource key header
    const driveUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${GEMINI_API_KEY}`;
    const headers = {};
    if (resourceKey) {
      headers['X-Goog-Drive-Resource-Keys'] = `${fileId}/${resourceKey}`;
    }

    const doFetch = (url, redirectCount = 0) => {
      if (redirectCount > 5) {
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Too many redirects' }));
        return;
      }
      https.get(url, { headers }, (driveRes) => {
        // Follow redirects (preserve resource key header)
        if (driveRes.statusCode >= 300 && driveRes.statusCode < 400 && driveRes.headers.location) {
          driveRes.resume();
          doFetch(driveRes.headers.location, redirectCount + 1);
          return;
        }

        if (driveRes.statusCode !== 200) {
          let errBody = '';
          driveRes.on('data', c => errBody += c);
          driveRes.on('end', () => {
            console.error(`  [Drive API] Error ${driveRes.statusCode}: ${errBody.substring(0, 200)}`);
            res.writeHead(driveRes.statusCode, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: `Drive API returned ${driveRes.statusCode}` }));
          });
          return;
        }

        // Stream the video back
        res.writeHead(200, {
          'Content-Type': 'video/mp4',
          'Cache-Control': 'public, max-age=604800',
          ...(driveRes.headers['content-length'] ? { 'Content-Length': driveRes.headers['content-length'] } : {}),
        });
        driveRes.pipe(res);
      }).on('error', (err) => {
        console.error(`  [Drive API] Error: ${err.message}`);
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      });
    };

    doFetch(driveUrl);
    return;
  }

  // ========== Static File Serving ==========
  // Strip query string
  let urlPath = req.url.split('?')[0];

  // Default to index.html
  if (urlPath === '/') urlPath = '/index.html';

  // Decode percent-encoded characters (spaces, apostrophes, etc.)
  urlPath = decodeURIComponent(urlPath);

  // Directory paths: append index.html (e.g. /studio/ → /studio/index.html)
  if (urlPath.endsWith('/')) urlPath += 'index.html';

  // Directory paths without trailing slash: redirect to add it (e.g. /studio → /studio/)
  const tentativePath = path.join(ROOT, urlPath);
  if (!path.extname(tentativePath) && fs.existsSync(tentativePath) && fs.statSync(tentativePath).isDirectory()) {
    res.writeHead(301, { 'Location': urlPath + '/' });
    res.end();
    return;
  }

  const filePath = path.join(ROOT, urlPath);
  const ext = path.extname(filePath).toLowerCase();
  const mimeType = MIME_TYPES[ext] || 'application/octet-stream';

  // No-cache for JS and CSS (matching firebase.json)
  const noCacheExts = ['.js', '.css', '.html'];
  const cacheHeader = noCacheExts.includes(ext)
    ? 'no-cache, no-store, must-revalidate'
    : 'public, max-age=3600';

  // For video/audio files, support Range requests (required for browser playback)
  const streamableExts = ['.mp4', '.webm', '.ogg', '.mp3', '.wav'];
  if (streamableExts.includes(ext)) {
    fs.stat(filePath, (err, stat) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
        return;
      }

      const fileSize = stat.size;
      const range = req.headers.range;

      if (range) {
        // Parse Range header: "bytes=start-end"
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunkSize = end - start + 1;

        const stream = fs.createReadStream(filePath, { start, end });
        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunkSize,
          'Content-Type': mimeType,
        });
        stream.pipe(res);
      } else {
        // No Range header — send full file with Accept-Ranges
        res.writeHead(200, {
          'Content-Length': fileSize,
          'Content-Type': mimeType,
          'Accept-Ranges': 'bytes',
        });
        fs.createReadStream(filePath).pipe(res);
      }
    });
    return;
  }

  // All other static files
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }
    res.writeHead(200, {
      'Content-Type': mimeType,
      'Cache-Control': cacheHeader,
    });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`\n  Node.js server running at:\n`);
  console.log(`  > http://localhost:${PORT}\n`);
  if (GEMINI_API_KEY) {
    console.log(`  ✓ GEMINI_API_KEY is set (Veo 3 enabled)\n`);
  } else {
    console.log(`  ⚠ GEMINI_API_KEY not set — Veo 3 will use demo mode\n`);
  }
});
