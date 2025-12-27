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
        // 1. Fetch relevant Historical Data
        let matchStage = {};
        if (region && region !== 'All') {
            matchStage.region = region;
        }
        if (productId && productId !== 'All') {
            matchStage.productId = productId;
        }

        // Get aggregated daily sales (Historical Trend)
        // Removed 90-day limit to show full history trend
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

        // Aggregate daily total sales for the trend chart
        // This sums up all products for each day
        const salesTrendMap = {};
        salesHistory.forEach(item => {
            const date = item._id.date;
            salesTrendMap[date] = (salesTrendMap[date] || 0) + item.quantity;
        });
        const salesTrend = Object.keys(salesTrendMap).sort().map(date => ({
            date,
            quantity: salesTrendMap[date]
        }));


        // Also need product info (current stock, etc.)
        let productQuery = {};
        if (productId && productId !== 'All') productQuery.productId = productId;
        if (region && region !== 'All') productQuery.region = region;

        const products = await Product.find(productQuery);

        // Prepare data for AI or Fallback
        // Group sales history by productId for easier processing
        const historyByProduct = {};
        salesHistory.forEach(item => {
            const pid = item._id.productId;
            if (!historyByProduct[pid]) historyByProduct[pid] = [];
            historyByProduct[pid].push({ date: item._id.date, qty: item.quantity });
        });

        let predictions = [];
        let aiAnalysis = "";

        // CHECK IF OPENAI KEY EXISTS
        if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key') {
            const productLimit = products.slice(0, 10);

            let promptData = "Historical Sales Data Summary:\n";
            productLimit.forEach(p => {
                const hist = historyByProduct[p.productId] || [];
                const totalSold = hist.reduce((acc, curr) => acc + curr.qty, 0);
                // Send last 5 data points as trend sample
                promptData += `Product: ${p.name} (ID: ${p.productId}). Total Sold: ${totalSold}. Recent: [${hist.slice(-5).map(h => h.qty).join(', ')}]. Stock: ${p.currentStock}.\n`;
            });

            promptData += `\nTask: Predict total quantity needed for the next ${timeframeDays} days for each product. 
        Also analyze sales trends and provide a summary.
        Output JSON: { "analysis": "string", "predictions": [ { "productId": "string", "predictedDemand": number } ] }`;

            try {
                const completion = await openai.chat.completions.create({
                    messages: [{ role: "system", content: "You are an inventory forecasting expert." }, { role: "user", content: promptData }],
                    model: "gpt-3.5-turbo",
                    response_format: { type: "json_object" },
                });

                const result = JSON.parse(completion.choices[0].message.content);
                aiAnalysis = result.analysis;

                predictions = result.predictions.map(pred => {
                    const prod = products.find(p => p.productId === pred.productId);
                    if (!prod) return null;
                    return {
                        productId: pred.productId,
                        productName: prod.name,
                        predictedDemand: pred.predictedDemand,
                        confidenceScore: 0.9,
                        reorderRescomended: prod.currentStock < pred.predictedDemand
                    };
                }).filter(p => p !== null);

            } catch (openaiError) {
                console.error("OpenAI Error:", openaiError.message);
                predictions = calculateMovingAverage(products, historyByProduct, timeframeDays);
                aiAnalysis = `Forecast generated using Moving Average (AI Unavailable: ${openaiError.message}).`;
            }

        } else {
            // FALLBACK
            predictions = calculateMovingAverage(products, historyByProduct, timeframeDays);
            aiAnalysis = "Forecast generated using Moving Average (AI Key not configured).";
        }

        // --- NEW AGGREGATIONS FOR VISUALIZATION ---

        // --- NEW AGGREGATIONS FOR VISUALIZATION ---

        // 1. Forecast Trend (Future Projection) with Random Noise
        // We have total predicted demand for N days. We distribute this linearly but with randomness
        // to mimic a realistic forecast curve.
        const forecastTrend = [];
        const today = new Date();
        const totalPredictedDemand = predictions.reduce((sum, p) => sum + p.predictedDemand, 0);
        const dailyAvg = totalPredictedDemand / timeframeDays;

        for (let i = 1; i <= timeframeDays; i++) {
            const futureDate = new Date(today);
            futureDate.setDate(today.getDate() + i);
            const dateStr = futureDate.toISOString().split('T')[0];

            // Add +/- 20% random variation
            const noise = (Math.random() - 0.5) * 0.4; // Range: -0.2 to 0.2
            const dailyValue = Math.max(0, Math.round(dailyAvg * (1 + noise)));

            forecastTrend.push({
                date: dateStr,
                quantity: dailyValue
            });
        }

        // 2. Regional Forecast Distribution (Based on Historical Sales Share)
        // Since products in DB might have a static 'region' field (or only one entry due to unique ID),
        // relying on start 'product.region' is inaccurate for multi-region products.
        // Better approach: Distribute meaningful predicted demand based on *historical sales distribution* by region.

        // Step A: Calculate Regional Share per Product from History
        const productRegionalShare = {}; // { productId: { 'North America': 0.6, 'Europe': 0.4 } }

        // We need to re-aggregate sales history by productId AND region
        // We can re-use salesHistory but we grouped by date earlier. 
        // Let's do a quick in-memory aggregation of the raw sales data logic if possible, 
        // OR essentially run a separate lightweight aggregation.
        // Given we already touched SalesData, let's just run a focused aggregation for distribution.
        const regionalStats = await SalesData.aggregate([
            { $match: matchStage },
            { $group: { _id: { productId: "$productId", region: "$region" }, totalQty: { $sum: "$quantity" } } }
        ]);

        regionalStats.forEach(stat => {
            const pid = stat._id.productId;
            const reg = stat._id.region;
            const qty = stat.totalQty;

            if (!productRegionalShare[pid]) productRegionalShare[pid] = { total: 0, regions: {} };
            productRegionalShare[pid].total += qty;
            productRegionalShare[pid].regions[reg] = qty;
        });

        // Step B: Aggregate Predicted Demand into Regions using Shares
        const regionalMap = {};

        predictions.forEach(p => {
            const shareData = productRegionalShare[p.productId];
            if (shareData && shareData.total > 0) {
                // Distribute this product's predicted demand across its active regions
                Object.keys(shareData.regions).forEach(reg => {
                    const share = shareData.regions[reg] / shareData.total;
                    const regionDemand = p.predictedDemand * share;
                    regionalMap[reg] = (regionalMap[reg] || 0) + regionDemand;
                });
            } else {
                // Fallback: If no history (new product?), assign to Product's default region or 'Unknown'
                const prod = products.find(pr => pr.productId === p.productId);
                const reg = prod ? (prod.region || 'Unknown') : 'Unknown';
                regionalMap[reg] = (regionalMap[reg] || 0) + p.predictedDemand;
            }
        });

        const regionalForecast = Object.keys(regionalMap).map(region => ({
            region,
            predictedDemand: Math.round(regionalMap[region])
        }));


        // Save Forecast History
        const forecastEntry = new Forecast({
            timeframeDays,
            region,
            product: productId || 'All',
            predictions,
            aiAnalysis
        });
        // Note: We don't save the transient trend data to DB to keep schema simple, 
        // we just return it in the response.
        // If we needed to save it, we'd update the Forecast model.
        await forecastEntry.save();

        // Combine DB object with extra viz data
        const responseData = {
            ...forecastEntry.toObject(),
            salesTrend,
            forecastTrend,
            regionalForecast
        };

        res.json(responseData);

    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error generating forecast' });
    }
};

const calculateMovingAverage = (products, historyByProduct, days) => {
    return products.map(p => {
        const hist = historyByProduct[p.productId] || [];
        if (hist.length === 0) return {
            productId: p.productId,
            productName: p.name,
            predictedDemand: 0,
            confidenceScore: 0.5,
            reorderRescomended: false
        };

        const totalQty = hist.reduce((acc, curr) => acc + curr.qty, 0);
        const avgDaily = totalQty / (hist.length || 1); // rough daily average
        const predictedDemand = Math.round(avgDaily * days);

        return {
            productId: p.productId,
            productName: p.name,
            predictedDemand,
            confidenceScore: 0.8,
            reorderRescomended: p.currentStock < predictedDemand
        };
    });
};

module.exports = {
    generateForecast
};
