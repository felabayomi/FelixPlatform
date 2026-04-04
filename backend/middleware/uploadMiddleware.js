const fs = require('fs');
const path = require('path');
const multer = require('multer');

const uploadsDir = path.join(__dirname, '..', 'uploads', 'products');
fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (_req, file, cb) => {
        const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        cb(null, `${Date.now()}-${safeName}`);
    }
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
        fileSize: 5 * 1024 * 1024
    }
});

module.exports = upload;
