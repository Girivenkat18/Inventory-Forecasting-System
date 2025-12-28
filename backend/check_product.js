const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });
const Product = require('./models/Product');

const checkProduct = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        const sample = await Product.findOne();
        console.log("Product Sample:", JSON.stringify(sample, null, 2));

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
};

checkProduct();
