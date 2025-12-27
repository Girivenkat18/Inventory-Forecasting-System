import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import ProductCatalog from './pages/ProductCatalog';
import { FaChartPie, FaBoxes } from 'react-icons/fa';
import './App.css'

const Navigation = () => {
  const location = useLocation();

  return (
    <nav style={{
      background: 'rgba(15, 23, 42, 0.8)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid var(--glass-border)',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div className="container" style={{ padding: '1rem 2rem', display: 'flex', alignItems: 'center', gap: '3rem' }}>
        <div style={{ fontWeight: '800', fontSize: '1.2rem', background: 'linear-gradient(to right, #3b82f6, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          INVENTORY.AI
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link to="/" style={{
            textDecoration: 'none',
            color: location.pathname === '/' ? 'white' : 'var(--text-secondary)',
            fontWeight: location.pathname === '/' ? '600' : '400',
            display: 'flex', alignItems: 'center', gap: '0.5rem'
          }}>
            <FaChartPie /> Dashboard
          </Link>
          <Link to="/products" style={{
            textDecoration: 'none',
            color: location.pathname === '/products' ? 'white' : 'var(--text-secondary)',
            fontWeight: location.pathname === '/products' ? '600' : '400',
            display: 'flex', alignItems: 'center', gap: '0.5rem'
          }}>
            <FaBoxes /> Product Catalog
          </Link>
        </div>
      </div>
    </nav>
  );
}

function App() {
  return (
    <Router>
      <Navigation />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/products" element={<ProductCatalog />} />
      </Routes>
    </Router>
  )
}

export default App
