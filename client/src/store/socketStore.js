import { create } from 'zustand';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const useSocketStore = create((set, get) => ({
    socket: null,
    onlineUsers: [],
    activeChatId: null,
    unreadMessages: 0,

    setActiveChatId: (id) => set({ activeChatId: id }),
    incrementUnreadMessages: () => set(s => ({ unreadMessages: s.unreadMessages + 1 })),
    resetUnreadMessages: () => set({ unreadMessages: 0 }),

    connect: (userId) => {
        if (!get().socket) {
            const socket = io(SOCKET_URL, {
                withCredentials: true,
            });

            socket.on("connect", () => {
                console.log("Connected to socket server");
                if (userId) {
                    socket.emit("setup", userId);
                }
            });

            socket.on("online-users", (users) => {
                set({ onlineUsers: users });
            });

            set({ socket });
        }
    },

    disconnect: () => {
        const { socket } = get();
        if (socket) {
            socket.disconnect();
            set({ socket: null });
        }
    }
}));

export default useSocketStore;
