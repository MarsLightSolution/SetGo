import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  SafeAreaView,
  StatusBar,
  Animated,
  Keyboard,
  Modal,
} from 'react-native';
import io from 'socket.io-client';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../Store/authStore';
import { API_ENDPOINTS, SOCKET_URL, IMAGE_BASE_URL } from '../config/api';
import logger from '../utils/logger';

const log = logger.create('Chat');
const { width } = Dimensions.get('window');

const theme = {
  background: '#FFFFFF',
  secondaryBg: '#F0F2F5',
  primary: '#008235',
  primaryDark: '#006128',
  primaryLight: '#DCF8C6',
  text: '#111B21',
  secondaryText: '#667781',
  tertiaryText: '#8696A0',
  border: '#E9EDEF',
  messageBubbleMine: '#D9FDD3',
  messageBubbleOther: '#FFFFFF',
  inputBg: '#FFFFFF',
  headerBg: '#F0F2F5',
  shadow: '#00000015',
};

// ─── Message Item ─────────────────────────────────────────────────────────────
const MessageItem = React.memo(({ item, onImagePress }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const isMe = item.sender === 'me';

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, []);

  const imageUri = item.localUri
    ? item.localUri
    : item.fileUrl
    ? `${IMAGE_BASE_URL}${item.fileUrl}`
    : null;

  const renderStatus = () => {
    if (!isMe) return null;
    if (item.failed)
      return <Ionicons name="alert-circle" size={12} color="#EF4444" />;
    if (item.sending)
      return <Ionicons name="checkmark" size={12} color={theme.tertiaryText} />;
    return <Ionicons name="checkmark-done" size={12} color={theme.primary} />;
  };

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <View style={[styles.messageRow, isMe ? styles.messageRowMe : styles.messageRowOther]}>
        {!isMe && (
          <View style={styles.msgAvatar}>
            <Text style={styles.msgAvatarText}>
              {(item.senderName || 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
        )}

        <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther, item.failed && { opacity: 0.6 }]}>
          {item.messageType === 'image' ? (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => imageUri && !item.sending && onImagePress(imageUri)}
              disabled={item.sending}
            >
              <Image
                source={{ uri: imageUri }}
                style={[styles.messageImage, item.sending && { opacity: 0.55 }]}
                resizeMode="cover"
              />
              {item.sending && (
                <View style={styles.imageOverlay}>
                  <ActivityIndicator color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>
          ) : (
            <Text style={[styles.messageText, { color: isMe ? '#1a1a1a' : theme.text }]}>
              {item.text}
            </Text>
          )}
        </View>
      </View>

      {/* Timestamp + status row */}
      <View style={[styles.metaRow, isMe ? { alignSelf: 'flex-end', marginRight: 12 } : { alignSelf: 'flex-start', marginLeft: 52 }]}>
        <Text style={styles.timestamp}>{item.timestamp}</Text>
        {renderStatus()}
      </View>
    </Animated.View>
  );
});

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ChatScreen() {
  const params = useLocalSearchParams();
  const { t } = useTranslation();
  const authUser = useAuthStore(state => state.user);

  const [currentUser, setCurrentUser] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoadingChats, setIsLoadingChats] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [lightboxUri, setLightboxUri] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState({});

  const flatListRef = useRef(null);
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const activeConvRef = useRef(null);
  const currentUserRef = useRef(null);
  const initialLoadRef = useRef(true);

  // Keep refs in sync to avoid stale closures in socket handlers
  useEffect(() => { activeConvRef.current = activeConversation; }, [activeConversation]);
  useEffect(() => { currentUserRef.current = currentUser; }, [currentUser]);

  // ─── Request permissions on mount ────────────────────────────────────────
  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        await ImagePicker.requestMediaLibraryPermissionsAsync();
        await ImagePicker.requestCameraPermissionsAsync();
      }
    })();
  }, []);

  // ─── Auto-connect using authStore user (run once when user becomes available)
  useEffect(() => {
    // Backend may return userName, username, or name — check all
    const username = authUser?.userName || authUser?.username || authUser?.name;
    if (username && !isConnected && !isConnecting) {
      connectUser(username);
    }
  }, [authUser?.userName, authUser?.username, authUser?.name]);

  // ─── Handle route param: auto-open specific conversation ─────────────────
  useEffect(() => {
    if (!isConnected || !currentUser || !params.conversationId) return;
    const target = conversations.find(c => c._id === params.conversationId);
    if (target) {
      openConversation(target);
    }
  }, [isConnected, currentUser, conversations, params.conversationId]);

  // ─── Socket setup — init once, never re-init on conv change ──────────────
  useEffect(() => {
    if (!isConnected || !currentUser) return;

    const socket = io(SOCKET_URL, {
      path: '/socket.io/',
      transports: ['websocket', 'polling'],
      withCredentials: true,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      log.info('Socket connected');
      // Rejoin all conversations on reconnect
      conversations.forEach(c => socket.emit('joinConversation', c._id));
      if (activeConvRef.current) {
        socket.emit('joinConversation', activeConvRef.current._id);
      }
    });

    socket.on('newMessage', (msg) => {
      const conv = activeConvRef.current;
      const me = currentUserRef.current;
      if (!me) return;

      if (msg.conversationId === conv?._id) {
        // Skip own messages — already added optimistically
        if (msg.senderId === me.userId) return;
        setMessages(prev => {
          if (prev.some(m => m.id === msg._id)) return prev;
          return [...prev, {
            id: msg._id || String(Date.now()),
            text: msg.text,
            sender: 'other',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            senderName: msg.senderName,
            fileUrl: msg.fileUrl,
            messageType: msg.messageType,
          }];
        });
      } else if (msg.senderId !== me.userId) {
        setUnreadCounts(prev => ({
          ...prev,
          [msg.conversationId]: (prev[msg.conversationId] || 0) + 1,
        }));
      }
    });

    socket.on('typing', ({ conversationId, userId }) => {
      const me = currentUserRef.current;
      if (conversationId === activeConvRef.current?._id && userId !== me?.userId) {
        setIsTyping(true);
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 2500);
      }
    });

    return () => {
      socket.disconnect();
      clearTimeout(typingTimeoutRef.current);
    };
  }, [isConnected, currentUser]); // ← no activeConversation dep — avoids reconnect bug

  // ─── Join room when active conversation changes ───────────────────────────
  useEffect(() => {
    if (activeConversation && socketRef.current?.connected) {
      socketRef.current.emit('joinConversation', activeConversation._id);
    }
  }, [activeConversation]);

  // ─── Keyboard scroll ─────────────────────────────────────────────────────
  useEffect(() => {
    const sub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100)
    );
    return () => sub.remove();
  }, []);

  // ─── API helpers ──────────────────────────────────────────────────────────
  const connectUser = async (username) => {
    if (!username?.trim() || isConnecting) return;
    setIsConnecting(true);
    setIsLoadingChats(true);
    try {
      const res = await fetch(API_ENDPOINTS.CHAT_CONNECT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, displayName: username }),
      });
      const data = await res.json();
      if (data.success) {
        setCurrentUser(data.user);
        setIsConnected(true);
        await Promise.all([loadAllUsers(), loadConversations(data.user.userId)]);
      } else {
        setIsLoadingChats(false);
      }
    } catch (err) {
      log.error('Chat connect error:', err);
      setIsLoadingChats(false);
    } finally {
      setIsConnecting(false);
    }
  };

  const loadAllUsers = async () => {
    try {
      const res = await fetch(API_ENDPOINTS.CHAT_USERS);
      const data = await res.json();
      if (data.success) setAllUsers(data.users);
    } catch (err) {
      log.error('Load users error:', err);
    }
  };

  const loadConversations = async (userId) => {
    try {
      const res = await fetch(API_ENDPOINTS.CHAT_CONVERSATIONS(userId));
      const data = await res.json();
      if (data.success) setConversations(data.conversations);
    } catch (err) {
      log.error('Load conversations error:', err);
    } finally {
      setIsLoadingChats(false);
    }
  };

  const loadMessages = async (conversationId) => {
    if (!currentUser) return;
    initialLoadRef.current = true;
    try {
      const res = await fetch(API_ENDPOINTS.CHAT_MESSAGES(conversationId));
      const data = await res.json();
      if (data.success) {
        setMessages(
          data.messages.reverse().map(msg => ({
            id: msg._id,
            text: msg.text,
            sender: msg.senderId === currentUser.userId ? 'me' : 'other',
            timestamp: new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            senderName: msg.senderName,
            fileUrl: msg.fileUrl,
            messageType: msg.messageType,
          }))
        );
      }
    } catch (err) {
      log.error('Load messages error:', err);
    }
  };

  const openConversation = useCallback(async (conv) => {
    setActiveConversation(conv);
    setMessages([]);
    setIsLoadingMessages(true);
    setUnreadCounts(prev => ({ ...prev, [conv._id]: 0 }));
    await loadMessages(conv._id);
    setIsLoadingMessages(false);
  }, [currentUser]);

  const startConversation = async (otherUser) => {
    if (!currentUser) return;
    try {
      const res = await fetch(API_ENDPOINTS.CHAT_CREATE_CONVERSATION, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participants: [currentUser.userId, otherUser.userId] }),
      });
      const data = await res.json();
      if (data.success) await openConversation(data.conversation);
    } catch (err) {
      log.error('Start conversation error:', err);
    }
  };

  // ─── Send text (optimistic) ───────────────────────────────────────────────
  const handleSendMessage = async () => {
    const text = newMessage.trim();
    if (!text || !activeConversation || !currentUser) return;

    const tempId = `temp-${Date.now()}`;
    setNewMessage('');

    setMessages(prev => [...prev, {
      id: tempId,
      text,
      sender: 'me',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      senderName: currentUser.userName,
      messageType: 'text',
      sending: true,
    }]);

    try {
      const res = await fetch(API_ENDPOINTS.CHAT_SEND_MESSAGE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: activeConversation._id,
          senderId: currentUser.userId,
          text,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setMessages(prev => prev.map(m => m.id === tempId
          ? { ...m, id: data.message._id, sending: false }
          : m
        ));
        socketRef.current?.emit('sendMessage', {
          conversationId: activeConversation._id,
          senderId: currentUser.userId,
          recipientId: getOtherParticipant(activeConversation)?.userId,
          text: data.message.text,
          messageType: data.message.messageType,
          senderName: data.message.senderName,
          _id: data.message._id,
        });
      } else {
        setMessages(prev => prev.map(m => m.id === tempId ? { ...m, failed: true, sending: false } : m));
      }
    } catch {
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, failed: true, sending: false } : m));
    }
  };

  // ─── Send image (optimistic with local preview) ───────────────────────────
  const handleImageUpload = async () => {
    if (!activeConversation || !currentUser) return;

    const showPicker = async (useCamera) => {
      const picker = useCamera
        ? ImagePicker.launchCameraAsync
        : ImagePicker.launchImageLibraryAsync;

      const result = await picker({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
      });
      if (result.canceled || !result.assets[0]) return;

      const asset = result.assets[0];
      const tempId = `temp-img-${Date.now()}`;

      setMessages(prev => [...prev, {
        id: tempId,
        sender: 'me',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        senderName: currentUser.userName,
        messageType: 'image',
        localUri: asset.uri,
        sending: true,
      }]);
      setIsUploading(true);

      try {
        const filename = asset.uri.split('/').pop() || `photo_${Date.now()}.jpg`;
        const ext = filename.toLowerCase().split('.').pop();
        const mimeMap = { png: 'image/png', gif: 'image/gif', webp: 'image/webp' };
        const mimeType = mimeMap[ext] || 'image/jpeg';

        const formData = new FormData();
        formData.append('file', {
          uri: Platform.OS === 'ios' ? asset.uri.replace('file://', '') : asset.uri,
          type: mimeType,
          name: filename,
        });
        formData.append('conversationId', activeConversation._id);
        formData.append('senderId', currentUser.userId);

        const res = await fetch(API_ENDPOINTS.CHAT_UPLOAD, {
          method: 'POST',
          body: formData,
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        const data = await res.json();

        if (data.success) {
          setMessages(prev => prev.map(m => m.id === tempId
            ? { ...m, id: data.message._id, fileUrl: data.message.fileUrl, sending: false }
            : m
          ));
          socketRef.current?.emit('sendMessage', {
            conversationId: activeConversation._id,
            senderId: currentUser.userId,
            recipientId: getOtherParticipant(activeConversation)?.userId,
            fileUrl: data.message.fileUrl,
            messageType: data.message.messageType,
            senderName: data.message.senderName,
            _id: data.message._id,
          });
        } else {
          setMessages(prev => prev.map(m => m.id === tempId ? { ...m, failed: true, sending: false } : m));
        }
      } catch (err) {
        log.error('Image upload error:', err);
        setMessages(prev => prev.map(m => m.id === tempId ? { ...m, failed: true, sending: false } : m));
      } finally {
        setIsUploading(false);
      }
    };

    Alert.alert('Send Image', '', [
      { text: 'Take Photo', onPress: () => showPicker(true) },
      { text: 'Choose from Library', onPress: () => showPicker(false) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  // ─── Typing emit ─────────────────────────────────────────────────────────
  const handleInputChange = (text) => {
    setNewMessage(text);
    if (!socketRef.current?.connected || !activeConversation || !currentUser) return;
    socketRef.current.emit('typing', {
      conversationId: activeConversation._id,
      userId: currentUser.userId,
    });
  };

  // ─── Helpers ─────────────────────────────────────────────────────────────
  const getOtherParticipant = (conv) =>
    conv?.participants?.find(p => p.userId !== currentUser?.userId);

  const chatUsers = allUsers
    .filter(u => u.userId !== currentUser?.userId)
    .filter(u => conversations.some(c => c.participants?.some(p => p.userId === u.userId)));

  // ─── Scroll to bottom on new messages ────────────────────────────────────
  const handleContentSizeChange = useCallback(() => {
    flatListRef.current?.scrollToEnd({ animated: !initialLoadRef.current });
    initialLoadRef.current = false;
  }, []);

  // ─── Loading ─────────────────────────────────────────────────────────────
  if (!isConnected && isConnecting) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={styles.connectingText}>{t('chat.connecting')}</Text>
      </SafeAreaView>
    );
  }

  if (!isConnected && !isConnecting && !authUser) {
    return (
      <SafeAreaView style={styles.center}>
        <Ionicons name="chatbubbles-outline" size={64} color={theme.border} />
        <Text style={styles.emptyTitle}>{t('chat.loginRequired')}</Text>
        <Text style={styles.emptySubtitle}>{t('chat.loginToUse')}</Text>
      </SafeAreaView>
    );
  }

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.headerBg} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {!activeConversation ? (
          // ── Conversation List ──────────────────────────────────────────────
          <>
            <View style={styles.listHeader}>
              <Text style={styles.listTitle}>{t('chat.title')}</Text>
              {currentUser && (
                <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
                  <Text style={styles.avatarText}>
                    {currentUser.userName?.charAt(0)?.toUpperCase() || 'U'}
                  </Text>
                </View>
              )}
            </View>

            <FlatList
              data={chatUsers}
              keyExtractor={item => item.userId}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const conv = conversations.find(c =>
                  c.participants?.some(p => p.userId === item.userId)
                );
                const unread = conv ? (unreadCounts[conv._id] || 0) : 0;

                return (
                  <TouchableOpacity
                    style={[styles.convItem, unread > 0 && styles.convItemUnread]}
                    onPress={() => startConversation(item)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.convAvatar, { backgroundColor: theme.primaryDark }]}>
                      <Text style={styles.convAvatarText}>
                        {item.userName?.charAt(0)?.toUpperCase() || 'U'}
                      </Text>
                    </View>

                    <View style={styles.convInfo}>
                      <Text style={[styles.convName, unread > 0 && { fontWeight: '700' }]} numberOfLines={1}>
                        {item.userName}
                      </Text>
                      {conv?.lastMessage ? (
                        <Text style={styles.convLastMsg} numberOfLines={1}>
                          {conv.lastMessage}
                        </Text>
                      ) : null}
                    </View>

                    <View style={styles.convMeta}>
                      {conv?.lastMessageTime ? (
                        <Text style={styles.convTime}>
                          {new Date(conv.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      ) : null}
                      {unread > 0 ? (
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>{unread > 99 ? '99+' : unread}</Text>
                        </View>
                      ) : (
                        <Ionicons name="chevron-forward" size={18} color={theme.tertiaryText} />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                isLoadingChats ? (
                  <View style={styles.center}>
                    <ActivityIndicator size="large" color={theme.primary} />
                  </View>
                ) : (
                  <View style={styles.center}>
                    <Ionicons name="chatbubbles-outline" size={72} color={theme.border} />
                    <Text style={styles.emptyTitle}>{t('chat.noConversations')}</Text>
                    <Text style={styles.emptySubtitle}>{t('chat.startFromListing')}</Text>
                  </View>
                )
              }
            />
          </>
        ) : (
          // ── Chat View ──────────────────────────────────────────────────────
          <View style={styles.flex}>
            {/* Header */}
            <View style={styles.chatHeader}>
              <TouchableOpacity
                style={styles.backBtn}
                onPress={() => { setActiveConversation(null); setMessages([]); }}
              >
                <Ionicons name="arrow-back" size={24} color={theme.text} />
              </TouchableOpacity>

              <View style={[styles.chatHeaderAvatar, { backgroundColor: theme.primaryDark }]}>
                <Text style={styles.chatHeaderAvatarText}>
                  {getOtherParticipant(activeConversation)?.userName?.charAt(0)?.toUpperCase() || 'U'}
                </Text>
              </View>

              <View style={styles.chatHeaderInfo}>
                <Text style={styles.chatHeaderName} numberOfLines={1}>
                  {getOtherParticipant(activeConversation)?.userName || 'Unknown'}
                </Text>
                {isTyping && (
                  <Text style={styles.typingLabel}>typing…</Text>
                )}
              </View>
            </View>

            {/* Messages */}
            <View style={styles.messagesArea}>
              {isLoadingMessages ? (
                <View style={styles.center}>
                  <ActivityIndicator size="large" color={theme.primary} />
                  <Text style={styles.loadingText}>Loading messages...</Text>
                </View>
              ) : (
                <>
                  <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.messagesList}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
                    onContentSizeChange={handleContentSizeChange}
                    renderItem={({ item }) => (
                      <MessageItem
                        item={item}
                        onImagePress={setLightboxUri}
                      />
                    )}
                    ListEmptyComponent={
                      <View style={[styles.center, { flex: 0, paddingVertical: 60 }]}>
                        <Text style={{ fontSize: 32 }}>👋</Text>
                        <Text style={styles.emptyTitle}>Say hello!</Text>
                      </View>
                    }
                  />

                  {isTyping && (
                    <View style={styles.typingBubble}>
                      <TypingDots />
                    </View>
                  )}
                </>
              )}
            </View>

            {/* Input */}
            <View style={styles.inputBar}>
              <TouchableOpacity
                style={[styles.iconBtn, isUploading && { opacity: 0.4 }]}
                onPress={handleImageUpload}
                disabled={isUploading}
              >
                {isUploading
                  ? <ActivityIndicator size="small" color={theme.primary} />
                  : <Ionicons name="add-circle" size={28} color={theme.primary} />
                }
              </TouchableOpacity>

              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder={t('chat.typeMessage')}
                  placeholderTextColor={theme.tertiaryText}
                  value={newMessage}
                  onChangeText={handleInputChange}
                  multiline
                  maxLength={1000}
                  onFocus={() => setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 300)}
                />
              </View>

              <TouchableOpacity
                style={[styles.sendBtn, !newMessage.trim() && { opacity: 0.5 }]}
                onPress={handleSendMessage}
                disabled={!newMessage.trim()}
              >
                <Ionicons name="send" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>

      {/* ── Image Lightbox ──────────────────────────────────────────────────── */}
      <Modal
        visible={!!lightboxUri}
        transparent
        animationType="fade"
        onRequestClose={() => setLightboxUri(null)}
      >
        <TouchableOpacity
          style={styles.lightboxBackdrop}
          activeOpacity={1}
          onPress={() => setLightboxUri(null)}
        >
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            <Image
              source={{ uri: lightboxUri }}
              style={styles.lightboxImage}
              resizeMode="contain"
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.lightboxClose} onPress={() => setLightboxUri(null)}>
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Typing animation ─────────────────────────────────────────────────────────
function TypingDots() {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = (dot, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: -5, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
        ])
      );
    const a1 = anim(dot1, 0);
    const a2 = anim(dot2, 150);
    const a3 = anim(dot3, 300);
    a1.start(); a2.start(); a3.start();
    return () => { a1.stop(); a2.stop(); a3.stop(); };
  }, []);

  return (
    <View style={{ flexDirection: 'row', gap: 4 }}>
      {[dot1, dot2, dot3].map((dot, i) => (
        <Animated.View
          key={i}
          style={[styles.typingDot, { transform: [{ translateY: dot }] }]}
        />
      ))}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: theme.background },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  connectingText: { marginTop: 12, color: theme.secondaryText, fontSize: 15 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: theme.text, marginTop: 16, marginBottom: 6 },
  emptySubtitle: { fontSize: 14, color: theme.secondaryText, textAlign: 'center', paddingHorizontal: 32 },

  // List header
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: theme.headerBg,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  listTitle: { fontSize: 26, fontWeight: '700', color: theme.text, letterSpacing: -0.5 },
  avatar: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  listContent: { flexGrow: 1 },

  // Conversation item
  convItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: theme.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  convItemUnread: { backgroundColor: '#F0FFF4' },
  convAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  convAvatarText: { color: '#fff', fontSize: 20, fontWeight: '600' },
  convInfo: { flex: 1, marginRight: 8 },
  convName: { fontSize: 16, fontWeight: '600', color: theme.text, marginBottom: 2 },
  convLastMsg: { fontSize: 13, color: theme.secondaryText },
  convMeta: { alignItems: 'flex-end', gap: 4 },
  convTime: { fontSize: 11, color: theme.tertiaryText },
  badge: {
    backgroundColor: theme.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },

  // Chat header
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: theme.headerBg,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    gap: 10,
  },
  backBtn: { width: 38, height: 38, justifyContent: 'center', alignItems: 'center' },
  chatHeaderAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatHeaderAvatarText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  chatHeaderInfo: { flex: 1 },
  chatHeaderName: { fontSize: 16, fontWeight: '700', color: theme.text },
  typingLabel: { fontSize: 12, color: theme.primary },

  // Messages
  messagesArea: { flex: 1, backgroundColor: theme.secondaryBg },
  messagesList: { padding: 16, paddingBottom: 24, flexGrow: 1 },
  loadingText: { marginTop: 12, color: theme.secondaryText, fontSize: 14 },

  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 2,
  },
  messageRowMe: { justifyContent: 'flex-end' },
  messageRowOther: { justifyContent: 'flex-start' },
  msgAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: theme.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 2,
  },
  msgAvatarText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  bubble: {
    maxWidth: '75%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 0,
  },
  bubbleMe: {
    backgroundColor: theme.messageBubbleMine,
    borderTopRightRadius: 2,
  },
  bubbleOther: {
    backgroundColor: theme.messageBubbleOther,
    borderTopLeftRadius: 2,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  messageText: { fontSize: 15, lineHeight: 20 },
  messageImage: { width: 220, height: 220, borderRadius: 8 },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 8,
    marginTop: 2,
  },
  timestamp: { fontSize: 11, color: theme.tertiaryText },

  // Typing
  typingBubble: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    alignSelf: 'flex-start',
    backgroundColor: theme.messageBubbleOther,
    marginLeft: 16,
    marginBottom: 4,
    borderRadius: 8,
    padding: 10,
    elevation: 1,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.tertiaryText,
  },

  // Input bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: theme.inputBg,
    borderTopWidth: 1,
    borderTopColor: theme.border,
    gap: 6,
  },
  iconBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  inputWrapper: {
    flex: 1,
    backgroundColor: theme.secondaryBg,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: theme.border,
  },
  input: { fontSize: 15, color: theme.text, lineHeight: 20 },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Lightbox
  lightboxBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lightboxImage: {
    width: width - 32,
    height: width - 32,
    borderRadius: 12,
  },
  lightboxClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
