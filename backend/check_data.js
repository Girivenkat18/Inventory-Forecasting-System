const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });
const SalesData = require('./models/SalesData');

const checkData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        const sample = await SalesData.findOne();
        console.log("Sample Document:", JSON.stringify(sample, null, 2));

        if (sample) {
            const keys = Object.keys(sample._doc);
            console.log("Keys in document:", keys);
        } else {
            console.log("No documents found.");
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
};

checkData();
