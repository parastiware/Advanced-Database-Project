import React from 'react';

export function UserForm({ newUser, setNewUser, editingUserId, onSubmit, onCancel }) {
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
