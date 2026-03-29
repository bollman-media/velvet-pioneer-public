const fs = require('fs');
const path = require('path');
const brain = path.join(process.env.HOME, '.gemini/jetski/brain/42e9a06c-2cd6-46e5-99de-e070784e0249');
const dest = path.join(process.env.HOME, 'Desktop/velvet-pioneer/images');

const copies = [
  ['cyberpunk_video_1772314142217.png', 'cyberpunk.png'],
  ['civilization_video_1772314167901.png', 'civilization.png'],
  ['metalic_video_1772314186399.png', 'metalic.png'],
  ['cutout_video_1772314205685.png', 'cutout.png'],
  ['surreal_video_1772314226324.png', 'surreal-video.png'],
  ['explosive_video_1772314246846.png', 'explosive-video.png'],
];

for (const [src, dst] of copies) {
  fs.copyFileSync(path.join(brain, src), path.join(dest, dst));
  console.log(`Copied ${src} -> ${dst}`);
}
console.log('Done!');
