import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Dimensions,
  StatusBar,
  Animated,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import io from 'socket.io-client';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
const { width, height } = Dimensions.get('window');

import { API_ENDPOINTS, BASE_URL, IMAGE_BASE_URL } from '../../config/api';
import { getUserData, getAuthToken } from '../../services/secureAuthService';
import { useChatStore } from '../../Store/chatStore';
import logger from '../../utils/logger';

const log = logger.create('Chat');

// ─── AsyncStorage cache helpers (module-level, no state) ──────────────────────

const cacheMessages = async (conversationId, msgs) => {
  try {
    await AsyncStorage.setItem(`messages_${conversationId}`, JSON.stringify(msgs));
  } catch {}
};
const loadCachedMessages = async (conversationId) => {
  try {
    const raw = await AsyncStorage.getItem(`messages_${conversationId}`);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};
const cacheConversations = async (convs) => {
  try { await AsyncStorage.setItem('conversations_cache', JSON.stringify(convs)); } catch {}
};
const loadCachedConversations = async () => {
  try {
    const raw = await AsyncStorage.getItem('conversations_cache');
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
};
const cacheAllUsers = async (users) => {
  try { await AsyncStorage.setItem('allUsers_cache', JSON.stringify(users)); } catch {}
};
const loadCachedAllUsers = async () => {
  try {
    const raw = await AsyncStorage.getItem('allUsers_cache');
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
};

// ─── Theme ────────────────────────────────────────────────────────────────────

// Avatar colour palette — cycles by first letter
const AVATAR_COLORS = ['#008235','#0EA5E9','#8B5CF6','#F59E0B','#EF4444','#EC4899','#14B8A6','#F97316'];
const avatarColor = (name = '') => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

const theme = {
  background: '#F9FAFB',
  secondaryBg: '#F3F4F6',
  chatListBg: '#FFFFFF',
  primary: '#008235',
  primaryDark: '#006828',
  primaryLight: '#DCFCE7',
  text: '#111827',
  secondaryText: '#6B7280',
  tertiaryText: '#9CA3AF',
  border: '#E5E7EB',
  messageBubbleMine: '#DCFCE7',
  messageBubbleOther: '#FFFFFF',
  inputBg: '#FFFFFF',
  headerBg: '#F0F2F5',
  shadow: '#00000015',
  divider: '#E9EDEF',
};

// ─── Message item (needs own hooks) ───────────────────────────────────────────

const MessageItem = ({ item }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  }, []);

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <View style={[
        styles.messageContainer,
        item.sender === 'me' ? styles.myMessage : styles.otherMessage,
      ]}>
        {item.sender === 'other' && (
          <View style={styles.avatarContainer}>
            <View style={[styles.messageAvatar, { backgroundColor: theme.primaryDark }]}>
              <Text style={styles.avatarText}>
                {item.senderName?.charAt(0)?.toUpperCase() || 'U'}
              </Text>
            </View>
          </View>
        )}
        <View style={[
          styles.messageBubble,
          item.sender === 'me' ? styles.myMessageBubble : styles.otherMessageBubble,
        ]}>
          {item.messageType === 'image' ? (
            item.isUploading ? (
              <View style={styles.imageUploadingContainer}>
                <Image source={{ uri: item.localUri }} style={[styles.messageImage, styles.imageUploading]} resizeMode="cover" />
                <View style={styles.imageUploadingOverlay}>
                  <ActivityIndicator size="large" color="#FFFFFF" />
                  <Text style={styles.imageUploadingText}>Sending...</Text>
                </View>
              </View>
            ) : item.fileUrl ? (
              <Image source={{ uri: `${IMAGE_BASE_URL}${item.fileUrl}` }} style={styles.messageImage} resizeMode="cover" />
            ) : null
          ) : (
            <Text style={[styles.messageText, { color: theme.text }]}>{item.text}</Text>
          )}
          <Text style={[styles.timestamp, { color: item.sender === 'me' ? '#667781' : theme.tertiaryText }]}>
            {item.timestamp}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

export default function ChatApp() {
  // ── Store state ──────────────────────────────────────────────
  const {
    currentUser, isConnected, isConnecting,
    allUsers, conversations, isLoadingChats, unreadCounts,
    activeConversation, isLoadingMessages, isTyping,
    messages: allMessages,
    setCurrentUser, setIsConnected, setIsConnecting,
    setAllUsers, setConversations, setIsLoadingChats,
    incrementUnread, clearUnread, loadPersistedUnreadCounts,
    setActiveConversation, setIsLoadingMessages, setIsTyping,
    setMessages, addMessage, updateMessage, removeMessage,
    persistUnreadCounts,
  } = useChatStore();

  // Messages for the currently active conversation
  const messages = activeConversation ? (allMessages[activeConversation._id] || []) : [];

  // ── Local state (transient UI only) ─────────────────────────
  const [newMessage, setNewMessage] = useState('');
  const [initialLoad, setInitialLoad] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [listSearch, setListSearch] = useState('');

  // ── Refs ─────────────────────────────────────────────────────
  const flatListRef = useRef(null);
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const messageQueueRef = useRef([]);
  const activeConversationRef = useRef(null);

  // ── Persist unread counts to AsyncStorage on every change ───
  useEffect(() => {
    persistUnreadCounts();
  }, [unreadCounts]);

  // ── On mount: restore cache + connect ───────────────────────
  useEffect(() => {
    requestPermissions();
    restoreFromCache();
    loadPersistedUnreadCounts();
    autoConnect();
  }, []);

  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    }
  };

  const restoreFromCache = async () => {
    const [cachedConvs, cachedUsers] = await Promise.all([
      loadCachedConversations(),
      loadCachedAllUsers(),
    ]);
    if (cachedConvs.length > 0) setConversations(cachedConvs);
    if (cachedUsers.length > 0) setAllUsers(cachedUsers);
  };

  const autoConnect = async () => {
    try {
      const userData = await getUserData();
      if (userData) {
        const identifier = userData.email || userData.username || userData._id;
        const displayName = userData.profileName || userData.userName || userData.username || 'User';
        if (identifier) {
          connectUser(identifier, displayName);
        } else {
          setIsLoadingChats(false);
        }
      } else {
        setIsLoadingChats(false);
      }
    } catch {
      setIsLoadingChats(false);
    }
  };

  // ── Keep ref in sync for socket handlers ────────────────────
  useEffect(() => {
    activeConversationRef.current = activeConversation;
  }, [activeConversation]);

  // ── Socket: connect when currentUser is set ─────────────────
  useEffect(() => {
    if (!currentUser) {
      socketRef.current?.disconnect();
      return;
    }

    let mounted = true;
    const handlers = {};

    (async () => {
      if (socketRef.current?.connected) return;

      const token = await getAuthToken();
      if (!mounted) return;

      socketRef.current = io(BASE_URL, {
        withCredentials: true,
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        auth: token ? { token: `Bearer ${token}` } : {},
      });

      handlers.onConnect = () => {
        log.info('Socket connected');
        if (activeConversationRef.current) {
          socketRef.current?.emit('joinConversation', activeConversationRef.current._id);
        }
      };

      handlers.handleNewMessage = (msg) => {
        if (messageQueueRef.current.includes(msg._id)) {
          messageQueueRef.current = messageQueueRef.current.filter(id => id !== msg._id);
          return;
        }
        const isOwnMessage = msg.senderId === currentUser.userId;
        const conv = activeConversationRef.current;
        if (conv && msg.conversationId === conv._id) {
          addMessage(conv._id, {
            id: msg._id || Date.now().toString(),
            text: msg.text,
            sender: isOwnMessage ? 'me' : 'other',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            senderName: msg.senderName,
            fileUrl: msg.fileUrl,
            messageType: msg.messageType,
            isOptimistic: false,
          });
          cacheMessages(conv._id, useChatStore.getState().messages[conv._id] || []);
        } else if (!isOwnMessage) {
          incrementUnread(msg.conversationId);
        }
      };

      handlers.handleTyping = ({ conversationId, userId }) => {
        const conv = activeConversationRef.current;
        if (conv && conversationId === conv._id && userId !== currentUser.userId) {
          setIsTyping(true);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 2000);
        }
      };

      socketRef.current.on('connect', handlers.onConnect);
      socketRef.current.on('newMessage', handlers.handleNewMessage);
      socketRef.current.on('typing', handlers.handleTyping);
    })();

    return () => {
      mounted = false;
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      socketRef.current?.off('connect', handlers.onConnect);
      socketRef.current?.off('newMessage', handlers.handleNewMessage);
      socketRef.current?.off('typing', handlers.handleTyping);
      socketRef.current?.disconnect();
    };
  }, [currentUser]);

  // ── Join room when active conversation changes ───────────────
  useEffect(() => {
    if (activeConversation?._id && socketRef.current?.connected) {
      socketRef.current.emit('joinConversation', activeConversation._id);
    }
  }, [activeConversation?._id]);

  // ── Scroll to bottom when messages arrive ───────────────────
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: !initialLoad });
        setInitialLoad(false);
      }, 100);
    }
  }, [messages.length]);

  // ── Keyboard scroll ─────────────────────────────────────────
  useEffect(() => {
    const listener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100)
    );
    return () => listener.remove();
  }, []);

  // ── API: connect user ────────────────────────────────────────
  const connectUser = async (username, displayName) => {
    if (!username?.trim()) return;
    setIsConnecting(true);
    try {
      const response = await fetch(API_ENDPOINTS.CHAT_CONNECT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, displayName: displayName || username }),
      });
      const data = await response.json();
      if (data.success) {
        setCurrentUser(data.user);
        setIsConnected(true);
        await Promise.all([
          loadAllUsers(),
          loadConversations(data.user.userId),
        ]);
      } else {
        setIsLoadingChats(false);
      }
    } catch {
      setIsLoadingChats(false);
    } finally {
      setIsConnecting(false);
    }
  };

  const loadAllUsers = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.CHAT_USERS);
      const data = await response.json();
      if (data.success) {
        setAllUsers(data.users);
        cacheAllUsers(data.users);
      }
    } catch {
      const cached = await loadCachedAllUsers();
      if (cached.length > 0) setAllUsers(cached);
    }
  };

  const loadConversations = async (userId) => {
    try {
      const response = await fetch(API_ENDPOINTS.CHAT_CONVERSATIONS(userId));
      const data = await response.json();
      if (data.success) {
        setConversations(data.conversations);
        await cacheConversations(data.conversations);
      }
    } catch {
      const cached = await loadCachedConversations();
      if (cached.length > 0) setConversations(cached);
    } finally {
      setIsLoadingChats(false);
    }
  };

  // ── Open a conversation ──────────────────────────────────────
  const startConversation = async (otherUser) => {
    if (!currentUser) return;
    setIsLoadingMessages(true);
    setInitialLoad(true);
    try {
      const response = await fetch(API_ENDPOINTS.CHAT_CREATE_CONVERSATION, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participants: [currentUser.userId, otherUser.userId] }),
      });
      const data = await response.json();
      if (data.success) {
        setActiveConversation(data.conversation);
        clearUnread(data.conversation._id);
        await loadMessages(data.conversation._id);
      }
    } catch (err) {
      log.error('Error opening conversation:', err);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const loadMessages = async (conversationId) => {
    if (!currentUser) return;
    try {
      // Show cache instantly
      const cached = await loadCachedMessages(conversationId);
      if (cached?.length > 0) {
        setMessages(conversationId, cached.map(m => ({ ...m, isOptimistic: false })));
      }
      // Fetch fresh
      const response = await fetch(API_ENDPOINTS.CHAT_MESSAGES(conversationId));
      const data = await response.json();
      if (data.success) {
        const formatted = data.messages.reverse().map((msg) => ({
          id: msg._id,
          text: msg.text,
          sender: msg.senderId === currentUser.userId ? 'me' : 'other',
          timestamp: new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          senderName: msg.senderName,
          fileUrl: msg.fileUrl,
          messageType: msg.messageType,
          fileName: msg.fileName,
          isOptimistic: false,
        }));
        setMessages(conversationId, formatted);
        cacheMessages(conversationId, formatted);
      }
    } catch (err) {
      log.error('Error loading messages:', err);
    }
  };

  // ── Send text message ────────────────────────────────────────
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeConversation || !currentUser) return;

    const messageText = newMessage.trim();
    const optimisticId = `opt_${Date.now()}`;
    setNewMessage('');

    addMessage(activeConversation._id, {
      id: optimisticId,
      text: messageText,
      sender: 'me',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      senderName: currentUser.userName,
      messageType: 'text',
      isOptimistic: true,
    });
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const response = await fetch(API_ENDPOINTS.CHAT_SEND_MESSAGE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: activeConversation._id,
          senderId: currentUser.userId,
          text: messageText,
        }),
      });
      const data = await response.json();
      if (data.success) {
        updateMessage(activeConversation._id, optimisticId, { id: data.message._id, isOptimistic: false });
        cacheMessages(activeConversation._id, useChatStore.getState().messages[activeConversation._id] || []);
        socketRef.current?.emit('sendMessage', {
          conversationId: activeConversation._id,
          senderId: currentUser.userId,
          text: data.message.text,
          fileUrl: data.message.fileUrl,
          messageType: data.message.messageType,
          senderName: data.message.senderName,
          _id: data.message._id,
        });
        messageQueueRef.current.push(data.message._id);
      } else {
        removeMessage(activeConversation._id, optimisticId);
        Alert.alert('Error', data.message || 'Failed to send message.');
      }
    } catch {
      removeMessage(activeConversation._id, optimisticId);
      Alert.alert('Error', 'Failed to send message. Check your connection.');
    }
  };

  // ── Send image ───────────────────────────────────────────────
  const handleImageUpload = async () => {
    if (!activeConversation || !currentUser) return;
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaType.Images,
        allowsEditing: true,
        quality: 0.7,
      });
      if (result.canceled || !result.assets[0]) return;

      const uri = result.assets[0].uri;
      const optimisticId = `opt_img_${Date.now()}`;

      addMessage(activeConversation._id, {
        id: optimisticId,
        text: 'Sending image...',
        sender: 'me',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        messageType: 'image',
        isUploading: true,
        localUri: uri,
        isOptimistic: true,
      });
      setIsUploading(true);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

      const filename = uri.split('/').pop() || `photo_${Date.now()}.jpg`;
      const ext = filename.toLowerCase().split('.').pop();
      const mimeMap = { png: 'image/png', gif: 'image/gif', webp: 'image/webp' };
      const mimeType = mimeMap[ext] || 'image/jpeg';

      const formData = new FormData();
      formData.append('file', {
        uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
        type: mimeType,
        name: filename,
      });
      formData.append('conversationId', activeConversation._id);
      formData.append('senderId', currentUser.userId);

      const uploadToken = await getAuthToken();
      const response = await fetch(API_ENDPOINTS.CHAT_UPLOAD, {
        method: 'POST',
        body: formData,
        headers: uploadToken ? { Authorization: `Bearer ${uploadToken}` } : {},
      });
      let data;
      try { data = JSON.parse(await response.text()); } catch { throw new Error('Invalid server response'); }

      if (data.success) {
        updateMessage(activeConversation._id, optimisticId, {
          id: data.message._id,
          fileUrl: data.message.fileUrl,
          isUploading: false,
          isOptimistic: false,
        });
        cacheMessages(activeConversation._id, useChatStore.getState().messages[activeConversation._id] || []);
        socketRef.current?.emit('sendMessage', {
          conversationId: activeConversation._id,
          senderId: currentUser.userId,
          text: data.message.text,
          fileUrl: data.message.fileUrl,
          messageType: data.message.messageType,
          senderName: data.message.senderName,
          _id: data.message._id,
        });
        messageQueueRef.current.push(data.message._id);
      } else {
        removeMessage(activeConversation._id, optimisticId);
        throw new Error(data.message || 'Upload failed');
      }
    } catch (err) {
      log.error('Image upload error:', err?.message || err?.toString() || JSON.stringify(err) || 'unknown');
      Alert.alert('Error', 'Failed to send image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // ── Render helpers ───────────────────────────────────────────
  const renderMessage = ({ item }) => <MessageItem item={item} />;

  const renderChatItem = ({ item }) => {
    const conversation = conversations.find((c) =>
      c.participants.some((p) => p.userId === item.userId)
    );

    const unreadCount = conversation ? Math.max(0, unreadCounts[conversation._id] || 0) : 0;
    const hasUnread = unreadCount > 0;
    const canTap = !!currentUser && !isConnecting;
    const initials = item.userName?.charAt(0)?.toUpperCase() || 'U';
    const bgColor = avatarColor(item.userName || '');
    const lastTime = conversation?.updatedAt
      ? new Date(conversation.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '';

    return (
      <TouchableOpacity
        style={[styles.chatItem, !canTap && styles.chatItemDisabled]}
        onPress={() => canTap && startConversation(item)}
        activeOpacity={canTap ? 0.7 : 1}
      >
        {/* Avatar */}
        <View style={[styles.chatAvatar, { backgroundColor: bgColor }]}>
          <Text style={styles.chatAvatarText}>{initials}</Text>
        </View>

        {/* Info */}
        <View style={styles.chatInfo}>
          <View style={styles.chatInfoTop}>
            <Text style={[styles.chatName, hasUnread && styles.chatNameUnread]} numberOfLines={1}>
              {item.userName}
            </Text>
            {lastTime ? <Text style={styles.chatTime}>{lastTime}</Text> : null}
          </View>
          <View style={styles.chatInfoBottom}>
            <Text style={[styles.chatPreview, hasUnread && styles.chatPreviewUnread]} numberOfLines={1}>
              {conversation ? 'Tap to continue chatting' : 'Start a conversation'}
            </Text>
            {hasUnread ? (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // ── Screens ──────────────────────────────────────────────────
  if (!isConnected && isConnecting) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor="#008235" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.text }]}>Connecting...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#008235" />
      <KeyboardAvoidingView
        style={styles.mainContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {!activeConversation ? (
          // ── Chat list ──────────────────────────────────────
          <>
            {/* Header */}
            <View style={styles.appHeader}>
              <View style={styles.headerLeft}>
                <Text style={styles.appTitle}>Messages</Text>
                <Text style={styles.appSubtitle}>
                  {allUsers.filter(u => u.userId !== currentUser?.userId).length} conversations
                </Text>
              </View>
              <View style={[styles.userAvatar, { backgroundColor: theme.primaryDark }]}>
                <Text style={styles.userAvatarText}>
                  {currentUser?.userName?.charAt(0)?.toUpperCase() || 'U'}
                </Text>
              </View>
            </View>

            {/* Search bar */}
            <View style={styles.searchBarWrap}>
              <Ionicons name="search-outline" size={18} color="#9CA3AF" />
              <TextInput
                style={styles.searchBarInput}
                placeholder="Search conversations..."
                placeholderTextColor="#9CA3AF"
                value={listSearch}
                onChangeText={setListSearch}
                returnKeyType="search"
              />
              {listSearch.length > 0 && (
                <TouchableOpacity onPress={() => setListSearch('')}>
                  <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>

            <FlatList
              data={allUsers.filter((u) =>
                u.userId !== currentUser?.userId &&
                (listSearch.trim() === '' || u.userName?.toLowerCase().includes(listSearch.toLowerCase()))
              )}
              renderItem={renderChatItem}
              keyExtractor={(item) => item.userId}
              contentContainerStyle={[styles.chatListFull, { paddingBottom: Platform.OS === 'ios' ? 100 : 80 }]}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                isLoadingChats ? (
                  <View style={styles.loadingChatsContainer}>
                    <ActivityIndicator size="large" color={theme.primary} />
                    <Text style={styles.loadingChatsText}>Loading chats...</Text>
                  </View>
                ) : (
                  <View style={styles.emptyListContainer}>
                    <Ionicons name="chatbubbles-outline" size={72} color="#D1D5DB" />
                    <Text style={styles.emptyListTitle}>
                      {listSearch ? 'No results found' : 'No Chats Yet'}
                    </Text>
                    <Text style={styles.emptyListText}>
                      {listSearch ? `No conversations matching "${listSearch}"` : 'Start a conversation to see your chats here'}
                    </Text>
                  </View>
                )
              }
            />
          </>
        ) : (
          // ── Active conversation ────────────────────────────
          <View style={styles.chatViewContainer}>
            <View style={styles.messageHeader}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => { setActiveConversation(null); setInitialLoad(true); }}
              >
                <Ionicons name="arrow-back" size={24} color={theme.text} />
              </TouchableOpacity>
              <View style={styles.messageHeaderInfo}>
                <View style={[styles.headerChatAvatar, { backgroundColor: theme.primaryDark }]}>
                  <Text style={styles.headerChatAvatarText}>
                    {activeConversation.participants
                      .find((p) => p.userId !== currentUser?.userId)
                      ?.userName?.charAt(0)?.toUpperCase() || 'U'}
                  </Text>
                </View>
                <View style={styles.headerChatInfo}>
                  <Text style={styles.messageHeaderName}>
                    {activeConversation.participants
                      .find((p) => p.userId !== currentUser?.userId)
                      ?.userName || 'Unknown'}
                  </Text>
                </View>
              </View>
              <View style={styles.headerActions}>
                <TouchableOpacity style={styles.headerIconButton}>
                  <Ionicons name="videocam-outline" size={24} color={theme.text} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.headerIconButton}>
                  <Ionicons name="call-outline" size={24} color={theme.text} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.messagesContainer}>
              {isLoadingMessages ? (
                <View style={styles.loadingMessagesContainer}>
                  <ActivityIndicator size="large" color={theme.primary} />
                  <Text style={styles.loadingMessagesText}>Loading messages...</Text>
                </View>
              ) : (
                <>
                  <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderMessage}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.messagesList}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
                    maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
                    onScrollBeginDrag={() => Keyboard.dismiss()}
                  />
                  {isTyping && (
                    <View style={styles.typingContainer}>
                      <View style={styles.typingBubble}>
                        <View style={styles.typingDot} />
                        <View style={[styles.typingDot, { marginLeft: 4 }]} />
                        <View style={[styles.typingDot, { marginLeft: 4 }]} />
                      </View>
                    </View>
                  )}
                </>
              )}
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.inputRow}>
                <TouchableOpacity
                  style={[styles.attachButton, isUploading && styles.attachButtonDisabled]}
                  onPress={handleImageUpload}
                  disabled={isUploading}
                >
                  {isUploading
                    ? <ActivityIndicator size="small" color={theme.primary} />
                    : <Ionicons name="add-circle" size={28} color={theme.primary} />}
                </TouchableOpacity>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.messageInput}
                    placeholder="Type a message"
                    placeholderTextColor={theme.tertiaryText}
                    value={newMessage}
                    onChangeText={setNewMessage}
                    multiline
                    maxLength={1000}
                    onFocus={() => setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 300)}
                  />
                </View>
                <TouchableOpacity
                  style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]}
                  onPress={handleSendMessage}
                  disabled={!newMessage.trim()}
                >
                  <Ionicons name={newMessage.trim() ? 'send' : 'mic'} size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 20, fontSize: 16, fontWeight: '500' },
  mainContainer: { flex: 1 },
  appHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12,
    backgroundColor: '#008235',
  },
  headerLeft: { flex: 1 },
  appTitle: { fontSize: 24, fontWeight: '700', color: '#FFFFFF', letterSpacing: -0.5 },
  appSubtitle: { fontSize: 13, color: '#DCFCE7', marginTop: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  headerIconButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  userAvatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFFFFF' },
  userAvatarText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  searchBarWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FFFFFF', borderRadius: 12,
    marginHorizontal: 12, marginTop: 12, marginBottom: 4,
    paddingHorizontal: 14, paddingVertical: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  searchBarInput: { flex: 1, fontSize: 14, color: '#111827', paddingVertical: 0 },
  contentContainer: { flex: 1 },
  chatListFull: { flexGrow: 1, backgroundColor: '#F9FAFB' },
  chatItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 12, marginTop: 8,
    borderRadius: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  chatItemDisabled: { opacity: 0.5 },
  chatAvatar: {
    width: 52, height: 52, borderRadius: 26,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  chatAvatarText: { color: '#FFFFFF', fontSize: 20, fontWeight: '700' },
  chatInfo: { flex: 1, justifyContent: 'center' },
  chatInfoTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  chatInfoBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chatName: { fontSize: 15, fontWeight: '600', color: '#111827', flex: 1, marginRight: 8 },
  chatNameUnread: { fontWeight: '700', color: '#008235' },
  chatTime: { fontSize: 12, color: '#9CA3AF' },
  chatPreview: { fontSize: 13, color: '#9CA3AF', flex: 1, marginRight: 8 },
  chatPreviewUnread: { color: '#374151', fontWeight: '500' },
  unreadBadge: {
    backgroundColor: '#008235', borderRadius: 10,
    minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6,
  },
  unreadBadgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  chatViewContainer: { flex: 1, backgroundColor: theme.background },
  messageHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: theme.headerBg, borderBottomWidth: 1, borderBottomColor: theme.border,
  },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', marginRight: 4 },
  messageHeaderInfo: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  headerChatAvatar: {
    width: 42, height: 42, borderRadius: 21,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  headerChatAvatarText: { color: '#FFFFFF', fontSize: 18, fontWeight: '600' },
  headerChatInfo: { flex: 1, justifyContent: 'center' },
  messageHeaderName: { fontSize: 17, fontWeight: '600', color: theme.text },
  headerActions: { flexDirection: 'row', gap: 8 },
  messagesContainer: { flex: 1, backgroundColor: theme.secondaryBg },
  loadingMessagesContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingMessagesText: { fontSize: 16, fontWeight: '500', color: theme.secondaryText, marginTop: 16 },
  messagesList: { padding: 16, paddingBottom: 20, flexGrow: 1 },
  messageContainer: { flexDirection: 'row', marginBottom: 8, alignItems: 'flex-end' },
  myMessage: { justifyContent: 'flex-end' },
  otherMessage: { justifyContent: 'flex-start' },
  avatarContainer: { marginRight: 8, marginBottom: 2 },
  messageAvatar: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  messageBubble: { maxWidth: '75%', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  myMessageBubble: { backgroundColor: theme.messageBubbleMine, borderTopRightRadius: 2 },
  otherMessageBubble: {
    backgroundColor: theme.messageBubbleOther, borderTopLeftRadius: 2,
    shadowColor: theme.shadow, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1, shadowRadius: 2, elevation: 1,
  },
  messageText: { fontSize: 15, lineHeight: 20, fontWeight: '400' },
  messageImage: { width: 240, height: 240, borderRadius: 8, marginBottom: 4 },
  imageUploadingContainer: { position: 'relative', width: 240, height: 240, marginBottom: 4 },
  imageUploading: { opacity: 0.5 },
  imageUploadingOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 8,
  },
  imageUploadingText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600', marginTop: 8 },
  timestamp: { fontSize: 11, marginTop: 4, fontWeight: '400' },
  typingContainer: { paddingHorizontal: 16, paddingBottom: 8 },
  typingBubble: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: theme.messageBubbleOther,
    paddingHorizontal: 16, paddingVertical: 12, borderRadius: 8, alignSelf: 'flex-start',
    shadowColor: theme.shadow, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1, shadowRadius: 2, elevation: 1,
  },
  typingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.tertiaryText },
  inputContainer: {
    backgroundColor: theme.inputBg, borderTopWidth: 1, borderTopColor: theme.border,
    paddingHorizontal: 12, paddingVertical: 8,
    paddingBottom: Platform.OS === 'ios' ? 85 : 65,
  },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end' },
  attachButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', marginRight: 4 },
  attachButtonDisabled: { opacity: 0.5 },
  inputWrapper: {
    flex: 1, backgroundColor: theme.secondaryBg, borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 10, marginRight: 8,
    maxHeight: 100, borderWidth: 1, borderColor: theme.border,
  },
  messageInput: { fontSize: 15, color: theme.text, lineHeight: 20 },
  sendButton: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: theme.primary, justifyContent: 'center', alignItems: 'center',
  },
  sendButtonDisabled: { opacity: 0.6 },
  loadingChatsContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 100 },
  loadingChatsText: { fontSize: 16, fontWeight: '500', color: theme.secondaryText, marginTop: 16 },
  emptyListContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    paddingVertical: 100, paddingHorizontal: 40,
  },
  emptyListTitle: { fontSize: 22, fontWeight: '700', color: theme.text, marginTop: 20, marginBottom: 8 },
  emptyListText: { fontSize: 15, color: theme.secondaryText, textAlign: 'center', lineHeight: 22 },
});
