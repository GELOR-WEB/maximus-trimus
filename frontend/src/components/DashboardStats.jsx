import React, { useEffect, useState } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const DashboardStats = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

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



    return (
        <div className="stats-container">
            {/* 1. TOP ROW: KEY METRICS */}
            <div className="stats-grid-top">
                <div className="stat-card">
                    <h4>Total Cuts (All Time)</h4>
                    <p className="stat-number">{stats.totalCutsAllTime}</p>
                </div>
                <div className="stat-card">
                    <h4>Cuts This Year</h4>
                    <p className="stat-number gold">{stats.totalCutsThisYear}</p>
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