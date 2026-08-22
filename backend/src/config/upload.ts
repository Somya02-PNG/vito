import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';
import crypto from 'crypto';

// Ensure private upload directories exist
const BASE_PRIVATE_UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'private');
const DOCS_DIR = path.join(BASE_PRIVATE_UPLOAD_DIR, 'documents');
const PHOTOS_DIR = path.join(BASE_PRIVATE_UPLOAD_DIR, 'photos');
const HANDOVER_DIR = path.join(BASE_PRIVATE_UPLOAD_DIR, 'handover');

[BASE_PRIVATE_UPLOAD_DIR, DOCS_DIR, PHOTOS_DIR, HANDOVER_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Storage engine for private documents
const documentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, DOCS_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
    cb(null, `doc-${uniqueSuffix}${ext}`);
  },
});

// Storage engine for vehicle photos
const photoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, PHOTOS_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
    cb(null, `photo-${uniqueSuffix}${ext}`);
  },
});

// Storage engine for handover inspection photos
const handoverStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, HANDOVER_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
    cb(null, `inspection-${uniqueSuffix}${ext}`);
  },
});

// File filters
const documentFileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
  ];
  if (allowedMimeTypes.includes(file.mimetype.toLowerCase())) {
    cb(null, true);
  } else {
    cb(new Error('Invalid document format. Only PDF, JPG, JPEG, PNG, and WEBP files are allowed.'));
  }
};

const photoFileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
  ];
  if (allowedMimeTypes.includes(file.mimetype.toLowerCase())) {
    cb(null, true);
  } else {
    cb(new Error('Invalid photo format. Only JPG, JPEG, PNG, and WEBP images are allowed.'));
  }
};

export const uploadDocument = multer({
  storage: documentStorage,
  fileFilter: documentFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
});

export const uploadPhoto = multer({
  storage: photoStorage,
  fileFilter: photoFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
});

export const uploadHandoverPhoto = multer({
  storage: handoverStorage,
  fileFilter: photoFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
});

export { BASE_PRIVATE_UPLOAD_DIR, DOCS_DIR, PHOTOS_DIR, HANDOVER_DIR };
