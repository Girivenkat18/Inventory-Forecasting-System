const fs = require('fs');
const csv = require('csv-parser');
const Product = require('../models/Product');
const SalesData = require('../models/SalesData');
const Forecast = require('../models/Forecast');

const uploadProducts = async (req, res) => {
    if (!req.file) return res.status(400).json({ msg: 'No file uploaded' });
    const results = [];

    fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', async () => {
            try {
                // Filter out empty rows (rows where productId is missing/empty)
                const validRows = results.filter(item => item.productId && item.productId.trim() !== '');

                // Deduplicate items based on productId (keep last occurrence)
                const productMap = new Map();
                validRows.forEach(item => {
                    productMap.set(item.productId.trim().replace(/\.0$/, ''), {
                        productId: item.productId.trim().replace(/\.0$/, ''),
                        name: item.name,
                        category: item.category,
                        region: item.region,
                        unitPrice: parseFloat(item.unitPrice) || 0,
                        currentStock: parseInt(item.currentStock) || 0,
                        reorderThreshold: parseInt(item.reorderThreshold) || 10
                    });
                });

                const productsToInsert = Array.from(productMap.values());

                // DESTRUCTIVE: Clear existing Products and Forecasts
                await Product.deleteMany({});
                await Forecast.deleteMany({});

                await Product.insertMany(productsToInsert);

                fs.unlinkSync(req.file.path);
                res.json({ msg: 'Product catalog uploaded successfully (Previous data overwritten)', count: productsToInsert.length });
            } catch (err) {
                console.error(err);
                res.status(500).json({ msg: 'Server error processing CSV' });
            }
        });
};

const uploadSales = async (req, res) => {
    if (!req.file) return res.status(400).json({ msg: 'No file uploaded' });
    const results = [];

    fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', async () => {
            try {
                // Filter out empty rows (rows where productId is missing/empty)
                const validRows = results.filter(item => item.productId && item.productId.trim() !== '');

                // productId, date, quantity, region, revenue
                const salesDocs = validRows.map(item => ({
                    productId: item.productId.trim().replace(/\.0$/, ''),
                    productName: item.productName,
                    date: new Date(item.date),
                    quantity: parseInt(item.quantity),
                    region: item.region,
                    revenue: parseFloat(item.revenue),
                    unitPrice: parseFloat(item.unitPrice),
                    category: item.category
                }));

                // DESTRUCTIVE: Clear existing Sales and Forecasts
                await SalesData.deleteMany({});
                await Forecast.deleteMany({});

                await SalesData.insertMany(salesDocs);

                fs.unlinkSync(req.file.path);
                res.json({ msg: 'Sales data uploaded successfully (Previous data overwritten)', count: validRows.length });
            } catch (err) {
                console.error("Sales Upload Error:", err);
                res.status(500).json({ msg: 'Server error processing CSV: ' + err.message });
            }
        });
};

module.exports = {
    uploadProducts,
    uploadSales
};
