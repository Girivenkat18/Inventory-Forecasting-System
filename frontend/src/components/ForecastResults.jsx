import React from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    PointElement,
    LineElement,
    ArcElement
} from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    PointElement,
    LineElement,
    ArcElement
);

const ForecastResults = ({ results }) => {
    if (!results) return null;

    const {
        predictions,
        aiAnalysis,
        generatedAt,
        timeframeDays,
        regionalForecast
    } = results;

    // --- Statistics Calculation ---
    const totalDemand = predictions.reduce((sum, p) => sum + p.predictedDemand, 0);
    const totalAlerts = predictions.filter(p => p.reorderRescomended).length;
    // Find top region by demand
    let topRegion = 'N/A';
    if (regionalForecast && regionalForecast.length > 0) {
        const sortedRegions = [...regionalForecast].sort((a, b) => b.predictedDemand - a.predictedDemand);
        topRegion = sortedRegions[0].region;
    }
    const avgConfidence = predictions.length > 0
        ? Math.round(predictions.reduce((sum, p) => sum + p.confidenceScore, 0) / predictions.length * 100)
        : 0;

    const exportPDF = () => {
        try {
            const doc = new jsPDF();
            doc.text(`Inventory Forecast Report - ${timeframeDays} Days`, 14, 15);
            // Ensure date formatting handles invalid dates gracefully, or just cast to string
            try {
                doc.text(`Generated: ${format(new Date(generatedAt), 'PPP')}`, 14, 22);
            } catch {
                doc.text(`Generated: ${new Date().toDateString()}`, 14, 22);
            }

            doc.setFontSize(10);
            const splitText = doc.splitTextToSize(`AI Analysis: ${aiAnalysis || 'No analysis available'}`, 180);
            doc.text(splitText, 14, 30);

            // Add Summary Stats to PDF - Cast numbers to strings to prevent jsPDF errors
            doc.text(`Total Predicted Demand: ${String(totalDemand)}`, 14, 45);
            doc.text(`Reorder Alerts: ${String(totalAlerts)}`, 80, 45);
            doc.text(`Top Region: ${String(topRegion)}`, 140, 45);

            const tableData = predictions.map(p => [
                String(p.productName),
                String(p.productId),
                String(p.predictedDemand),
                String(p.confidenceScore),
                p.reorderRescomended ? 'YES' : 'No'
            ]);

            autoTable(doc, {
                head: [['Product', 'ID', 'Predicted Demand', 'Confidence', 'Reorder?']],
                body: tableData,
                startY: 55,
            });

            doc.save('inventory_forecast.pdf');
        } catch (error) {
            console.error("Errro exporting PDF:", error);
            alert("Failed to create PDF. See console for details.");
        }
    };

    // 1. Prediction Bar Chart Data
    const sortedPreds = [...predictions].sort((a, b) => b.predictedDemand - a.predictedDemand).slice(0, 10);
    const barChartData = {
        labels: sortedPreds.map(p => p.productName),
        datasets: [{
            label: 'Predicted Demand',
            data: sortedPreds.map(p => p.predictedDemand),
            backgroundColor: '#3b82f6',
            borderRadius: 4
        }]
    };

    // 2. Regional Pie Chart Data
    const pieChartData = {
        labels: regionalForecast ? regionalForecast.map(r => r.region) : [],
        datasets: [
            {
                label: 'Regional Demand',
                data: regionalForecast ? regionalForecast.map(r => r.predictedDemand) : [],
                backgroundColor: [
                    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'
                ],
                borderWidth: 1
            }
        ]
    };


    return (
        <div className="glass-panel" style={{ padding: '2rem', marginTop: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ margin: 0 }}>Forecast Analysis</h2>
                <button className="btn btn-outline" onClick={exportPDF}>Export PDF</button>
            </div>

            {/* AI Insight */}
            <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #3b82f6', marginBottom: '2rem' }}>
                <strong>AI Insight:</strong> {aiAnalysis}
            </div>

            {/* Summary Statistics Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '12px', textAlign: 'center' }}>
                    <h4 style={{ margin: '0 0 0.5rem 0', color: '#aaa', fontSize: '0.9rem' }}>Total Predicted Demand</h4>
                    <span style={{ fontSize: '2rem', fontWeight: 'bold', color: '#60a5fa' }}>{totalDemand}</span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '12px', textAlign: 'center' }}>
                    <h4 style={{ margin: '0 0 0.5rem 0', color: '#aaa', fontSize: '0.9rem' }}>Reorder Alerts</h4>
                    <span style={{ fontSize: '2rem', fontWeight: 'bold', color: totalAlerts > 0 ? '#ef4444' : '#10b981' }}>{totalAlerts}</span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '12px', textAlign: 'center' }}>
                    <h4 style={{ margin: '0 0 0.5rem 0', color: '#aaa', fontSize: '0.9rem' }}>Top Region</h4>
                    <span style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>{topRegion}</span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '12px', textAlign: 'center' }}>
                    <h4 style={{ margin: '0 0 0.5rem 0', color: '#aaa', fontSize: '0.9rem' }}>Avg. Confidence</h4>
                    <span style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>{avgConfidence}%</span>
                </div>
            </div>

            {/* Charts Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>

                {/* 1. Demand Forecast per Product */}
                <div className="chart-container" style={{ height: '350px', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px' }}>
                    <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: '#ccc' }}>Predicted Demand by Product</h3>
                    <Bar data={barChartData} options={{ responsive: true, maintainAspectRatio: false }} />
                </div>

                {/* 2. Regional Distribution (Centered) */}
                {regionalForecast && regionalForecast.length > 0 && (
                    <div className="chart-container" style={{ height: '350px', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', display: 'flex', flexDirection: 'column' }}>
                        <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: '#ccc' }}>Forecast Distribution by Region</h3>
                        <div style={{ flex: 1, position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}>
                            <Pie
                                data={pieChartData}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                        legend: { position: 'right' }
                                    }
                                }}
                            />
                        </div>
                    </div>
                )}
            </div>

            <h3 style={{ marginTop: '2rem' }}>Detailed Predictions</h3>
            <table className="data-table">
                <thead>
                    <tr>
                        <th>Product</th>
                        <th>ID</th>
                        <th>Predicted Demand</th>
                        <th>Reorder?</th>
                    </tr>
                </thead>
                <tbody>
                    {predictions.map((p, idx) => (
                        <tr key={idx}>
                            <td>{p.productName}</td>
                            <td>{p.productId}</td>
                            <td>{p.predictedDemand}</td>
                            <td>
                                {p.reorderRescomended && (
                                    <span className="alert-badge">Reorder Needed</span>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

        </div>
    );
};

export default ForecastResults;
