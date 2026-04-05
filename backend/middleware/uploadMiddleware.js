const fs = require('fs');
const path = require('path');
const multer = require('multer');

const uploadsDirectory = path.join(__dirname, '..', 'uploads', 'products');
fs.mkdirSync(uploadsDirectory, { recursive: true });

const sanitizeBaseName = (value = 'image') => {
    const trimmed = String(value || 'image').trim().toLowerCase();
    const withoutExtension = trimmed.replace(/\.[^.]+$/g, '');
    return withoutExtension.replace(/[^a-z0-9-_]+/g, '-').replace(/^-+|-+$/g, '') || 'image';
};

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, uploadsDirectory);
    },
    filename: (_req, file, cb) => {
        const extension = path.extname(file.originalname || '').toLowerCase() || '.png';
        const uniqueName = `${Date.now()}-${sanitizeBaseName(file.originalname)}${extension}`;
        cb(null, uniqueName);
    },
});

const fileFilter = (_req, file, cb) => {
    if (!file.mimetype || !file.mimetype.startsWith('image/')) {
        return cb(new Error('Only image uploads are allowed'));
    }

    cb(null, true);
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 1,
    }
});

module.exports = upload;
