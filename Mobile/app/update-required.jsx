import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const APP_STORE_URL = 'https://play.google.com/store/apps/details?id=com.setgo.app';

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
        <TouchableOpacity style={styles.btn} onPress={() => Linking.openURL(APP_STORE_URL)}>
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
