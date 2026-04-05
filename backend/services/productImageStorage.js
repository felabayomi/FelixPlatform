const fs = require('fs/promises');
const { v2: cloudinary } = require('cloudinary');

let cloudinaryConfigured = false;

const getCloudinaryConfig = () => ({
    cloudName: process.env.PRODUCTS_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.PRODUCTS_CLOUDINARY_API_KEY || process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.PRODUCTS_CLOUDINARY_API_SECRET || process.env.CLOUDINARY_API_SECRET || '',
    folder: process.env.PRODUCTS_CLOUDINARY_FOLDER || 'felix-platform/products',
});

const isCloudinaryConfigured = () => {
    const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();
    return Boolean(cloudName && apiKey && apiSecret);
};

const ensureCloudinaryConfigured = () => {
    if (cloudinaryConfigured || !isCloudinaryConfigured()) {
        return isCloudinaryConfigured();
    }

    const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();
    cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
    });

    cloudinaryConfigured = true;
    return true;
};

const removeLocalFile = async (filePath) => {
    if (!filePath) {
        return;
    }

    await fs.unlink(filePath).catch(() => { });
};

async function storeProductImage(file) {
    if (!file) {
        throw new Error('Image file is required');
    }

    if (ensureCloudinaryConfigured()) {
        const { folder } = getCloudinaryConfig();

        try {
            const result = await cloudinary.uploader.upload(file.path, {
                folder,
                resource_type: 'image',
                use_filename: true,
                unique_filename: true,
                overwrite: false,
            });

            await removeLocalFile(file.path);

            return {
                imageUrl: result.secure_url || result.url,
                filename: file.filename || 'uploaded-image',
                originalName: file.originalname || 'uploaded-image',
                mimetype: file.mimetype || 'image/png',
                size: file.size || 0,
                storage: 'cloudinary',
                publicId: result.public_id || null,
            };
        } catch (error) {
            await removeLocalFile(file.path);
            throw new Error(error?.message || 'Cloud image upload failed');
        }
    }

    return {
        imageUrl: `/uploads/products/${file.filename}`,
        filename: file.filename || 'uploaded-image',
        originalName: file.originalname || 'uploaded-image',
        mimetype: file.mimetype || 'image/png',
        size: file.size || 0,
        storage: 'local',
        publicId: null,
    };
}

module.exports = {
    storeProductImage,
    isCloudinaryConfigured,
};
