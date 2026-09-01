const mongoose = require('mongoose');

const galleryImageSchema = new mongoose.Schema({
    url: { type: String, required: true },
    publicId: { type: String, default: '' }, // Cloudinary public_id for deletion
    order: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('GalleryImage', galleryImageSchema);
