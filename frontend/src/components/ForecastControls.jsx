import React, { useState } from 'react';

const ForecastControls = ({ onGenerate, loading }) => {
    const [days, setDays] = useState('30');

    const handleGenerate = () => {
        onGenerate({ days, region: 'All', productId: 'All' });
    }

    const timeframeOptions = [
        { value: '1', label: '1 Day' },
        { value: '5', label: '5 Days' },
        { value: '10', label: '10 Days' },
        { value: '30', label: '30 Days' },
        { value: '90', label: '90 Days' }
    ];

    return (
        <div className="glass-panel" style={{ padding: '2.5rem 2.5rem', marginTop: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '2rem' }}>


                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '600' }}>Forecast Timeframe</h2>
                        <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                            Select prediction period for all products
                        </p>
                    </div>


                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        {timeframeOptions.map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => setDays(opt.value)}
                                style={{
                                    padding: '0.75rem 1.25rem',
                                    borderRadius: '10px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '1rem',
                                    fontWeight: '500',
                                    transition: 'all 0.2s ease',
                                    background: days === opt.value
                                        ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                                        : 'rgba(255,255,255,0.08)',
                                    color: days === opt.value ? '#fff' : 'var(--text-secondary)',
                                    boxShadow: days === opt.value ? '0 4px 12px rgba(99, 102, 241, 0.3)' : 'none'
                                }}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>


                <button
                    className="btn btn-primary"
                    onClick={handleGenerate}
                    disabled={loading}
                    style={{
                        padding: '0.8rem 1.5rem',
                        fontSize: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}
                >
                    {loading ? (
                        <>
                            <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⏳</span>
                            Analyzing...
                        </>
                    ) : (
                        <>Generate Forecast →</>
                    )}
                </button>
            </div>
        </div>
    );
};

export default ForecastControls;
