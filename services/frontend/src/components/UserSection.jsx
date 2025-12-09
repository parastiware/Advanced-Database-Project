import React from 'react';

export function UserSection({ users, newUser, setNewUser, editingUserId, onCreateUser, onEditUser, onCancelEdit, onDeleteUser }) {
    return (
        <section className="database-section">
            <h2>📊 PostgreSQL - Users</h2>
            <UserForm
                newUser={newUser}
                setNewUser={setNewUser}
                editingUserId={editingUserId}
                onSubmit={onCreateUser}
                onCancel={onCancelEdit}
            />
            <UserList
                users={users}
                onEdit={onEditUser}
                onDelete={onDeleteUser}
            />
        </section>
    );
}

function UserForm({ newUser, setNewUser, editingUserId, onSubmit, onCancel }) {
    return (
        <form onSubmit={onSubmit} className="form">
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
                required={!editingUserId}
            />
            <button type="submit">{editingUserId ? 'Update User' : 'Create User'}</button>
            {editingUserId && <button type="button" onClick={onCancel}>Cancel</button>}
        </form>
    );
}

function UserList({ users, onEdit, onDelete }) {
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
