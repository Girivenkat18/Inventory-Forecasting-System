import React, { useRef } from 'react';
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
import { Bar, Pie } from 'react-chartjs-2';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { format } from 'date-fns';


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
    const barChartRef = useRef(null);
    const pieChartRef = useRef(null);


    if (!results) return null;

    const {
        predictions,
        aiAnalysis,
        salesTrend,
        regionalForecast,
        regionalRevenue,
        regionalPredictedRevenue,
        totalPredictedRevenue,
        timeframeDays = 30,
        generatedAt
    } = results;

    const totalDemand = predictions.reduce((sum, p) => sum + p.predictedDemand, 0);
    const totalAlerts = predictions.filter(p => p.reorderRescomended).length;
    const avgConfidence = predictions.length > 0
        ? (predictions.reduce((sum, p) => sum + (p.confidenceScore || 0), 0) / predictions.length * 100).toFixed(1)
        : 0;

    let topRegion = 'N/A';
    let topRegionDemand = 0;
    if (regionalForecast && regionalForecast.length > 0) {
        const sortedRegions = [...regionalForecast].sort((a, b) => b.predictedDemand - a.predictedDemand);
        topRegion = sortedRegions[0].region;
        topRegionDemand = sortedRegions[0].predictedDemand;
    }

    const reorderProducts = predictions.filter(p => p.reorderRescomended);

    const formatCurrency = (num) => {
        if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `$${(num / 1000).toFixed(1)}K`;
        return `$${num?.toFixed(2) || 0}`;
    };

    const formatNumber = (num) => {
        return Math.ceil(num || 0).toLocaleString();
    };

    const exportPDF = async () => {
        try {
            const doc = new jsPDF('p', 'mm', 'a4');
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const margin = 15;
            const contentWidth = pageWidth - (margin * 2);

            const primaryColor = [59, 130, 246]; // Blue
            const successColor = [16, 185, 129]; // Green
            const warningColor = [245, 158, 11]; // Orange
            const dangerColor = [239, 68, 68]; // Red
            const darkText = [30, 41, 59];
            const lightText = [100, 116, 139];

            const addSectionHeader = (text, y) => {
                doc.setFillColor(...primaryColor);
                doc.rect(margin, y - 6, contentWidth, 10, 'F');
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.text(text, margin + 3, y);
                return y + 12;
            };

            const addExplanation = (text, y) => {
                doc.setTextColor(...lightText);
                doc.setFontSize(9);
                doc.setFont('helvetica', 'italic');
                const lines = doc.splitTextToSize(text, contentWidth);
                doc.text(lines, margin, y);
                return y + (lines.length * 4) + 4;
            };

            const addPageNumber = (pageNum) => {
                doc.setTextColor(...lightText);
                doc.setFontSize(8);
                doc.text(`Page ${pageNum}`, pageWidth - margin - 10, pageHeight - 10);
                doc.text('Inventory Forecast Report', margin, pageHeight - 10);
            };

            doc.setFillColor(...primaryColor);
            doc.rect(0, 0, pageWidth, 80, 'F');

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(28);
            doc.setFont('helvetica', 'bold');
            doc.text('INVENTORY FORECAST', pageWidth / 2, 35, { align: 'center' });
            doc.setFontSize(22);
            doc.text('ANALYSIS REPORT', pageWidth / 2, 48, { align: 'center' });

            doc.setFontSize(12);
            doc.setFont('helvetica', 'normal');
            doc.text(`${timeframeDays}-Day Demand Forecast`, pageWidth / 2, 65, { align: 'center' });

            doc.setFillColor(248, 250, 252);
            doc.roundedRect(margin + 20, 100, contentWidth - 40, 60, 3, 3, 'F');

            doc.setTextColor(...darkText);
            doc.setFontSize(11);
            const reportDate = generatedAt ? format(new Date(generatedAt), 'PPP') : format(new Date(), 'PPP');
            const reportTime = generatedAt ? format(new Date(generatedAt), 'p') : format(new Date(), 'p');

            doc.text('Report Generated:', margin + 30, 118);
            doc.setFont('helvetica', 'bold');
            doc.text(reportDate + ' at ' + reportTime, margin + 30, 128);

            doc.setFont('helvetica', 'normal');
            doc.text('Forecast Period:', margin + 30, 143);
            doc.setFont('helvetica', 'bold');
            doc.text(`Next ${timeframeDays} Days`, margin + 30, 153);

            let coverY = 180;
            doc.setFillColor(248, 250, 252);
            doc.roundedRect(margin, coverY, contentWidth, 50, 3, 3, 'F');

            const statWidth = contentWidth / 3;
            const stats = [
                { label: 'Total Products', value: predictions.length, color: primaryColor },
                { label: 'Total Demand', value: formatNumber(totalDemand), color: successColor },
                { label: 'Reorder Alerts', value: totalAlerts, color: totalAlerts > 0 ? dangerColor : successColor }
            ];

            stats.forEach((stat, i) => {
                const x = margin + (statWidth * i) + (statWidth / 2);
                doc.setTextColor(...stat.color);
                doc.setFontSize(18);
                doc.setFont('helvetica', 'bold');
                doc.text(String(stat.value), x, coverY + 22, { align: 'center' });
                doc.setTextColor(...lightText);
                doc.setFontSize(9);
                doc.setFont('helvetica', 'normal');
                doc.text(stat.label, x, coverY + 32, { align: 'center' });
            });

            addPageNumber(1);

            doc.addPage();
            let y = 20;

            y = addSectionHeader('EXECUTIVE SUMMARY', y);


            doc.setTextColor(...darkText);
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text('Key Performance Indicators', margin, y);
            y += 8;

            const metricsData = [
                ['Metric', 'Value', 'Insight'],
                ['Total Predicted Demand', formatNumber(totalDemand), `Units expected to be needed in the next ${timeframeDays} days`],
                ['Products Analyzed', String(predictions.length), 'Number of products included in this forecast'],
                ['Reorder Alerts', String(totalAlerts), totalAlerts > 0 ? '[!] Action required for low-stock items' : '[OK] All products adequately stocked'],
                ['Top Performing Region', topRegion, `Highest demand region with ${formatNumber(topRegionDemand)} units predicted`],
                ['Predicted Revenue', formatCurrency(totalPredictedRevenue || 0), 'Estimated revenue based on demand forecast']
            ];

            autoTable(doc, {
                startY: y,
                head: [metricsData[0]],
                body: metricsData.slice(1),
                margin: { left: margin, right: margin },
                headStyles: {
                    fillColor: primaryColor,
                    textColor: [255, 255, 255],
                    fontStyle: 'bold',
                    fontSize: 9
                },
                bodyStyles: {
                    fontSize: 8,
                    textColor: darkText
                },
                alternateRowStyles: {
                    fillColor: [248, 250, 252]
                },
                columnStyles: {
                    0: { fontStyle: 'bold', cellWidth: 45 },
                    1: { cellWidth: 35, halign: 'center' },
                    2: { cellWidth: 'auto' }
                }
            });

            y = doc.lastAutoTable.finalY + 15;

            doc.setTextColor(...darkText);
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text('Quick Insights', margin, y);
            y += 8;

            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');

            const insights = [];
            if (totalAlerts > 0) {
                insights.push(`[ALERT] ${totalAlerts} product(s) require immediate reorder attention`);
            }
            if (topRegion !== 'N/A') {
                insights.push(`[TOP] ${topRegion} is the highest-demand region for this forecast period`);
            }

            insights.forEach(insight => {
                doc.text(`• ${insight}`, margin + 5, y);
                y += 6;
            });

            addPageNumber(2);

            doc.addPage();
            y = 20;

            y = addSectionHeader('DEMAND ANALYSIS', y);

            y = addExplanation(
                'The bar chart below shows the top 10 products by predicted demand. This visualization helps identify which products will require the most inventory attention during the forecast period.',
                y
            );

            if (barChartRef.current) {
                try {
                    const canvas = await html2canvas(barChartRef.current, {
                        backgroundColor: '#ffffff',
                        scale: 2
                    });
                    const imgData = canvas.toDataURL('image/png');
                    const imgWidth = contentWidth;
                    const imgHeight = (canvas.height * imgWidth) / canvas.width;
                    doc.addImage(imgData, 'PNG', margin, y, imgWidth, Math.min(imgHeight, 150));
                    y += Math.min(imgHeight, 150) + 10;
                } catch (err) {
                    console.warn('Could not capture bar chart:', err);
                    doc.setTextColor(...lightText);
                    doc.text('[Chart could not be captured]', margin, y);
                    y += 10;
                }
            }

            doc.setTextColor(...darkText);
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text('Top 10 Products by Predicted Demand', margin, y);
            y += 6;

            const sortedPreds = [...predictions].sort((a, b) => b.predictedDemand - a.predictedDemand).slice(0, 10);
            const topProductsData = sortedPreds.map((p, i) => [
                String(i + 1),
                p.productName || 'Unknown',
                p.productId,
                formatNumber(p.predictedDemand),
                `${((p.confidenceScore || 0) * 100).toFixed(0)}%`
            ]);

            autoTable(doc, {
                startY: y,
                head: [['Rank', 'Product Name', 'ID', 'Predicted Demand', 'Confidence']],
                body: topProductsData,
                margin: { left: margin, right: margin },
                headStyles: {
                    fillColor: primaryColor,
                    textColor: [255, 255, 255],
                    fontStyle: 'bold',
                    fontSize: 9
                },
                bodyStyles: {
                    fontSize: 8,
                    textColor: darkText
                },
                alternateRowStyles: {
                    fillColor: [248, 250, 252]
                },
                columnStyles: {
                    0: { cellWidth: 15, halign: 'center' },
                    1: { cellWidth: 'auto' },
                    2: { cellWidth: 25, halign: 'center' },
                    3: { cellWidth: 35, halign: 'right' },
                    4: { cellWidth: 25, halign: 'center' }
                }
            });

            y = doc.lastAutoTable.finalY + 10;

            y = addExplanation(
                'Understanding demand patterns: Products at the top of this list should be prioritized for inventory replenishment. High confidence scores indicate reliable predictions based on consistent historical data.',
                y
            );

            addPageNumber(3);

            if (regionalForecast && regionalForecast.length > 0) {
                doc.addPage();
                y = 20;

                y = addSectionHeader('REGIONAL ANALYSIS', y);

                y = addExplanation(
                    'This section breaks down the forecast by geographic region, helping you understand demand distribution across different markets.',
                    y
                );

                if (pieChartRef.current) {
                    try {
                        const canvas = await html2canvas(pieChartRef.current, {
                            backgroundColor: '#ffffff',
                            scale: 2
                        });
                        const imgData = canvas.toDataURL('image/png');
                        const imgWidth = contentWidth * 0.7;
                        const imgHeight = (canvas.height * imgWidth) / canvas.width;
                        doc.addImage(imgData, 'PNG', margin + (contentWidth - imgWidth) / 2, y, imgWidth, Math.min(imgHeight, 80));
                        y += Math.min(imgHeight, 80) + 10;
                    } catch (err) {
                        console.warn('Could not capture pie chart:', err);
                    }
                }

                doc.setTextColor(...darkText);
                doc.setFontSize(11);
                doc.setFont('helvetica', 'bold');
                doc.text('Regional Demand Distribution', margin, y);
                y += 6;

                const totalRegionalDemand = regionalForecast.reduce((sum, r) => sum + r.predictedDemand, 0);
                const regionalData = regionalForecast.map(r => [
                    r.region,
                    formatNumber(r.predictedDemand),
                    `${((r.predictedDemand / totalRegionalDemand) * 100).toFixed(1)}%`,
                    r.region === topRegion ? '⭐ Highest Demand' : ''
                ]);

                autoTable(doc, {
                    startY: y,
                    head: [['Region', 'Predicted Demand', 'Share %', 'Note']],
                    body: regionalData,
                    margin: { left: margin, right: margin },
                    headStyles: {
                        fillColor: primaryColor,
                        textColor: [255, 255, 255],
                        fontStyle: 'bold',
                        fontSize: 9
                    },
                    bodyStyles: {
                        fontSize: 9,
                        textColor: darkText
                    },
                    alternateRowStyles: {
                        fillColor: [248, 250, 252]
                    }
                });

                y = doc.lastAutoTable.finalY + 10;

                addPageNumber(4);
            }

            doc.addPage();
            y = 20;

            y = addSectionHeader('DETAILED PREDICTIONS', y);

            const detailedData = predictions.map(p => [
                p.productId,
                p.productName || 'Unknown',
                formatNumber(p.currentStock || 0),
                formatNumber(p.predictedDemand),
                String(p.reorderThreshold || 10),
                `${((p.confidenceScore || 0) * 100).toFixed(0)}%`,
                p.reorderRescomended ? 'REORDER' : 'OK'
            ]);

            autoTable(doc, {
                startY: y,
                head: [['ID', 'Product Name', 'Current Stock', 'Predicted Demand', 'Reorder Threshold', 'Confidence', 'Status']],
                body: detailedData,
                margin: { left: margin, right: margin },
                headStyles: {
                    fillColor: primaryColor,
                    textColor: [255, 255, 255],
                    fontStyle: 'bold',
                    fontSize: 8
                },
                bodyStyles: {
                    fontSize: 7,
                    textColor: darkText
                },
                alternateRowStyles: {
                    fillColor: [248, 250, 252]
                },
                columnStyles: {
                    0: { cellWidth: 18, halign: 'center' },
                    1: { cellWidth: 'auto' },
                    2: { cellWidth: 22, halign: 'right' },
                    3: { cellWidth: 25, halign: 'right' },
                    4: { cellWidth: 22, halign: 'center' },
                    5: { cellWidth: 18, halign: 'center' },
                    6: { cellWidth: 22, halign: 'center' }
                },
                didParseCell: function (data) {
                    if (data.column.index === 6 && data.cell.raw === 'REORDER') {
                        data.cell.styles.textColor = dangerColor;
                        data.cell.styles.fontStyle = 'bold';
                    }
                }
            });

            addPageNumber(doc.internal.getNumberOfPages());

            if (reorderProducts.length > 0) {
                doc.addPage();
                y = 20;

                y = addSectionHeader('REORDER RECOMMENDATIONS', y);

                doc.setFillColor(254, 242, 242);
                doc.setDrawColor(...dangerColor);
                doc.setLineWidth(0.5);
                doc.roundedRect(margin, y, contentWidth, 15, 2, 2, 'FD');

                doc.setTextColor(...dangerColor);
                doc.setFontSize(10);
                doc.setFont('helvetica', 'bold');
                doc.text(`[!] ${reorderProducts.length} Product(s) Require Immediate Attention`, margin + 5, y + 10);
                y += 25;

                const reorderData = reorderProducts.map(p => {
                    const stockGap = p.predictedDemand - (p.currentStock || 0);
                    const urgency = stockGap > 100 ? 'Critical' : stockGap > 50 ? 'High' : 'Medium';
                    return [
                        p.productId,
                        p.productName || 'Unknown',
                        formatNumber(p.currentStock || 0),
                        formatNumber(p.predictedDemand),
                        formatNumber(Math.max(0, stockGap)),
                        urgency
                    ];
                }).sort((a, b) => {
                    // Sort by urgency (Critical first)
                    const urgencyOrder = { 'Critical': 0, 'High': 1, 'Medium': 2 };
                    return (urgencyOrder[a[5]] || 3) - (urgencyOrder[b[5]] || 3);
                });

                autoTable(doc, {
                    startY: y,
                    head: [['ID', 'Product Name', 'Current Stock', 'Predicted Demand', 'Gap to Fill', 'Urgency']],
                    body: reorderData,
                    margin: { left: margin, right: margin },
                    headStyles: {
                        fillColor: dangerColor,
                        textColor: [255, 255, 255],
                        fontStyle: 'bold',
                        fontSize: 9
                    },
                    bodyStyles: {
                        fontSize: 8,
                        textColor: darkText
                    },
                    alternateRowStyles: {
                        fillColor: [254, 242, 242]
                    },
                    columnStyles: {
                        0: { cellWidth: 20, halign: 'center' },
                        1: { cellWidth: 'auto' },
                        2: { cellWidth: 25, halign: 'right' },
                        3: { cellWidth: 30, halign: 'right' },
                        4: { cellWidth: 25, halign: 'right' },
                        5: { cellWidth: 25, halign: 'center' }
                    }
                });

                doc.setTextColor(...darkText);
                doc.setFontSize(11);
                doc.setFont('helvetica', 'bold');
                doc.text('Recommended Actions', margin, y);
                y += 8;

                doc.setFontSize(9);
                doc.setFont('helvetica', 'normal');
                const actions = [
                    '1. Prioritize reordering products marked as "Critical" urgency immediately',
                    '2. Contact suppliers to check lead times for high-urgency items',
                    '3. Consider expedited shipping for critical products if standard lead time exceeds demand timeline',
                    '4. Review safety stock levels and consider adjustments based on this forecast',
                    '5. Monitor daily sales for critical items and adjust reorder quantities as needed'
                ];

                actions.forEach(action => {
                    doc.text(action, margin + 5, y);
                    y += 6;
                });

                addPageNumber(doc.internal.getNumberOfPages());
            }

            doc.addPage();
            y = 80;

            doc.setTextColor(...darkText);
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.text('End of Report', pageWidth / 2, y, { align: 'center' });

            y += 15;
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...lightText);

            const footerLines = [
                `This report was generated on ${format(new Date(), 'PPP')} at ${format(new Date(), 'p')}`,
                `Forecast Period: ${timeframeDays} days`,
                `Total Products Analyzed: ${predictions.length}`,
                '',
                'For questions or additional analysis, please contact your inventory management team.',
                '',
                '— Generated by AI-Powered Inventory Forecasting System —'
            ];

            footerLines.forEach(line => {
                doc.text(line, pageWidth / 2, y, { align: 'center' });
                y += 7;
            });

            addPageNumber(doc.internal.getNumberOfPages());

            // Save the PDF
            doc.save(`inventory_forecast_${format(new Date(), 'yyyy-MM-dd')}.pdf`);

        } catch (error) {
            console.error("Error exporting PDF:", error);
            alert("Failed to create PDF. See console for details.");
        }
    };

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
                <button className="btn btn-outline" onClick={exportPDF} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    📄 Export Forecast Report
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '12px', textAlign: 'center' }}>
                    <h4 style={{ margin: '0 0 0.5rem 0', color: '#aaa', fontSize: '0.9rem' }}>Total Predicted Demand</h4>
                    <span style={{ fontSize: '2rem', fontWeight: 'bold', color: '#60a5fa' }}>{formatNumber(totalDemand)}</span>
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
                    <h4 style={{ margin: '0 0 0.5rem 0', color: '#aaa', fontSize: '0.9rem' }}>Predicted Revenue</h4>
                    <span style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>{formatCurrency(totalPredictedRevenue || 0)}</span>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>

                <div
                    ref={barChartRef}
                    className="chart-container"
                    style={{ height: '500px', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px' }}
                >
                    <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: '#ccc' }}>Predicted Demand by Product</h3>
                    <Bar
                        data={barChartData}
                        options={{
                            indexAxis: 'y',
                            responsive: true,
                            maintainAspectRatio: false,
                            scales: {
                                x: {
                                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                                    ticks: { color: '#ccc' }
                                },
                                y: {
                                    grid: { display: false },
                                    ticks: {
                                        color: '#ccc',
                                        autoSkip: false
                                    }
                                }
                            },
                            plugins: {
                                legend: { display: false },
                                tooltip: {
                                    backgroundColor: 'rgba(0,0,0,0.8)',
                                    titleColor: '#fff',
                                    bodyColor: '#fff'
                                }
                            }
                        }}
                    />
                </div>

                {regionalForecast && regionalForecast.length > 0 && (
                    <div
                        ref={pieChartRef}
                        className="chart-container"
                        style={{ height: '350px', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', display: 'flex', flexDirection: 'column' }}
                    >
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
                )}            </div>

            <h3 style={{ marginTop: '2rem' }}>Detailed Predictions</h3>
            <table className="data-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Product</th>
                        <th>Current Stock</th>
                        <th>Predicted Demand</th>
                        <th>Reorder Threshold</th>
                        <th>Reorder?</th>

                    </tr>
                </thead>
                <tbody>
                    {predictions.map((p, idx) => (
                        <tr key={idx}>
                            <td>{p.productId}</td>
                            <td>{p.productName}</td>
                            <td>{p.currentStock || 0}</td>
                            <td>{formatNumber(p.predictedDemand)}</td>
                            <td>{p.reorderThreshold || 10}</td>
                            <td>
                                {p.reorderRescomended ? (
                                    <span className="alert-badge">Reorder Needed</span>
                                ) : (
                                    <span style={{ color: '#10b981', fontWeight: '500' }}>OK</span>
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
