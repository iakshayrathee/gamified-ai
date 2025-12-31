"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadDocument = exports.uploadMultiple = exports.uploadSingle = void 0;
const multer_1 = __importDefault(require("multer"));
// Configure multer to store files in memory
const storage = multer_1.default.memoryStorage();
// File filter for asset uploads (images, audio, animations)
const assetFileFilter = (req, file, cb) => {
    const allowedMimes = [
        'image/png',
        'image/jpeg',
        'image/svg+xml',
        'image/webp',
        'image/gif',
        'audio/mpeg',
        'audio/mp3',
        'audio/wav',
        'audio/ogg',
        'video/mp4',
        'video/webm',
    ];
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error(`Invalid file type: ${file.mimetype}. Allowed types: images, audio, animations.`));
    }
};
// File filter for document uploads (PDF, DOCX)
const documentFileFilter = (req, file, cb) => {
    const allowedMimes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    ];
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error(`Invalid file type: ${file.mimetype}. Allowed types: PDF, DOCX.`));
    }
};
// Create multer upload middleware for assets
const uploadOptions = {
    storage,
    fileFilter: assetFileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max file size
    },
};
// Create multer upload middleware for documents
const documentUploadOptions = {
    storage,
    fileFilter: documentFileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max file size
    },
};
// Middleware for single file upload (assets)
const uploadSingle = (req, res, next) => {
    const upload = multer_1.default(uploadOptions);
    upload.single('file')(req, res, next);
};
exports.uploadSingle = uploadSingle;
// Middleware for multiple file uploads (max 10 files)
const uploadMultiple = (req, res, next) => {
    const upload = multer_1.default(uploadOptions);
    upload.array('files', 10)(req, res, next);
};
exports.uploadMultiple = uploadMultiple;
// Middleware for single document upload
const uploadDocument = (req, res, next) => {
    const documentUpload = multer_1.default(documentUploadOptions);
    documentUpload.single('file')(req, res, next);
};
exports.uploadDocument = uploadDocument;
