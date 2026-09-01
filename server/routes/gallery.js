const express = require('express');
const router = express.Router();
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const GalleryImage = require('../models/GalleryImage');
const { authenticateToken, isAdmin } = require('../middleware/authMiddleware');

// Configure Cloudinary from env vars
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Multer: store uploads in memory (buffer) for Cloudinary upload
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB max
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'), false);
        }
    }
});

/**
 * GET /api/gallery
 * Public — returns all gallery images sorted by order.
 * Sets aggressive cache headers for browser caching.
 */
router.get('/', async (req, res) => {
    try {
        const images = await GalleryImage.find().sort({ order: 1, createdAt: 1 });

        // Use a short cache or no-cache to ensure new uploads appear immediately
        res.set('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=300');
        res.json(images);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

/**
 * POST /api/gallery
 * Admin-only — upload a new gallery image.
 * Accepts multipart/form-data with an 'image' field.
 */
router.post('/', authenticateToken, isAdmin, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No image file provided' });
        }

        // Upload buffer to Cloudinary
        const result = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                {
                    folder: 'maximus-trimus/gallery',
                    resource_type: 'image',
                    transformation: [
                        { width: 1200, height: 1600, crop: 'limit' }, // Resize to max 1200x1600
                        { quality: 'auto:good' }, // Auto-optimize quality
                        { fetch_format: 'auto' } // Serve WebP/AVIF where supported
                    ]
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );
            stream.end(req.file.buffer);
        });

        // Determine order (append to end)
        const maxOrder = await GalleryImage.findOne().sort({ order: -1 });
        const nextOrder = maxOrder ? maxOrder.order + 1 : 0;

        const galleryImage = new GalleryImage({
            url: result.secure_url,
            publicId: result.public_id,
            order: nextOrder
        });

        await galleryImage.save();
        res.status(201).json(galleryImage);
    } catch (err) {
        console.error('Gallery upload error:', err);
        res.status(500).json({ message: err.message || 'Failed to upload image' });
    }
});

/**
 * DELETE /api/gallery/:id
 * Admin-only — delete a gallery image from Cloudinary and MongoDB.
 */
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const image = await GalleryImage.findById(req.params.id);
        if (!image) {
            return res.status(404).json({ message: 'Image not found' });
        }

        // Delete from Cloudinary if publicId exists
        if (image.publicId) {
            try {
                await cloudinary.uploader.destroy(image.publicId);
            } catch (cloudErr) {
                console.error('Cloudinary deletion warning:', cloudErr.message);
                // Continue with DB deletion even if Cloudinary fails
            }
        }

        await GalleryImage.findByIdAndDelete(req.params.id);
        res.json({ message: 'Image deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
