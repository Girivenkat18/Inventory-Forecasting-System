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

        // Get aggregated daily sales for the last 90 days (or more) to show trends
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

        // Also need product info (current stock, etc.)
        let productQuery = {};
        if (productId && productId !== 'All') productQuery.productId = productId;
        // If filtering by region, we might need to filter products available in that region? 
        // The requirement says "forecast future inventory needs by product and region".
        // For simplicity, if region is selected, we assume we are forecasting for that region's stock if applicable.
        // However, Product catalog has a 'region' field.
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
            // AI APPROACH
            // We will send a summary of data to OpenAI to save tokens, rather than every single row.
            // Or if data is small enough, send it all.
            // Let's create a text summary for the prompt.

            // Limit to top 5 products if 'All' is selected to prevent token overflow in this simple demo, 
            // or iterate in batches. For this demo, let's just take up to 10 products.
            const productLimit = products.slice(0, 10);

            let promptData = "Historical Sales Data (last 90 days):\n";
            productLimit.forEach(p => {
                const hist = historyByProduct[p.productId] || [];
                // Calculate simple aggregate for prompt to save space
                const totalSold = hist.reduce((acc, curr) => acc + curr.qty, 0);
                promptData += `Product: ${p.name} (ID: ${p.productId}). Total Sold: ${totalSold}. Trend: [${hist.slice(-5).map(h => h.qty).join(', ')}...]. Current Stock: ${p.currentStock}.\n`;
            });

            promptData += `\nTask: Predict the total quantity needed for the next ${timeframeDays} days for each product. 
        Also analyze the general sales trend and provide a short summary.
        Output JSON format: { "analysis": "string", "predictions": [ { "productId": "string", "predictedDemand": number } ] }`;

            try {
                const completion = await openai.chat.completions.create({
                    messages: [{ role: "system", content: "You are an inventory forecasting expert." }, { role: "user", content: promptData }],
                    model: "gpt-3.5-turbo",
                    response_format: { type: "json_object" },
                });

                const result = JSON.parse(completion.choices[0].message.content);
                aiAnalysis = result.analysis;

                // Map predictions back to product details
                predictions = result.predictions.map(pred => {
                    const prod = products.find(p => p.productId === pred.productId);
                    if (!prod) return null;
                    return {
                        productId: pred.productId,
                        productName: prod.name,
                        predictedDemand: pred.predictedDemand,
                        confidenceScore: 0.9, // Mock confidence
                        reorderRescomended: prod.currentStock < pred.predictedDemand
                    };
                }).filter(p => p !== null);

            } catch (openaiError) {
                console.error("=== OpenAI API Error Details ===");
                console.error("Error Type:", openaiError.constructor.name);
                console.error("Error Message:", openaiError.message);

                // Log detailed error information
                if (openaiError.status) {
                    console.error("HTTP Status Code:", openaiError.status);
                }
                if (openaiError.code) {
                    console.error("Error Code:", openaiError.code);
                }
                if (openaiError.type) {
                    console.error("Error Type:", openaiError.type);
                }
                if (openaiError.response) {
                    console.error("Response Data:", JSON.stringify(openaiError.response.data, null, 2));
                }

                // Log the full error for debugging
                console.error("Full Error Object:", JSON.stringify(openaiError, Object.getOwnPropertyNames(openaiError), 2));
                console.error("================================");

                // Fallback if OpenAI fails call
                predictions = calculateMovingAverage(products, historyByProduct, timeframeDays);

                // Provide user-friendly error messages based on error type
                if (openaiError.status === 429) {
                    aiAnalysis = `Forecast generated using Moving Average method. Note: AI-powered insights are temporarily unavailable due to API quota limits. Please check your OpenAI billing at https://platform.openai.com/account/billing to enable AI features.`;
                } else if (openaiError.status === 401) {
                    aiAnalysis = `Forecast generated using Moving Average method. Note: AI-powered insights require a valid OpenAI API key.`;
                } else {
                    aiAnalysis = `Forecast generated using Moving Average method. Note: AI-powered insights are temporarily unavailable (Error: ${openaiError.message || 'Unknown error'}).`;
                }
            }

        } else {
            // FALLBACK: MOVING AVERAGE
            predictions = calculateMovingAverage(products, historyByProduct, timeframeDays);
            aiAnalysis = "Forecast generated using Moving Average (AI Key not configured).";
        }

        // Save Forecast History
        const forecastEntry = new Forecast({
            timeframeDays,
            region,
            product: productId || 'All',
            predictions,
            aiAnalysis
        });
        await forecastEntry.save();

        res.json(forecastEntry);

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
