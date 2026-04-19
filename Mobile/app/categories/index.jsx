import { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useFilters } from '../../context/FilterContext';

const CATEGORIES = [
  { key: 'Cars & Motorcycles',         icon: 'car',            color: '#EF4444', bg: '#FEF2F2' },
  { key: 'Real Estate',                icon: 'home',           color: '#8B5CF6', bg: '#F5F3FF' },
  { key: 'Electronics',                icon: 'phone-portrait', color: '#3B82F6', bg: '#EFF6FF' },
  { key: 'Household & Furniture',      icon: 'bed',            color: '#F59E0B', bg: '#FFFBEB' },
  { key: 'Jobs',                       icon: 'briefcase',      color: '#10B981', bg: '#ECFDF5' },
  { key: 'Leisure, Hobby & Neighborhood', icon: 'football',    color: '#EC4899', bg: '#FDF2F8' },
  { key: 'Service',                    icon: 'construct',      color: '#6366F1', bg: '#EEF2FF' },
  { key: 'Other',                      icon: 'grid',           color: '#6B7280', bg: '#F9FAFB' },
];

export default function CategoriesScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { updateFilters } = useFilters();
  const [selected, setSelected] = useState(null);

  const handleSelect = useCallback((category) => {
    setSelected(category.key);
    updateFilters({ category: category.key });
    router.push('/');
  }, [updateFilters, router]);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.card, selected === item.key && styles.cardSelected]}
      onPress={() => handleSelect(item)}
      activeOpacity={0.75}
    >
      <View style={[styles.iconBox, { backgroundColor: item.bg }]}>
        <Ionicons name={item.icon} size={28} color={item.color} />
      </View>
      <Text style={styles.cardLabel} numberOfLines={2}>{item.key}</Text>
      <Ionicons name="chevron-forward" size={16} color="#9CA3AF" style={styles.chevron} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('home.categories.general')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={CATEGORIES}
        renderItem={renderItem}
        keyExtractor={(item) => item.key}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  list: { padding: 16, gap: 10 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    gap: 14,
  },
  cardSelected: { borderColor: '#008235', backgroundColor: '#F0FFF4' },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardLabel: { flex: 1, fontSize: 15, fontWeight: '500', color: '#111827' },
  chevron: { marginLeft: 'auto' },
});
