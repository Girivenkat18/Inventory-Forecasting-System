# 🚀 AI-Driven Inventory Forecasting System

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)

**A full-stack inventory management solution that leverages OpenAI GPT-3.5 to forecast product demand and optimize stock levels.**

[Features](#-features) • [Tech Stack](#-tech-stack) • [API Reference](#-api-reference) • [Installation](#-getting-started)

</div>

---

## 📋 Overview

This system helps businesses predict future inventory demands by analyzing historical sales data. It combines statistical analysis with AI-powered insights to deliver accurate demand forecasts with confidence scoring.

### 🎯 Problem Solved
- **Stockout Prevention**: Identifies products that need reordering before running out
- **Data-Driven Decisions**: AI-generated analysis and confidence scores for each prediction
- **Regional Analytics**: Revenue and demand breakdown by geographic regions

---

## ✨ Features

### 📊 Dashboard Page (`/`)
- **Upload Sales CSV**: Import historical sales data via file upload
- **View Sales Overview Modal**:
  - Quarterly revenue line chart
  - Revenue by region bar chart
  - Key metrics (Total Revenue, Total Units Sold)
  - Recent sales data table (100 records)
  - Download sales data as CSV
- **AI Forecast Generation**:
  - Select timeframe (1, 5, 10, 30, or 90 days)
  - Generate predictions for all products
  - View detailed prediction table with:
    - Product ID & Name
    - Current Stock
    - Predicted Demand
    - Confidence Score
    - Reorder Threshold
    - Reorder Status (OK / Reorder Needed)
  - Regional revenue charts (historical vs predicted)
  - Sales trend visualization
  - **PDF Export**: Multi-page professional report

### 📦 Product Catalog Page (`/products`)
- **Upload Products CSV**: Import product catalog
- **Product Table Display**:
  - Product ID, Name, Category, Region
  - Unit Price, Current Stock, Reorder Threshold
  - Stock Status (In Stock / Low Stock badge)

---

## 🛠 Tech Stack

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | - | Runtime environment |
| Express.js | 5.2.1 | REST API framework |
| MongoDB + Mongoose | 9.0.2 | Database & ODM |
| OpenAI SDK | 6.15.0 | GPT-3.5-turbo integration |
| Multer | 2.0.2 | File upload handling |
| csv-parser | 3.2.0 | CSV file processing |
| json2csv | 6.0.0 | CSV export generation |

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.2.0 | UI framework |
| Vite | 7.2.4 | Build tool & dev server |
| Chart.js | 4.5.1 | Data visualization |
| react-chartjs-2 | 5.3.1 | React Chart.js wrapper |
| jsPDF | 3.0.4 | PDF generation |
| jspdf-autotable | 5.0.2 | PDF table formatting |
| html2canvas | 1.4.1 | Chart to image conversion |
| Axios | 1.13.2 | HTTP client |
| React Router | 7.11.0 | Client-side routing |
| date-fns | 4.1.0 | Date formatting |

---

## 📡 API Reference

**Base URL:** `http://localhost:5001/api`

### Upload Endpoints

#### Upload Sales Data
```http
POST /api/upload/sales
Content-Type: multipart/form-data
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `file` | `File` | CSV file with sales records |

**CSV Headers:**
```
productId, productName, date, quantity, region, revenue, unitPrice, category
```

**Response:**
```json
{
  "msg": "Sales data uploaded successfully (Previous data overwritten)",
  "count": 500
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
| `file` | `File` | CSV file with product catalog |

**CSV Headers:**
```
productId, name, category, region, unitPrice, currentStock, reorderThreshold
```

**Response:**
```json
{
  "msg": "Product catalog uploaded successfully (Previous data overwritten)",
  "count": 100
}
```

---

### Data Endpoints

#### Get Sales Overview
```http
GET /api/data/overview
```

**Response:**
```json
{
  "totalRevenue": 1250000,
  "totalQuantity": 15000,
  "salesByRegion": [
    { "_id": "North America", "revenue": 500000, "quantity": 6000 }
  ],
  "salesTrends": [
    { "_id": "2024-01-15", "revenue": 25000, "quantity": 300 }
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

**Response:** Downloads `sales_data.csv` file with columns:
`Date, Product ID, Product Name, Category, Region, Quantity, Unit Price, Revenue`

---

### Forecast Endpoint

#### Generate AI Forecast
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
  "aiAnalysis": "Based on the historical sales data...",
  "salesTrend": [
    { "date": "2024-01-01", "quantity": 45 }
  ],
  "regionalForecast": [
    { "region": "North America", "predictedDemand": 500 }
  ],
  "regionalRevenue": [
    { "region": "North America", "revenue": 250000 }
  ],
  "regionalPredictedRevenue": [
    { "region": "North America", "predictedRevenue": 25000 }
  ],
  "totalPredictedRevenue": 42500
}
```

---

## 🏗 Project Structure

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
│   │   ├── dataRoutes.js
│   │   ├── forecastRoutes.js
│   │   └── uploadRoutes.js
│   ├── index.js
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ForecastResults.jsx    # Predictions table & charts
│   │   │   ├── ForecastControls.jsx   # Timeframe selector
│   │   │   └── SalesOverviewModal.jsx # Sales data modal
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx          # Main dashboard
│   │   │   └── ProductCatalog.jsx     # Product management
│   │   ├── services/
│   │   │   └── api.js                 # Axios API client
│   │   └── App.jsx
│   └── package.json
│
├── products.csv                   # Sample product data
├── sales.csv                      # Sample sales data
└── README.md
```

---

## 🧠 Forecasting Algorithm

### Primary: OpenAI GPT-3.5-turbo
1. Aggregates historical sales by product
2. Sends summarized data to GPT-3.5-turbo
3. AI returns predictions with confidence scores
4. Includes 20-second timeout with automatic fallback

### Fallback: Moving Average
When AI is unavailable (rate limits, no API key):
- Calculates average daily sales per product
- Computes confidence based on data consistency (coefficient of variation)
- `predictedDemand = avgDaily × days`

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- OpenAI API Key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Girivenkat18/Inventory-Forecasting-System.git
   cd Inventory_Forecasting_System
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   ```

3. **Configure Environment**  
   Create `.env` in the `backend` directory:
   ```env
   OPENAI_API_KEY=sk-your-api-key
   MONGODB_URI=mongodb://localhost:27017/inventory_forecast
   PORT=5001
   ```

4. **Frontend Setup**
   ```bash
   cd ../frontend
   npm install
   ```

### Running the Application

1. **Start Backend**
   ```bash
   cd backend
   npm start
   ```
   Runs on: `http://localhost:5001`

2. **Start Frontend**
   ```bash
   cd frontend
   npm run dev
   ```
   Runs on: `http://localhost:5173`

---

## 📊 Database Schemas

### Product
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

### SalesData
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

---

## 📄 License

MIT License

---
