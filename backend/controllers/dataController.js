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

        // Aggregation by Region
        const salesByRegion = await SalesData.aggregate([
            {
                $group: {
                    _id: "$region",
                    revenue: { $sum: "$revenue" },
                    quantity: { $sum: "$quantity" }
                }
            }
        ]);

        // Sales Trends (Daily)
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

        // Fetch a subset of recent sales for the table
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
    getProducts
};
