import { create } from 'zustand';
import api from '../api/axios';

const useDatingStore = create((set, get) => ({
    profile: null,
    candidates: [],
    matches: [],
    isLoading: false,
    error: null,

    fetchMyProfile: async () => {
        try {
            const { data } = await api.get('/dating/profile/me');
            set({ profile: data.profile });
            return data.profile;
        } catch {
            set({ profile: null });
            return null;
        }
    },

    saveProfile: async (profileData) => {
        set({ isLoading: true, error: null });
        try {
            const { data } = await api.post('/dating/profile', profileData);
            set({ profile: data.profile, isLoading: false });
            return { success: true };
        } catch (err) {
            set({ error: err.response?.data?.message || 'Error', isLoading: false });
            return { success: false };
        }
    },

    fetchDiscovery: async () => {
        set({ isLoading: true });
        try {
            const { data } = await api.get('/dating/discovery');
            set({ candidates: data.candidates, isLoading: false });
        } catch (err) {
            set({ candidates: [], isLoading: false });
        }
    },

    swipeRight: async (targetUserId) => {
        try {
            const { data } = await api.post(`/dating/like/${targetUserId}`);
            // Remove from candidates
            set(state => ({
                candidates: state.candidates.filter(c => c.user._id !== targetUserId)
            }));
            return data;
        } catch {
            return { isMatch: false };
        }
    },

    swipeLeft: async (targetUserId) => {
        try {
            await api.post(`/dating/pass/${targetUserId}`);
            set(state => ({
                candidates: state.candidates.filter(c => c.user._id !== targetUserId)
            }));
        } catch {}
    },

    fetchMatches: async () => {
        set({ isLoading: true });
        try {
            const { data } = await api.get('/dating/matches');
            set({ matches: data.matches, isLoading: false });
        } catch {
            set({ matches: [], isLoading: false });
        }
    },

    unmatch: async (targetUserId) => {
        try {
            await api.delete(`/dating/unmatch/${targetUserId}`);
            set(state => ({
                matches: state.matches.filter(m => m.user._id !== targetUserId)
            }));
        } catch {}
    }
}));

export default useDatingStore;
