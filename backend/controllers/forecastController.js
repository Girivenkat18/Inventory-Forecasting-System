const SalesData = require('../models/SalesData');
const Product = require('../models/Product');
const Forecast = require('../models/Forecast');
const OpenAI = require('openai');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const generateForecast = async (req, res) => {
    const { days, region, productId } = req.body;
    const timeframeDays = parseInt(days) || 30;

    try {
        let matchStage = {};
        if (region && region !== 'All') {
            matchStage.region = region;
        }
        if (productId && productId !== 'All') {
            matchStage.productId = productId;
        }

        const salesHistory = await SalesData.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: {
                        date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                        productId: "$productId"
                    },
                    quantity: { $sum: "$quantity" }
                }
            },
            { $sort: { "_id.date": 1 } }
        ]);

        const salesTrendMap = {};
        salesHistory.forEach(item => {
            const date = item._id.date;
            salesTrendMap[date] = (salesTrendMap[date] || 0) + item.quantity;
        });
        const salesTrend = Object.keys(salesTrendMap).sort().map(date => ({
            date,
            quantity: salesTrendMap[date]
        }));

        let productQuery = {};
        if (productId && productId !== 'All') productQuery.productId = productId;
        if (region && region !== 'All') productQuery.region = region;


        const products = await Product.find(productQuery).sort({ productId: 1 });

        const historyByProduct = {};
        salesHistory.forEach(item => {
            const pid = item._id.productId;
            if (!historyByProduct[pid]) historyByProduct[pid] = [];
            historyByProduct[pid].push({ date: item._id.date, qty: item.quantity });
        });


        const productMetrics = {};
        products.forEach(p => {
            const hist = historyByProduct[p.productId] || [];

            const totalSold = hist.reduce((acc, curr) => acc + curr.qty, 0);
            const daysWithSales = hist.length;

            let activeDays = 1;
            if (hist.length > 1) {
                const firstDate = new Date(hist[0].date);
                const lastDate = new Date(hist[hist.length - 1].date);
                const diffTime = Math.abs(lastDate - firstDate);
                activeDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
            }
            if (hist.length === 1) activeDays = 1;

            activeDays = Math.max(activeDays, 1);

            const ads = totalSold / activeDays;

            let trend = "stable";
            if (hist.length >= 3) {
                const recent = hist.slice(-10);
                const last3 = recent.slice(-3);
                const prev3 = recent.slice(-6, -3);

                if (prev3.length === 3) {
                    const avgLast = last3.reduce((a, b) => a + b.qty, 0) / 3;
                    const avgPrev = prev3.reduce((a, b) => a + b.qty, 0) / 3;
                    const ratio = avgPrev > 0 ? avgLast / avgPrev : 1;

                    if (ratio > 1.1) trend = "up";
                    else if (ratio < 0.9) trend = "down";
                }
            }

            productMetrics[p.productId] = {
                ads: parseFloat(ads.toFixed(2)),
                trend: trend,
                totalSold,
                activeDays
            };
        });


        let predictions = [];
        let aiAnalysis = "";

        const hasKey = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key';

        if (hasKey) {
            const productLimit = products.slice(0, 50);

            let promptData = "Historical Sales Data Summary:\n";
            productLimit.forEach(p => {
                const hist = historyByProduct[p.productId] || [];
                const metrics = productMetrics[p.productId] || { ads: 0, trend: 'stable' };
                const recent = hist.slice(-5).map(h => h.qty).join(', ');
                const baselineDemand = Math.ceil(metrics.ads * timeframeDays);

                promptData += `Product: ${p.name} (ID: ${p.productId}). `;
                promptData += `ADS (Avg Daily Sales): ${metrics.ads}. Trend: ${metrics.trend}. `;
                promptData += `Recent Sales: [${recent}]. Current Stock: ${p.currentStock}. `;
                promptData += `Baseline Demand (ADS * ${timeframeDays} days): ${baselineDemand}.\n`;
            });

            promptData += `\nTask: Predict total needed quantity for the next ${timeframeDays} days.
        Guidelines:
        1. Start with the 'Baseline Demand' provided for each product.
        2. Adjust the baselineUP or DOWN based on the 'Trend' (e.g. +10-20% for 'up', -10-20% for 'down').
        3. If the Time Frame is higher (e.g. 30 vs 7 days), the Predicted Demand MUST be higher proportionally.
        4. Output MUST be an INTEGER (no decimals).
        5. Provide a brief analysis of the market trend.
        Output JSON: { "analysis": "Brief summary...", "predictions": [ { "productId": "string", "predictedDemand": number, "confidenceScore": number } ] }`;

            try {
                const timeoutPromise = new Promise((resolve, reject) => {
                    setTimeout(() => reject(new Error("OpenAI request timed out")), 25000);
                });

                const apiPromise = openai.chat.completions.create({
                    messages: [
                        { role: "system", content: "You are an inventory forecasting expert. You must return INTEGERS for predicted demand. Be mathematically consistent with the time frame." },
                        { role: "user", content: promptData }
                    ],
                    model: "gpt-3.5-turbo",
                    response_format: { type: "json_object" },
                });

                const completion = await Promise.race([apiPromise, timeoutPromise]);

                const result = JSON.parse(completion.choices[0].message.content);
                aiAnalysis = result.analysis;

                predictions = result.predictions.map(pred => {
                    const prod = products.find(p => p.productId === pred.productId);
                    if (!prod) return null;

                    return {
                        productId: pred.productId,
                        productName: prod.name,
                        currentStock: prod.currentStock || 0,
                        predictedDemand: Math.ceil(pred.predictedDemand), // Ensure integer
                        confidenceScore: pred.confidenceScore || 0.85,
                        reorderRescomended: prod.currentStock < Math.ceil(pred.predictedDemand),
                        reorderThreshold: prod.reorderThreshold || 10
                    };
                }).filter(p => p !== null);

            } catch (openaiError) {
                console.error("OpenAI Error:", openaiError);
                predictions = calculateMovingAverage(products, historyByProduct, timeframeDays, productMetrics);
                aiAnalysis = `Forecast generated using Enhanced Moving Average (AI Unavailable: ${openaiError.message}).`;
            }

        } else {
            predictions = calculateMovingAverage(products, historyByProduct, timeframeDays, productMetrics);
            aiAnalysis = "Forecast generated using Enhanced Moving Average (AI Key not configured).";
        }

        const regionDemandMap = {};
        predictions.forEach(p => {
            const prod = products.find(prod => prod.productId === p.productId);
            if (prod && prod.region) {
                regionDemandMap[prod.region] = (regionDemandMap[prod.region] || 0) + p.predictedDemand;
            }
        });
        const regionalForecast = Object.keys(regionDemandMap).map(region => ({
            region: region,
            predictedDemand: regionDemandMap[region]
        }));

        const regionalRevenueAgg = await SalesData.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: "$region",
                    totalRevenue: { $sum: "$revenue" }
                }
            },
            { $sort: { totalRevenue: -1 } }
        ]);
        const regionalRevenue = regionalRevenueAgg.map(r => ({
            region: r._id,
            revenue: r.totalRevenue
        }));

        const avgPriceByRegion = await SalesData.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: "$region",
                    avgPrice: { $avg: "$unitPrice" }
                }
            }
        ]);
        const priceMap = {};
        avgPriceByRegion.forEach(r => {
            priceMap[r._id] = r.avgPrice || 0;
        });

        const regionalPredictedRevenue = regionalForecast.map(rf => {
            const avgPrice = priceMap[rf.region] || 0;
            return {
                region: rf.region,
                predictedRevenue: Math.round(rf.predictedDemand * avgPrice)
            };
        });

        const totalPredictedRevenue = regionalPredictedRevenue.reduce((sum, r) => sum + r.predictedRevenue, 0);

        res.json({
            timeframeDays,
            predictions,
            aiAnalysis,
            salesTrend,
            regionalForecast,
            regionalRevenue,
            regionalPredictedRevenue,
            totalPredictedRevenue
        });

    } catch (err) {
        console.error("Generate Forecast Error:", err);
        res.status(500).json({ msg: 'Server Error', error: err.message });
    }
};

const calculateMovingAverage = (products, historyByProduct, days, productMetrics) => {
    return products.map(p => {
        const metrics = productMetrics[p.productId];

        let predictedDemand = 0;
        let confidenceScore = 0.5;

        if (!metrics || metrics.activeDays === 0) {
            predictedDemand = 0;
        } else {
            let baseDemand = metrics.ads * days;

            if (metrics.trend === 'up') baseDemand *= 1.15;
            if (metrics.trend === 'down') baseDemand *= 0.85;

            predictedDemand = Math.round(baseDemand);

            confidenceScore = Math.min(0.9, 0.5 + (metrics.activeDays / 365) * 0.4);
        }

        return {
            productId: p.productId,
            productName: p.name,
            currentStock: p.currentStock || 0,
            predictedDemand,
            confidenceScore: parseFloat(confidenceScore.toFixed(2)),
            reorderRescomended: p.currentStock < predictedDemand,
            reorderThreshold: p.reorderThreshold || 10
        };
    });
};



module.exports = {
    generateForecast
};
