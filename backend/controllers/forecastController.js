const SalesData = require('../models/SalesData');
const Product = require('../models/Product');
const Forecast = require('../models/Forecast');
const OpenAI = require('openai');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const generateForecast = async (req, res) => {
    console.log("-> generateForecast called");
    const { days, region, productId } = req.body;
    console.log(`Params: days=${days}, region=${region}, productId=${productId}`);
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

        console.log("Fetching sales history...");
        // Get aggregated daily sales (Historical Trend)
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
        console.log(`Sales history fetched. Count: ${salesHistory.length}`);

        // Aggregate daily total sales for the trend chart
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

        console.log("Fetching products...");
        const products = await Product.find(productQuery);
        console.log(`Products fetched. Count: ${products.length}`);

        // Prepare data for AI or Fallback
        const historyByProduct = {};
        salesHistory.forEach(item => {
            const pid = item._id.productId;
            if (!historyByProduct[pid]) historyByProduct[pid] = [];
            historyByProduct[pid].push({ date: item._id.date, qty: item.quantity });
        });

        let predictions = [];
        let aiAnalysis = "";

        // CHECK IF OPENAI KEY EXISTS
        const hasKey = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key';
        console.log(`Has OpenAI Key: ${hasKey}`);

        if (hasKey) {
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
        IMPORTANT: Estimate a 'confidenceScore' (0.0 to 1.0) for each prediction based on data consistency.
        Output JSON: { "analysis": "string", "predictions": [ { "productId": "string", "predictedDemand": number, "confidenceScore": number } ] }`;

            try {
                console.log("Calling OpenAI...");
                // Add a timeout for the OpenAI call
                const timeoutPromise = new Promise((resolve, reject) => {
                    setTimeout(() => reject(new Error("OpenAI request timed out")), 20000);
                });

                const apiPromise = openai.chat.completions.create({
                    messages: [{ role: "system", content: "You are an inventory forecasting expert." }, { role: "user", content: promptData }],
                    model: "gpt-3.5-turbo",
                    response_format: { type: "json_object" },
                });

                const completion = await Promise.race([apiPromise, timeoutPromise]);
                console.log("OpenAI responded.");

                const result = JSON.parse(completion.choices[0].message.content);
                aiAnalysis = result.analysis;

                predictions = result.predictions.map(pred => {
                    const prod = products.find(p => p.productId === pred.productId);
                    if (!prod) return null;
                    return {
                        productId: pred.productId,
                        productName: prod.name,
                        predictedDemand: pred.predictedDemand,
                        confidenceScore: pred.confidenceScore || 0.85, // Use AI confidence or fallback
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
            console.log("Using Moving Average fallback.");
            predictions = calculateMovingAverage(products, historyByProduct, timeframeDays);
            aiAnalysis = "Forecast generated using Moving Average (AI Key not configured).";
        }

        // --- NEW AGGREGATIONS FOR VISUALIZATION ---
        // 1. Forecast Distribution by Region (Pie Chart)
        const regionMap = {};
        predictions.forEach(p => {
            const prod = products.find(prod => prod.productId === p.productId);
            if (prod && prod.region) {
                regionMap[prod.region] = (regionMap[prod.region] || 0) + p.predictedDemand;
            }
        });
        const forecastDistribution = Object.keys(regionMap).map(region => ({
            name: region,
            value: regionMap[region]
        }));


        res.json({
            predictions,
            analysis: aiAnalysis,
            salesTrend,
            forecastDistribution
        });
        console.log("Forecast response sent.");

    } catch (err) {
        console.error("Generate Forecast Internal Error:", err);
        res.status(500).json({ msg: 'Server Error', error: err.message });
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
        const avgDaily = totalQty / (hist.length || 1);

        const variance = hist.reduce((acc, curr) => acc + Math.pow(curr.qty - avgDaily, 2), 0) / hist.length;
        const stdDev = Math.sqrt(variance);

        const cv = avgDaily > 0 ? stdDev / avgDaily : 0;
        let confidenceScore = 0.95 - (cv * 0.5);
        confidenceScore = Math.max(0.4, Math.min(0.95, confidenceScore));

        const predictedDemand = Math.round(avgDaily * days);

        return {
            productId: p.productId,
            productName: p.name,
            predictedDemand,
            confidenceScore: parseFloat(confidenceScore.toFixed(2)),
            reorderRescomended: p.currentStock < predictedDemand
        };
    });
};

module.exports = {
    generateForecast
};
