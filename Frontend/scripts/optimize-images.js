import imagemin from 'imagemin';
import imageminWebp from 'imagemin-webp';
import imageminMozjpeg from 'imagemin-mozjpeg';
import imageminPngquant from 'imagemin-pngquant';
import fs from 'fs';
import path from 'path';

async function optimizeImages() {
  const inputDir = 'src/assets/images';
  const outputDir = 'src/assets/images/optimized';

  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log('Optimizing images...');

  try {
    // Convert and compress to WebP (modern format)
    const webpFiles = await imagemin([`${inputDir}/*.{jpg,jpeg,png}`], {
      destination: outputDir,
      plugins: [
        imageminWebp({
          quality: 75, // Reduce quality for smaller file size
        }),
      ],
    });

    // Optimize original JPEGs
    const jpegFiles = await imagemin([`${inputDir}/*.{jpg,jpeg}`], {
      destination: outputDir,
      plugins: [
        imageminMozjpeg({
          quality: 75, // Reduce quality
        }),
      ],
    });

    // Optimize original PNGs
    const pngFiles = await imagemin([`${inputDir}/*.png`], {
      destination: outputDir,
      plugins: [
        imageminPngquant({
          quality: [0.6, 0.8], // Reduce quality range
        }),
      ],
    });

    console.log('Images optimized:');
    console.log(`WebP files: ${webpFiles.length}`);
    console.log(`JPEG files: ${jpegFiles.length}`);
    console.log(`PNG files: ${pngFiles.length}`);

    // Calculate size reduction
    const originalSizes = [];
    const optimizedSizes = [];

    for (const file of webpFiles) {
      const originalPath = file.sourcePath;
      const optimizedPath = file.destinationPath;
      
      if (fs.existsSync(originalPath)) {
        originalSizes.push(fs.statSync(originalPath).size);
        optimizedSizes.push(fs.statSync(optimizedPath).size);
      }
    }

    const totalOriginal = originalSizes.reduce((sum, size) => sum + size, 0);
    const totalOptimized = optimizedSizes.reduce((sum, size) => sum + size, 0);
    const reduction = ((totalOriginal - totalOptimized) / totalOriginal) * 100;

    console.log(`\nSize reduction: ${reduction.toFixed(2)}%`);
    console.log(`Original: ${(totalOriginal / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Optimized: ${(totalOptimized / 1024 / 1024).toFixed(2)} MB`);

  } catch (error) {
    console.error('Error optimizing images:', error);
  }
}

// Also optimize upload directory
async function optimizeUploads() {
  const inputDir = 'src/assets/uploads';
  const outputDir = 'src/assets/uploads/optimized';

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  try {
    await imagemin([`${inputDir}/*.{jpg,jpeg,png}`], {
      destination: outputDir,
      plugins: [
        imageminWebp({ quality: 70 }),
        imageminMozjpeg({ quality: 70 }),
        imageminPngquant({ quality: [0.5, 0.7] }),
      ],
    });

    console.log('Upload images optimized');
  } catch (error) {
    console.error('Error optimizing upload images:', error);
  }
}

// Run optimizations
async function main() {
  await optimizeImages();
  await optimizeUploads();
}

main();