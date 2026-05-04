import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiSend, FiPlus, FiUser, FiUsers, FiSearch, FiPaperclip, FiMic, FiSquare, FiX, FiTrash2, FiArrowLeft } from 'react-icons/fi';
import api from '../api/axios';
import useAuthStore from '../store/authStore';
import useSocketStore from '../store/socketStore';
import NewGroupModal from '../components/chat/NewGroupModal';
import './Chat.css';

export default function Chat() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuthStore();
    const { socket, setActiveChatId, onlineUsers, resetUnreadMessages } = useSocketStore();
    const [conversations, setConversations] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [typingUser, setTypingUser] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Media attachments
    const [attachment, setAttachment] = useState(null);
    const [attachmentPreview, setAttachmentPreview] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState(null);
    const [recordingTime, setRecordingTime] = useState(0);

    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const timerRef = useRef(null);
    // Ref always holds the latest activeChat._id — prevents stale closure in socket handlers
    const activeChatIdRef = useRef(null);

    useEffect(() => {
        const init = async () => {
            // Clear message badge as soon as user opens chat
            resetUnreadMessages();
            await fetchConversations();
            // If navigated from dating matches, auto-open the conversation
            if (location.state?.openConversation) {
                fetchMessages(location.state.openConversation);
                // Clear location state so refresh doesn't re-open
                window.history.replaceState({}, '');
            }
        };
        init();
        return () => {
            setActiveChatId(null);
        };
    }, [setActiveChatId]);

    useEffect(() => {
        if (!socket) return;

        // Use ref so handlers always see the latest activeChatId without re-subscribing
        const handleReceive = (message) => {
            const msgConvId = message.conversation?._id || message.conversation;
            if (String(msgConvId) === String(activeChatIdRef.current)) {
                setMessages(prev => {
                    // Replace optimistic temp message if it exists, else append
                    const tempIdx = prev.findIndex(m => m._tempId && m._tempId === message._tempId);
                    if (tempIdx !== -1) {
                        // Swap the temp with the real server message
                        const updated = [...prev];
                        updated[tempIdx] = message;
                        return updated;
                    }
                    // Deduplicate by real _id (receiver side)
                    const alreadyExists = prev.some(m => String(m._id) === String(message._id));
                    return alreadyExists ? prev : [...prev, message];
                });
            }
            // Always refresh sidebar conversation list for unread badges
            fetchConversations();
        };

        const handleTyping = ({ conversationId, username }) => {
            if (conversationId === activeChatIdRef.current) setTypingUser(username);
        };

        const handleStopTyping = ({ conversationId }) => {
            if (conversationId === activeChatIdRef.current) setTypingUser(null);
        };

        const handleConvUpdated = () => {
            fetchConversations();
        };

        const handleMessageDeleted = ({ messageId, conversationId }) => {
            if (conversationId === activeChatIdRef.current) {
                setMessages(prev => prev.filter(m => m._id !== messageId));
            }
            fetchConversations();
        };

        const handleConversationDeleted = ({ conversationId }) => {
            if (conversationId === activeChatIdRef.current) {
                setActiveChat(null);
                activeChatIdRef.current = null;
                setMessages([]);
            }
            fetchConversations();
        };

        const handleConversationRead = ({ conversationId, userId }) => {
            if (conversationId === activeChatIdRef.current) {
                setMessages(prev => prev.map(m => {
                    if (m.sender._id === user._id && (!m.readBy || !m.readBy.includes(userId))) {
                        return { ...m, readBy: [...(m.readBy || []), userId] };
                    }
                    return m;
                }));
            }
            fetchConversations();
        };

        const handleMessageLiked = ({ messageId, likes }) => {
            setMessages(prev => prev.map(m => m._id === messageId ? { ...m, likes } : m));
        };

        socket.on("receive-message", handleReceive);
        socket.on("user-typing", handleTyping);
        socket.on("user-stopped-typing", handleStopTyping);
        socket.on("conversation-updated", handleConvUpdated);
        socket.on("message-deleted", handleMessageDeleted);
        socket.on("conversation-deleted", handleConversationDeleted);
        socket.on("conversation-read", handleConversationRead);
        socket.on("message-liked", handleMessageLiked);

        return () => {
            socket.off("receive-message", handleReceive);
            socket.off("user-typing", handleTyping);
            socket.off("user-stopped-typing", handleStopTyping);
            socket.off("conversation-updated", handleConvUpdated);
            socket.off("message-deleted", handleMessageDeleted);
            socket.off("conversation-deleted", handleConversationDeleted);
            socket.off("conversation-read", handleConversationRead);
            socket.off("message-liked", handleMessageLiked);
        };
        // Only re-subscribe when socket changes — ref handles chat tracking
    }, [socket]);

    useEffect(() => {
        if (activeChat && messages.length > 0) {
            const unreadMessages = messages.filter(m => m.sender._id !== user?._id && (!m.readBy || !m.readBy.includes(user?._id)));
            if (unreadMessages.length > 0) {
                api.put(`/chat/${activeChat._id}/read`)
                    .then(() => fetchConversations())
                    .catch(console.error);
                setMessages(prev => prev.map(m => {
                    if (m.sender._id !== user?._id && (!m.readBy || !m.readBy.includes(user?._id))) {
                        return { ...m, readBy: [...(m.readBy || []), user?._id] };
                    }
                    return m;
                }));
            }
        }
    }, [messages, activeChat, user]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const fetchConversations = async () => {
        try {
            const res = await api.get('/chat');
            setConversations(res.data);
        } catch (error) {
            console.error("Error fetching conversations:", error);
        }
    };

    const fetchMessages = async (chat) => {
        try {
            // Leave previous room
            if (activeChatIdRef.current) {
                socket?.emit("leave-conversation", activeChatIdRef.current);
            }
            // Update ref immediately so socket handlers use the new ID at once
            activeChatIdRef.current = chat._id;
            setActiveChat(chat);
            setActiveChatId(chat._id);
            const res = await api.get(`/chat/${chat._id}/messages`);
            setMessages(res.data);
            socket?.emit("join-conversation", chat._id);
        } catch (error) {
            console.error("Error fetching messages:", error);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setAttachment(file);
            setAttachmentPreview(URL.createObjectURL(file));
        }
    };

    const removeAttachment = () => {
        setAttachment(null);
        setAttachmentPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            const chunks = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunks.push(e.data);
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'audio/webm' });
                setAudioBlob(blob);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);

            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        } catch (err) {
            console.error("Error accessing microphone:", err);
            alert("Could not access microphone.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            clearInterval(timerRef.current);
        }
    };

    const removeAudio = () => {
        setAudioBlob(null);
        setRecordingTime(0);
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if ((!newMessage.trim() && !attachment && !audioBlob) || !activeChat) return;

        // Create a unique temp ID for this optimistic message
        const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2)}`;

        // ── Optimistic update: show the message instantly ──────────────────────
        const optimisticMsg = {
            _tempId: tempId,          // used to find & replace when socket confirms
            _id: tempId,              // React key — will be replaced by real _id
            conversation: activeChat._id,
            sender: { _id: user._id, username: user.username, avatar: user.avatar },
            text: newMessage.trim() || null,
            mediaUrl: attachmentPreview || null,
            mediaType: attachment ? attachment.type.split('/')[0] : null,
            readBy: [user._id],
            likes: [],
            createdAt: new Date().toISOString(),
            _optimistic: true,
        };
        setMessages(prev => [...prev, optimisticMsg]);

        // Clear inputs immediately
        setNewMessage('');
        removeAttachment();
        removeAudio();
        socket?.emit('stop-typing', { conversationId: activeChat._id, username: user.username });

        try {
            const formData = new FormData();
            if (optimisticMsg.text) formData.append('text', optimisticMsg.text);
            if (attachment) {
                formData.append('media', attachment);
            } else if (audioBlob) {
                formData.append('media', audioBlob, 'audio-message.webm');
            }
            // Pass tempId so the server can relay it in the socket event
            formData.append('tempId', tempId);

            const res = await api.post(`/chat/${activeChat._id}/messages`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            // Fallback: if socket didn't replace the temp already, swap it now
            if (res?.data) {
                setMessages(prev => {
                    const tempIdx = prev.findIndex(m => m._tempId === tempId);
                    if (tempIdx !== -1) {
                        const updated = [...prev];
                        updated[tempIdx] = res.data;
                        return updated;
                    }
                    // Already replaced by socket — deduplicate
                    const alreadyExists = prev.some(m => String(m._id) === String(res.data._id));
                    return alreadyExists ? prev : [...prev, res.data];
                });
            }
        } catch (error) {
            // Roll back the optimistic message on failure
            setMessages(prev => prev.filter(m => m._tempId !== tempId));
            console.error('Error sending message:', error);
            alert(error.response?.data?.message || 'Failed to send message');
        }
    };

    const handleTyping = (e) => {
        setNewMessage(e.target.value);
        if (e.target.value.trim().length > 0) {
            socket?.emit("typing", { conversationId: activeChat._id, username: user.username });
        } else {
            socket?.emit("stop-typing", { conversationId: activeChat._id, username: user.username });
        }
    };

    const handleDeleteMessage = async (messageId) => {
        if (!window.confirm("Are you sure you want to delete this message?")) return;
        try {
            await api.delete(`/chat/messages/${messageId}`);
            setMessages(prev => prev.filter(m => m._id !== messageId));
            fetchConversations();
        } catch (error) {
            console.error("Error deleting message:", error);
            alert("Failed to delete message");
        }
    };

    const handleDeleteConversation = async () => {
        if (!window.confirm("Are you sure you want to delete this entire conversation?")) return;
        try {
            await api.delete(`/chat/${activeChat._id}`);
            setActiveChat(null);
            setMessages([]);
            fetchConversations();
        } catch (error) {
            console.error("Error deleting conversation:", error);
            alert("Failed to delete conversation");
        }
    };

    const handleUserClick = (userId) => {
        if (userId) {
            navigate(`/profile/${userId}`);
        }
    };

    const handleChatHeaderClick = () => {
        if (activeChat.type === 'dm') {
            const otherParticipant = activeChat.participants.find(p => p._id !== user?._id);
            if (otherParticipant) {
                navigate(`/profile/${otherParticipant._id}`);
            }
        }
    };

    const handleDoubleTap = async (msgId) => {
        try {
            const res = await api.post(`/chat/messages/${msgId}/like`);
            setMessages(prev => prev.map(m => m._id === msgId ? { ...m, likes: res.data.likes } : m));
        } catch (error) {
            console.error("Error liking message:", error);
        }
    };

    const getChatName = (chat) => {
        if (chat.type === "group") return chat.name;
        const otherParticipant = chat.participants.find(p => p._id !== user?._id);
        return otherParticipant?.fullName || otherParticipant?.username || "Unknown";
    };

    const getChatAvatar = (chat) => {
        if (chat.type === "group") return <FiUsers className="chat-avatar-icon" />;
        const otherParticipant = chat.participants.find(p => p._id !== user?._id);
        const isOnline = otherParticipant && onlineUsers && onlineUsers.includes(otherParticipant._id);

        return (
            <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {otherParticipant?.avatar ? <img src={otherParticipant.avatar} alt="avatar" /> : <FiUser className="chat-avatar-icon" />}
                {isOnline && <div className="online-dot"></div>}
            </div>
        );
    };

    const filteredConversations = conversations.filter(chat =>
        getChatName(chat).toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className={`chat-container ${activeChat ? 'chat-open' : ''}`}>
            {/* Sidebar */}
            <div className="chat-sidebar">
                <div className="chat-sidebar-header">
                    <h2>Messages</h2>
                    <button className="new-chat-btn" onClick={() => setIsModalOpen(true)}><FiPlus /></button>
                </div>
                <div className="chat-search">
                    <FiSearch className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search messages..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="conversation-list">
                    {filteredConversations.map((chat) => (
                        <div
                            key={chat._id}
                            className={`conversation-item ${activeChat?._id === chat._id ? 'active' : ''}`}
                            onClick={() => fetchMessages(chat)}
                        >
                            <div className="chat-avatar">
                                {getChatAvatar(chat)}
                            </div>
                            <div className="chat-info">
                                <div className="chat-name">{getChatName(chat)}</div>
                                <div className={`chat-last-msg ${chat.unreadCount > 0 ? 'unread' : ''}`} style={{ fontWeight: chat.unreadCount > 0 ? 'bold' : 'normal', color: chat.unreadCount > 0 ? '#fff' : 'var(--text-secondary)' }}>
                                    {chat.unreadCount > 0 && <span style={{ color: '#e1306c', marginRight: '4px' }}>New:</span>}
                                    {chat.lastMessage
                                        ? (chat.lastMessage.text || (chat.lastMessage.mediaType ? `Sent a ${chat.lastMessage.mediaType}` : 'Media attached'))
                                        : "Say hello!"}
                                </div>
                            </div>
                            {chat.unreadCount > 0 && (
                                <div className="unread-badge" style={{
                                    backgroundColor: '#e1306c',
                                    color: 'white',
                                    borderRadius: '50%',
                                    padding: '2px 8px',
                                    fontSize: '0.75rem',
                                    fontWeight: 'bold',
                                    marginLeft: 'auto'
                                }}>
                                    {chat.unreadCount}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Chat Area */}
            <div className="chat-area">
                {activeChat ? (
                    <>
                        <div className="chat-area-header">
                            <div className="chat-header-left" onClick={handleChatHeaderClick} style={{ cursor: activeChat.type === 'dm' ? 'pointer' : 'default', display: 'flex', alignItems: 'center', gap: '15px' }}>
                                {/* Back button — mobile only */}
                                <button
                                    className="chat-back-btn"
                                    onClick={(e) => { e.stopPropagation(); setActiveChat(null); activeChatIdRef.current = null; setMessages([]); setActiveChatId(null); }}
                                >
                                    <FiArrowLeft /> Back
                                </button>
                                <div className="chat-avatar">{getChatAvatar(activeChat)}</div>
                                <div className="chat-header-info">
                                    <h3>{getChatName(activeChat)}</h3>
                                    {typingUser && <span className="typing-indicator">{typingUser} is typing...</span>}
                                </div>
                            </div>
                            <div className="chat-header-actions">
                                <button className="delete-conv-btn" onClick={handleDeleteConversation} title="Delete Conversation">
                                    <FiTrash2 />
                                </button>
                            </div>
                        </div>

                        <div className="messages-container">
                            {messages.map((msg, index) => {
                                const isMine = msg.sender._id === user?._id;
                                const isFirstInGroup = index === 0 || messages[index - 1].sender._id !== msg.sender._id;
                                const isLastInGroup = index === messages.length - 1 || messages[index + 1].sender._id !== msg.sender._id;
                                const groupClass = `${isFirstInGroup ? 'group-first' : ''} ${isLastInGroup ? 'group-last' : ''} ${!isFirstInGroup && !isLastInGroup ? 'group-middle' : ''}`.trim();

                                const isLastMessage = index === messages.length - 1;
                                const showSeen = isLastMessage && isMine && activeChat.type === 'dm' && msg.readBy && msg.readBy.length > 1;

                                return (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        key={msg._id || index}
                                        className={`message-wrapper ${isMine ? 'mine' : 'theirs'} ${groupClass}`}
                                    >
                                        {!isMine && activeChat.type === 'group' && isFirstInGroup && (
                                            <div
                                                className="message-sender-name"
                                                onClick={() => handleUserClick(msg.sender._id)}
                                                style={{ cursor: 'pointer' }}
                                                title={`View ${msg.sender.username}'s profile`}
                                            >
                                                {msg.sender.username}
                                            </div>
                                        )}
                                        <div
                                            className={`message-bubble ${isMine ? 'mine' : 'theirs'} ${msg.mediaUrl ? 'has-media' : ''} ${groupClass}`}
                                            onDoubleClick={() => handleDoubleTap(msg._id)}
                                        >
                                            {msg.mediaUrl && (
                                                <div className="message-media">
                                                    {msg.mediaType === 'image' && <img src={msg.mediaUrl} alt="attachment" />}
                                                    {msg.mediaType === 'video' && <video src={msg.mediaUrl} controls />}
                                                    {msg.mediaType === 'audio' && <audio src={msg.mediaUrl} controls />}
                                                </div>
                                            )}
                                            {msg.text && <div className="message-text">{msg.text}</div>}

                                            {isMine && (
                                                <button
                                                    className="delete-message-btn"
                                                    onClick={() => handleDeleteMessage(msg._id)}
                                                    title="Delete message"
                                                >
                                                    <FiTrash2 />
                                                </button>
                                            )}

                                            {msg.likes && msg.likes.length > 0 && (
                                                <div className="message-likes">
                                                    ❤️ {msg.likes.length > 1 ? msg.likes.length : ''}
                                                </div>
                                            )}
                                        </div>

                                        {isLastInGroup && (
                                            <div className="message-time">
                                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        )}

                                        {showSeen && (
                                            <div className="message-seen">Seen</div>
                                        )}
                                    </motion.div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Attachments Preview Area */}
                        {(attachmentPreview || audioBlob || isRecording) && (
                            <div className="attachment-preview-area">
                                {attachmentPreview && (
                                    <div className="attachment-preview">
                                        {attachment.type.startsWith('video/') ? (
                                            <video src={attachmentPreview} />
                                        ) : (
                                            <img src={attachmentPreview} alt="Preview" />
                                        )}
                                        <button className="remove-attachment-btn" onClick={removeAttachment}><FiX /></button>
                                    </div>
                                )}
                                {isRecording && (
                                    <div className="recording-indicator">
                                        <div className="recording-dot pulse"></div>
                                        <span>Recording... {formatTime(recordingTime)}</span>
                                        <button className="stop-recording-btn" onClick={stopRecording}><FiSquare /></button>
                                    </div>
                                )}
                                {audioBlob && !isRecording && (
                                    <div className="audio-preview">
                                        <audio src={URL.createObjectURL(audioBlob)} controls />
                                        <button className="remove-attachment-btn" onClick={removeAudio}><FiX /></button>
                                    </div>
                                )}
                            </div>
                        )}

                        <form className="message-input-area" onSubmit={handleSendMessage}>
                            {!isRecording && !audioBlob && (
                                <>
                                    <button
                                        type="button"
                                        className="attachment-btn"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <FiPaperclip />
                                    </button>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        style={{ display: 'none' }}
                                        accept="image/*,video/*"
                                        onChange={handleFileChange}
                                    />
                                </>
                            )}

                            <input
                                type="text"
                                placeholder="Type a message..."
                                value={newMessage}
                                onChange={handleTyping}
                                disabled={isRecording || audioBlob}
                            />

                            {!newMessage.trim() && !attachment && !audioBlob ? (
                                <button
                                    type="button"
                                    className={`record-btn ${isRecording ? 'recording' : ''}`}
                                    onClick={isRecording ? stopRecording : startRecording}
                                >
                                    {isRecording ? <FiSquare /> : <FiMic />}
                                </button>
                            ) : (
                                <button type="submit" className="send-btn" disabled={isRecording}>
                                    <FiSend />
                                </button>
                            )}
                        </form>
                    </>
                ) : (
                    <div className="no-chat-selected">
                        <FiSearch className="no-chat-icon" />
                        <h3>Select a conversation or start a new one</h3>
                    </div>
                )}
            </div>

            <NewGroupModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onChatCreated={(newChat) => {
                    fetchConversations();
                    fetchMessages(newChat);
                }}
            />
        </div>
    );
}
