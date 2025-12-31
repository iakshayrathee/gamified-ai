import multer from 'multer';

// Configure multer to store files in memory
const storage = multer.memoryStorage();

// File filter for asset uploads (images, audio, animations)
const assetFileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
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
const documentFileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
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
export const upload = multer({
    storage,
    fileFilter: assetFileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max file size
    },
});

// Create multer upload middleware for documents
export const documentUpload = multer({
    storage,
    fileFilter: documentFileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max file size
    },
});

// Middleware for single file upload (assets)
export const uploadSingle = upload.single('file');

// Middleware for multiple file uploads (max 10 files)
export const uploadMultiple = upload.array('files', 10);

// Middleware for single document upload
export const uploadDocument = documentUpload.single('file');
