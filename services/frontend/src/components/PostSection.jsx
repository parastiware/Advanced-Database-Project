import React from 'react';
import { PostForm } from './PostForm';
import { PostList } from './PostList';

export function PostSection({ users, posts, newPost, setNewPost, editingPostId, onCreatePost, onEditPost, onCancelEdit, onDeletePost }) {
    return (
        <section className="database-section">
            <h2>📄 MongoDB - Posts</h2>
            <PostForm
                users={users}
                newPost={newPost}
                setNewPost={setNewPost}
                editingPostId={editingPostId}
                onSubmit={onCreatePost}
                onCancel={onCancelEdit}
            />
            <PostList
                posts={posts}
                onEdit={onEditPost}
                onDelete={onDeletePost}
            />
        </section>
    );
}
