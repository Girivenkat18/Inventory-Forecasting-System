import React from 'react';
import { Line, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { CSVLink } from "react-csv";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

const SalesOverviewModal = ({ isOpen, onClose, data }) => {
    if (!isOpen || !data) return null;

    const { totalRevenue, totalQuantity, salesTrends, salesByRegion, recentSales } = data;

    // Chart Data Preparation
    const lineChartData = {
        labels: salesTrends.map(d => d._id),
        datasets: [
            {
                label: 'Daily Revenue',
                data: salesTrends.map(d => d.revenue),
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.5)',
                tension: 0.4
            }
        ]
    };

    const barChartData = {
        labels: salesByRegion.map(d => d._id),
        datasets: [
            {
                label: 'Revenue by Region',
                data: salesByRegion.map(d => d.revenue),
                backgroundColor: ['#8b5cf6', '#3b82f6', '#06b6d4', '#10b981'],
            }
        ]
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content glass-panel">
                <button className="close-btn" onClick={onClose}>&times;</button>

                <h2>Sales Overview</h2>

                <div className="chart-container">
                    <Line data={lineChartData} options={{ responsive: true, maintainAspectRatio: false }} />
                </div>

                <div style={{ display: 'flex', gap: '2rem', marginTop: '2rem' }}>
                    <div style={{ flex: 1, minHeight: '300px' }}>
                        <h3>Regional Performance</h3>
                        <Bar data={barChartData} options={{ responsive: true }} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <h3>Key Metrics</h3>
                        <div className="stat-card glass-panel">
                            <span className="stat-label">Total Revenue</span>
                            <span className="stat-value">${totalRevenue.toLocaleString()}</span>
                        </div>
                        <div className="stat-card glass-panel" style={{ marginTop: '1rem' }}>
                            <span className="stat-label">Total Units Sold</span>
                            <span className="stat-value">{totalQuantity.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                <div style={{ marginTop: '3rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3>Recent Sales Data</h3>
                        {recentSales && (
                            <CSVLink
                                data={recentSales}
                                filename={"sales-data.csv"}
                                className="btn btn-outline"
                            >
                                Download CSV
                            </CSVLink>
                        )}
                    </div>

                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Product ID</th>
                                    <th>Region</th>
                                    <th>Qty</th>
                                    <th>Revenue</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentSales.map((sale, idx) => (
                                    <tr key={idx}>
                                        <td>{new Date(sale.date).toLocaleDateString()}</td>
                                        <td>{sale.productId}</td>
                                        <td>{sale.region}</td>
                                        <td>{sale.quantity}</td>
                                        <td>${sale.revenue}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default SalesOverviewModal;
