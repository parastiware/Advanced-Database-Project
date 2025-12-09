import React from 'react';

export function PostList({ posts, onEdit, onDelete }) {
    return (
        <div className="data-list">
            {posts && posts.length > 0 ? (
                posts.map((post) => (
                    <div key={post._id} className="data-item">
                        <h3>{post.title}</h3>
                        <p>{post.body}</p>
                        <small>
                            By: <strong>{post.user ? post.user.name : 'Unknown'}</strong>
                            {post.user && ` (${post.user.email})`}
                        </small>
                        {post.tags && post.tags.length > 0 && (
                            <div style={{ marginTop: '6px' }}>
                                <strong>Tags:</strong> {post.tags.join(', ')}
                            </div>
                        )}
                        <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                            <button onClick={() => onEdit(post)}>Edit</button>
                            <button onClick={() => onDelete(post._id)}>Delete</button>
                        </div>
                    </div>
                ))
            ) : (
                <div className="data-item">No posts available</div>
            )}
        </div>
    );
}
