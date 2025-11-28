import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

function App() {
    const [users, setUsers] = useState([]);
    const [posts, setPosts] = useState([]);
    const [newUser, setNewUser] = useState({ email: '', name: '', password: '' });
    const [newPost, setNewPost] = useState({ author_id: '', title: '', body: '', tags: '' });

    useEffect(() => {
        fetchUsers();
        fetchPosts();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await fetch(`${API_URL}/users`);
            const data = await res.json();
            setUsers(data);
        } catch (err) {
            console.error('Error fetching users:', err);
        }
    };

    const fetchPosts = async () => {
        try {
            const res = await fetch(`${API_URL}/posts`);
            const data = await res.json();
            setPosts(data);
        } catch (err) {
            console.error('Error fetching posts:', err);
        }
    };

    const createUser = async (e) => {
        e.preventDefault();
        try {
            await fetch(`${API_URL}/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newUser),
            });
            setNewUser({ email: '', name: '', password: '' });
            fetchUsers();
        } catch (err) {
            console.error('Error creating user:', err);
        }
    };

    const createPost = async (e) => {
        e.preventDefault();
        try {
            await fetch(`${API_URL}/posts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...newPost,
                    tags: newPost.tags.split(',').map(t => t.trim()),
                }),
            });
            setNewPost({ author_id: '', title: '', body: '', tags: '' });
            fetchPosts();
        } catch (err) {
            console.error('Error creating post:', err);
        }
    };

    return (
        <div className="App">
            <header>
                <h1>🌐 Polyglot Persistence Demo</h1>
                <p>Demonstrating Postgres, MongoDB, Neo4j, TimescaleDB, and Redis</p>
            </header>

            <div className="container">
                <section className="database-section">
                    <h2>📊 PostgreSQL - Users</h2>
                    <form onSubmit={createUser} className="form">
                        <input
                            type="email"
                            placeholder="Email"
                            value={newUser.email}
                            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                            required
                        />
                        <input
                            type="text"
                            placeholder="Name"
                            value={newUser.name}
                            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                            required
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            value={newUser.password}
                            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                            required
                        />
                        <button type="submit">Create User</button>
                    </form>
                    <div className="data-list">
                        {users.map((user) => (
                            <div key={user.id} className="data-item">
                                <strong>{user.name}</strong> ({user.email})
                            </div>
                        ))}
                    </div>
                </section>

                <section className="database-section">
                    <h2>📄 MongoDB - Posts</h2>
                    <form onSubmit={createPost} className="form">
                        <input
                            type="text"
                            placeholder="Author ID (User ID)"
                            value={newPost.author_id}
                            onChange={(e) => setNewPost({ ...newPost, author_id: e.target.value })}
                            required
                        />
                        <input
                            type="text"
                            placeholder="Title"
                            value={newPost.title}
                            onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                            required
                        />
                        <textarea
                            placeholder="Body"
                            value={newPost.body}
                            onChange={(e) => setNewPost({ ...newPost, body: e.target.value })}
                            required
                        />
                        <input
                            type="text"
                            placeholder="Tags (comma-separated)"
                            value={newPost.tags}
                            onChange={(e) => setNewPost({ ...newPost, tags: e.target.value })}
                        />
                        <button type="submit">Create Post</button>
                    </form>
                    <div className="data-list">
                        {posts.map((post) => (
                            <div key={post._id} className="data-item">
                                <h3>{post.title}</h3>
                                <p>{post.body}</p>
                                <small>By: {post.author_id}</small>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="database-section">
                    <h2>🔗 Neo4j - Graph</h2>
                    <p>User relationships and social graph visualization coming soon...</p>
                </section>

                <section className="database-section">
                    <h2>⏱️ TimescaleDB - Events</h2>
                    <p>Real-time analytics and time-series data coming soon...</p>
                </section>

                <section className="database-section">
                    <h2>⚡ Redis - Cache</h2>
                    <p>Cache status and real-time performance metrics coming soon...</p>
                </section>
            </div>
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
