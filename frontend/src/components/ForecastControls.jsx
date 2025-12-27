import React, { useEffect, useState } from 'react';
import { fetchProducts } from '../services/api';

const ForecastControls = ({ onGenerate, loading }) => {
    const [days, setDays] = useState('30');
    const [region, setRegion] = useState('All');
    const [product, setProduct] = useState('All');
    const [productList, setProductList] = useState([]);

    useEffect(() => {
        fetchProducts().then(res => setProductList(res.data)).catch(console.error);
    }, []);

    const handleGenerate = () => {
        onGenerate({ days, region, productId: product });
    }

    const uniqueRegions = ['All', ...new Set(productList.map(p => p.region).filter(Boolean))];

    return (
        <div className="glass-panel" style={{ padding: '2rem', marginTop: '2rem' }}>
            <h2 style={{ marginTop: 0 }}>Forecast Settings</h2>
            <div className="input-group">

                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Timeframe</label>
                    <select className="select-input" value={days} onChange={(e) => setDays(e.target.value)}>
                        <option value="1">Next 1 Day</option>
                        <option value="5">Next 5 Days</option>
                        <option value="10">Next 10 Days</option>
                        <option value="30">Next 30 Days</option>
                        <option value="90">Next 90 Days</option>
                    </select>
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Region</label>
                    <select className="select-input" value={region} onChange={(e) => setRegion(e.target.value)}>
                        {uniqueRegions.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Product</label>
                    <select className="select-input" value={product} onChange={(e) => setProduct(e.target.value)}>
                        <option value="All">All Products</option>
                        {productList.map(p => (
                            <option key={p.productId} value={p.productId}>{p.name} ({p.productId})</option>
                        ))}
                    </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'end' }}>
                    <button className="btn btn-primary" onClick={handleGenerate} disabled={loading}>
                        {loading ? 'Analyzing...' : 'Generate Forecast'}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default ForecastControls;
