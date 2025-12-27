import React from 'react';
import { Bar } from 'react-chartjs-2';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';

const ForecastResults = ({ results }) => {
    if (!results) return null;

    const { predictions, aiAnalysis, generatedAt, timeframeDays } = results;

    const exportPDF = () => {
        const doc = new jsPDF();
        doc.text(`Inventory Forecast Report - ${timeframeDays} Days`, 14, 15);
        doc.text(`Generated: ${format(new Date(generatedAt), 'PPP')}`, 14, 22);

        doc.setFontSize(10);
        const splitText = doc.splitTextToSize(`AI Analysis: ${aiAnalysis}`, 180);
        doc.text(splitText, 14, 30);

        const tableData = predictions.map(p => [
            p.productName,
            p.productId,
            p.predictedDemand,
            p.confidenceScore,
            p.reorderRescomended ? 'YES' : 'No'
        ]);

        doc.autoTable({
            head: [['Product', 'ID', 'Predicted Demand', 'Confidence', 'Reorder?']],
            body: tableData,
            startY: 50,
        });

        doc.save('inventory_forecast.pdf');
    };

    // Prepare chart data for top 10 predicted items
    const sortedPreds = [...predictions].sort((a, b) => b.predictedDemand - a.predictedDemand).slice(0, 10);
    const chartData = {
        labels: sortedPreds.map(p => p.productName),
        datasets: [{
            label: 'Predicted Demand',
            data: sortedPreds.map(p => p.predictedDemand),
            backgroundColor: '#3b82f6',
            borderRadius: 4
        }]
    };

    return (
        <div className="glass-panel" style={{ padding: '2rem', marginTop: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ marginTop: 0 }}>Forecast Analysis</h2>
                <button className="btn btn-outline" onClick={exportPDF}>Export PDF</button>
            </div>

            <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #3b82f6', marginBottom: '2rem' }}>
                <strong>AI Insight:</strong> {aiAnalysis}
            </div>

            <div className="chart-container" style={{ height: '300px' }}>
                <Bar data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />
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
