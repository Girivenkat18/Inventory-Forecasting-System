import React, { useState } from 'react';
import { uploadSales, fetchOverview, generateForecast } from '../services/api';
import SalesOverviewModal from '../components/SalesOverviewModal';
import ForecastControls from '../components/ForecastControls';
import ForecastResults from '../components/ForecastResults';
import { FaUpload, FaChartLine } from 'react-icons/fa';

const Dashboard = () => {
    const [salesOverviewData, setSalesOverviewData] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [forecastData, setForecastData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [uploadMsg, setUploadMsg] = useState('');

    const handleSalesUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);
        try {
            await uploadSales(formData);
            setUploadMsg('Sales data uploaded successfully!');
            setTimeout(() => setUploadMsg(''), 3000);
        } catch (err) {
            console.error("Upload Error:", err);
            const errMsg = err.response?.data?.msg || 'Failed to upload sales data.';
            setUploadMsg(errMsg);
        }
    };

    const openSalesView = async () => {
        try {
            const res = await fetchOverview();
            setSalesOverviewData(res.data);
            setIsModalOpen(true);
        } catch (err) {
            console.error("Failed to fetch overview", err);
        }
    };

    const handleGenerateForecast = async (params) => {
        setLoading(true);
        try {
            const res = await generateForecast(params);
            setForecastData(res.data);
        } catch (err) {
            console.error("Forecasting failed", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container">
            <header className="app-header">
                <div>
                    <h1 style={{ margin: 0, fontSize: '1.8rem' }}>Dashboard</h1>
                    <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Welcome to Inventory AI</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    {uploadMsg && <span style={{ color: 'var(--accent-success)' }}>{uploadMsg}</span>}
                    <div className="file-input-wrapper">
                        <label className="btn btn-outline" htmlFor="sales-upload">
                            <FaUpload /> Upload Sales CSV
                        </label>
                        <input
                            id="sales-upload"
                            type="file"
                            accept=".csv"
                            onChange={handleSalesUpload}
                            style={{ display: 'none' }}
                        />
                    </div>
                    <button className="btn btn-primary" onClick={openSalesView}>
                        <FaChartLine /> View Sales Data
                    </button>
                </div>
            </header>

            <SalesOverviewModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                data={salesOverviewData}
            />

            <div style={{ textAlign: 'center', marginBottom: '3rem', padding: '3rem 0' }}>
                <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem', background: 'linear-gradient(to right, #60a5fa, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    AI-Driven Inventory Forecasting
                </h2>
                <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
                    Leverage advanced AI analysis to predict future stock requirements, optimize your inventory levels, and prevent stockouts.
                </p>
            </div>

            <ForecastControls onGenerate={handleGenerateForecast} loading={loading} />

            <ForecastResults results={forecastData} />

        </div>
    );
};

export default Dashboard;
