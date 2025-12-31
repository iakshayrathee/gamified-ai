"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadDocument = exports.uploadMultiple = exports.uploadSingle = exports.documentUpload = exports.upload = void 0;
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
exports.upload = (0, multer_1.default)({
    storage,
    fileFilter: assetFileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max file size
    },
});
// Create multer upload middleware for documents
exports.documentUpload = (0, multer_1.default)({
    storage,
    fileFilter: documentFileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max file size
    },
});
// Middleware for single file upload (assets)
exports.uploadSingle = exports.upload.single('file');
// Middleware for multiple file uploads (max 10 files)
exports.uploadMultiple = exports.upload.array('files', 10);
// Middleware for single document upload
exports.uploadDocument = exports.documentUpload.single('file');
