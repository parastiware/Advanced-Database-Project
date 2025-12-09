import React from 'react';

export function PostForm({ users, newPost, setNewPost, editingPostId, onSubmit, onCancel }) {
    return (
        <form onSubmit={onSubmit} className="form">
            <select
                value={newPost.author_id}
                onChange={(e) => setNewPost({ ...newPost, author_id: e.target.value })}
                required
            >
                <option value="">-- Select Author (User) --</option>
                {users.map((user) => (
                    <option key={user.id} value={user.id}>
                        {user.name} ({user.email})
                    </option>
                ))}
            </select>
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
            <button type="submit">{editingPostId ? 'Update Post' : 'Create Post'}</button>
            {editingPostId && <button type="button" onClick={onCancel}>Cancel</button>}
        </form>
    );
}
