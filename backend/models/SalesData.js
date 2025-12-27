const mongoose = require('mongoose');

const SalesDataSchema = new mongoose.Schema({
    productId: { type: String, required: true },
    date: { type: Date, required: true },
    quantity: { type: Number, required: true },
    region: { type: String, required: true },
    revenue: { type: Number, required: true }
}, { collection: 'salesdata' });

module.exports = mongoose.model('SalesData', SalesDataSchema);
