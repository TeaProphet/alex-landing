const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const uploadsDir = path.join(__dirname, 'public', 'uploads');
const tempDir = path.join(__dirname, 'temp_uploads_backup');

console.log('🚀 Starting low-memory build process...');

// Step 1: Move images to temp directory
if (fs.existsSync(uploadsDir)) {
  console.log('📂 Moving images to temporary location...');
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
  fs.renameSync(uploadsDir, tempDir);
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('✅ Images moved to temp directory');
}

try {
  // Step 2: Run build without images
  console.log('🏗️  Building Strapi without images...');
  process.env.NODE_OPTIONS = '--max-old-space-size=1536';
  execSync('node --optimize-for-size ./node_modules/@strapi/strapi/bin/strapi.js build --minify false', { stdio: 'inherit' });
  console.log('✅ Build completed successfully');
} catch (error) {
  console.error('❌ Build failed:', error.message);
} finally {
  // Step 3: Restore images
  if (fs.existsSync(tempDir)) {
    console.log('📂 Restoring images from temporary location...');
    fs.rmSync(uploadsDir, { recursive: true, force: true });
    fs.renameSync(tempDir, uploadsDir);
    console.log('✅ Images restored');
  }
}

console.log('🎉 Low-memory build process completed!');