import React from 'react';

export function UserList({ users, onEdit, onDelete }) {
    return (
        <div className="data-list">
            {Array.isArray(users) && users.length > 0 ? (
                users.map((user) => (
                    <div key={user.id} className="data-item">
                        <strong>{user.name}</strong> ({user.email})
                        <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                            <button onClick={() => onEdit(user)}>Edit</button>
                            <button onClick={() => onDelete(user.id)}>Delete</button>
                        </div>
                    </div>
                ))
            ) : (
                <div className="data-item">No users available</div>
            )}
        </div>
    );
}
