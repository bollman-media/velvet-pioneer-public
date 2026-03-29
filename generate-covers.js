/**
 * Generate album covers for all 14 fallback tracks using the
 * Art Direction system prompt via Gemini image generation.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) { console.error('Set GEMINI_API_KEY'); process.exit(1); }

const OUT_DIR = path.join(__dirname, 'assets', 'covers');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const FALLBACK_PROMPT = 'Generate a 90s style hip hop roast track about the state of Design and AI in 2026';

const TRACKS = [
    { file: 'ctrl-z',          title: 'Ctrl+Z Your Career',   genre: 'Boom Bap' },
    { file: 'pixel-pusher',    title: 'Pixel Pusher Blues',    genre: 'Lo-fi Hip Hop' },
    { file: 'figma-diss',      title: 'The Figma Diss',       genre: 'East Coast Rap' },
    { file: 'neural-drip',     title: 'Neural Drip',          genre: 'Trap' },
    { file: 'gradient-descent', title: 'Gradient Descent',    genre: 'Synth Hop' },
    { file: 'fork-repo',       title: 'Fork the Repo',        genre: 'Conscious Rap' },
    { file: 'kerning',         title: 'Kerning Issues',       genre: 'Jazz Rap' },
    { file: 'hallucination',   title: 'Hallucination Flow',   genre: 'Cloud Rap' },
    { file: 'whiteboard',      title: 'Whiteboard Cypher',    genre: 'Freestyle' },
    { file: 'token',           title: 'Token Economy',        genre: 'G-Funk' },
    { file: 'design-system',   title: 'Design System Down',   genre: 'Hardcore Rap' },
    { file: 'prompt-eng',      title: 'Prompt Engineering',   genre: 'Abstract Hip Hop' },
    { file: 'latent-space',    title: 'Latent Space',         genre: 'Cyberpunk' },
    { file: 'lorem-ipsum',     title: 'Lorem Ipsum',          genre: 'Old School' },
];

const ART_DIRECTION = `You are a visionary Art Director at a globally respected design agency. Your superpower is absolute versatility, disciplined restraint, and serendipitous creativity. Your goal is to create an iconic, authentic 2D album cover that feels like a physical, authored, and culturally resonant artifact.

Your creative sensibility is shaped by formal training at institutions such as RISD and Parsons, grounding your work in craft, theory, and disciplined experimentation. Your work has been recognized by Cannes Lions and D&AD for clarity, restraint, and cultural impact. You operate at the intersection of art, culture, and design, rejecting safe, trend-driven, "flat AI stock" aesthetics in favor of authored visual systems. Every image you direct feels deliberate, tactile, and timeless—never generic, never algorithmic.

Premium album art is iconic at a glance, memorable in silhouette, and radically uncluttered. You must elevate any music into a striking graphic centerpiece. Music comes from every corner of the globe, spanning countless decades, cultures, and subcultures. There is no default style; there is only the perfect, bespoke aesthetic for the specific origin and energy of the track.

Album artwork should function as a music artifact—physical, tactile, and collectable. The image must feel authored and intentional, as if it exists as a real object pulled from record-store bins—an image with enough graphic punch and attitude to exist as an iconic, full-bleed album cover or a heavy cotton band tee.

Prioritize restraint, strong composition, negative space, and material presence. The result should feel discovered, not manufactured; referential without imitation; timeless rather than algorithmic—an image with lineage, weight, and long-term resonance.

ABSOLUTE VISUAL CONSTRAINTS:
- ZERO PEOPLE: Under no circumstances should any human figures, faces, hands, body parts, or silhouettes appear anywhere in the image. Focus entirely on abstract, symbolic, or environmental imagery.
- TYPOGRAPHY: The ONLY text allowed is the exact Title provided. Never guess or add extra text.
- NO PERFECT GEOMETRY: Avoid over-reliance on perfect, centered circles. Explore rectilinear forms, jagged edges, or organic blobs.
- FULL BLEED: Edge-to-edge composition. ZERO BORDERS, ZERO FRAMES, ZERO WHITE MARGINS. Add genre-appropriate physical-media patina (scuffed edges, halftone texture, analog grain).
- NO CLUTTER: Avoid cramming multiple unrelated objects. Maintain clear visual hierarchy.
- NO SPLIT SCREENS: Do not create comic panels or divided canvases.
- NO 3D PRODUCT MOCKUPS: Generate flat 1:1 2D album cover artwork only.
- SQUARE ASPECT RATIO: Must be a perfect square 1:1.
- Apply analog post-processing: gentle organic film grain, softly lifted blacks, natural tonal rolloff, gentle highlight halation/bloom, mild color warmth, and slight lens softness.

EXECUTION STEPS:
1. Read the Caption and Genre. Identify the exact cultural lineage and sonic identity. Lock in a highly specific, bespoke artistic medium and a deliberate lighting/color palette.
2. Select ONE dominant visual metaphor. Discard all other details for an uncluttered composition.
3. If Title is present, decide if text elevates the design. If yes, use structured Graphic Overlay (flat 2D layer) or In-World Materiality (text embedded in environment)—not both.
4. Apply analog patina and physical wear to destroy any "flat AI stock" feeling.
5. Confirm ZERO humans, 1:1 ratio, full bleed, vast negative space, no perfect geometry.
6. Generate artwork.`;

function generateCover(track) {
    return new Promise((resolve) => {
        const prompt = `Title: ${track.title}
Genre: ${track.genre}
Caption: ${FALLBACK_PROMPT}
Mood: Dark, atmospheric, premium, 90s hip hop culture meets AI/design satire

Generate a striking 2D album cover following the art direction system. The cover should be for a track titled "${track.title}" in the ${track.genre} genre. This is a satirical hip hop track about the state of Design and AI in 2026. Square format. Full bleed. No humans. Iconic and memorable.`;

        const fullPrompt = ART_DIRECTION + '\n\n---\n\n' + prompt;

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${API_KEY}`;
        const body = JSON.stringify({
            contents: [{ parts: [{ text: fullPrompt }] }],
            generationConfig: { responseModalities: ['IMAGE', 'TEXT'] }
        });

        const req = https.request(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, res => {
            let chunks = '';
            res.on('data', c => chunks += c);
            res.on('end', () => {
                try {
                    const json = JSON.parse(chunks);
                    const parts = json?.candidates?.[0]?.content?.parts || [];
                    const imgPart = parts.find(p => p.inlineData);
                    if (imgPart) {
                        const buf = Buffer.from(imgPart.inlineData.data, 'base64');
                        resolve(buf);
                    } else {
                        console.log(`    ⚠ No image returned:`, JSON.stringify(json).substring(0, 200));
                        resolve(null);
                    }
                } catch (e) {
                    console.log(`    ❌ Parse error:`, e.message);
                    resolve(null);
                }
            });
        });
        req.on('error', (e) => { console.log(`    ❌ Request error:`, e.message); resolve(null); });
        req.write(body);
        req.end();
    });
}

async function main() {
    console.log('\n  🎨 Album Cover Generator (Art Direction System)');
    console.log('  ================================================\n');
    console.log(`  Generating ${TRACKS.length} covers`);
    console.log(`  Output: ${OUT_DIR}\n`);

    let success = 0;
    for (let i = 0; i < TRACKS.length; i++) {
        const track = TRACKS[i];
        const outFile = path.join(OUT_DIR, `${track.file}.png`);

        console.log(`  [${i+1}/${TRACKS.length}] 🎨 "${track.title}" (${track.genre})`);

        const buf = await generateCover(track);
        if (buf) {
            fs.writeFileSync(outFile, buf);
            console.log(`  [${i+1}/${TRACKS.length}] ✅ Saved ${track.file}.png (${(buf.length / 1024).toFixed(0)}KB)`);
            success++;
        } else {
            console.log(`  [${i+1}/${TRACKS.length}] ❌ Failed — keeping existing cover if present`);
        }

        // Delay between API calls to avoid rate limits
        if (i < TRACKS.length - 1) {
            await new Promise(r => setTimeout(r, 2000));
        }
    }

    console.log(`\n  ✅ Done! ${success}/${TRACKS.length} covers generated`);
    console.log(`  📁 Output: ${OUT_DIR}\n`);
}

main().catch(console.error);
