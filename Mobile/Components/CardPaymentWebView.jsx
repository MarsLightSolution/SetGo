// Hosts Azericard's card page inside the app.
//
// The backend returns a signed form ({ url, fields }) that must be POSTed by the browser, so it
// can't be opened with Linking.openURL. We render a tiny HTML page that auto-submits that form in
// a WebView, then watch navigation: once the bank sends the buyer back to our result page
// (MERCH_URL / BACKREF → .../payment/result/:orderId) we close the WebView and let the caller poll
// the order. The WebView never decides the outcome — only the bank's signed callback to the
// backend does.
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import logger from '../utils/logger';

const log = logger.create('CardPayment');

const RESULT_PATH = '/payment/result/';

const escapeHtml = (v) =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

// Base64 without relying on btoa being present in every RN runtime.
const toBase64 = (str) => {
  if (typeof globalThis.btoa === 'function') return globalThis.btoa(str);
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let out = '';
  for (let i = 0; i < str.length; i += 3) {
    const [a, b, c] = [str.charCodeAt(i), str.charCodeAt(i + 1), str.charCodeAt(i + 2)];
    const n = (a << 16) | ((b || 0) << 8) | (c || 0);
    out += chars[(n >> 18) & 63] + chars[(n >> 12) & 63]
      + (i + 1 < str.length ? chars[(n >> 6) & 63] : '=')
      + (i + 2 < str.length ? chars[n & 63] : '=');
  }
  return out;
};

export function buildGatewayHtml({ url, fields }) {
  const { height, width } = Dimensions.get('screen');
  // Browser data the bank uses for 3-D Secure risk checks; not part of the signature.
  const mInfo = toBase64(JSON.stringify({
    browserScreenHeight: String(Math.round(height)),
    browserScreenWidth: String(Math.round(width)),
    browserTZ: String(new Date().getTimezoneOffset()),
  }));
  const inputs = Object.entries({ ...fields, M_INFO: mInfo })
    .map(([name, value]) => `<input type="hidden" name="${escapeHtml(name)}" value="${escapeHtml(value)}" />`)
    .join('');
  return `<!doctype html><html><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<style>body{font-family:-apple-system,Roboto,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;color:#6b7280}</style>
</head><body><p>Redirecting to the secure payment page…</p>
<form id="pay" method="POST" action="${escapeHtml(url)}">${inputs}</form>
<script>document.getElementById('pay').submit();</script>
</body></html>`;
}

const isResultUrl = (u) => typeof u === 'string' && u.includes(RESULT_PATH);

const CardPaymentWebView = ({ visible, gateway, onReturn, onCancel }) => {
  const [loading, setLoading] = useState(true);
  const finishedRef = useRef(false);

  const html = useMemo(() => (gateway ? buildGatewayHtml(gateway) : null), [gateway]);

  const finish = useCallback((cb) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    cb?.();
  }, []);

  // Reset when a new payment opens.
  React.useEffect(() => {
    if (visible) {
      finishedRef.current = false;
      setLoading(true);
    }
  }, [visible, gateway]);

  const handleUrl = useCallback((url) => {
    if (isResultUrl(url)) {
      log.info('Bank returned the buyer to the result page');
      finish(onReturn);
      return false; // don't load the web result page inside the app
    }
    return true;
  }, [finish, onReturn]);

  const confirmCancel = useCallback(() => {
    Alert.alert(
      'Leave payment?',
      'If you already confirmed the payment on the bank page, we will still pick up the result.',
      [
        { text: 'Stay', style: 'cancel' },
        { text: 'Leave', style: 'destructive', onPress: () => finish(onCancel) },
      ]
    );
  }, [finish, onCancel]);

  if (!gateway || !html) return null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={confirmCancel} presentationStyle="fullScreen">
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={confirmCancel} style={styles.headerBtn} accessibilityLabel="Close payment page">
            <Ionicons name="close" size={24} color="#374151" />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Ionicons name="lock-closed" size={14} color="#16a34a" />
            <Text style={styles.headerTitle}>Secure card payment</Text>
          </View>
          <View style={styles.headerBtn} />
        </View>

        <WebView
          originWhitelist={['*']}
          source={{ html, baseUrl: '' }}
          onShouldStartLoadWithRequest={(req) => handleUrl(req.url)}
          onNavigationStateChange={(nav) => { if (isResultUrl(nav.url)) handleUrl(nav.url); }}
          onLoadEnd={() => setLoading(false)}
          onError={({ nativeEvent }) => {
            log.warn('Payment page failed to load:', nativeEvent?.description);
            setLoading(false);
          }}
          javaScriptEnabled
          domStorageEnabled
          sharedCookiesEnabled
          thirdPartyCookiesEnabled
          setSupportMultipleWindows={false}
          mixedContentMode={Platform.OS === 'android' ? 'compatibility' : undefined}
          style={styles.webview}
        />

        {loading && (
          <View style={styles.loading} pointerEvents="none">
            <ActivityIndicator size="large" color="#16a34a" />
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitleWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerTitle: { fontSize: 16, fontWeight: '600', color: '#111827' },
  webview: { flex: 1 },
  loading: { ...StyleSheet.absoluteFillObject, top: 60, alignItems: 'center', justifyContent: 'center' },
});

export default CardPaymentWebView;
