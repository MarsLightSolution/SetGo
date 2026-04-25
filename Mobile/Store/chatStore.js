import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useChatStore = create((set, get) => ({
  // Connection
  currentUser: null,
  isConnected: false,
  isConnecting: false,
  connectionError: '',

  // Chat list
  allUsers: [],
  conversations: [],
  isLoadingChats: true,
  unreadCounts: {},

  // Active conversation
  activeConversation: null,
  isLoadingMessages: false,
  isTyping: false,

  // Messages keyed by conversationId — persists across tab switches
  messages: {},

  // ─── Connection ───────────────────────────────────────────────
  setCurrentUser: (user) => set({ currentUser: user }),
  setIsConnected: (v) => set({ isConnected: v }),
  setIsConnecting: (v) => set({ isConnecting: v }),
  setConnectionError: (e) => set({ connectionError: e }),

  // ─── Chat list ────────────────────────────────────────────────
  setAllUsers: (users) => set({ allUsers: users }),
  setConversations: (convs) => set({ conversations: convs }),
  setIsLoadingChats: (v) => set({ isLoadingChats: v }),

  // ─── Unread counts ────────────────────────────────────────────
  setUnreadCounts: (counts) => set({ unreadCounts: counts }),
  incrementUnread: (conversationId) =>
    set((state) => ({
      unreadCounts: {
        ...state.unreadCounts,
        [conversationId]: (state.unreadCounts[conversationId] || 0) + 1,
      },
    })),
  clearUnread: (conversationId) =>
    set((state) => ({
      unreadCounts: { ...state.unreadCounts, [conversationId]: 0 },
    })),

  // ─── Active conversation ──────────────────────────────────────
  setActiveConversation: (conv) => set({ activeConversation: conv }),
  setIsLoadingMessages: (v) => set({ isLoadingMessages: v }),
  setIsTyping: (v) => set({ isTyping: v }),

  // ─── Messages (per conversation) ─────────────────────────────
  setMessages: (conversationId, msgs) =>
    set((state) => ({
      messages: { ...state.messages, [conversationId]: msgs },
    })),

  addMessage: (conversationId, msg) =>
    set((state) => {
      const existing = state.messages[conversationId] || [];
      if (existing.some((m) => m.id === msg.id)) return state;
      return {
        messages: {
          ...state.messages,
          [conversationId]: [...existing, msg],
        },
      };
    }),

  updateMessage: (conversationId, tempId, updates) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: (state.messages[conversationId] || []).map((m) =>
          m.id === tempId ? { ...m, ...updates } : m
        ),
      },
    })),

  removeMessage: (conversationId, messageId) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: (state.messages[conversationId] || []).filter(
          (m) => m.id !== messageId
        ),
      },
    })),

  // ─── Persistence helpers ──────────────────────────────────────
  persistUnreadCounts: async () => {
    const { unreadCounts } = get();
    try {
      await AsyncStorage.setItem('unreadCounts', JSON.stringify(unreadCounts));
    } catch {}
  },

  loadPersistedUnreadCounts: async () => {
    try {
      const raw = await AsyncStorage.getItem('unreadCounts');
      if (raw) set({ unreadCounts: JSON.parse(raw) });
    } catch {}
  },

  // ─── Reset (on logout / disconnect) ──────────────────────────
  reset: () =>
    set({
      currentUser: null,
      isConnected: false,
      isConnecting: false,
      connectionError: '',
      allUsers: [],
      conversations: [],
      isLoadingChats: true,
      unreadCounts: {},
      activeConversation: null,
      isLoadingMessages: false,
      isTyping: false,
      messages: {},
    }),
}));
