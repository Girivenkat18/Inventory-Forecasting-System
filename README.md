# 🚀 AI-Driven Inventory Forecasting System

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)

**An intelligent, full-stack inventory management solution that leverages AI to forecast product demand, optimize stock levels, and provide actionable business insights.**

[Features](#-key-features) • [Tech Stack](#-tech-stack) • [API Reference](#-api-reference) • [Installation](#-getting-started) • [Architecture](#-system-architecture)

</div>

---

## 📋 Project Overview

This system addresses a critical business challenge: **predicting future inventory demands** to minimize stockouts and overstock situations. By combining historical sales data analysis with OpenAI's GPT-3.5-turbo, it delivers accurate demand forecasts with confidence scoring.

### 🎯 Business Problem Solved
- **Stockout Prevention**: Predicts when products need reordering before running out
- **Inventory Optimization**: Reduces carrying costs by avoiding overstock
- **Data-Driven Decisions**: Provides AI-generated analysis and actionable insights
- **Regional Analytics**: Breaks down forecasts and revenue by geographic regions

---

## ✨ Key Features

### 📊 Data Management
| Feature | Description |
|---------|-------------|
| **CSV Upload** | Bulk import sales and product data via drag-and-drop CSV uploads |
| **Data Validation** | Automatic sanitization and validation of product IDs during import |
| **Export Functionality** | Download sales data as CSV for external analysis |

### 🤖 AI-Powered Forecasting
| Feature | Description |
|---------|-------------|
| **GPT-3.5 Integration** | Utilizes OpenAI's language model for intelligent demand prediction |
| **Confidence Scoring** | Each prediction includes a confidence score (0.0-1.0) based on data consistency |
| **Fallback Algorithm** | Moving Average calculation when AI is unavailable |
| **Multi-Parameter Filtering** | Filter forecasts by region, product, and time horizon |

### 📈 Visualization & Reporting
| Feature | Description |
|---------|-------------|
| **Interactive Charts** | Line charts, bar charts, and pie charts using Chart.js |
| **Regional Revenue Analysis** | Breakdown of predicted vs historical revenue by region |
| **Sales Trends** | Time-series visualization of sales patterns |
| **PDF Export** | Professional multi-page PDF reports with charts and tables |

### 🔄 Stock Management
| Feature | Description |
|---------|-------------|
| **Reorder Alerts** | Automatic flagging when stock falls below threshold |
| **Current Stock Tracking** | Real-time inventory level monitoring |
| **Product Catalog** | Comprehensive product management with CRUD operations |

---

## 🛠 Tech Stack

### Backend
| Technology | Purpose |
|------------|---------|
| **Node.js + Express.js** | RESTful API server |
| **MongoDB + Mongoose** | NoSQL database with ODM |
| **OpenAI SDK** | GPT-3.5-turbo API integration |
| **Multer** | File upload handling |
| **csv-parser** | CSV file processing |
| **json2csv** | CSV export generation |

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 19** | Component-based UI framework |
| **Vite** | Fast build tool and dev server |
| **Chart.js + react-chartjs-2** | Data visualization |
| **jsPDF + jspdf-autotable** | PDF report generation |
| **html2canvas** | Chart-to-image conversion for PDFs |
| **Axios** | HTTP client for API communication |
| **React Router v7** | Client-side routing |
| **React Icons** | Icon library |

---

## 📡 API Reference

### Base URL
```
http://localhost:5000/api
```

### Endpoints Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/upload/sales` | Upload sales data CSV |
| `POST` | `/upload/products` | Upload product catalog CSV |
| `GET` | `/data/overview` | Get sales overview and metrics |
| `GET` | `/data/products` | Get all products |
| `GET` | `/data/download-sales` | Download sales data as CSV |
| `POST` | `/forecast/generate` | Generate AI-powered demand forecast |

---

### 📤 Upload Endpoints

#### Upload Sales Data
```http
POST /api/upload/sales
Content-Type: multipart/form-data
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `file` | `File` | CSV file containing sales records |

**Expected CSV Headers:**
```csv
productId,productName,date,quantity,region,revenue,unitPrice,category
```

**Response:**
```json
{
  "msg": "Sales data uploaded successfully",
  "count": 150
}
```

---

#### Upload Products
```http
POST /api/upload/products
Content-Type: multipart/form-data
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `file` | `File` | CSV file containing product catalog |

**Expected CSV Headers:**
```csv
productId,name,category,region,unitPrice,currentStock,reorderThreshold
```

**Response:**
```json
{
  "msg": "Products uploaded successfully",
  "count": 50
}
```

---

### 📊 Data Endpoints

#### Get Overview
```http
GET /api/data/overview
```

**Response:**
```json
{
  "totalRevenue": 1250000,
  "totalQuantity": 15000,
  "salesByRegion": [
    { "_id": "North America", "revenue": 500000, "quantity": 6000 },
    { "_id": "Europe", "revenue": 450000, "quantity": 5500 },
    { "_id": "Asia", "revenue": 300000, "quantity": 3500 }
  ],
  "salesTrends": [
    { "_id": "2024-01-15", "revenue": 25000, "quantity": 300 },
    { "_id": "2024-01-16", "revenue": 28000, "quantity": 340 }
  ],
  "recentSales": [
    {
      "productId": "10001",
      "productName": "Product A",
      "date": "2024-01-20T00:00:00.000Z",
      "quantity": 50,
      "region": "North America",
      "revenue": 2500,
      "unitPrice": 50,
      "category": "Electronics"
    }
  ]
}
```

---

#### Get All Products
```http
GET /api/data/products
```

**Response:**
```json
[
  {
    "productId": "10001",
    "name": "Product A",
    "category": "Electronics",
    "region": "North America",
    "unitPrice": 50,
    "currentStock": 150,
    "reorderThreshold": 20
  }
]
```

---

#### Download Sales CSV
```http
GET /api/data/download-sales
```

**Response:** Downloads `sales_data.csv` file

---

### 🔮 Forecast Endpoint

#### Generate Forecast
```http
POST /api/forecast/generate
Content-Type: application/json
```

**Request Body:**
```json
{
  "days": 30,
  "region": "All",
  "productId": "All"
}
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `days` | `number` | Forecast time horizon (default: 30) |
| `region` | `string` | Filter by region or "All" |
| `productId` | `string` | Filter by product ID or "All" |

**Response:**
```json
{
  "predictions": [
    {
      "productId": "10001",
      "productName": "Product A",
      "currentStock": 150,
      "predictedDemand": 200,
      "confidenceScore": 0.87,
      "reorderRescomended": true,
      "reorderThreshold": 20
    }
  ],
  "aiAnalysis": "Based on the historical sales data, Product A shows a consistent upward trend with seasonal variations. The predicted demand of 200 units for the next 30 days is based on...",
  "salesTrend": [
    { "date": "2024-01-01", "quantity": 45 },
    { "date": "2024-01-02", "quantity": 52 }
  ],
  "regionalForecast": [
    { "region": "North America", "predictedDemand": 500 },
    { "region": "Europe", "predictedDemand": 350 }
  ],
  "regionalRevenue": [
    { "region": "North America", "revenue": 250000 },
    { "region": "Europe", "revenue": 175000 }
  ],
  "regionalPredictedRevenue": [
    { "region": "North America", "predictedRevenue": 25000 },
    { "region": "Europe", "predictedRevenue": 17500 }
  ],
  "totalPredictedRevenue": 42500
}
```

---

## 🏗 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React + Vite)                  │
├─────────────────────────────────────────────────────────────────┤
│  Dashboard.jsx       │  ProductCatalog.jsx  │  Components       │
│  - CSV Upload        │  - Product List      │  - ForecastResults│
│  - View Sales Data   │  - Product Details   │  - ForecastControls│
│  - Generate Forecast │                      │  - SalesOverviewModal│
└─────────────────────┬───────────────────────┴───────────────────┘
                      │ Axios HTTP Requests
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Backend (Node.js + Express)                  │
├─────────────────────────────────────────────────────────────────┤
│  Routes             │  Controllers          │  Models (MongoDB) │
│  - /upload/*        │  - uploadController   │  - Product        │
│  - /data/*          │  - dataController     │  - SalesData      │
│  - /forecast/*      │  - forecastController │  - Forecast       │
└─────────────────────┴───────────┬───────────┴───────────────────┘
                                  │
                      ┌───────────┴───────────┐
                      ▼                       ▼
              ┌───────────────┐       ┌───────────────┐
              │   MongoDB     │       │   OpenAI API  │
              │   Database    │       │  (GPT-3.5)    │
              └───────────────┘       └───────────────┘
```

---

## 📁 Project Structure

```
Inventory_Forecasting_System/
├── backend/
│   ├── controllers/
│   │   ├── dataController.js      # Overview, products, CSV download
│   │   ├── forecastController.js  # AI forecasting logic
│   │   └── uploadController.js    # CSV file processing
│   ├── models/
│   │   ├── Product.js             # Product schema
│   │   ├── SalesData.js           # Sales records schema
│   │   └── Forecast.js            # Forecast results schema
│   ├── routes/
│   │   ├── dataRoutes.js          # Data API routes
│   │   ├── forecastRoutes.js      # Forecast API routes
│   │   └── uploadRoutes.js        # Upload API routes
│   ├── index.js                   # Express server entry point
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ForecastResults.jsx    # Charts & prediction display
│   │   │   ├── ForecastControls.jsx   # Filter controls
│   │   │   └── SalesOverviewModal.jsx # Sales data modal
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx          # Main dashboard
│   │   │   └── ProductCatalog.jsx     # Product management
│   │   ├── services/
│   │   │   └── api.js                 # Axios API client
│   │   ├── App.jsx                    # Root component
│   │   └── main.jsx                   # Entry point
│   ├── index.html
│   └── package.json
│
├── products.csv                   # Sample product data
├── sales.csv                      # Sample sales data
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18 or higher
- **MongoDB** (local or cloud - MongoDB Atlas)
- **OpenAI API Key** (for AI-powered forecasting)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/Inventory_Forecasting_System.git
   cd Inventory_Forecasting_System
   ```

2. **Set up the Backend**
   ```bash
   cd backend
   npm install
   ```

3. **Configure Environment Variables**
   
   Create a `.env` file in the `backend` directory:
   ```env
   OPENAI_API_KEY=sk-your-openai-api-key-here
   MONGODB_URI=mongodb://localhost:27017/inventory_forecast
   PORT=5000
   ```

4. **Set up the Frontend**
   ```bash
   cd ../frontend
   npm install
   ```

### Running the Application

1. **Start MongoDB** (if running locally)
   ```bash
   mongod
   ```

2. **Start the Backend Server**
   ```bash
   cd backend
   npm start
   ```
   Backend runs on: `http://localhost:5000`

3. **Start the Frontend Dev Server**
   ```bash
   cd frontend
   npm run dev
   ```
   Frontend runs on: `http://localhost:5173`

---

## 📊 Database Schemas

### Product Schema
```javascript
{
  productId: String (required, unique),
  name: String (required),
  category: String (required),
  region: String,
  unitPrice: Number (required),
  currentStock: Number (default: 0),
  reorderThreshold: Number (default: 10)
}
```

### SalesData Schema
```javascript
{
  productId: String (required),
  productName: String,
  date: Date (required),
  quantity: Number (required),
  region: String (required),
  revenue: Number (required),
  unitPrice: Number,
  category: String
}
```

### Forecast Schema
```javascript
{
  generatedAt: Date,
  timeframeDays: Number (required),
  region: String,
  product: String,
  predictions: [{
    productId: String,
    productName: String,
    predictedDemand: Number,
    confidenceScore: Number,
    reorderRecommended: Boolean
  }],
  aiAnalysis: String
}
```

---

## 🧠 Forecasting Algorithm

The system employs a **hybrid forecasting approach**:

### Primary: AI-Powered (OpenAI GPT-3.5-turbo)
1. Aggregates historical sales by product
2. Calculates total sold quantities and recent trends
3. Sends structured data to GPT-3.5-turbo as a prompt
4. AI analyzes patterns and returns predictions with confidence scores
5. Includes 20-second timeout with automatic fallback

### Fallback: Statistical Moving Average
When AI is unavailable (rate limits, network issues, no API key):

```javascript
// Coefficient of Variation-based confidence
variance = Σ(qty - avgDaily)² / n
stdDev = √variance
cv = stdDev / avgDaily
confidenceScore = 0.95 - (cv * 0.5)  // Range: 0.4 - 0.95
predictedDemand = avgDaily × days
```

---

## 🖼 Screenshots

> *Upload sales CSV, view real-time analytics, and generate AI-powered forecasts*

### Key UI Features:
- **Dark Mode Interface** with glassmorphism design
- **Interactive Charts** with hover tooltips
- **Responsive Tables** with sorting and filtering
- **PDF Export** with professional formatting

---

## 🔒 Error Handling

The system includes robust error handling:

| Scenario | Handling |
|----------|----------|
| Invalid CSV format | Returns validation error with details |
| Duplicate product IDs | Updates existing records |
| OpenAI rate limit | Falls back to Moving Average |
| Network timeout | 20-second timeout with fallback |
| Empty database | Returns appropriate empty state |

---

## 📈 Performance Optimizations

- **Aggregation Pipelines**: MongoDB aggregations for efficient data processing
- **Pagination**: Recent sales limited to 100 records for faster loading
- **Chunked Processing**: CSV files processed in memory-efficient chunks
- **Lazy Loading**: Charts render on-demand
- **Debounced API Calls**: Prevents excessive requests during rapid interactions

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📄 License

This project is licensed under the MIT License.

---

<div align="center">
  <strong>Built with ❤️ for smarter inventory management</strong>
</div>
