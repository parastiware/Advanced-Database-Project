import React, { useState, useEffect } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

export function AnalyticsSection() {
    const [events, setEvents] = useState([]);
    const [stats, setStats] = useState({
        totalEvents: 0,
        totalUsers: 0,
        totalPosts: 0,
        eventTypes: {}
    });
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState('');

    useEffect(() => {
        fetchAnalytics();
        if (autoRefresh) {
            const interval = setInterval(fetchAnalytics, 3000);
            return () => clearInterval(interval);
        }
    }, [autoRefresh]);

    const fetchAnalytics = async () => {
        setLoading(true);
        setFetchError('');
        try {
            const res = await fetch(`${API_URL}/analytics`);
            if (res.ok) {
                const data = await res.json();
                setEvents(Array.isArray(data.events) ? data.events.slice(0, 10) : []);
                setStats(data.stats || {
                    totalEvents: data.events?.length || 0,
                    totalUsers: 0,
                    totalPosts: 0,
                    eventTypes: {}
                });
            } else {
                setFetchError('Failed to fetch analytics data.');
            }
        } catch (err) {
            setFetchError('Error fetching analytics: ' + err.message);
            // Show mock data if endpoint not ready
            setStats({
                totalEvents: Math.floor(Math.random() * 100),
                totalUsers: Math.floor(Math.random() * 20),
                totalPosts: Math.floor(Math.random() * 50),
                eventTypes: {
                    USER_CREATED: Math.floor(Math.random() * 10),
                    POST_CREATED: Math.floor(Math.random() * 15),
                    USER_UPDATED: Math.floor(Math.random() * 5),
                    POST_UPDATED: Math.floor(Math.random() * 8)
                }
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="database-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0 }}>⏱️ TimescaleDB - Real-time Analytics</h2>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                        type="checkbox"
                        checked={autoRefresh}
                        onChange={(e) => setAutoRefresh(e.target.checked)}
                        style={{ cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '0.9rem', color: '#666' }}>Auto-refresh</span>
                </label>
            </div>

            {fetchError && (
                <div style={{
                    background: '#ffebee',
                    color: '#c62828',
                    padding: '12px',
                    borderRadius: '8px',
                    marginBottom: '15px',
                    borderLeft: '4px solid #c62828'
                }}>{fetchError}</div>
            )}

            {loading ? (
                <div style={{ textAlign: 'center', color: '#667eea', padding: '40px 0', fontSize: '1.2rem' }}>
                    Loading analytics...
                </div>
            ) : (
                <>
                    <div className="analytics-grid">
                        <div className="stat-card">
                            <h4>Total Events</h4>
                            <div className="value">{stats.totalEvents}</div>
                            <div className="unit">events</div>
                        </div>
                        <div className="stat-card">
                            <h4>Total Users</h4>
                            <div className="value">{stats.totalUsers}</div>
                            <div className="unit">users</div>
                        </div>
                        <div className="stat-card">
                            <h4>Total Posts</h4>
                            <div className="value">{stats.totalPosts}</div>
                            <div className="unit">posts</div>
                        </div>
                    </div>

                    <h3 style={{ color: '#667eea', marginTop: '20px', marginBottom: '15px' }}>Event Type Distribution</h3>
                    <div className="analytics-grid">
                        {Object.entries(stats.eventTypes).map(([type, count]) => (
                            <div key={type} className="stat-card success">
                                <h4>{type.replace(/_/g, ' ')}</h4>
                                <div className="value">{count}</div>
                                <div className="unit">events</div>
                            </div>
                        ))}
                    </div>

                    <h3 style={{ color: '#667eea', marginTop: '20px', marginBottom: '15px' }}>Recent Events</h3>
                    <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                        {events.length > 0 ? (
                            events.map((event, idx) => (
                                <div key={idx} style={{
                                    padding: '12px',
                                    marginBottom: '8px',
                                    background: '#f5f5f5',
                                    borderRadius: '8px',
                                    borderLeft: '3px solid #667eea',
                                    fontSize: '0.9rem'
                                }}>
                                    <strong style={{ color: '#667eea' }}>{event.type || 'Event'}</strong>
                                    <div style={{ color: '#666', fontSize: '0.85rem', marginTop: '4px' }}>
                                        {new Date(event.time || Date.now()).toLocaleTimeString()}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
                                No events recorded yet
                            </div>
                        )}
                    </div>

                    <button onClick={fetchAnalytics} style={{ marginTop: '15px', width: '100%' }}>
                        Refresh Analytics
                    </button>
                </>
            )}
        </section>
    );
}
