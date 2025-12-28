const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    productId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    category: { type: String, required: true },
    region: { type: String },
    unitPrice: { type: Number, required: true },
    currentStock: { type: Number, default: 0 },
    reorderThreshold: { type: Number, default: 10 }
});

module.exports = mongoose.model('Product', ProductSchema);
