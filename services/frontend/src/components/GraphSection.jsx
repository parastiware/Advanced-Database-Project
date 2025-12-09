import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Network } from 'vis-network';
import 'vis-network/styles/vis-network.min.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

export function GraphSection({ users }) {
    const graphContainer = useRef(null);
    const networkInstance = useRef(null);
    const [relationships, setRelationships] = useState([]);
    const [followData, setFollowData] = useState({ followerId: '', followeeId: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const renderGraph = useCallback(() => {
        const nodes = users.map(u => ({
            id: u.id,
            label: u.name,
            color: '#667eea',
            font: { size: 14, color: '#fff' },
            shape: 'circle',
            size: 25
        }));

        const edges = relationships.map((rel, idx) => ({
            from: rel.followerId,
            to: rel.followeeId,
            arrows: 'to',
            color: '#764ba2',
            width: 2,
            smooth: { type: 'continuous' }
        }));

        const data = { nodes, edges };
        const options = {
            physics: {
                enabled: true,
                stabilization: { iterations: 200 }
            },
            interaction: {
                navigationButtons: true,
                keyboard: true,
                zoomView: true,
                dragView: true
            }
        };

        if (graphContainer.current) {
            if (networkInstance.current) {
                networkInstance.current.destroy();
            }
            networkInstance.current = new Network(graphContainer.current, data, options);
        }
    }, [users, relationships]);

    useEffect(() => {
        fetchRelationships();
        const interval = setInterval(fetchRelationships, 3000);
        return () => clearInterval(interval);
    }, []);

    // Render the network graph whenever users or relationships change
    useEffect(() => {
        if (graphContainer.current && users.length > 0) {
            renderGraph();
        }
    }, [users, relationships, renderGraph]);

    const createRelationship = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!followData.followerId || !followData.followeeId) {
            setError('Please select both users');
            return;
        }

        if (followData.followerId === followData.followeeId) {
            setError('A user cannot follow themselves');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/follow`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    followerId: followData.followerId,
                    followeeId: followData.followeeId,
                }),
            });

            if (res.ok) {
                setSuccess('Relationship created successfully!');
                setFollowData({ followerId: '', followeeId: '' });
                fetchRelationships();
            } else {
                const error = await res.json();
                setError(error.error || 'Failed to create relationship');
            }
        } catch (err) {
            console.error('Error creating relationship:', err);
            setError('Error: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchRelationships = async () => {
        try {
            const res = await fetch(`${API_URL}/relationships`);
            if (res.ok) {
                const data = await res.json();
                setRelationships(Array.isArray(data) ? data : []);
            }
        } catch (err) {
            console.error('Error fetching relationships:', err);
        }
    };

    return (
        <section className="database-section">
            <h2>🔗 Neo4j - Social Graph</h2>

            {error && (
                <div style={{
                    padding: '12px',
                    marginBottom: '15px',
                    background: '#ffebee',
                    color: '#c62828',
                    borderRadius: '8px',
                    borderLeft: '4px solid #c62828'
                }}>{error}</div>
            )}
            {success && (
                <div style={{
                    padding: '12px',
                    marginBottom: '15px',
                    background: '#e8f5e9',
                    color: '#2e7d32',
                    borderRadius: '8px',
                    borderLeft: '4px solid #2e7d32'
                }}>{success}</div>
            )}

            <form onSubmit={createRelationship} className="form">
                <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '10px' }}>
                    Create a follow relationship between users:
                </div>
                <select
                    value={followData.followerId}
                    onChange={(e) => setFollowData({ ...followData, followerId: e.target.value })}
                    required
                >
                    <option value="">-- Select Follower --</option>
                    {users.map((user) => (
                        <option key={user.id} value={user.id}>{user.name}</option>
                    ))}
                </select>
                <div style={{ textAlign: 'center', color: '#999', fontWeight: '600' }}>follows</div>
                <select
                    value={followData.followeeId}
                    onChange={(e) => setFollowData({ ...followData, followeeId: e.target.value })}
                    required
                >
                    <option value="">-- Select Person to Follow --</option>
                    {users.map((user) => (
                        <option key={user.id} value={user.id}>{user.name}</option>
                    ))}
                </select>
                <button type="submit" disabled={loading || users.length < 2}>
                    {loading ? 'Creating...' : 'Create Relationship'}
                </button>
                {users.length < 2 && (
                    <div style={{ fontSize: '0.85rem', color: '#999' }}>
                        Create at least 2 users to establish relationships
                    </div>
                )}
            </form>

            <div style={{ marginTop: '30px', height: '500px', background: '#f8f8ff', borderRadius: '12px', boxShadow: '0 2px 8px #eee', border: '1px solid #ddd' }} ref={graphContainer} />

            {relationships.length > 0 && (
                <div style={{ marginTop: '20px' }}>
                    <h3 style={{ color: '#667eea', marginBottom: '15px', fontSize: '1rem' }}>
                        {relationships.length} Active Relationship{relationships.length !== 1 ? 's' : ''}
                    </h3>
                    <div style={{ display: 'grid', gap: '10px' }}>
                        {relationships.map((rel, idx) => (
                            <div key={idx} style={{
                                padding: '10px 15px',
                                background: '#f5f5f5',
                                borderRadius: '8px',
                                borderLeft: '3px solid #667eea',
                                fontSize: '0.9rem'
                            }}>
                                <strong style={{ color: '#667eea' }}>{rel.followerName}</strong>
                                <span style={{ color: '#999', margin: '0 8px' }}>→</span>
                                <strong style={{ color: '#667eea' }}>{rel.followeeName}</strong>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {relationships.length === 0 && users.length > 0 && (
                <div style={{
                    marginTop: '20px',
                    padding: '20px',
                    textAlign: 'center',
                    background: '#f5f5f5',
                    borderRadius: '8px',
                    color: '#999'
                }}>
                    No relationships yet. Create one using the form above!
                </div>
            )}
        </section>
    );
}
