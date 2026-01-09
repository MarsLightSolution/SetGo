/**
 * Image Optimization Script for SetGo Frontend
 *
 * This script compresses and optimizes images for production deployment
 * Reduces bundle size by 60-80% while maintaining visual quality
 *
 * Usage: node scripts/optimize-images.js
 */

import sharp from 'sharp';
import { glob } from 'glob';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
  // Input directories to scan
  inputDirs: [
    path.join(__dirname, '../public/images'),
    path.join(__dirname, '../src/assets/images'),
  ],

  // Output directory (backup originals here)
  backupDir: path.join(__dirname, '../backup/images-original'),

  // Image quality settings
  quality: {
    jpeg: 80,  // 70-85 recommended
    png: 80,   // PNG compression quality
    webp: 85,  // WebP quality (better compression)
  },

  // Resize large images
  maxWidth: 1920,
  maxHeight: 1920,

  // Convert to WebP (modern format, better compression)
  generateWebP: true,

  // Files to skip (logos, icons that need transparency)
  skipFiles: ['vite.svg'],

  // File size threshold in KB
  minFileSizeKB: 50, // Only optimize files larger than 50KB
};

// Statistics
const stats = {
  processed: 0,
  skipped: 0,
  saved: 0,
  errors: 0,
  totalOriginalSize: 0,
  totalOptimizedSize: 0,
};

/**
 * Format bytes to human readable
 */
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Backup original file
 */
async function backupFile(filePath) {
  const relativePath = filePath.replace(path.join(__dirname, '..'), '');
  const backupPath = path.join(CONFIG.backupDir, relativePath);
  const backupDir = path.dirname(backupPath);

  await fs.mkdir(backupDir, { recursive: true });
  await fs.copyFile(filePath, backupPath);

  console.log(`  ✓ Backed up to: ${relativePath}`);
}

/**
 * Optimize JPEG image
 */
async function optimizeJPEG(filePath) {
  const image = sharp(filePath);
  const metadata = await image.metadata();

  // Resize if too large
  let pipeline = image;
  if (metadata.width > CONFIG.maxWidth || metadata.height > CONFIG.maxHeight) {
    pipeline = pipeline.resize(CONFIG.maxWidth, CONFIG.maxHeight, {
      fit: 'inside',
      withoutEnlargement: true,
    });
  }

  // Optimize JPEG
  await pipeline
    .jpeg({
      quality: CONFIG.quality.jpeg,
      progressive: true,
      mozjpeg: true, // Use mozjpeg for better compression
    })
    .toFile(filePath + '.tmp');

  // Replace original
  await fs.rename(filePath + '.tmp', filePath);

  // Generate WebP version if enabled
  if (CONFIG.generateWebP) {
    const webpPath = filePath.replace(/\.jpe?g$/i, '.webp');
    await sharp(filePath)
      .webp({ quality: CONFIG.quality.webp })
      .toFile(webpPath);
    console.log(`  ✓ Generated WebP: ${path.basename(webpPath)}`);
  }
}

/**
 * Optimize PNG image
 */
async function optimizePNG(filePath) {
  const image = sharp(filePath);
  const metadata = await image.metadata();

  // Resize if too large
  let pipeline = image;
  if (metadata.width > CONFIG.maxWidth || metadata.height > CONFIG.maxHeight) {
    pipeline = pipeline.resize(CONFIG.maxWidth, CONFIG.maxHeight, {
      fit: 'inside',
      withoutEnlargement: true,
    });
  }

  // Optimize PNG
  await pipeline
    .png({
      quality: CONFIG.quality.png,
      compressionLevel: 9,
      adaptiveFiltering: true,
      palette: true, // Convert to 8-bit palette if possible
    })
    .toFile(filePath + '.tmp');

  // Replace original
  await fs.rename(filePath + '.tmp', filePath);

  // Generate WebP version if enabled
  if (CONFIG.generateWebP) {
    const webpPath = filePath.replace(/\.png$/i, '.webp');
    await sharp(filePath)
      .webp({ quality: CONFIG.quality.webp, lossless: false })
      .toFile(webpPath);
    console.log(`  ✓ Generated WebP: ${path.basename(webpPath)}`);
  }
}

/**
 * Optimize single image file
 */
async function optimizeImage(filePath) {
  try {
    const fileName = path.basename(filePath);

    // Skip if in skip list
    if (CONFIG.skipFiles.includes(fileName)) {
      console.log(`⊘ Skipping: ${fileName} (in skip list)`);
      stats.skipped++;
      return;
    }

    // Check file size
    const fileStat = await fs.stat(filePath);
    const fileSizeKB = fileStat.size / 1024;

    if (fileSizeKB < CONFIG.minFileSizeKB) {
      console.log(`⊘ Skipping: ${fileName} (${formatBytes(fileStat.size)}) - below threshold`);
      stats.skipped++;
      return;
    }

    console.log(`\n📸 Processing: ${fileName} (${formatBytes(fileStat.size)})`);

    // Backup original
    await backupFile(filePath);

    const originalSize = fileStat.size;

    // Optimize based on file type
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.jpg' || ext === '.jpeg') {
      await optimizeJPEG(filePath);
    } else if (ext === '.png') {
      await optimizePNG(filePath);
    } else {
      console.log(`  ⊘ Unsupported format: ${ext}`);
      stats.skipped++;
      return;
    }

    // Calculate savings
    const newStat = await fs.stat(filePath);
    const newSize = newStat.size;
    const saved = originalSize - newSize;
    const savedPercent = ((saved / originalSize) * 100).toFixed(1);

    stats.totalOriginalSize += originalSize;
    stats.totalOptimizedSize += newSize;
    stats.saved += saved;
    stats.processed++;

    console.log(`  ✓ Optimized: ${formatBytes(originalSize)} → ${formatBytes(newSize)}`);
    console.log(`  💾 Saved: ${formatBytes(saved)} (${savedPercent}%)`);

  } catch (error) {
    console.error(`  ✗ Error processing ${filePath}:`, error.message);
    stats.errors++;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('\n🎨 SetGo Image Optimization Tool');
  console.log('='.repeat(50));
  console.log(`Quality Settings: JPEG=${CONFIG.quality.jpeg} PNG=${CONFIG.quality.png} WebP=${CONFIG.quality.webp}`);
  console.log(`Generate WebP: ${CONFIG.generateWebP ? 'Yes' : 'No'}`);
  console.log(`Min File Size: ${CONFIG.minFileSizeKB}KB`);
  console.log('='.repeat(50) + '\n');

  // Create backup directory
  await fs.mkdir(CONFIG.backupDir, { recursive: true });

  // Find all images
  const imagePatterns = [
    '**/*.jpg',
    '**/*.jpeg',
    '**/*.png',
  ];

  for (const inputDir of CONFIG.inputDirs) {
    console.log(`\n📁 Scanning: ${inputDir}\n`);

    for (const pattern of imagePatterns) {
      const images = await glob(pattern, {
        cwd: inputDir,
        absolute: true,
        ignore: ['**/node_modules/**', '**/dist/**', '**/backup/**'],
      });

      for (const imagePath of images) {
        await optimizeImage(imagePath);
      }
    }
  }

  // Print statistics
  console.log('\n' + '='.repeat(50));
  console.log('📊 OPTIMIZATION SUMMARY');
  console.log('='.repeat(50));
  console.log(`✓ Processed: ${stats.processed} images`);
  console.log(`⊘ Skipped: ${stats.skipped} images`);
  console.log(`✗ Errors: ${stats.errors}`);
  console.log('\n💾 SPACE SAVINGS:');
  console.log(`  Original Size: ${formatBytes(stats.totalOriginalSize)}`);
  console.log(`  Optimized Size: ${formatBytes(stats.totalOptimizedSize)}`);
  console.log(`  Total Saved: ${formatBytes(stats.saved)}`);

  if (stats.totalOriginalSize > 0) {
    const totalPercent = ((stats.saved / stats.totalOriginalSize) * 100).toFixed(1);
    console.log(`  Reduction: ${totalPercent}%`);
  }

  console.log('\n✓ Optimization complete!');
  console.log(`  Backups saved to: ${CONFIG.backupDir}`);
  console.log('='.repeat(50) + '\n');
}

// Run the script
main().catch(console.error);
