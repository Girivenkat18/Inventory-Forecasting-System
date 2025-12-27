# AI-Driven Inventory Forecasting System

An intelligent inventory management system that uses AI to forecast product demand and optimize inventory levels.

## Features

- **Sales Data Upload**: Upload historical sales data via CSV files
- **Product Management**: Manage product inventory and details
- **AI-Powered Forecasting**: Generate demand forecasts using AI models
- **Dashboard**: Visualize sales trends and inventory metrics
- **Real-time Analytics**: Track inventory levels and sales performance

## Tech Stack

### Backend
- Node.js with Express
- SQLite database
- OpenAI API integration for forecasting

### Frontend
- React
- Modern UI components
- Data visualization

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd Inventory_Forecasting_System
```

2. Install backend dependencies:
```bash
cd backend
npm install
```

3. Install frontend dependencies:
```bash
cd ../frontend
npm install
```

4. Set up environment variables:
   - Create a `.env` file in the backend directory
   - Add your OpenAI API key: `OPENAI_API_KEY=your_api_key_here`

### Running the Application

1. Start the backend server:
```bash
cd backend
npm start
```

2. Start the frontend development server:
```bash
cd frontend
npm start
```

The application will be available at `http://localhost:3000`

## Project Structure

```
Inventory_Forecasting_System/
├── backend/          # Backend API server
├── frontend/         # React frontend application
├── products.csv      # Sample product data
├── sales.csv         # Sample sales data
└── README.md         # This file
```

## License

This project is licensed under the MIT License.
