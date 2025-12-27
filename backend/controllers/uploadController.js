const fs = require('fs');
const csv = require('csv-parser');
const Product = require('../models/Product');
const SalesData = require('../models/SalesData');

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

                // Map CSV columns to schema if necessary, assuming CSV headers match 
                // productId, name, category, region, unitPrice, currentStock, reorderThreshold

                // Clear existing or Upsert? Let's Upsert to avoid duplicates
                for (let item of validRows) {
                    await Product.findOneAndUpdate(
                        { productId: item.productId },
                        {
                            name: item.name,
                            category: item.category,
                            region: item.region,
                            unitPrice: parseFloat(item.unitPrice),
                            currentStock: parseInt(item.currentStock),
                            reorderThreshold: parseInt(item.reorderThreshold)
                        },
                        { upsert: true, new: true }
                    );
                }

                fs.unlinkSync(req.file.path);
                res.json({ msg: 'Product catalog uploaded successfully', count: validRows.length });
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
                    productId: item.productId,
                    date: new Date(item.date),
                    quantity: parseInt(item.quantity),
                    region: item.region,
                    revenue: parseFloat(item.revenue)
                }));

                // Ideally we might want to check for duplicates or clear old data, 
                // but for now let's just insert.
                await SalesData.insertMany(salesDocs);

                fs.unlinkSync(req.file.path);
                res.json({ msg: 'Sales data uploaded successfully', count: validRows.length });
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
