const SalesData = require('../models/SalesData');
const Product = require('../models/Product');

const getOverview = async (req, res) => {
    try {
        const totalSales = await SalesData.aggregate([
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: "$revenue" },
                    totalQuantity: { $sum: "$quantity" },
                    count: { $sum: 1 }
                }
            }
        ]);

        const salesByRegion = await SalesData.aggregate([
            {
                $group: {
                    _id: "$region",
                    revenue: { $sum: "$revenue" },
                    quantity: { $sum: "$quantity" }
                }
            }
        ]);

        const salesTrends = await SalesData.aggregate([
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                    revenue: { $sum: "$revenue" },
                    quantity: { $sum: "$quantity" }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        const recentSales = await SalesData.find().sort({ date: -1 }).limit(100);

        res.json({
            totalRevenue: totalSales[0]?.totalRevenue || 0,
            totalQuantity: totalSales[0]?.totalQuantity || 0,
            salesByRegion,
            salesTrends,
            recentSales
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
};

const downloadSalesData = async (req, res) => {
    try {
        const { Parser } = require('json2csv');
        const salesData = await SalesData.find().sort({ date: -1 }).lean();

        if (!salesData || salesData.length === 0) {
            return res.status(404).json({ msg: 'No sales data found' });
        }

        const fields = [
            { label: 'Date', value: 'date' },
            { label: 'Product ID', value: 'productId' },
            { label: 'Product Name', value: 'productName' },
            { label: 'Category', value: 'category' },
            { label: 'Region', value: 'region' },
            { label: 'Quantity', value: 'quantity' },
            { label: 'Unit Price', value: 'unitPrice' },
            { label: 'Revenue', value: 'revenue' }
        ];

        const json2csvParser = new Parser({ fields });
        const csv = json2csvParser.parse(salesData);

        res.header('Content-Type', 'text/csv');
        res.attachment('sales_data.csv');
        return res.send(csv);

    } catch (err) {
        console.error("CSV Download Error:", err);
        res.status(500).json({ msg: 'Server error generating CSV' });
    }
};

const getProducts = async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
};

module.exports = {
    getOverview,
    getProducts,
    downloadSalesData
};
