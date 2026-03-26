import sharp from 'sharp';
import { readdir, stat, rename } from 'fs/promises';
import { join } from 'path';

const DIR = './src/assets/images';

const configs = {
  // Large hero/gallery images - resize + compress heavily
  'gallary01.jpg':  { width: 1200, quality: 70, format: 'jpeg' },
  'gallary02.jpeg': { width: 800,  quality: 70, format: 'jpeg' },
  'gallary03.jpg':  { width: 800,  quality: 70, format: 'jpeg' },

  // Decorative/illustration PNGs - resize + compress
  'binocular.png':  { width: 600,  quality: 75, format: 'png' },
  'logo.png':       { width: 300,  quality: 80, format: 'png' },
  'banner1.png':    { width: 1200, quality: 75, format: 'png' },

  // Ad sidebar images
  'ad01.png':       { width: 400,  quality: 75, format: 'png' },
  'ad02.png':       { width: 400,  quality: 75, format: 'png' },

  // Small images - just compress, no resize
  'post1.png':      { quality: 75, format: 'png' },
  'post2.png':      { quality: 75, format: 'png' },
  'nodata.png':     { quality: 75, format: 'png' },
};

async function getSize(filepath) {
  const s = await stat(filepath);
  return s.size;
}

async function compress() {
  let totalBefore = 0;
  let totalAfter = 0;

  for (const [filename, cfg] of Object.entries(configs)) {
    const filepath = join(DIR, filename);

    try {
      const before = await getSize(filepath);
      totalBefore += before;

      let pipeline = sharp(filepath);

      if (cfg.width) {
        pipeline = pipeline.resize(cfg.width, null, { withoutEnlargement: true });
      }

      if (cfg.format === 'jpeg') {
        pipeline = pipeline.jpeg({ quality: cfg.quality, mozjpeg: true });
      } else if (cfg.format === 'png') {
        pipeline = pipeline.png({ quality: cfg.quality, compressionLevel: 9 });
      }

      const tmpPath = filepath + '.tmp';
      await pipeline.toFile(tmpPath);

      const after = await getSize(tmpPath);
      totalAfter += after;

      // Replace original with compressed
      await rename(tmpPath, filepath);

      const saving = ((1 - after / before) * 100).toFixed(1);
      console.log(`${filename}: ${(before/1024).toFixed(0)}KB -> ${(after/1024).toFixed(0)}KB (${saving}% smaller)`);
    } catch (err) {
      console.error(`Failed: ${filename} - ${err.message}`);
    }
  }

  console.log(`\nTotal: ${(totalBefore/1024/1024).toFixed(2)}MB -> ${(totalAfter/1024/1024).toFixed(2)}MB (${((1 - totalAfter/totalBefore) * 100).toFixed(1)}% smaller)`);
}

compress();
