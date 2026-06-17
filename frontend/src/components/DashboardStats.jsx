import React, { useEffect, useState } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3000');

const DashboardStats = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const [selectedMonth, setSelectedMonth] = useState(currentMonthKey);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await axios.get(`${API_URL}/api/bookings/stats`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
                });
                setStats(res.data);
            } catch (err) {
                console.error("Error fetching stats:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return <div className="stats-loading">Calculating Analytics...</div>;
    if (!stats) return null;

    const availableMonths = Array.from(new Set([
        ...Object.keys(stats.monthlyCutsData || {}),
        ...Object.keys(stats.earnings?.monthlyEarnings || {}),
        currentMonthKey // Ensure current month is always an option
    ])).sort().reverse();

    const formatMonthKey = (key) => {
        const [y, m] = key.split('-');
        const date = new Date(parseInt(y), parseInt(m) - 1);
        return date.toLocaleString('default', { month: 'long', year: 'numeric' });
    };

    const selectedCuts = stats.monthlyCutsData?.[selectedMonth] || 0;
    const selectedEarnings = stats.earnings?.monthlyEarnings?.[selectedMonth]?.total || 0;

    return (
        <div className="stats-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, color: 'white' }}>Performance Dashboard</h3>
                <select 
                    value={selectedMonth} 
                    onChange={e => setSelectedMonth(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid #444', background: '#222', color: '#fff', fontSize: '1rem', outline: 'none' }}
                >
                    {availableMonths.map(key => (
                        <option key={key} value={key}>{formatMonthKey(key)}</option>
                    ))}
                </select>
            </div>

            {/* 1. TOP ROW: KEY METRICS */}
            <div className="stats-grid-top">
                <div className="stat-card">
                    <h4>Total Cuts (All Time)</h4>
                    <p className="stat-number">{stats.totalCutsAllTime}</p>
                </div>
                <div className="stat-card">
                    <h4>Cuts in {formatMonthKey(selectedMonth).split(' ')[0]}</h4>
                    <p className="stat-number gold">{selectedCuts}</p>
                </div>
                <div className="stat-card">
                    <h4>Busiest Month</h4>
                    <p className="stat-text">{stats.busiestMonth}</p>
                </div>
                <div className="stat-card">
                    <h4>Quiet Month</h4>
                    <p className="stat-text text-muted">{stats.leastBusyMonth}</p>
                </div>
            </div>

            {/* 1b. EARNINGS SECTION (New) */}
            <div className="stats-habits-section" style={{ marginBottom: '30px' }}>
                <h3>Earnings Analytics</h3>
                <div className="stats-grid-top" style={{ marginTop: '15px' }}>
                    <div className="stat-card earnings-card">
                        <h4>Total Earnings</h4>
                        <p className="stat-number gold">₱{stats.earnings?.totalEarnings?.toLocaleString() || 0}</p>
                        <div className="payment-breakdown">
                            <span>💵 ₱{stats.earnings?.cashTotal?.toLocaleString() || 0}</span>
                            <span>📱 ₱{stats.earnings?.emoneyTotal?.toLocaleString() || 0}</span>
                        </div>
                    </div>
                    <div className="stat-card earnings-card">
                        <h4>{formatMonthKey(selectedMonth).split(' ')[0]} Earnings</h4>
                        <p className="stat-number">₱{selectedEarnings.toLocaleString()}</p>
                    </div>
                    <div className="stat-card profitable-card">
                        <h4>Most Profitable</h4>
                        <p className="stat-text">{stats.earnings?.mostProfitableMonth}</p>
                        <p className="stat-subtext">₱{stats.earnings?.mostProfitableAmount?.toLocaleString() || 0}</p>
                    </div>
                    <div className="stat-card profitable-card">
                        <h4>Least Profitable</h4>
                        <p className="stat-text text-muted">{stats.earnings?.leastProfitableMonth}</p>
                        <p className="stat-subtext text-muted">₱{stats.earnings?.leastProfitableAmount?.toLocaleString() || 0}</p>
                    </div>
                </div>
            </div>


            {/* 2. BOTTOM ROW: CLIENT FREQUENCY CONTAINERS */}
            <div className="stats-habits-section">
                <h3>Client Visit Frequency</h3>
                <p className="subtitle">Clients grouped by average days between visits.</p>

                <div className="frequency-containers">
                    {/* Frequent Clients */}
                    <div className="frequency-box frequent-box">
                        <h4>🔥 Frequent</h4>
                        <p className="freq-desc">Every 2 weeks or earlier</p>
                        <div className="client-chips">
                            {stats.clientFrequency.frequent.length > 0 ? (
                                stats.clientFrequency.frequent.map((name, idx) => (
                                    <span key={idx} className="client-chip frequent-chip">{name}</span>
                                ))
                            ) : (
                                <p className="no-clients">No clients yet</p>
                            )}
                        </div>
                    </div>

                    {/* Regular Clients */}
                    <div className="frequency-box regular-box">
                        <h4>📅 Regular</h4>
                        <p className="freq-desc">Monthly to 2 months</p>
                        <div className="client-chips">
                            {stats.clientFrequency.regular.length > 0 ? (
                                stats.clientFrequency.regular.map((name, idx) => (
                                    <span key={idx} className="client-chip regular-chip">{name}</span>
                                ))
                            ) : (
                                <p className="no-clients">No clients yet</p>
                            )}
                        </div>
                    </div>

                    {/* Rare Clients */}
                    <div className="frequency-box rare-box">
                        <h4>⏰ Rare</h4>
                        <p className="freq-desc">Beyond 2 months</p>
                        <div className="client-chips">
                            {stats.clientFrequency.rare.length > 0 ? (
                                stats.clientFrequency.rare.map((name, idx) => (
                                    <span key={idx} className="client-chip rare-chip">{name}</span>
                                ))
                            ) : (
                                <p className="no-clients">No clients yet</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardStats;