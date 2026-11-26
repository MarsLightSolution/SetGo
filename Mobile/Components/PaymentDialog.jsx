import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
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
import { useTranslation } from 'react-i18next';
import logger from '../utils/logger';
import api from '../services/api';
import CardPaymentWebView from './CardPaymentWebView';
import { API_ENDPOINTS } from '../config/api';
import { PENDING_PAYMENT_KEY } from '../hooks/usePendingPaymentCheck';

const { width: _width } = Dimensions.get('window'); // Prefixed with _ since not currently used
const POLL_INTERVAL_MS = 2500;
const POLL_TIMEOUT_MS = 60 * 1000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Azerbaijan postal codes: 4 digits (same rule as the web checkout).
const POSTAL_RE = /^\d{4}$/;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Pull a readable message out of an axios error / backend error body.
const errorMessageFrom = (err, fallback) => {
  const status = err?.response?.status;
  if (status === 401) return 'Session expired. Please log in again.';
  return err?.response?.data?.message || (err?.response ? fallback : 'Network error. Please check your connection.');
};

const validateDetails = (d) => {
  const errors = {};
  if (!d.name.trim()) errors.name = 'Full name is required';
  if (!EMAIL_RE.test(d.email.trim())) errors.email = 'Enter a valid email';
  if (!d.address.trim()) errors.address = 'Address is required';
  if (!d.city.trim()) errors.city = 'City is required';
  if (!POSTAL_RE.test(d.pincode.trim())) errors.pincode = 'Postal code must be 4 digits';
  return errors;
};

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
  const { i18n } = useTranslation();
  const [walletBalance, setWalletBalance] = useState(0);
  const [useWallet, setUseWallet] = useState(false);
  const [customAmount, setCustomAmount] = useState(''); // Custom wallet amount
  // READY, LOADING, BANK (card page open), CONFIRMING (waiting for bank), PENDING, SUCCESS, FAILURE
  const [status, setStatus] = useState('READY');
  const [errorMessage, setErrorMessage] = useState('');
  const [loadingWallet, setLoadingWallet] = useState(false);
  const [details, setDetails] = useState({ name: '', email: '', address: '', city: '', pincode: '' });
  const [detailErrors, setDetailErrors] = useState({});
  const [gateway, setGateway] = useState(null);
  const [cardOrderId, setCardOrderId] = useState(null);
  const pollCancelledRef = useRef(false);

  // Prefill checkout details from the profile whenever the dialog opens.
  useEffect(() => {
    if (!isVisible || !user) return;
    setDetails({
      name: user.fullName || user.name || user.userName || '',
      email: user.email || '',
      address: user.address || '',
      city: user.city || '',
      pincode: String(user.postalCode || user.zipCode || ''),
    });
    setDetailErrors({});
  }, [isVisible, user]);

  useEffect(() => () => { pollCancelledRef.current = true; }, []);

  const updateDetail = (field, value) => {
    setDetails((d) => ({ ...d, [field]: value }));
    if (detailErrors[field]) setDetailErrors((e) => ({ ...e, [field]: undefined }));
  };

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
      // Shared client: sends the Bearer token and refreshes it if needed.
      const { data } = await api.get(API_ENDPOINTS.USER_WALLET(user.userId), { timeout: 8000 });

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

  // Resets and closes without checking status (used after success / from the pending screen).
  const closeDialog = useCallback(() => {
    pollCancelledRef.current = true;
    setStatus('READY');
    setUseWallet(false);
    setCustomAmount('');
    setErrorMessage('');
    setGateway(null);
    setCardOrderId(null);

    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      fadeAnim.setValue(1);
      onClose();
    });
  }, [onClose, fadeAnim]);

  const handleClose = useCallback(() => {
    if (status === 'LOADING' || status === 'CONFIRMING') {
      Alert.alert(
        'Payment in Progress',
        'Please wait while we confirm your payment.',
        [{ text: 'OK' }]
      );
      return;
    }
    closeDialog();
  }, [status, closeDialog]);

  const finishSuccess = useCallback((orderId) => {
    AsyncStorage.removeItem(PENDING_PAYMENT_KEY).catch(() => {});
    setStatus('SUCCESS');
    onPaymentSuccess?.(price);
    setTimeout(() => {
      closeDialog();
      if (orderId) router.push({ pathname: `/order/${orderId}` });
    }, 2300);
  }, [onPaymentSuccess, price, closeDialog, router]);

  /**
   * After the bank page closes, ask the backend what the bank said. Only the bank's signed
   * callback changes the order, so this just waits for paymentStatus to leave "processing".
   */
  const pollCardOrder = useCallback(async (orderId) => {
    pollCancelledRef.current = false;
    setStatus('CONFIRMING');
    const deadline = Date.now() + POLL_TIMEOUT_MS;

    while (!pollCancelledRef.current && Date.now() < deadline) {
      try {
        const { data } = await api.get(API_ENDPOINTS.PAYMENT_ORDER(orderId), { timeout: 10000 });
        const order = data?.data?.order;
        if (order?.paymentStatus === 'completed') {
          finishSuccess(orderId);
          return;
        }
        if (order?.paymentStatus === 'failed') {
          AsyncStorage.removeItem(PENDING_PAYMENT_KEY).catch(() => {});
          setStatus('FAILURE');
          setErrorMessage('The bank did not approve this payment. You were not charged; any wallet amount was returned.');
          fetchWalletBalance(0);
          return;
        }
      } catch (err) {
        logger.warn('Order status check failed:', err?.message);
      }
      await sleep(POLL_INTERVAL_MS);
    }
    if (!pollCancelledRef.current) setStatus('PENDING');
  }, [finishSuccess, fetchWalletBalance]);

  /**
   * POST /api/payments/initiate
   *  - wallet covers everything → order is paid immediately
   *  - otherwise → backend returns a signed Azericard form; we open it in a WebView
   * The buyer is always the logged-in user (from the Bearer token).
   */
  const processPayment = async () => {
    const errors = validateDetails(details);
    if (Object.keys(errors).length) {
      setDetailErrors(errors);
      return;
    }

    setStatus('LOADING');
    setErrorMessage('');

    const payload = {
      productId: product._id,
      walletDeduction: Math.round(walletAmountToUse * 100) / 100,
      lang: (i18n?.language || 'az').slice(0, 2),
      checkoutDetails: Object.fromEntries(Object.entries(details).map(([k, v]) => [k, v.trim()])),
    };

    try {
      const { data } = await api.post(API_ENDPOINTS.PAYMENT_INITIATE, payload);
      const orderId = data?.data?.orderId;

      if (data?.success && data.completed) {
        logger.log('Wallet payment completed');
        finishSuccess(orderId);
        return;
      }

      const gw = data?.data?.gateway;
      if (data?.success && gw?.url && gw?.fields && orderId) {
        try {
          await AsyncStorage.setItem(PENDING_PAYMENT_KEY, JSON.stringify({ orderId, timestamp: Date.now() }));
        } catch (e) {
          logger.warn('Failed to store pending payment:', e);
        }
        setCardOrderId(orderId);
        setGateway(gw);
        setStatus('BANK');
        return;
      }

      setStatus('FAILURE');
      setErrorMessage(data?.message || 'Invalid payment response. Please try again.');
    } catch (err) {
      logger.error('Payment error:', err?.response?.data || err?.message);
      setStatus('FAILURE');
      setErrorMessage(errorMessageFrom(err, 'Payment failed. Please try again.'));
    }
  };

  // Bank page finished (returned to our result URL) or the buyer closed it: either way, check.
  const handleBankDone = useCallback(() => {
    setGateway(null);
    if (cardOrderId) pollCardOrder(cardOrderId);
  }, [cardOrderId, pollCardOrder]);

  const handleViewPendingOrder = () => {
    const id = cardOrderId;
    closeDialog();
    if (id) router.push({ pathname: `/order/${id}` });
  };

  const handlePay = async () => {
    if (status === 'PENDING') {
      handleViewPendingOrder();
      return;
    }
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
    if (status === 'FAILURE') return 'Try Again';
    if (status === 'PENDING') return 'View Order';
    if (remainingAmount > 0) return `Pay ₼ ${remainingAmount.toFixed(2)} by card`;
    return `Pay ₼ ${formatNumber(price)} from wallet`;
  }, [status, price, remainingAmount]);

  const isPayDisabled = ['LOADING', 'SUCCESS', 'BANK', 'CONFIRMING'].includes(status);

  const renderStatusAnimation = () => {
    if (status === 'LOADING' || status === 'BANK' || status === 'CONFIRMING') {
      const [title, sub] = {
        LOADING: ['Processing payment...', 'Please wait'],
        BANK: ['Complete payment on the bank page', 'Do not close the app'],
        CONFIRMING: ['Confirming with the bank...', 'This usually takes a few seconds'],
      }[status];
      return (
        <View style={styles.statusContainer}>
          <ActivityIndicator size="large" color="#16a34a" />
          <Text style={styles.statusText}>{title}</Text>
          <Text style={styles.statusSubtext}>{sub}</Text>
        </View>
      );
    }

    if (status === 'PENDING') {
      return (
        <View style={styles.statusContainer}>
          <Ionicons name="time-outline" size={80} color="#f59e0b" />
          <Text style={styles.statusText}>Waiting for bank confirmation</Text>
          <Text style={[styles.statusSubtext, styles.centerText]}>
            We haven&apos;t heard back from the bank yet. Your order is saved and will update
            automatically — you won&apos;t be charged twice.
          </Text>
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
      {/* iOS doesn't resize for the keyboard; lift the sheet so the details form stays visible.
          Android's modal window already resizes, so no extra behavior there. */}
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
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
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
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

                {/* Checkout / delivery details (sent to the bank, so they must be real) */}
                <View style={styles.detailsCard}>
                  <Text style={styles.sectionTitle}>Delivery Details</Text>
                  {[
                    { key: 'name', label: 'Full name', props: { autoCapitalize: 'words', textContentType: 'name' } },
                    { key: 'email', label: 'Email', props: { keyboardType: 'email-address', autoCapitalize: 'none', textContentType: 'emailAddress' } },
                    { key: 'address', label: 'Address', props: { textContentType: 'fullStreetAddress' } },
                    { key: 'city', label: 'City', props: { textContentType: 'addressCity' } },
                    { key: 'pincode', label: 'Postal code (4 digits)', props: { keyboardType: 'number-pad', maxLength: 4, textContentType: 'postalCode' } },
                  ].map(({ key, label, props }) => (
                    <View key={key} style={styles.fieldWrap}>
                      <Text style={styles.fieldLabel}>{label}</Text>
                      <TextInput
                        style={[styles.fieldInput, detailErrors[key] && styles.fieldInputError]}
                        value={details[key]}
                        onChangeText={(v) => updateDetail(key, v)}
                        placeholder={label}
                        placeholderTextColor="#9ca3af"
                        editable={status === 'READY'}
                        {...props}
                      />
                      {detailErrors[key] ? <Text style={styles.validationError}>{detailErrors[key]}</Text> : null}
                    </View>
                  ))}
                </View>

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
      </KeyboardAvoidingView>

      <CardPaymentWebView
        visible={status === 'BANK' && !!gateway}
        gateway={gateway}
        onReturn={handleBankDone}
        onCancel={handleBankDone}
      />
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
  detailsCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  fieldWrap: {
    marginBottom: 10,
  },
  fieldLabel: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 4,
  },
  fieldInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 15,
    color: '#111827',
  },
  fieldInputError: {
    borderColor: '#ef4444',
  },
  centerText: {
    textAlign: 'center',
    paddingHorizontal: 16,
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
