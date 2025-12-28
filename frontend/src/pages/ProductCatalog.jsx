import React, { useEffect, useState } from 'react';
import { uploadProducts, fetchProducts } from '../services/api';
import { FaUpload, FaBox } from 'react-icons/fa';

const ProductCatalog = () => {
    const [products, setProducts] = useState([]);
    const [uploadMsg, setUploadMsg] = useState('');

    const loadProducts = async () => {
        try {
            const res = await fetchProducts();
            setProducts(res.data);
        } catch (err) { console.error(err); }
    };

    useEffect(() => {
        loadProducts();
    }, []);

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);
        try {
            await uploadProducts(formData);
            setUploadMsg('Product catalog uploaded successfully!');
            setTimeout(() => setUploadMsg(''), 3000);
            loadProducts();
        } catch (err) {
            console.error(err);
            setUploadMsg('Failed to upload products.');
        }
    };

    return (
        <div className="container">
            <header className="app-header">
                <div>
                    <h1 style={{ margin: 0, fontSize: '1.8rem' }}>Product Catalog</h1>
                    <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Manage your inventory items</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    {uploadMsg && <span style={{ color: 'var(--accent-success)' }}>{uploadMsg}</span>}
                    <div className="file-input-wrapper">
                        <label className="btn btn-outline" htmlFor="product-upload">
                            <FaUpload /> Upload Catalog CSV
                        </label>
                        <input
                            id="product-upload"
                            type="file"
                            accept=".csv"
                            onChange={handleUpload}
                            style={{ display: 'none' }}
                        />
                    </div>
                </div>
            </header>

            <div className="glass-panel" style={{ padding: '1rem' }}>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Category</th>
                            <th>Region</th>
                            <th>Price</th>
                            <th>Stock</th>
                            <th>Reorder Threshold</th>
                            <th style={{ textAlign: 'center' }}>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map(p => (
                            <tr key={p.productId}>
                                <td>{p.productId}</td>
                                <td>{p.name}</td>
                                <td>{p.category}</td>
                                <td>{p.region || 'N/A'}</td>
                                <td>${p.unitPrice}</td>
                                <td>{p.currentStock}</td>
                                <td>{p.reorderThreshold}</td>
                                <td style={{ textAlign: 'center' }}>
                                    {p.currentStock <= p.reorderThreshold ?
                                        <span className="alert-badge">Low Stock</span> :
                                        <span style={{ color: 'var(--accent-success)', fontSize: '0.875rem', fontWeight: 'bold' }}>In Stock</span>
                                    }
                                </td>
                            </tr>
                        ))}
                        {products.length === 0 && (
                            <tr>
                                <td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>
                                    No products found. Upload a CSV to get started.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ProductCatalog;
