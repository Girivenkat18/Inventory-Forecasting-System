const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });
const SalesData = require('./models/SalesData');

const migrate = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB for migration...");

        // Find documents with productId ending in .0
        const cursor = SalesData.find({ productId: { $regex: /\.0$/ } }).cursor();

        let count = 0;
        for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
            const cleanId = doc.productId.replace(/\.0$/, '');
            doc.productId = cleanId;
            // Also clean productId if it's stored as number but we want string consistency? 
            // The model defines it as String. 
            // Just replacing .0 is safer.
            await doc.save();
            count++;
            if (count % 100 === 0) console.log(`Migrated ${count} docs...`);
        }

        console.log(`Migration complete. Updated ${count} documents.`);
        await mongoose.disconnect();
    } catch (err) {
        console.error("Migration failed:", err);
    }
};

migrate();
