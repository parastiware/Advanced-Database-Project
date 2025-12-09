import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import './App.css';
import { Header } from './components/Header';
import { UserSection } from './components/UserSection';
import { PostSection } from './components/PostSection';
import { GraphSection } from './components/GraphSection';
import { AnalyticsSection } from './components/AnalyticsSection';
import { CacheSection } from './components/CacheSection';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

function App() {
    const [users, setUsers] = useState([]);
    const [posts, setPosts] = useState([]);
    const [newUser, setNewUser] = useState({ email: '', name: '', password: '' });
    const [newPost, setNewPost] = useState({ author_id: '', title: '', body: '', tags: '' });
    const [editingUserId, setEditingUserId] = useState(null);
    const [editingPostId, setEditingPostId] = useState(null);

    useEffect(() => {
        fetchUsers();
        fetchPosts();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await fetch(`${API_URL}/users`);
            const data = await res.json();
            if (Array.isArray(data)) {
                setUsers(data);
            } else {
                console.warn('/users returned non-array:', data);
                setUsers([]);
            }
        } catch (err) {
            console.error('Error fetching users:', err);
        }
    };

    const fetchPosts = async () => {
        try {
            const res = await fetch(`${API_URL}/posts`);
            const data = await res.json();
            if (Array.isArray(data)) {
                setPosts(data);
            } else {
                console.warn('/posts returned non-array:', data);
                setPosts([]);
            }
        } catch (err) {
            console.error('Error fetching posts:', err);
        }
    };

    const createUser = async (e) => {
        e.preventDefault();
        try {
            if (editingUserId) {
                // Update user
                const payload = { email: newUser.email, name: newUser.name, password: newUser.password || null };
                await fetch(`${API_URL}/users/${editingUserId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
                setEditingUserId(null);
            } else {
                // Create new user
                await fetch(`${API_URL}/users`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newUser),
                });
            }
            setNewUser({ email: '', name: '', password: '' });
            fetchUsers();
        } catch (err) {
            console.error('Error creating/updating user:', err);
        }
    };

    const editUser = (user) => {
        setNewUser({ email: user.email, name: user.name, password: '' });
        setEditingUserId(user.id);
    };

    const cancelEditUser = () => {
        setEditingUserId(null);
        setNewUser({ email: '', name: '', password: '' });
    };

    const deleteUser = async (id) => {
        if (!window.confirm('Delete user?')) return;
        try {
            await fetch(`${API_URL}/users/${id}`, { method: 'DELETE' });
            fetchUsers();
        } catch (err) {
            console.error('Error deleting user:', err);
        }
    };

    const createPost = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...newPost,
                tags: newPost.tags ? newPost.tags.split(',').map(t => t.trim()) : [],
            };
            if (editingPostId) {
                // Update post
                await fetch(`${API_URL}/posts/${editingPostId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
                setEditingPostId(null);
            } else {
                // Create new post
                await fetch(`${API_URL}/posts`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
            }
            setNewPost({ author_id: '', title: '', body: '', tags: '' });
            fetchPosts();
        } catch (err) {
            console.error('Error creating/updating post:', err);
        }
    };

    const editPost = (post) => {
        setNewPost({ author_id: post.author_id, title: post.title, body: post.body, tags: (post.tags || []).join(', ') });
        setEditingPostId(post._id);
    };

    const cancelEditPost = () => {
        setEditingPostId(null);
        setNewPost({ author_id: '', title: '', body: '', tags: '' });
    };

    const deletePost = async (id) => {
        if (!window.confirm('Delete post?')) return;
        try {
            await fetch(`${API_URL}/posts/${id}`, { method: 'DELETE' });
            fetchPosts();
        } catch (err) {
            console.error('Error deleting post:', err);
        }
    };

    return (
        <div className="App">
            <Header />

            <div className="container">
                <UserSection
                    users={users}
                    newUser={newUser}
                    setNewUser={setNewUser}
                    editingUserId={editingUserId}
                    onCreateUser={createUser}
                    onEditUser={editUser}
                    onCancelEdit={cancelEditUser}
                    onDeleteUser={deleteUser}
                />

                <PostSection
                    users={users}
                    posts={posts}
                    newPost={newPost}
                    setNewPost={setNewPost}
                    editingPostId={editingPostId}
                    onCreatePost={createPost}
                    onEditPost={editPost}
                    onCancelEdit={cancelEditPost}
                    onDeletePost={deletePost}
                />

                <GraphSection users={users} />

                <AnalyticsSection />

                <CacheSection />
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
