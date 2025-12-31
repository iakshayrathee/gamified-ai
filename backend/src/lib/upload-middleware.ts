import multer from 'multer';

// Configure multer to store files in memory
const storage = (multer as any).memoryStorage();

// File filter for asset uploads (images, audio, animations)
const assetFileFilter = (req: any, file: any, cb: any) => {
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
    } else {
        cb(new Error(`Invalid file type: ${file.mimetype}. Allowed types: images, audio, animations.`));
    }
};

// File filter for document uploads (PDF, DOCX)
const documentFileFilter = (req: any, file: any, cb: any) => {
    const allowedMimes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    ];

    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
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
export const uploadSingle = (req: any, res: any, next: any) => {
    const upload = (multer as any)(uploadOptions);
    upload.single('file')(req, res, next);
};

// Middleware for multiple file uploads (max 10 files)
export const uploadMultiple = (req: any, res: any, next: any) => {
    const upload = (multer as any)(uploadOptions);
    upload.array('files', 10)(req, res, next);
};

// Middleware for single document upload
export const uploadDocument = (req: any, res: any, next: any) => {
    const documentUpload = (multer as any)(documentUploadOptions);
    documentUpload.single('file')(req, res, next);
};