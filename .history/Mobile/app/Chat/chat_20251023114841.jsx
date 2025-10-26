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
  SafeAreaView,
  StatusBar,
  Animated,
  Keyboard,
} from 'react-native';
import io from 'socket.io-client';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const API_BASE = `${process.env.EXPO_PUBLIC_API_URL}/api/chat`;
const SOCKET_URL = "wss://tiwari.shop";
const SERVER_BASE = process.env.EXPO_PUBLIC_API_URL || "http://51.20.123.49:8080";

const theme = {
  background: '#FFFFFF',
  secondaryBg: '#F0F2F5',
  chatListBg: '#FFFFFF',
  primary: '#25D366',
  primaryDark: '#128C7E',
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
  divider: '#E9EDEF',
};

// Separate Message Component to use hooks properly
const MessageItem = ({ item }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <View style={[
        styles.messageContainer,
        item.sender === 'me' ? styles.myMessage : styles.otherMessage
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
          item.sender === 'me' 
            ? styles.myMessageBubble
            : styles.otherMessageBubble
        ]}>
          {item.messageType === 'image' ? (
            item.isUploading ? (
              <View style={styles.imageUploadingContainer}>
                <Image
                  source={{ uri: item.localUri }}
                  style={[styles.messageImage, styles.imageUploading]}
                  resizeMode="cover"
                />
                <View style={styles.imageUploadingOverlay}>
                  <ActivityIndicator size="large" color="#FFFFFF" />
                  <Text style={styles.imageUploadingText}>Sending...</Text>
                </View>
              </View>
            ) : item.fileUrl ? (
              <Image
                source={{ uri: `${SERVER_BASE}${item.fileUrl}` }}
                style={styles.messageImage}
                resizeMode="cover"
              />
            ) : null
          ) : (
            <Text style={[styles.messageText, { color: theme.text }]}>
              {item.text}
            </Text>
          )}
          <Text style={[
            styles.timestamp,
            { color: item.sender === 'me' ? '#667781' : theme.tertiaryText }
          ]}>
            {item.timestamp}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
};

export default function ChatApp() {
  const [currentUser, setCurrentUser] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState('');
  
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  const flatListRef = useRef(null);
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    requestPermissions();
    autoConnect();
  }, []);

  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    }
  };

  const autoConnect = async () => {
    try {
      let storedUsername = await AsyncStorage.getItem('userName');
      
      if (!storedUsername) {
        const userJson = await AsyncStorage.getItem('user');
        if (userJson) {
          try {
            const userObj = JSON.parse(userJson);
            storedUsername = userObj.userName;
          } catch (e) {
            console.error('Error parsing user JSON:', e);
          }
        }
      }
      
      if (storedUsername) {
        console.log('Auto-connecting with username:', storedUsername);
        connectUser(storedUsername);
      }
    } catch (error) {
      console.error('Error auto-connecting:', error);
    }
  };

  useEffect(() => {
    if (isConnected && currentUser) {
      socketRef.current = io(SOCKET_URL, { 
        withCredentials: true,
        transports: ['websocket', 'polling']
      });

      socketRef.current.on('connect', () => {
        console.log('✅ Socket connected');
        if (activeConversation) {
          socketRef.current.emit('joinConversation', activeConversation._id);
        }
      });

      socketRef.current.on('disconnect', () => {
        console.log('❌ Socket disconnected');
      });

      socketRef.current.on('newMessage', (msg) => {
        console.log('📨 New message received:', msg);
        
        if (msg.conversationId === activeConversation?._id) {
          setMessages((prev) => {
            const exists = prev.some(m => m.id === msg._id);
            if (exists) return prev;

            return [
              ...prev,
              {
                id: msg._id || Date.now().toString(),
                text: msg.text,
                sender: msg.senderId === currentUser.userId ? 'me' : 'other',
                timestamp: new Date().toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                }),
                senderName: msg.senderName,
                fileUrl: msg.fileUrl,
                messageType: msg.messageType,
              },
            ];
          });
        }
      });

      socketRef.current.on('typing', ({ conversationId, userId }) => {
        if (conversationId === activeConversation?._id && userId !== currentUser.userId) {
          setIsTyping(true);
          
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
          }
          
          typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
          }, 2000);
        }
      });

      return () => {
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        socketRef.current?.disconnect();
      };
    }
  }, [isConnected, currentUser, activeConversation]);

  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: !initialLoad });
        setInitialLoad(false);
      }, 100);
    }
  }, [messages]);

  useEffect(() => {
    if (activeConversation && socketRef.current?.connected) {
      socketRef.current.emit('joinConversation', activeConversation._id);
      console.log('📍 Joined conversation:', activeConversation._id);
    }
  }, [activeConversation]);

  // Keyboard handling for chat scroll
  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    );

    return () => {
      keyboardWillShow.remove();
    };
  }, []);

  const connectUser = async (username) => {
    if (!username?.trim()) return;
    setIsConnecting(true);
    setConnectionError('');

    try {
      const response = await fetch(`${API_BASE}/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, displayName: username }),
      });

      const data = await response.json();
      if (data.success) {
        setCurrentUser(data.user);
        setIsConnected(true);
        
        await AsyncStorage.setItem('userId', data.user.userId);
        await AsyncStorage.setItem('userName', username);
        await AsyncStorage.setItem('user', JSON.stringify({
          userName: username,
          userId: data.user.userId
        }));
        
        await loadAllUsers();
        await loadConversations(data.user.userId);
      } else {
        setConnectionError(data.message || 'Connection failed');
      }
    } catch (error) {
      console.error('Connection error:', error);
      setConnectionError('Connection failed. Check your network.');
    } finally {
      setIsConnecting(false);
    }
  };

  const loadAllUsers = async () => {
    try {
      const response = await fetch(`${API_BASE}/users`);
      const data = await response.json();
      if (data.success) setAllUsers(data.users);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const loadConversations = async (userId) => {
    try {
      const response = await fetch(`${API_BASE}/conversations/${userId}`);
      const data = await response.json();
      if (data.success) setConversations(data.conversations);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setIsLoadingChats(false);
    }
  };

  const startConversation = async (otherUser) => {
    if (!currentUser) return;
    setIsLoadingMessages(true);
    try {
      const response = await fetch(`${API_BASE}/conversations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participants: [currentUser.userId, otherUser.userId] }),
      });
      const data = await response.json();
      if (data.success) {
        setActiveConversation(data.conversation);
        setInitialLoad(true);
        await loadMessages(data.conversation._id);
        
        if (socketRef.current?.connected) {
          socketRef.current.emit('joinConversation', data.conversation._id);
        }
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const loadMessages = async (conversationId) => {
    if (!currentUser) return;
    try {
      const response = await fetch(`${API_BASE}/messages/${conversationId}`);
      const data = await response.json();
      if (data.success) {
        const formattedMessages = data.messages.reverse().map((msg) => ({
          id: msg._id,
          text: msg.text,
          sender: msg.senderId === currentUser.userId ? 'me' : 'other',
          timestamp: new Date(msg.timestamp).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          senderName: msg.senderName,
          fileUrl: msg.fileUrl,
          messageType: msg.messageType,
          fileName: msg.fileName,
        }));
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeConversation || !currentUser) return;
    
    const messageText = newMessage.trim();
    setNewMessage('');

    try {
      const response = await fetch(`${API_BASE}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: activeConversation._id,
          senderId: currentUser.userId,
          text: messageText,
        }),
      });

      const data = await response.json();
      if (data.success && socketRef.current?.connected) {
        socketRef.current.emit('sendMessage', {
          conversationId: activeConversation._id,
          senderId: currentUser.userId,
          text: data.message.text,
          fileUrl: data.message.fileUrl,
          messageType: data.message.messageType,
          senderName: data.message.senderName,
          _id: data.message._id,
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    }
  };

  const handleImageUpload = async () => {
    if (!activeConversation || !currentUser) return;
    
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
        base64: false,
      });

      if (result.canceled || !result.assets[0]) return;

      const asset = result.assets[0];
      const uri = asset.uri;
      
      // Create temporary message with loading state
      const tempMessageId = `temp_${Date.now()}`;
      const tempMessage = {
        id: tempMessageId,
        text: 'Sending image...',
        sender: 'me',
        timestamp: new Date().toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        messageType: 'image',
        isUploading: true,
        localUri: uri,
      };
      
      setMessages((prev) => [...prev, tempMessage]);
      setIsUploading(true);
      
      // Scroll to show the uploading image
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
      
      const filename = uri.split('/').pop() || `photo_${Date.now()}.jpg`;
      
      let mimeType = 'image/jpeg';
      const extension = filename.toLowerCase().split('.').pop();
      if (extension === 'png') mimeType = 'image/png';
      else if (extension === 'gif') mimeType = 'image/gif';
      else if (extension === 'webp') mimeType = 'image/webp';

      const formData = new FormData();
      
      formData.append('file', {
        uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
        type: mimeType,
        name: filename,
      });
      
      formData.append('conversationId', activeConversation._id);
      formData.append('senderId', currentUser.userId);

      const response = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        throw new Error('Invalid server response');
      }

      if (data.success) {
        // Remove temp message
        setMessages((prev) => prev.filter(msg => msg.id !== tempMessageId));
        
        // Emit via socket - the real message will come back via socket listener
        if (socketRef.current?.connected) {
          socketRef.current.emit('sendMessage', {
            conversationId: activeConversation._id,
            senderId: currentUser.userId,
            text: data.message.text,
            fileUrl: data.message.fileUrl,
            messageType: data.message.messageType,
            senderName: data.message.senderName,
            _id: data.message._id,
          });
        }
      } else {
        // Remove temp message on error
        setMessages((prev) => prev.filter(msg => msg.id !== tempMessageId));
        throw new Error(data.message || 'Upload failed');
      }
    } catch (error) {
      console.error('❌ Image upload error:', error);
      Alert.alert('Error', 'Failed to send image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const renderMessage = ({ item }) => {
    return <MessageItem item={item} />;
  };

  const renderChatItem = ({ item }) => {
    const hasConversation = conversations.some((conv) =>
      conv.participants.some((p) => p.userId === item.userId)
    );
    if (!hasConversation) return null;

    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() => startConversation(item)}
        activeOpacity={0.7}
      >
        <View style={styles.chatAvatarContainer}>
          <View style={[styles.chatAvatar, { backgroundColor: theme.primaryDark }]}>
            <Text style={styles.chatAvatarText}>
              {item.userName?.charAt(0)?.toUpperCase() || 'U'}
            </Text>
          </View>
        </View>
        
        <View style={styles.chatInfo}>
          <Text style={styles.chatName} numberOfLines={1}>
            {item.userName}
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={20} color={theme.tertiaryText} />
      </TouchableOpacity>
    );
  };

  if (!isConnected && isConnecting) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar barStyle="dark-content" backgroundColor={theme.background} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.text }]}>
            Connecting...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.headerBg} />
      
      <KeyboardAvoidingView
        style={styles.mainContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {!activeConversation ? (
          // CHAT LIST VIEW
          <>
            <View style={styles.appHeader}>
              <View style={styles.headerLeft}>
                <Text style={styles.appTitle}>Messages</Text>
              </View>
              <View style={styles.headerRight}>
                <TouchableOpacity style={styles.headerIconButton}>
                  <Ionicons name="search-outline" size={24} color={theme.text} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.headerIconButton}>
                  <Ionicons name="create-outline" size={24} color={theme.text} />
                </TouchableOpacity>
                <View style={[styles.userAvatar, { backgroundColor: theme.primary }]}>
                  <Text style={styles.userAvatarText}>
                    {currentUser?.userName?.charAt(0)?.toUpperCase() || 'U'}
                  </Text>
                </View>
              </View>
            </View>

            <FlatList
              data={allUsers.filter((user) => user.userId !== currentUser?.userId)}
              renderItem={renderChatItem}
              keyExtractor={(item) => item.userId}
              contentContainerStyle={styles.chatListFull}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                isLoadingChats ? (
                  <View style={styles.loadingChatsContainer}>
                    <ActivityIndicator size="large" color={theme.primary} />
                    <Text style={styles.loadingChatsText}>Loading chats...</Text>
                  </View>
                ) : (
                  <View style={styles.emptyListContainer}>
                    <Ionicons name="chatbubbles-outline" size={80} color={theme.secondaryText} />
                    <Text style={styles.emptyListTitle}>No Chats Yet</Text>
                    <Text style={styles.emptyListText}>Start a conversation to see your chats here</Text>
                  </View>
                )
              }
            />
          </>
        ) : (
          // CHAT VIEW
          <View style={styles.chatViewContainer}>
            {/* Message Header */}
            <View style={styles.messageHeader}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => {
                  setActiveConversation(null);
                  setMessages([]);
                  setIsLoadingMessages(false);
                }}
              >
                <Ionicons name="arrow-back" size={24} color={theme.text} />
              </TouchableOpacity>
              
              <View style={styles.messageHeaderInfo}>
                <View style={[styles.headerChatAvatar, { backgroundColor: theme.primaryDark }]}>
                  <Text style={styles.headerChatAvatarText}>
                    {activeConversation.participants
                      .find((p) => p.userId !== currentUser?.userId)
                      ?.userName?.charAt(0)
                      ?.toUpperCase() || 'U'}
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

            {/* Messages List */}
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
                    maintainVisibleContentPosition={{
                      minIndexForVisible: 0,
                    }}
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

            {/* Input Area */}
            <View style={styles.inputContainer}>
              <View style={styles.inputRow}>
                <TouchableOpacity
                  style={[styles.attachButton, isUploading && styles.attachButtonDisabled]}
                  onPress={handleImageUpload}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <ActivityIndicator size="small" color={theme.primary} />
                  ) : (
                    <Ionicons name="add-circle" size={28} color={theme.primary} />
                  )}
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
                    onFocus={() => {
                      setTimeout(() => {
                        flatListRef.current?.scrollToEnd({ animated: true });
                      }, 300);
                    }}
                  />
                </View>

                <TouchableOpacity
                  style={[
                    styles.sendButton,
                    !newMessage.trim() && styles.sendButtonDisabled
                  ]}
                  onPress={handleSendMessage}
                  disabled={!newMessage.trim()}
                >
                  <Ionicons 
                    name={newMessage.trim() ? "send" : "mic"} 
                    size={20} 
                    color="#FFFFFF" 
                  />
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
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    fontWeight: '500',
  },
  mainContainer: {
    flex: 1,
  },
  appHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: theme.headerBg,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  headerLeft: {
    flex: 1,
  },
  appTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: theme.text,
    letterSpacing: -0.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  contentContainer: {
    flex: 1,
  },
  chatListFull: {
    flexGrow: 1,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: theme.chatListBg,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  chatAvatarContainer: {
    position: 'relative',
    marginRight: 14,
  },
  chatAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatAvatarText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '600',
  },
  chatInfo: {
    flex: 1,
    marginRight: 8,
    justifyContent: 'center',
  },
  chatName: {
    fontSize: 17,
    fontWeight: '600',
    color: theme.text,
  },
  chatViewContainer: {
    flex: 1,
    backgroundColor: theme.background,
  },
  messageArea: {
    flex: 1,
    backgroundColor: theme.background,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.headerBg,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  messageHeaderInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerChatAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerChatAvatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  headerChatInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  messageHeaderName: {
    fontSize: 17,
    fontWeight: '600',
    color: theme.text,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: theme.secondaryBg,
  },
  loadingMessagesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingMessagesText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.secondaryText,
    marginTop: 16,
  },
  messagesList: {
    padding: 16,
    paddingBottom: 20,
    flexGrow: 1,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-end',
  },
  myMessage: {
    justifyContent: 'flex-end',
  },
  otherMessage: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    marginRight: 8,
    marginBottom: 2,
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  myMessageBubble: {
    backgroundColor: theme.messageBubbleMine,
    borderTopRightRadius: 2,
  },
  otherMessageBubble: {
    backgroundColor: theme.messageBubbleOther,
    borderTopLeftRadius: 2,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '400',
  },
  messageImage: {
    width: 240,
    height: 240,
    borderRadius: 8,
    marginBottom: 4,
  },
  imageUploadingContainer: {
    position: 'relative',
    width: 240,
    height: 240,
    marginBottom: 4,
  },
  imageUploading: {
    opacity: 0.5,
  },
  imageUploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 8,
  },
  imageUploadingText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
    fontWeight: '400',
  },
  typingContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.messageBubbleOther,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.tertiaryText,
  },
  inputContainer: {
    backgroundColor: theme.inputBg,
    borderTopWidth: 1,
    borderTopColor: theme.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  attachButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  attachButtonDisabled: {
    opacity: 0.5,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: theme.secondaryBg,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: theme.border,
  },
  messageInput: {
    fontSize: 15,
    color: theme.text,
    lineHeight: 20,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: theme.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 0,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  loadingChatsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  loadingChatsText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.secondaryText,
    marginTop: 16,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
    paddingHorizontal: 40,
  },
  emptyListTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.text,
    marginTop: 20,
    marginBottom: 8,
  },
  emptyListText: {
    fontSize: 15,
    color: theme.secondaryText,
    textAlign: 'center',
    lineHeight: 22,
  },
});