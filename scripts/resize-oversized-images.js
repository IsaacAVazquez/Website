#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PLAYER_IMAGES_DIR = path.join(__dirname, '..', 'public', 'player-images');
const MAPPING_FILE = path.join(__dirname, '..', 'src', 'data', 'player-images.json');

// Check if ImageMagick is available
function checkImageMagick() {
  try {
    execSync('convert -version', { stdio: 'pipe' });
    return true;
  } catch (error) {
    return false;
  }
}

// Check if sips (macOS built-in) is available
function checkSips() {
  try {
    execSync('sips --version', { stdio: 'pipe' });
    return true;
  } catch (error) {
    return false;
  }
}

function identifyOversizedImages() {
  console.log('🔍 Identifying oversized images...');
  
  const files = fs.readdirSync(PLAYER_IMAGES_DIR).filter(file => file.endsWith('.jpg'));
  const oversized = [];
  
  for (const file of files) {
    const filePath = path.join(PLAYER_IMAGES_DIR, file);
    
    try {
      const fileInfo = execSync(`file "${filePath}"`, { encoding: 'utf8' });
      
      if (fileInfo.includes('3400 x 2450')) {
        const stats = fs.statSync(filePath);
        oversized.push({
          file,
          path: filePath,
          size: stats.size,
          sizeInMB: (stats.size / (1024 * 1024)).toFixed(1)
        });
      }
    } catch (error) {
      console.warn(`Could not analyze ${file}: ${error.message}`);
    }
  }
  
  return oversized;
}

function resizeImage(imagePath, outputPath) {
  // Try sips first (built into macOS)
  if (checkSips()) {
    try {
      execSync(`sips -z 70 70 "${imagePath}" --out "${outputPath}"`, { stdio: 'pipe' });
      return true;
    } catch (error) {
      console.warn(`sips failed for ${path.basename(imagePath)}: ${error.message}`);
    }
  }
  
  // Fallback to ImageMagick if available
  if (checkImageMagick()) {
    try {
      execSync(`convert "${imagePath}" -resize 70x70! "${outputPath}"`, { stdio: 'pipe' });
      return true;
    } catch (error) {
      console.warn(`ImageMagick failed for ${path.basename(imagePath)}: ${error.message}`);
    }
  }
  
  return false;
}

function createBackup(oversizedImages) {
  const backupDir = path.join(PLAYER_IMAGES_DIR, '..', 'player-images-backup-oversized');
  
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir);
  }
  
  console.log(`📁 Creating backup of ${oversizedImages.length} oversized images...`);
  
  let backupCount = 0;
  for (const img of oversizedImages) {
    try {
      const backupPath = path.join(backupDir, img.file);
      fs.copyFileSync(img.path, backupPath);
      backupCount++;
    } catch (error) {
      console.warn(`Failed to backup ${img.file}: ${error.message}`);
    }
  }
  
  console.log(`✅ Backed up ${backupCount}/${oversizedImages.length} images to ${backupDir}`);
  return backupDir;
}

function resizeOversizedImages(dryRun = true) {
  console.log('🖼️  Resizing oversized player images...\n');
  
  // Check for required tools
  const hasSips = checkSips();
  const hasImageMagick = checkImageMagick();
  
  if (!hasSips && !hasImageMagick) {
    console.error('❌ Neither sips (macOS) nor ImageMagick found.');
    console.error('   Install ImageMagick: brew install imagemagick');
    console.error('   Or use macOS sips (should be built-in)');
    return;
  }
  
  console.log(`🔧 Using ${hasSips ? 'sips (macOS built-in)' : 'ImageMagick'} for resizing`);
  
  // Identify oversized images
  const oversizedImages = identifyOversizedImages();
  
  if (oversizedImages.length === 0) {
    console.log('✅ No oversized images found!');
    return;
  }
  
  console.log(`\n📊 Found ${oversizedImages.length} oversized images:`);
  console.log(`   Total size: ${oversizedImages.reduce((sum, img) => sum + img.size, 0) / (1024 * 1024 * 1024).toFixed(1)} GB`);
  console.log(`   Average size: ${(oversizedImages.reduce((sum, img) => sum + parseFloat(img.sizeInMB), 0) / oversizedImages.length).toFixed(1)} MB each`);
  
  if (dryRun) {
    console.log('\n🔍 DRY RUN - No files will be modified');
    console.log('\nFirst 10 oversized images:');
    oversizedImages.slice(0, 10).forEach(img => {
      console.log(`   • ${img.file} (${img.sizeInMB} MB)`);
    });
    if (oversizedImages.length > 10) {
      console.log(`   ... and ${oversizedImages.length - 10} more`);
    }
    
    console.log('\n💡 To actually resize images, run:');
    console.log('   node scripts/resize-oversized-images.js --execute');
    return;
  }
  
  // Create backup first
  const backupDir = createBackup(oversizedImages);
  
  console.log(`\n🔄 Resizing ${oversizedImages.length} images to 70x70...`);
  
  let successCount = 0;
  let failCount = 0;
  
  for (const img of oversizedImages) {
    try {
      // Create temporary resized file
      const tempPath = img.path + '.resized.tmp';
      
      if (resizeImage(img.path, tempPath)) {
        // Verify the resized image
        const newFileInfo = execSync(`file "${tempPath}"`, { encoding: 'utf8' });
        
        if (newFileInfo.includes('70 x 70')) {
          // Replace original with resized version
          fs.renameSync(tempPath, img.path);
          successCount++;
          
          if (successCount % 50 === 0) {
            console.log(`   ✅ Resized ${successCount}/${oversizedImages.length} images...`);
          }
        } else {
          fs.unlinkSync(tempPath); // Clean up failed resize
          failCount++;
          console.warn(`   ❌ Resize verification failed for ${img.file}`);
        }
      } else {
        failCount++;
        console.warn(`   ❌ Resize failed for ${img.file}`);
      }
    } catch (error) {
      failCount++;
      console.warn(`   ❌ Error processing ${img.file}: ${error.message}`);
    }
  }
  
  console.log(`\n📊 Resize Results:`);
  console.log(`   ✅ Successfully resized: ${successCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
  console.log(`   📁 Backups saved to: ${backupDir}`);
  
  if (successCount > 0) {
    console.log(`\n🎯 Benefits:`);
    console.log(`   • Consistent image rendering across all players`);
    console.log(`   • Faster loading times (~${(successCount * 3.5).toFixed(0)} MB saved)`);
    console.log(`   • Better mobile performance`);
    
    console.log(`\n💡 Next steps:`);
    console.log(`   • Test your fantasy football pages: http://localhost:3001/fantasy-football`);
    console.log(`   • All player images should now render at consistent sizes`);
    console.log(`   • If satisfied, you can delete the backup folder`);
  }
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const execute = args.includes('--execute') || args.includes('-e');
  
  resizeOversizedImages(!execute);
}

module.exports = { resizeOversizedImages, identifyOversizedImages };