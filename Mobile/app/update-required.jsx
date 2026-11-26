import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { getRemoteKey } from '../services/remoteConfig';

// Package ids are case-sensitive: use the one this build was made with.
const ANDROID_PACKAGE = Constants.expoConfig?.android?.package || 'com.Satgo.app';
const PLAY_STORE_URL = `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}`;
const WEBSITE_URL = 'https://satgo.az';

// iOS: the App Store link (apps.apple.com/app/id…) comes from the backend's config/app keys as
// `iosStoreUrl` once the app is listed; until then, the website.
async function openStore() {
  const url = Platform.OS === 'ios'
    ? await getRemoteKey('iosStoreUrl', WEBSITE_URL)
    : await getRemoteKey('androidStoreUrl', PLAY_STORE_URL);
  Linking.openURL(url).catch(() => Linking.openURL(WEBSITE_URL).catch(() => {}));
}

export default function UpdateRequiredScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Ionicons name="arrow-up-circle" size={72} color="#008235" />
        </View>
        <Text style={styles.title}>Update Required</Text>
        <Text style={styles.body}>
          This version of SetGo is no longer supported. Please update to the latest version to continue.
        </Text>
        <TouchableOpacity style={styles.btn} onPress={openStore}>
          <Text style={styles.btnText}>Update Now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  iconWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F0FFF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
  },
  title: { fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 12, textAlign: 'center' },
  body: { fontSize: 15, color: '#6B7280', textAlign: 'center', lineHeight: 22, marginBottom: 36 },
  btn: {
    backgroundColor: '#008235',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
