import { useState, useEffect } from 'react';
import { FiX, FiSearch } from 'react-icons/fi';
import api from '../../api/axios';
import Avatar from '../ui/Avatar';
import './NewGroupModal.css';

export default function NewGroupModal({ isOpen, onClose, onChatCreated }) {
    const [users, setUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [groupName, setGroupName] = useState('');
    const [isGroup, setIsGroup] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchUsers();
            setSelectedUsers([]);
            setGroupName('');
            setSearchQuery('');
        }
    }, [isOpen]);

    const fetchUsers = async () => {
        try {
            if (!searchQuery.trim()) {
                const res = await api.get('/users/suggestions');
                setUsers(res.data.users || []);
            } else {
                const res = await api.get('/users/search?q=' + searchQuery);
                setUsers(res.data.users || []);
            }
        } catch (error) {
            console.error("Error fetching users", error);
            setUsers([]);
        }
    };

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchUsers();
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    const toggleUser = (user) => {
        if (selectedUsers.find(u => u._id === user._id)) {
            setSelectedUsers(selectedUsers.filter(u => u._id !== user._id));
        } else {
            if (!isGroup) {
                // If DM, only one user allowed
                setSelectedUsers([user]);
            } else {
                setSelectedUsers([...selectedUsers, user]);
            }
        }
    };

    const handleCreate = async () => {
        if (selectedUsers.length === 0) return;
        
        try {
            if (isGroup) {
                if (!groupName.trim()) return alert("Group name is required");
                const res = await api.post('/chat/group', {
                    name: groupName,
                    participantIds: selectedUsers.map(u => u._id)
                });
                onChatCreated(res.data);
            } else {
                const res = await api.post(`/chat/dm/${selectedUsers[0]._id}`);
                onChatCreated(res.data);
            }
            onClose();
        } catch (error) {
            console.error("Error creating chat", error);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content new-chat-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>New {isGroup ? 'Group' : 'Message'}</h2>
                    <button className="close-btn" onClick={onClose}><FiX /></button>
                </div>

                <div className="chat-type-toggle">
                    <button 
                        className={`toggle-btn ${!isGroup ? 'active' : ''}`} 
                        onClick={() => { setIsGroup(false); setSelectedUsers([]); }}
                    >
                        Direct Message
                    </button>
                    <button 
                        className={`toggle-btn ${isGroup ? 'active' : ''}`} 
                        onClick={() => { setIsGroup(true); setSelectedUsers([]); }}
                    >
                        Group Chat
                    </button>
                </div>

                {isGroup && (
                    <div className="group-name-input">
                        <input 
                            type="text" 
                            placeholder="Group Name" 
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                        />
                    </div>
                )}

                <div className="user-search-input">
                    <FiSearch className="search-icon" />
                    <input 
                        type="text" 
                        placeholder="Search users..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {selectedUsers.length > 0 && (
                    <div className="selected-users-chips">
                        {selectedUsers.map(u => (
                            <div key={u._id} className="user-chip">
                                {u.username}
                                <FiX onClick={() => toggleUser(u)} />
                            </div>
                        ))}
                    </div>
                )}

                <div className="user-list">
                    {users.map(user => (
                        <div 
                            key={user._id} 
                            className={`user-item ${selectedUsers.find(u => u._id === user._id) ? 'selected' : ''}`}
                            onClick={() => toggleUser(user)}
                        >
                            <Avatar src={user.avatar} size={40} />
                            <div className="user-info">
                                <h4>{user.fullName || user.username}</h4>
                                <span>@{user.username}</span>
                            </div>
                        </div>
                    ))}
                </div>

                <button 
                    className="create-chat-submit"
                    disabled={selectedUsers.length === 0 || (isGroup && !groupName.trim())}
                    onClick={handleCreate}
                >
                    {isGroup ? 'Create Group' : 'Start Chat'}
                </button>
            </div>
        </div>
    );
}
