import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

const USE_CLOUDINARY = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (USE_CLOUDINARY) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  console.log('[Cloudinary] Configured successfully for file uploads.');
} else {
  console.log('[Local Storage] Cloudinary credentials missing. Falling back to local file storage under /uploads.');
}

// Multer Local Configuration (temporary or persistent storage depending on Cloudinary availability)
const uploadDir = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

export const multerUpload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB absolute maximum limit (form handles individual field limits)
  },
  fileFilter: (req, file, cb) => {
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.pdf'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only images (.jpg, .jpeg, .png) and PDFs (.pdf) are allowed'));
    }
  },
});

/**
 * Uploads a file (already processed by Multer) to Cloudinary or returns the local server URL.
 */
export async function uploadToCloudinaryOrLocal(
  file: Express.Multer.File,
  reqHost: string
): Promise<string> {
  if (USE_CLOUDINARY) {
    try {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: 'sucihome_employee_portal',
        resource_type: 'auto',
      });
      // Delete temporary local file
      fs.unlinkSync(file.path);
      return result.secure_url;
    } catch (error) {
      console.error('[Cloudinary] Upload failed, falling back to local file path:', error);
      // Fallback to local server path on upload failure
    }
  }

  // Local URL fallback
  const normalizedPath = file.filename;
  return `http://${reqHost}/uploads/${normalizedPath}`;
}
