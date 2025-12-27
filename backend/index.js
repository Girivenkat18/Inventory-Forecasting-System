require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const uploadRoutes = require('./routes/uploadRoutes');
const dataRoutes = require('./routes/dataRoutes');
const forecastRoutes = require('./routes/forecastRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  console.log(`[REQUEST] ${req.method} ${req.url}`);
  next();
});
app.use('/uploads', express.static('uploads'));

// DB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};
connectDB();

// Check OpenAI API Key Configuration
console.log('\n=== OpenAI Configuration Check ===');
if (!process.env.OPENAI_API_KEY) {
  console.warn('⚠️  OPENAI_API_KEY is not set in .env file');
  console.warn('   Forecasting will use Moving Average fallback method');
} else if (process.env.OPENAI_API_KEY === 'your_openai_api_key') {
  console.warn('⚠️  OPENAI_API_KEY is set to placeholder value');
  console.warn('   Forecasting will use Moving Average fallback method');
} else {
  console.log('✓ OPENAI_API_KEY is configured');
  console.log(`  Key prefix: ${process.env.OPENAI_API_KEY.substring(0, 20)}...`);
  console.log('  AI-powered forecasting is enabled');
}
console.log('==================================\n');

// Routes
app.use('/api/upload', uploadRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/forecast', forecastRoutes);

app.get('/', (req, res) => {
  res.send('API is running...');
});

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
