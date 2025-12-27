const mongoose = require('mongoose');

const ForecastSchema = new mongoose.Schema({
    generatedAt: { type: Date, default: Date.now },
    timeframeDays: { type: Number, required: true },
    region: { type: String, default: 'All' },
    product: { type: String, default: 'All' },
    predictions: [
        {
            productId: String,
            productName: String,
            predictedDemand: Number,
            confidenceScore: Number,
            reorderRescomended: Boolean
        }
    ],
    aiAnalysis: { type: String }
});

module.exports = mongoose.model('Forecast', ForecastSchema);
