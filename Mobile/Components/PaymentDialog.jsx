import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  Linking,
  Platform,
  Dimensions,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { io } from 'socket.io-client';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080/api';
const SOCKET_URL = process.env.EXPO_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8080';

// ✅ SIMPLIFIED: Helper function to get text from multilingual object
const getTextValue = (textObj, fallback = '') => {
  if (!textObj) return fallback;
  if (typeof textObj === 'string') return textObj;
  if (typeof textObj === 'object') {
    // Just return English or first available value
    return textObj.en || textObj.az || textObj.ru || Object.values(textObj)[0] || fallback;
  }
  return fallback;
};

const PaymentDialog = ({ 
  isVisible, 
  product, 
  user, 
  onClose, 
  onPaymentSuccess,
}) => {
  const router = useRouter();
  const [walletBalance, setWalletBalance] = useState(0);
  const [useWallet, setUseWallet] = useState(false);
  const [onlineMethod, setOnlineMethod] = useState('');
  const [status, setStatus] = useState('READY');
  const [orderId, setOrderId] = useState(null);
  const [socket, setSocket] = useState(null);
  const [loadingWallet, setLoadingWallet] = useState(false);
  const [error, setError] = useState(null);
  
  // Animation values
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  
  const orderTimestamp = Date.now().toString();
  const price = product?.price ?? 0;
  const walletDeduction = useWallet ? Math.min(walletBalance, price) : 0;
  const remainder = price - walletDeduction;
  const txnId = `txn_${orderTimestamp}_${Math.floor(Math.random() * 1e6)}`;

  // Get owner ID properly
  const ownerId = product?.owner?._id || product?.owner || null;
  const productOwnerId = product?.owner?._id || product?.owner || null;
  
  // ✅ SIMPLIFIED: Get product title (handles both string and object)
  const productTitle = useMemo(() => {
    return getTextValue(product?.title, 'Unnamed Product');
  }, [product?.title]);

  // Fetch wallet balance with credentials
  const fetchWalletBalance = useCallback(async (retryCount = 0) => {
    // if (!user?._id || !isVisible) return;
    
    setLoadingWallet(true);
    setError(null);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const res = await fetch(`${API_URL}/users/${user.userId}/wallet`, {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        signal: controller.signal,
      });
      
      console.log('📍 Wallet API URL:', `${API_URL}/user/${user._id}/wallet`);
      clearTimeout(timeoutId);

      if (!res.ok) {
        const errorText = await res.text();
        console.error('❌ Wallet API error:', errorText);
        throw new Error(`HTTP ${res.status}: ${errorText || res.statusText}`);
      }
      
      const data = await res.json();
      console.log('💰 Wallet response:', data);
      
      if (data.success && typeof data.walletBalance === 'number') {
        setWalletBalance(data.walletBalance);
        console.log('✅ Wallet balance fetched:', data.walletBalance);
      } else if (typeof data.walletBalance === 'number') {
        setWalletBalance(data.walletBalance);
      } else {
        console.warn('⚠️ Invalid wallet response, using fallback');
        setWalletBalance(user?.walletBalance ?? 0);
      }
    } catch (err) {
      console.error('❌ Wallet fetch error:', err);
      
      if (err.name === 'AbortError') {
        setError('Request timeout. Please check your connection.');
      } else {
        setError('Failed to fetch wallet balance');
      }
      
      if (retryCount === 0) {
        console.log('🔄 Retrying wallet balance fetch...');
        setTimeout(() => fetchWalletBalance(1), 1500);
      } else {
        console.log('⚠️ Using fallback wallet balance from user prop');
        setWalletBalance(user?.walletBalance ?? 0);
      }
    } finally {
      setLoadingWallet(false);
    }
  }, [user?._id, user?.walletBalance, isVisible]);

  useEffect(() => {
    if (isVisible) {
      console.log('💳 Fetching wallet balance for user:', user?._id);
      fetchWalletBalance();
    }
  }, [isVisible, fetchWalletBalance]);

  useEffect(() => {
    if (status === 'SUCCESS' || status === 'FAILURE') {
      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0);
    }
  }, [status, scaleAnim]);

  useEffect(() => {
    if (!orderId || !isVisible) return;

    console.log('🔌 Connecting to socket for order:', orderId);
    console.log('🔌 Socket URL:', SOCKET_URL);
    
    const newSocket = io(SOCKET_URL, { 
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 3,
      withCredentials: true,
    });

    newSocket.emit('subscribePayment', orderId);

    newSocket.on('paymentUpdate', (data) => {
      console.log('📡 Payment update received:', data);
      if (data.status === 'PAID' && data.orderId === orderId) {
        console.log('✅ Payment confirmed!');
        setStatus('SUCCESS');
        onPaymentSuccess?.(price);
        
        setTimeout(() => {
          newSocket.disconnect();
          handleClose();
        }, 2000);
      }
    });

    newSocket.on('connect_error', (err) => {
      console.error('❌ Socket connection error:', err);
    });

    setSocket(newSocket);

    return () => {
      newSocket.off('paymentUpdate');
      newSocket.off('connect_error');
      newSocket.disconnect();
    };
  }, [orderId, isVisible, price, onPaymentSuccess]);

  const handleClose = useCallback(() => {
    if (status === 'LOADING') {
      Alert.alert(
        'Payment in Progress',
        'Please wait while we process your payment.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    setStatus('READY');
    setUseWallet(false);
    setOnlineMethod('');
    setOrderId(null);
    setError(null);
    
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      fadeAnim.setValue(1);
      onClose();
    });
  }, [status, onClose, fadeAnim]);

  const handleOrderCreation = useCallback(async () => {
    try {
      const orderPayload = {
        buyerId: user.userId,
        sellerId: productOwnerId,
        productId: product._id,
        total: price,
        transactionId: txnId,
        address: {
          name: user.fullName || user.name || user.username || 'N/A',
          email: user.email || 'N/A',
          city: user.city || 'Not specified',
          address: user.address || 'Not specified',
          zipCode: user.postalCode || user.zipCode || 'Not specified',
        },
      };

      console.log('📦 Creating order:', orderPayload);

      const res = await fetch(`${API_URL}/Orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(orderPayload),
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Order creation failed');
      }
      
      const data = await res.json();
      console.log('📦 Order response:', data);
      
      if (data.success) {
        console.log('✅ Order created successfully:', data.data._id);
        
        Alert.alert(
          'Order Created!',
          'Your order has been created successfully.',
          [
            {
              text: 'View Order',
              onPress: () => {
                handleClose();
                setTimeout(() => {
                  router.push({
                    pathname: '/order',
                    params: { orderId: data.data._id }
                  });
                }, 300);
              },
            },
            {
              text: 'Close',
              onPress: () => handleClose(),
              style: 'cancel',
            }
          ]
        );
      } else {
        throw new Error(data.message || 'Order creation failed');
      }
    } catch (err) {
      console.error('❌ Order creation error:', err);
      Alert.alert(
        'Order Failed', 
        err.message || 'Failed to create order. Please contact support.',
        [{ text: 'OK' }]
      );
    }
  }, [user, productOwnerId, product, price, txnId, router, handleClose]);

  const walletTransfer = useCallback(async () => {
    setStatus('LOADING');
    setError(null);
    
    const payload = {
      senderId: user.userId,
      receiverId: ownerId,
      type: 'transfer',
      amount: price,
      description: `Payment for ${productTitle} - Order ${orderTimestamp}`,
      transactionId: txnId,
      referenceId: `order_${orderTimestamp}`,
      source: 'wallet',
    };

    console.log('💰 Wallet transfer payload:', payload);

    try {
      const res = await fetch(`${API_URL}/api/transaction/transferFund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Wallet transfer failed');
      }
      
      const data = await res.json();
      console.log('💰 Wallet transfer response:', data);

      if (data.success !== false) {
        console.log('✅ Wallet transfer successful');
        setStatus('SUCCESS');
        onPaymentSuccess?.(price);
        
        await handleOrderCreation();
        
        setTimeout(() => {
          handleClose();
        }, 2000);
      } else {
        console.error('❌ Wallet transfer failed:', data);
        setStatus('FAILURE');
        setError(data.message || 'Wallet transfer failed');
        Alert.alert(
          'Payment Failed', 
          data.message || 'Insufficient balance or transfer error. Please try again.'
        );
      }
    } catch (err) {
      console.error('❌ Wallet transfer error:', err);
      setStatus('FAILURE');
      setError(err.message || 'Network error. Please check your connection.');
      Alert.alert('Error', err.message || 'Something went wrong. Please try again.');
    }
  }, [user, ownerId, price, productTitle, txnId, onPaymentSuccess, handleOrderCreation, handleClose, orderTimestamp]);

  const onlineTransfer = useCallback(async () => {
    setStatus('LOADING');
    setError(null);
    
    const payload = {
      userId: user._id,
      receiverId: ownerId,
      type: 'transfer',
      amount: remainder,
      description: `Payment for ${productTitle} - Order ${orderTimestamp}`,
      transactionId: txnId,
      referenceId: `order_${orderTimestamp}`,
      source: 'online',
      product: product._id,
      walletDeduction: walletDeduction,
    };

    console.log('💳 Online transfer payload:', payload);

    try {
      const res = await fetch(`${API_URL}/payment/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Payment creation failed');
      }

      const data = await res.json();
      console.log('💳 Online payment response:', data);

      if (data.success === true) {
        console.log('✅ Payment URL received:', data.url);
        setOrderId(data.orderId);
        
        if (data.url) {
          Alert.alert(
            'Complete Payment',
            'You will be redirected to complete your payment securely.',
            [
              {
                text: 'Cancel',
                onPress: () => {
                  setStatus('READY');
                  setOrderId(null);
                },
                style: 'cancel',
              },
              {
                text: 'Continue',
                onPress: () => {
                  Linking.openURL(data.url).catch(err => {
                    console.error('❌ Failed to open payment URL:', err);
                    Alert.alert('Error', 'Failed to open payment page. Please try again.');
                    setStatus('FAILURE');
                  });
                },
              },
            ],
            { cancelable: false }
          );
        } else {
          throw new Error('Payment URL not received');
        }
      } else {
        console.error('❌ Payment creation failed:', data);
        setStatus('FAILURE');
        setError(data.message || 'Payment creation failed');
        Alert.alert('Payment Failed', data.message || 'Unable to create payment. Please try again.');
      }
    } catch (err) {
      console.error('❌ Online transfer error:', err);
      setStatus('FAILURE');
      setError(err.message || 'Network error occurred');
      Alert.alert('Error', err.message || 'Something went wrong. Please try again.');
    }
  }, [user, ownerId, remainder, productTitle, txnId, walletDeduction, orderTimestamp]);

  const handlePay = useCallback(async () => {
    if (status === 'FAILURE') {
      setStatus('READY');
      setError(null);
      return;
    }
    
    if (isPayDisabled) return;

    console.log('💳 Initiating payment...');
    console.log('💰 Wallet deduction:', walletDeduction);
    console.log('💳 Online payment:', remainder);

    if (remainder === 0) {
      console.log('💰 Full wallet payment');
      await walletTransfer();
    } else {
      console.log('💳 Online payment required');
      await onlineTransfer();
    }
  }, [status, remainder, walletTransfer, onlineTransfer, walletDeduction]);

  const RadioButton = ({ value, label, disabled }) => (
    <TouchableOpacity
      style={[styles.radioContainer, disabled && styles.radioDisabled]}
      onPress={() => !disabled && setOnlineMethod(value)}
      disabled={disabled}
    >
      <View style={styles.radio}>
        {onlineMethod === value && (
          <View style={styles.radioSelected} />
        )}
      </View>
      <Text style={[styles.radioLabel, disabled && styles.radioLabelDisabled]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const CheckBox = ({ checked, onChange, disabled, label }) => (
    <TouchableOpacity
      style={[styles.checkboxContainer, disabled && styles.checkboxDisabled]}
      onPress={() => !disabled && onChange(!checked)}
      disabled={disabled}
    >
      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
        {checked && (
          <Ionicons name="checkmark" size={16} color="#fff" />
        )}
      </View>
      <Text style={[styles.checkboxLabel, disabled && styles.checkboxLabelDisabled]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const payLabel = useMemo(() => {
    if (status === 'LOADING') return 'Processing…';
    if (status === 'SUCCESS') return 'Payment Successful';
    if (status === 'FAILURE') return 'Retry Payment';
    if (remainder === 0) return `Pay ₼${price.toLocaleString()} with Wallet`;
    if (!onlineMethod) return 'Select payment method';
    return `Pay ₼${remainder.toLocaleString()} via ${onlineMethod}`;
  }, [status, price, remainder, onlineMethod]);

  const isPayDisabled = 
    status === 'LOADING' || 
    status === 'SUCCESS' ||
    (status === 'READY' && remainder > 0 && !onlineMethod);

  const renderStatusAnimation = () => {
    if (status === 'LOADING') {
      return (
        <View style={styles.statusContainer}>
          <ActivityIndicator size="large" color="#16a34a" />
          <Text style={styles.statusText}>Processing payment...</Text>
          <Text style={styles.statusSubtext}>Please wait</Text>
        </View>
      );
    }
    
    if (status === 'SUCCESS') {
      return (
        <Animated.View 
          style={[
            styles.statusContainer,
            { transform: [{ scale: scaleAnim }] }
          ]}
        >
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={80} color="#16a34a" />
          </View>
          <Text style={styles.statusText}>Payment Successful!</Text>
          <Text style={styles.statusSubtext}>Creating your order...</Text>
        </Animated.View>
      );
    }
    
    if (status === 'FAILURE') {
      return (
        <Animated.View 
          style={[
            styles.statusContainer,
            { transform: [{ scale: scaleAnim }] }
          ]}
        >
          <View style={styles.failureIcon}>
            <Ionicons name="close-circle" size={80} color="#ef4444" />
          </View>
          <Text style={styles.statusText}>Payment Failed</Text>
          {error && (
            <Text style={styles.errorMessage}>{error}</Text>
          )}
          <Text style={styles.statusSubtext}>Please try again</Text>
        </Animated.View>
      );
    }
    
    return null;
  };

  if (!product || !user || !ownerId) {
    console.warn('❌ PaymentDialog: Missing required props', { 
      product: !!product, 
      user: !!user, 
      ownerId: !!ownerId 
    });
    return null;
  }

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity 
          style={styles.modalBackdrop} 
          onPress={handleClose}
          activeOpacity={1}
        />
        
        <Animated.View style={[styles.modalContent, { opacity: fadeAnim }]}>
          <View style={styles.header}>
            <Text style={styles.title}>Complete Payment</Text>
            <TouchableOpacity
              onPress={handleClose}
              disabled={status === 'LOADING'}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>

          <ScrollView 
            showsVerticalScrollIndicator={false}
            style={styles.scrollContent}
            contentContainerStyle={styles.scrollContentContainer}
          >
            {status === 'READY' ? (
              <>
                <View style={styles.summaryCard}>
                  <Text style={styles.sectionTitle}>Order Summary</Text>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Product</Text>
                    <Text style={styles.productName} numberOfLines={1}>
                      {productTitle}
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Product Price</Text>
                    <Text style={styles.priceText}>₼ {price.toLocaleString()}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Wallet Balance</Text>
                    {loadingWallet ? (
                      <ActivityIndicator size="small" color="#16a34a" />
                    ) : (
                      <TouchableOpacity onPress={() => fetchWalletBalance(0)}>
                        <View style={styles.balanceContainer}>
                          <Text style={[
                            styles.walletBalance,
                            { color: walletBalance > 0 ? '#16a34a' : '#ef4444' }
                          ]}>
                            ₼ {walletBalance.toLocaleString()}
                          </Text>
                          <Ionicons name="refresh-outline" size={16} color="#6b7280" />
                        </View>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {error && (
                  <View style={styles.errorCard}>
                    <Ionicons name="alert-circle" size={20} color="#ef4444" />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}

                <CheckBox
                  checked={useWallet}
                  onChange={setUseWallet}
                  disabled={!walletBalance || status !== 'READY' || loadingWallet}
                  label={`Use Wallet ${walletBalance > 0 ? `(up to ₼${walletBalance.toLocaleString()})` : '(No Balance)'}`}
                />

                {useWallet && (
                  <View style={styles.infoCard}>
                    <Ionicons name="information-circle" size={20} color="#16a34a" />
                    <Text style={styles.infoText}>
                      {remainder === 0
                        ? '✓ Full amount will be paid from wallet.'
                        : `₼${walletDeduction.toLocaleString()} from wallet, ₼${remainder.toLocaleString()} to pay online.`}
                    </Text>
                  </View>
                )}

                {remainder > 0 && (
                  <View style={styles.paymentMethods}>
                    <Text style={styles.sectionTitle}>Choose Payment Method</Text>
                    <RadioButton 
                      value="CARD" 
                      label="Credit / Debit Card"
                      disabled={remainder === 0 || status !== 'READY'}
                    />
                  </View>
                )}
              </>
            ) : (
              renderStatusAnimation()
            )}
          </ScrollView>

          {status !== 'SUCCESS' && (
            <View style={styles.footer}>
              <TouchableOpacity
                style={[
                  styles.payButton,
                  isPayDisabled && styles.payButtonDisabled,
                  status === 'FAILURE' && styles.retryButton,
                ]}
                onPress={handlePay}
                disabled={isPayDisabled}
              >
                <Text style={styles.payButtonText}>{payLabel}</Text>
              </TouchableOpacity>

              <View style={styles.securityFooter}>
                <Ionicons name="shield-checkmark" size={14} color="#9ca3af" />
                <Text style={styles.securityText}>
                  100% Secured Payments | Verified Merchant
                </Text>
              </View>
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  // ... (keep all your existing styles - they remain unchanged)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    padding: 20,
  },
  summaryCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#111827',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6b7280',
    flex: 1,
  },
  productName: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  priceText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#16a34a',
  },
  balanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  walletBalance: {
    fontSize: 16,
    fontWeight: '600',
  },
  errorCard: {
    backgroundColor: '#fef2f2',
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorText: {
    fontSize: 13,
    color: '#dc2626',
    lineHeight: 18,
    marginLeft: 8,
    flex: 1,
  },
  errorMessage: {
    fontSize: 13,
    color: '#ef4444',
    marginTop: 8,
    textAlign: 'center',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 4,
  },
  checkboxDisabled: {
    opacity: 0.5,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderRadius: 6,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
  },
  checkboxLabel: {
    fontSize: 15,
    color: '#111827',
  },
  checkboxLabelDisabled: {
    color: '#9ca3af',
  },
  infoCard: {
    backgroundColor: '#f0fdf4',
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  infoText: {
    fontSize: 13,
    color: '#166534',
    lineHeight: 18,
    marginLeft: 8,
    flex: 1,
  },
  paymentMethods: {
    marginTop: 8,
  },
  radioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  radioDisabled: {
    opacity: 0.5,
  },
  radio: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#16a34a',
    borderRadius: 10,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    width: 10,
    height: 10,
    backgroundColor: '#16a34a',
    borderRadius: 5,
  },
  radioLabel: {
    fontSize: 15,
    color: '#111827',
  },
  radioLabelDisabled: {
    color: '#9ca3af',
  },
  statusContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
  },
  statusSubtext: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  successIcon: {
    marginBottom: 8,
  },
  failureIcon: {
    marginBottom: 8,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  payButton: {
    backgroundColor: '#16a34a',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  payButtonDisabled: {
    backgroundColor: '#d1d5db',
    elevation: 0,
  },
  retryButton: {
    backgroundColor: '#6366f1',
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  securityFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  securityText: {
    fontSize: 11,
    color: '#9ca3af',
    textAlign: 'center',
  },
});

export default PaymentDialog;