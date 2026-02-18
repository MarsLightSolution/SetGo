import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import logger from '../utils/logger';
import { getUserId } from '../services/secureAuthService';

const { width: _width } = Dimensions.get('window'); // Prefixed with _ since not currently used

import { API_ENDPOINTS } from '../config/api';

// Helper function to get text from multilingual object
const getTextValue = (textObj, fallback = '') => {
  if (!textObj) return fallback;
  if (typeof textObj === 'string') return textObj;
  if (typeof textObj === 'object') {
    return textObj.en || textObj.az || textObj.ru || Object.values(textObj)[0] || fallback;
  }
  return fallback;
};

const parseNumber = (v) => {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const formatNumber = (v) => {
  const n = parseNumber(v);
  return (n ?? 0).toLocaleString();
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
  const [customAmount, setCustomAmount] = useState(''); // Custom wallet amount
  const [status, setStatus] = useState('READY'); // READY, LOADING, SUCCESS, FAILURE
  const [errorMessage, setErrorMessage] = useState('');
  const [loadingWallet, setLoadingWallet] = useState(false);

  // Animation values
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const price = product?.price ?? 0;

  // Calculate actual wallet amount to use
  const walletAmountToUse = useMemo(() => {
    if (!useWallet) return 0;

    if (customAmount === '') {
      // Use maximum possible (either full balance or price, whichever is lower)
      return Math.min(walletBalance, price);
    }

    const amount = parseFloat(customAmount);
    if (isNaN(amount) || amount <= 0) return 0;

    // Ensure amount doesn't exceed wallet balance or price
    return Math.min(amount, walletBalance, price);
  }, [useWallet, customAmount, walletBalance, price]);

  // Calculate remaining amount to pay online
  const remainingAmount = useMemo(() => {
    return Math.max(0, price - walletAmountToUse);
  }, [price, walletAmountToUse]);

  // Get product title (handles both string and object)
  const productTitle = useMemo(() => {
    return getTextValue(product?.title, 'Unnamed Product');
  }, [product?.title]);

  // Fetch wallet balance
  const fetchWalletBalance = useCallback(async (retryCount = 0) => {
    if (!user?.userId) return;

    setLoadingWallet(true);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const res = await fetch(API_ENDPOINTS.USER_WALLET(user.userId), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      logger.log('Wallet response:', data);

      // Extract wallet balance from response
      const balance =
        data?.data?.walletBalance ??
        data?.walletBalance ??
        data?.balance ??
        data?.data ??
        0;

      setWalletBalance(typeof balance === 'number' ? balance : 0);
    } catch (err) {
      logger.error('Wallet fetch error:', err);

      if (retryCount === 0) {
        setTimeout(() => fetchWalletBalance(1), 1500);
      } else {
        setWalletBalance(user?.walletBalance ?? 0);
      }
    } finally {
      setLoadingWallet(false);
    }
  }, [user?.userId, user?.walletBalance]);

  useEffect(() => {
    if (isVisible && user?.userId) {
      fetchWalletBalance();
    }
  }, [isVisible, fetchWalletBalance, user?.userId]);

  useEffect(() => {
    if (status === 'SUCCESS' || status === 'FAILURE') {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }).start();
    } else {
      scaleAnim.setValue(0);
    }
  }, [status, scaleAnim]);

  // Handler for custom amount input
  const handleCustomAmountChange = (value) => {
    // Allow empty string or valid numbers with up to 2 decimal places
    if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
      setCustomAmount(value);
    }
  };

  // Quick select buttons for wallet amount
  const handleQuickSelect = (percentage) => {
    const maxUsable = Math.min(walletBalance, price);
    const amount = (maxUsable * percentage).toFixed(2);
    setCustomAmount(amount);
  };

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
    setCustomAmount('');
    setErrorMessage('');

    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      fadeAnim.setValue(1);
      onClose();
    });
  }, [status, onClose, fadeAnim]);

  /**
   * UNIFIED PAYMENT PROCESSING
   * Uses the new /api/payments/initiate endpoint
   * Backend handles: product lookup, price validation, wallet deduction, payment processing
   */
  const processPayment = async () => {
    setStatus('LOADING');
    setErrorMessage('');

    // Get userId from secure storage
    const storedUserId = await getUserId();
    const buyerId = storedUserId || user?.userId;

    if (!buyerId) {
      setStatus('FAILURE');
      setErrorMessage('Authentication required. Please log in again.');
      return;
    }

    // Minimal payload - backend fetches product details and validates
    const payload = {
      buyerId: buyerId,
      productId: product._id,
      walletUsed: useWallet,
      walletAmount: walletAmountToUse,
      checkoutDetails: {
        name: user.fullName || user.name || user.userName || 'N/A',
        email: user.email || 'N/A',
        city: user.city || 'Not specified',
        address: user.address || 'Not specified',
        pincode: user.postalCode || user.zipCode || 'Not specified',
      },
    };

    logger.log('Payment payload:', payload);

    try {
      const res = await fetch(API_ENDPOINTS.PAYMENT_INITIATE, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      logger.log('Payment response:', data);

      // Handle unauthorized/authentication errors
      if (res.status === 401 || res.status === 403) {
        setStatus('FAILURE');
        setErrorMessage('Session expired. Please log in again.');
        return;
      }

      if (data.success === true) {
        // If payment completed without redirect (wallet-only payment)
        if (data.completed === true) {
          logger.log('Payment completed successfully');
          setStatus('SUCCESS');

          // Notify parent component
          onPaymentSuccess?.(price);

          // Navigate to order page
          setTimeout(() => {
            handleClose();
            if (data.orderId) {
              router.push({
                pathname: `/order/${data.orderId}`,
              });
            }
          }, 2300);
        }
        // If payment requires redirect (online payment or wallet + online)
        else if (data.url) {
          // Store pending payment info
          try {
            await AsyncStorage.setItem('pendingPayment', JSON.stringify({
              orderId: data.orderId,
              transactionId: data.transactionId,
              timestamp: Date.now(),
            }));
          } catch (e) {
            logger.warn('Failed to store pending payment:', e);
          }

          // Open payment URL
          Alert.alert(
            'Complete Payment',
            'You will be redirected to complete your payment securely.',
            [
              {
                text: 'Cancel',
                onPress: () => {
                  setStatus('READY');
                },
                style: 'cancel',
              },
              {
                text: 'Continue',
                onPress: () => {
                  Linking.openURL(data.url).catch(err => {
                    logger.error('Failed to open payment URL:', err);
                    setStatus('FAILURE');
                    setErrorMessage('Failed to open payment page. Please try again.');
                  });
                },
              },
            ],
            { cancelable: false }
          );
        } else {
          setStatus('FAILURE');
          setErrorMessage('Invalid payment response. Please try again.');
        }
      } else {
        setStatus('FAILURE');
        setErrorMessage(data.message || 'Payment failed. Please try again.');
      }
    } catch (err) {
      logger.error('Payment error:', err);
      setStatus('FAILURE');
      setErrorMessage('Network error. Please check your connection.');
    }
  };

  const handlePay = async () => {
    if (status === 'FAILURE') {
      setStatus('READY');
      setErrorMessage('');
      return;
    }

    if (isPayDisabled) return;

    await processPayment();
  };

  const payLabel = useMemo(() => {
    if (status === 'LOADING') return 'Processing Payment...';
    if (status === 'SUCCESS') return 'Payment Successful';
    if (status === 'FAILURE') return 'Retry Payment';
    return `Pay ₼ ${formatNumber(price)}`;
  }, [status, price]);

  const isPayDisabled = status === 'LOADING' || status === 'SUCCESS';

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
          <Text style={styles.statusSubtext}>Redirecting to order...</Text>
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
          {errorMessage && (
            <Text style={styles.errorMessage}>{errorMessage}</Text>
          )}
          <Text style={styles.statusSubtext}>Please try again</Text>
        </Animated.View>
      );
    }

    return null;
  };

  // Validation check
  const customAmountExceedsLimit = customAmount &&
    parseFloat(customAmount) > Math.min(walletBalance, price);

  if (!product || !user) {
    logger.warn('PaymentDialog: Missing required props', {
      product: !!product,
      user: !!user,
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
                {/* Order Summary */}
                <View style={styles.summaryCard}>
                  <Text style={styles.sectionTitle}>Order Summary</Text>

                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Product</Text>
                    <Text style={styles.productName} numberOfLines={1}>{productTitle}</Text>
                  </View>

                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Product Price</Text>
                    <Text style={styles.priceText}>₼ {formatNumber(price)}</Text>
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
                            ₼ {formatNumber(walletBalance)}
                          </Text>
                          <Ionicons name="refresh-outline" size={16} color="#6b7280" />
                        </View>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Payment Breakdown */}
                  {useWallet && walletAmountToUse > 0 && (
                    <>
                      <View style={[styles.summaryRow, styles.breakdownRow]}>
                        <Text style={styles.summaryLabel}>Wallet Payment</Text>
                        <Text style={styles.walletDeductText}>
                          - ₼ {walletAmountToUse.toFixed(2)}
                        </Text>
                      </View>
                      <View style={[styles.summaryRow, styles.totalRow]}>
                        <Text style={styles.totalLabel}>Online Payment</Text>
                        <Text style={styles.totalValue}>
                          ₼ {remainingAmount.toFixed(2)}
                        </Text>
                      </View>
                    </>
                  )}
                </View>

                {/* Wallet Checkbox */}
                {walletBalance > 0 && (
                  <View style={styles.walletSection}>
                    <TouchableOpacity
                      style={styles.walletToggle}
                      onPress={() => {
                        setUseWallet(!useWallet);
                        if (useWallet) {
                          setCustomAmount('');
                        }
                      }}
                      disabled={status !== 'READY'}
                    >
                      <View style={[styles.checkbox, useWallet && styles.checkboxChecked]}>
                        {useWallet && (
                          <Ionicons name="checkmark" size={16} color="#fff" />
                        )}
                      </View>
                      <Text style={styles.walletToggleText}>Use Wallet Balance</Text>
                    </TouchableOpacity>

                    {/* Custom Amount Input */}
                    {useWallet && (
                      <View style={styles.customAmountContainer}>
                        <Text style={styles.customAmountLabel}>
                          Enter Amount to Use from Wallet
                        </Text>
                        <View style={styles.inputWrapper}>
                          <Text style={styles.currencyPrefix}>₼</Text>
                          <TextInput
                            style={styles.customAmountInput}
                            value={customAmount}
                            onChangeText={handleCustomAmountChange}
                            placeholder={`Max: ${Math.min(walletBalance, price).toFixed(2)}`}
                            placeholderTextColor="#9ca3af"
                            keyboardType="decimal-pad"
                            editable={status === 'READY'}
                          />
                        </View>

                        {/* Quick Select Buttons */}
                        <View style={styles.quickSelectRow}>
                          {[0.25, 0.5, 0.75, 1].map((percent) => (
                            <TouchableOpacity
                              key={percent}
                              style={styles.quickSelectBtn}
                              onPress={() => handleQuickSelect(percent)}
                              disabled={status !== 'READY'}
                            >
                              <Text style={styles.quickSelectText}>
                                {percent === 1 ? 'Max' : `${percent * 100}%`}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>

                        {/* Validation Message */}
                        {customAmountExceedsLimit && (
                          <Text style={styles.validationError}>
                            Amount exceeds available balance or price
                          </Text>
                        )}
                      </View>
                    )}
                  </View>
                )}

                {/* Wallet Usage Info */}
                {useWallet && walletAmountToUse > 0 && (
                  <View style={styles.infoCard}>
                    <Ionicons name="information-circle" size={20} color="#3b82f6" />
                    <Text style={styles.infoText}>
                      {walletAmountToUse >= price
                        ? `Full amount (₼ ${walletAmountToUse.toFixed(2)}) will be paid from your wallet.`
                        : `₼ ${walletAmountToUse.toFixed(2)} will be deducted from wallet. Remaining ₼ ${remainingAmount.toFixed(2)} will be paid online.`}
                    </Text>
                  </View>
                )}

                {/* Payment Method Info */}
                {(!useWallet || remainingAmount > 0) && (
                  <View style={styles.paymentMethodCard}>
                    <View style={styles.paymentMethodIcon}>
                      <Ionicons name="card" size={24} color="#16a34a" />
                    </View>
                    <View style={styles.paymentMethodInfo}>
                      <Text style={styles.paymentMethodTitle}>Secure Payment</Text>
                      <Text style={styles.paymentMethodSubtitle}>
                        Powered by Azericard Gateway
                      </Text>
                    </View>
                  </View>
                )}
              </>
            ) : (
              renderStatusAnimation()
            )}
          </ScrollView>

          {/* Pay Button */}
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
                {status === 'LOADING' ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.payButtonText}>{payLabel}</Text>
                )}
              </TouchableOpacity>

              {/* Security Badge */}
              <View style={styles.securityFooter}>
                <Ionicons name="lock-closed" size={14} color="#9ca3af" />
                <Text style={styles.securityText}>
                  Secured Payment • PCI DSS Certified
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
    minHeight: '60%',
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
    flexGrow: 1,
    flexShrink: 1,
  },
  scrollContentContainer: {
    padding: 20,
  },
  summaryCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#374151',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  breakdownRow: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    marginTop: 8,
    paddingTop: 12,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  priceText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#16a34a',
  },
  productName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    flex: 1,
    textAlign: 'right',
    marginLeft: 8,
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
  walletDeductText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#16a34a',
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3b82f6',
  },
  walletSection: {
    marginBottom: 16,
  },
  walletToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  walletToggleText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#374151',
    marginLeft: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
  },
  customAmountContainer: {
    marginTop: 12,
    padding: 16,
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  customAmountLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  currencyPrefix: {
    paddingLeft: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  customAmountInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    fontSize: 16,
    color: '#111827',
  },
  quickSelectRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  quickSelectBtn: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#16a34a',
    alignItems: 'center',
  },
  quickSelectText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16a34a',
  },
  validationError: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 8,
  },
  infoCard: {
    backgroundColor: '#eff6ff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  infoText: {
    fontSize: 13,
    color: '#1e40af',
    lineHeight: 18,
    marginLeft: 8,
    flex: 1,
  },
  paymentMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    marginBottom: 16,
  },
  paymentMethodIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#fff',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  paymentMethodInfo: {
    marginLeft: 12,
  },
  paymentMethodTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  paymentMethodSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
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
  errorMessage: {
    fontSize: 13,
    color: '#ef4444',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
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
