import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';

const UPLOADS_DIR = path.resolve(process.cwd(), 'public', 'uploads');
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp']);
const ALLOWED_IMAGE_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);

function ensureUploadsDir() {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

ensureUploadsDir();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const originalExt = path.extname(file.originalname || '').toLowerCase();
    const ext = ALLOWED_IMAGE_EXTENSIONS.has(originalExt) ? originalExt : '.png';
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `recipe-${unique}${ext}`);
  },
});

function imageFileFilter(_req, file, cb) {
  const extension = path.extname(file.originalname || '').toLowerCase();
  const isAllowedMime = ALLOWED_IMAGE_MIME_TYPES.has(file.mimetype);
  const isAllowedExt = ALLOWED_IMAGE_EXTENSIONS.has(extension);

  if (isAllowedMime || isAllowedExt) {
    cb(null, true);
    return;
  }

  cb(new Error('Seuls les fichiers PNG, JPG, JPEG ou WEBP sont acceptes.'));
}

const uploadSingleRecipeImage = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: MAX_IMAGE_SIZE_BYTES,
  },
}).single('image');

function buildPublicImageUrl(req, filename) {
  const baseUrl = process.env.API_BASE_URL || `${req.protocol}://${req.get('host')}`;
  return `${baseUrl}/uploads/${filename}`;
}

function hasValidImageSignature(filePath) {
  const descriptor = fs.openSync(filePath, 'r');

  try {
    const header = Buffer.alloc(16);
    const bytesRead = fs.readSync(descriptor, header, 0, header.length, 0);
    const signature = header.subarray(0, bytesRead);

    const isPng = signature.length >= 8
      && signature[0] === 0x89
      && signature[1] === 0x50
      && signature[2] === 0x4e
      && signature[3] === 0x47
      && signature[4] === 0x0d
      && signature[5] === 0x0a
      && signature[6] === 0x1a
      && signature[7] === 0x0a;

    const isJpeg = signature.length >= 3
      && signature[0] === 0xff
      && signature[1] === 0xd8
      && signature[2] === 0xff;

    const isWebp = signature.length >= 12
      && signature.subarray(0, 4).toString('ascii') === 'RIFF'
      && signature.subarray(8, 12).toString('ascii') === 'WEBP';

    return isPng || isJpeg || isWebp;
  } finally {
    fs.closeSync(descriptor);
  }
}

export function handleRecipeImageUpload(req, res, next) {
  uploadSingleRecipeImage(req, res, (error) => {
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'Image trop lourde: 5MB maximum.' });
      }

      return res.status(400).json({ message: 'Upload image invalide.' });
    }

    if (error) {
      return res.status(400).json({ message: error.message || 'Upload image invalide.' });
    }

    if (req.file?.filename) {
      if (!hasValidImageSignature(req.file.path)) {
        fs.unlink(req.file.path, () => {});
        return res.status(400).json({ message: 'Le fichier envoye n\'est pas une image valide (PNG, JPG, JPEG ou WEBP).' });
      }

      req.body.imageUrl = buildPublicImageUrl(req, req.file.filename);
    }

    return next();
  });
}

export function parseRecipeMultipartFields(req, _res, next) {
  if (typeof req.body?.ingredients === 'string') {
    try {
      req.body.ingredients = JSON.parse(req.body.ingredients);
    } catch {
      req.body.ingredients = [];
    }
  }

  if (typeof req.body?.etapes === 'string') {
    try {
      req.body.etapes = JSON.parse(req.body.etapes);
    } catch {
      req.body.etapes = [];
    }
  }

  return next();
}
