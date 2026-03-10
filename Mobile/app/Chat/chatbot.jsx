import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';

// Toast helper functions
const showSuccessToast = (message) => {
  Toast.show({
    type: 'success',
    text1: 'Success',
    text2: message,
    position: 'top',
    visibilityTime: 3000,
    autoHide: true,
    topOffset: 50,
  });
};

const showErrorToast = (message) => {
  Toast.show({
    type: 'error',
    text1: 'Error',
    text2: message,
    position: 'top',
    visibilityTime: 4000,
    autoHide: true,
    topOffset: 50,
  });
};

const showWarningToast = (message) => {
  Toast.show({
    type: 'info',
    text1: 'Warning',
    text2: message,
    position: 'top',
    visibilityTime: 3000,
    autoHide: true,
    topOffset: 50,
  });
};

import { API_ENDPOINTS } from '../../config/api';
import logger from '../../utils/logger';

const log = logger.create('Chatbot');

export default function Chatbot() {
  const router = useRouter();
  const scrollViewRef = useRef(null);

  const [messages, setMessages] = useState([
    { sender: 'bot', text: '👋 Hi! I\'m your shopping assistant. How can I help you today?' },
  ]);
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [showOrderInput, setShowOrderInput] = useState(false);
  const [menuStack, setMenuStack] = useState([]);
  const [currentMenu, setCurrentMenu] = useState('main');
  const [userId, setUserId] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    loadUserId();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadUserId = async () => {
    try {
      const id = await AsyncStorage.getItem('userId');
      
      if (!id) {
        showWarningToast('User session not found. Some features may be limited.');
        setMessages((prev) => [
          ...prev,
          { 
            sender: 'bot', 
            text: '⚠️ I notice you\'re not logged in. You can still ask general questions, but I won\'t be able to access your order history.' 
          },
        ]);
      } else {
        setUserId(id);
        log.info('User ID loaded:', id);
      }
    } catch (error) {
      log.error('Error loading userId:', error);
      showErrorToast('Failed to load user session');
    } finally {
      setIsInitializing(false);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const MENU_ICONS = {
    'Where is my order?': 'cube-outline',
    'Payment issues': 'card-outline',
    'Return or refund policy': 'refresh-outline',
    'Wallet & Escrow help': 'wallet-outline',
    'Report an ad or seller': 'alert-circle-outline',
    'Contact customer support': 'headset-outline',
    'Show all my orders': 'list-outline',
    'Track a specific order': 'search-outline',
    'Cancel an order': 'close-circle-outline',
    'Payment failed': 'card-outline',
    'Refund not received': 'cash-outline',
    'Add funds to wallet': 'add-circle-outline',
    'Back': 'arrow-back-outline',
  };

  const MENUS = {
    main: [
      'Where is my order?',
      'Payment issues',
      'Return or refund policy',
      'Wallet & Escrow help',
      'Report an ad or seller',
      'Contact customer support',
    ],
    order: [
      'Show all my orders',
      'Track a specific order',
      'Cancel an order',
      'Back',
    ],
    payment: [
      'Payment failed',
      'Refund not received',
      'Add funds to wallet',
      'Back',
    ],
  };

  const handleQuestion = async (question) => {
    setMessages((prev) => [...prev, { sender: 'user', text: question }]);

    if (question === 'Where is my order?') {
      setMenuStack((prev) => [...prev, currentMenu]);
      setCurrentMenu('order');
      setMessages((prev) => [
        ...prev,
        { sender: 'bot', text: '📦 How can I help with your orders?' },
      ]);
      return;
    }

    if (question === 'Payment issues') {
      setMenuStack((prev) => [...prev, currentMenu]);
      setCurrentMenu('payment');
      setMessages((prev) => [
        ...prev,
        { sender: 'bot', text: '💳 What payment issue are you facing?' },
      ]);
      return;
    }

    if (question === 'Back') {
      const prevMenu = menuStack[menuStack.length - 1];
      setMenuStack(menuStack.slice(0, -1));
      setCurrentMenu(prevMenu || 'main');
      setMessages((prev) => [
        ...prev,
        { sender: 'bot', text: 'How else can I assist you?' },
      ]);
      return;
    }

    if (question === 'Track a specific order') {
      if (!userId) {
        setMessages((prev) => [
          ...prev,
          { 
            sender: 'bot', 
            text: '⚠️ You need to be logged in to track orders. Please log in and try again.' 
          },
        ]);
        showWarningToast('Please log in to track your orders');
        return;
      }
      
      setShowOrderInput(true);
      setMessages((prev) => [
        ...prev,
        { sender: 'bot', text: 'Please enter your Order ID below:' },
      ]);
      return;
    }

    if (question === 'Show all my orders') {
      if (!userId) {
        setMessages((prev) => [
          ...prev,
          { 
            sender: 'bot', 
            text: '⚠️ You need to be logged in to view your orders. Please log in and try again.' 
          },
        ]);
        showWarningToast('Please log in to view your orders');
        return;
      }
    }

    await fetchResponse(question);
  };

  const handleOrderSubmit = async () => {
    const trimmedOrderId = orderId.trim();
    
    if (!trimmedOrderId) {
      showErrorToast('Please enter an Order ID');
      return;
    }

    // Basic order ID format validation
    if (trimmedOrderId.length < 5) {
      showErrorToast('Order ID seems too short. Please check and try again.');
      return;
    }

    setMessages((prev) => [...prev, { sender: 'user', text: `Order ID: ${trimmedOrderId}` }]);
    setShowOrderInput(false);

    await fetchResponse('Track a specific order', trimmedOrderId);
    setOrderId('');
  };

  const fetchResponse = async (question, orderIdParam = null) => {
    setLoading(true);
    
    try {
      const { data } = await axios.post(
        API_ENDPOINTS.CHATBOT_ASK,
        {
          question,
          orderId: orderIdParam,
          userId,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 15000, // 15 second timeout
        }
      );

      log.info('API Response:', data);

      if (data.success) {
        setMessages((prev) => [...prev, { sender: 'bot', text: data.answer }]);

        if (data.redirectTo === 'raiseQuery') {
          setTimeout(() => {
            setMessages((prev) => [
              ...prev,
              {
                sender: 'bot',
                text: '👉 Click the button below to raise a query:',
                action: 'raiseQuery',
              },
            ]);
          }, 1000);
        }
      } else {
        // Backend returned success: false
        const errorMessage = data.answer || data.message || '⚠️ Sorry, I couldn\'t process that request.';
        setMessages((prev) => [
          ...prev,
          { sender: 'bot', text: errorMessage },
        ]);
        showErrorToast(data.message || 'Request failed');
      }
    } catch (err) {
      log.error('Chatbot error:', err);
      
      let errorMessage = '⚠️ Sorry, something went wrong. ';
      let toastMessage = '';
      
      if (err.code === 'ECONNABORTED') {
        // Timeout error
        errorMessage += 'The request took too long. Please check your internet connection and try again.';
        toastMessage = 'Request timed out. Please try again.';
      } else if (err.message.includes('Backend URL is not configured')) {
        // Configuration error
        errorMessage = '⚠️ The chatbot service is not configured properly. Please contact support.';
        toastMessage = 'Configuration error';
      } else if (err.response) {
        // Server responded with error
        const status = err.response.status;
        const serverMessage = err.response.data?.message || err.response.data?.answer;
        
        switch (status) {
          case 400:
            errorMessage = serverMessage || '⚠️ Invalid request. Please check your input and try again.';
            toastMessage = 'Invalid request';
            break;
          case 401:
            errorMessage = '⚠️ Your session has expired. Please log in again.';
            toastMessage = 'Session expired';
            setTimeout(() => router.replace('/auth'), 2000);
            break;
          case 404:
            errorMessage = '⚠️ The chatbot service is currently unavailable. Please try again later or contact support.';
            toastMessage = 'Service not found';
            break;
          case 500:
            errorMessage = serverMessage || '⚠️ Server error. Our team has been notified. Please try again later.';
            toastMessage = 'Server error';
            break;
          case 503:
            errorMessage = '⚠️ The service is temporarily unavailable. Please try again in a few moments.';
            toastMessage = 'Service temporarily unavailable';
            break;
          default:
            errorMessage = `⚠️ Error (${status}): ${serverMessage || 'Something went wrong. Please try again.'}`;
            toastMessage = `Error ${status}`;
        }
      } else if (err.request) {
        // Request made but no response
        errorMessage = '⚠️ Cannot reach the server. Please check your internet connection and try again.';
        toastMessage = 'No internet connection';
      } else {
        // Other errors
        errorMessage += err.message || 'An unexpected error occurred. Please try again.';
        toastMessage = 'Unexpected error';
      }

      setMessages((prev) => [
        ...prev,
        { sender: 'bot', text: errorMessage },
      ]);

      showErrorToast(toastMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRaiseQuery = () => {
    if (!userId) {
      showWarningToast('Please log in to raise a query');
      setMessages((prev) => [
        ...prev,
        { 
          sender: 'bot', 
          text: '⚠️ You need to be logged in to raise a query. Please log in first.' 
        },
      ]);
      setTimeout(() => router.replace('/auth'), 2000);
      return;
    }
    
    router.push('/Chat/raiseQuery');
  };

  if (isInitializing) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#059669" />
        <Text style={styles.loadingText}>Loading assistant...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header with gradient */}
      <LinearGradient
        colors={['#059669', '#16a34a', '#0d9488']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        {/* Decorative circles */}
        <View style={styles.decorativeCircle1} />
        <View style={styles.decorativeCircle2} />
        <View style={styles.decorativeCircle3} />

        {/* Back button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Ionicons name="close" size={24} color="#374151" />
        </TouchableOpacity>

        {/* Header content */}
        <View style={styles.headerContent}>
          <View style={styles.iconContainer}>
            <Ionicons name="bag-handle-outline" size={28} color="#fff" />
          </View>
          <View>
            <Text style={styles.headerTitle}>Your Shop Assistant</Text>
            <View style={styles.statusContainer}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Online • Ready to help</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Messages Container */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <LinearGradient
          colors={['rgba(236, 253, 245, 0.3)', '#ffffff']}
          style={styles.messagesContainer}
        >
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
          >
            {messages.map((msg, idx) => (
              <View key={idx}>
                <View
                  style={[
                    styles.messageWrapper,
                    msg.sender === 'user' ? styles.userMessageWrapper : styles.botMessageWrapper,
                  ]}
                >
                  <View
                    style={[
                      styles.messageBubble,
                      msg.sender === 'user' ? styles.userMessage : styles.botMessage,
                    ]}
                  >
                    <Text
                      style={[
                        styles.messageText,
                        msg.sender === 'user' ? styles.userMessageText : styles.botMessageText,
                      ]}
                    >
                      {msg.text}
                    </Text>
                  </View>
                </View>

                {msg.action === 'raiseQuery' && (
                  <View style={styles.actionButtonWrapper}>
                    <TouchableOpacity
                      style={styles.raiseQueryButton}
                      onPress={handleRaiseQuery}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={['#059669', '#16a34a']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.raiseQueryGradient}
                      >
                        <Ionicons name="chatbubble-ellipses-outline" size={18} color="#fff" />
                        <Text style={styles.raiseQueryText}>Raise a Query</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}

            {loading && (
              <View style={styles.loadingWrapper}>
                <View style={styles.loadingBubble}>
                  <ActivityIndicator size="small" color="#059669" />
                  <Text style={styles.loadingText}>Typing...</Text>
                </View>
              </View>
            )}
          </ScrollView>
        </LinearGradient>

        {/* Footer - Input or Menu */}
        <LinearGradient
          colors={['#ffffff', 'rgba(236, 253, 245, 0.2)']}
          style={styles.footer}
        >
          {showOrderInput ? (
            <View style={styles.inputContainer}>
              <TouchableOpacity
                style={styles.inputBackButton}
                onPress={() => {
                  setShowOrderInput(false);
                  setOrderId('');
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="arrow-back" size={22} color="#059669" />
              </TouchableOpacity>
              <TextInput
                style={styles.textInput}
                placeholder="Enter Order ID (e.g., ORD12345)"
                placeholderTextColor="#9ca3af"
                value={orderId}
                onChangeText={setOrderId}
                autoFocus
                returnKeyType="send"
                onSubmitEditing={handleOrderSubmit}
                maxLength={50}
              />
              <TouchableOpacity
                style={[styles.sendButton, !orderId.trim() && styles.sendButtonDisabled]}
                onPress={handleOrderSubmit}
                activeOpacity={0.8}
                disabled={!orderId.trim()}
              >
                <LinearGradient
                  colors={orderId.trim() ? ['#059669', '#16a34a'] : ['#9ca3af', '#9ca3af']}
                  style={styles.sendGradient}
                >
                  <Ionicons name="send" size={20} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.menuGrid}>
              {(MENUS[currentMenu] || []).map((q, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.menuButton,
                    q === 'Back' && styles.backMenuButton,
                  ]}
                  onPress={() => handleQuestion(q)}
                  activeOpacity={0.7}
                  disabled={loading}
                >
                  <View
                    style={[
                      styles.menuButtonContent,
                      q === 'Back' ? styles.backButtonContent : styles.normalButtonContent,
                      loading && styles.menuButtonDisabled,
                    ]}
                  >
                    <Ionicons
                      name={MENU_ICONS[q]}
                      size={18}
                      color={q === 'Back' ? '#047857' : '#059669'}
                    />
                    <Text
                      style={[
                        styles.menuButtonText,
                        q === 'Back' && styles.backButtonText,
                      ]}
                      numberOfLines={2}
                    >
                      {q}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </LinearGradient>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  flex: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight + 10,
    paddingBottom: 20,
    paddingHorizontal: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  decorativeCircle1: {
    position: 'absolute',
    top: -40,
    right: -80,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  decorativeCircle2: {
    position: 'absolute',
    bottom: -60,
    left: -60,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  decorativeCircle3: {
    position: 'absolute',
    top: '50%',
    right: '25%',
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight + 10,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 10,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    zIndex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#86efac',
  },
  statusText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    gap: 12,
  },
  messageWrapper: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  userMessageWrapper: {
    justifyContent: 'flex-end',
  },
  botMessageWrapper: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '85%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  userMessage: {
    backgroundColor: '#059669',
    borderTopRightRadius: 4,
  },
  botMessage: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#d1fae5',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userMessageText: {
    color: '#fff',
  },
  botMessageText: {
    color: '#1f2937',
  },
  loadingWrapper: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  loadingBubble: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#d1fae5',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  actionButtonWrapper: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: 8,
  },
  raiseQueryButton: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  raiseQueryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  raiseQueryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#d1fae5',
    padding: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inputBackButton: {
    width: 40,
    height: 40,
    backgroundColor: '#d1fae5',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    height: 44,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#d1fae5',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  menuButton: {
    width: '48.5%',
    minHeight: 56,
  },
  backMenuButton: {
    width: '100%',
  },
  menuButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 8,
    minHeight: 56,
  },
  normalButtonContent: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#d1fae5',
  },
  backButtonContent: {
    backgroundColor: '#d1fae5',
  },
  menuButtonDisabled: {
    opacity: 0.5,
  },
  menuButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#047857',
    textAlign: 'center',
    flex: 1,
  },
  backButtonText: {
    color: '#047857',
    fontWeight: '600',
  },
});