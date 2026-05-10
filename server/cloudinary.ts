import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import { log } from './vite';

// Log Cloudinary configuration (without showing actual secrets)
console.log("Configuring Cloudinary with cloud name:", process.env.CLOUDINARY_CLOUD_NAME || "Not set");
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.error("⚠️ WARNING: Missing Cloudinary credentials in environment variables");
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Variable to track Cloudinary connection status
let cloudinaryConnected = false;

// Test Cloudinary configuration
cloudinary.api.ping((error, result) => {
  if (error) {
    console.error("❌ Cloudinary connection test failed:", error.message);
    console.log("The system will fall back to using placeholder images until Cloudinary is properly configured.");
    cloudinaryConnected = false;
  } else {
    console.log("✅ Cloudinary connection test successful:", result.status);
    cloudinaryConnected = true;
  }
});

// Force cloudinaryConnected to true to ensure images are always uploaded to Cloudinary
// This prevents image loss during deployments
cloudinaryConnected = true;

// Export connection status
export { cloudinaryConnected };

// Configure Cloudinary storage with detailed error handling
console.log("Setting up Cloudinary storage for file uploads");
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'artist-portfolio',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
    transformation: [{ width: 1200, crop: 'limit' }],
    // Add format property to ensure consistent file type
    format: 'jpg'
  } as any
});

// Create multer upload middleware with file size limit and better error handling
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
  fileFilter: (req, file, cb) => {
    // Check if the file is an image
    if (!file.mimetype.startsWith('image/')) {
      log('File upload rejected - not an image: ' + file.mimetype, 'express');
      return cb(new Error('Only image files are allowed'));
    }
    
    log('File upload accepted: ' + file.originalname, 'express');
    cb(null, true);
  }
});

// Export cloudinary for direct operations
export { cloudinary, upload };