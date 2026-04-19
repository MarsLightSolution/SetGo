import { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, StatusBar, Modal, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_ENDPOINTS } from '../../config/api';
import { getAuthToken } from '../../services/secureAuthService';

const logKeys = {
  list: (resolved) => ['admin', 'errorLogs', resolved],
};

async function fetchLogs(resolved) {
  const token = await getAuthToken();
  const url = `${API_ENDPOINTS.ERROR_LOG_LIST}?resolved=${resolved}&limit=50`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  return data.data?.logs || [];
}

async function resolveLog(id) {
  const token = await getAuthToken();
  await fetch(API_ENDPOINTS.ERROR_LOG_RESOLVE(id), {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  });
}

const TYPE_COLOR = { boundary: '#EF4444', api: '#F59E0B', unknown: '#6B7280' };

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function ErrorLogsScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const [showResolved, setShowResolved] = useState(false);
  const [selected, setSelected] = useState(null);

  const { data: logs = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: logKeys.list(showResolved),
    queryFn: () => fetchLogs(showResolved),
    staleTime: 60 * 1000,
  });

  const resolveMutation = useMutation({
    mutationFn: resolveLog,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'errorLogs'] });
      setSelected(null);
    },
  });

  const renderItem = ({ item }) => {
    const typeColor = TYPE_COLOR[item.type] || TYPE_COLOR.unknown;
    return (
      <TouchableOpacity style={styles.card} onPress={() => setSelected(item)} activeOpacity={0.75}>
        <View style={styles.cardTop}>
          <View style={[styles.typeBadge, { backgroundColor: `${typeColor}20` }]}>
            <Text style={[styles.typeText, { color: typeColor }]}>{item.type || 'unknown'}</Text>
          </View>
          <Text style={styles.time}>{timeAgo(item.createdAt)}</Text>
        </View>
        <Text style={styles.msg} numberOfLines={2}>{item.message}</Text>
        <Text style={styles.module}>{item.module || '—'} · {item.platform || '—'} · v{item.appVersion || '?'}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Error Logs</Text>
        <TouchableOpacity
          style={[styles.toggleBtn, showResolved && styles.toggleBtnActive]}
          onPress={() => setShowResolved((v) => !v)}
        >
          <Text style={[styles.toggleText, showResolved && styles.toggleTextActive]}>
            {showResolved ? 'Resolved' : 'Open'}
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color="#008235" style={{ marginTop: 48 }} />
      ) : (
        <FlatList
          data={logs}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={logs.length === 0 ? styles.emptyContainer : styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#008235" />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="checkmark-circle-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No {showResolved ? 'resolved' : 'open'} errors</Text>
            </View>
          }
        />
      )}

      {/* Detail Modal */}
      <Modal visible={!!selected} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSelected(null)}>
        {selected && (
          <SafeAreaView style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} numberOfLines={1}>{selected.type} error</Text>
              <TouchableOpacity onPress={() => setSelected(null)}>
                <Ionicons name="close" size={24} color="#111827" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <Text style={styles.detailLabel}>Message</Text>
              <Text style={styles.detailValue}>{selected.message}</Text>

              {selected.stack ? <>
                <Text style={styles.detailLabel}>Stack</Text>
                <Text style={[styles.detailValue, styles.mono]}>{selected.stack}</Text>
              </> : null}

              <Text style={styles.detailLabel}>Context</Text>
              <Text style={styles.detailValue}>
                Module: {selected.module || '—'}{'\n'}
                Platform: {selected.platform || '—'}{'\n'}
                App version: {selected.appVersion || '—'}{'\n'}
                OS: {selected.osVersion || '—'}{'\n'}
                Device: {selected.device || '—'}
              </Text>

              {selected.extra ? <>
                <Text style={styles.detailLabel}>Extra</Text>
                <Text style={[styles.detailValue, styles.mono]}>
                  {JSON.stringify(selected.extra, null, 2)}
                </Text>
              </> : null}

              <Text style={styles.detailLabel}>Time</Text>
              <Text style={styles.detailValue}>{new Date(selected.createdAt).toLocaleString()}</Text>
            </ScrollView>

            {!selected.resolved && (
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.resolveBtn}
                  onPress={() => resolveMutation.mutate(selected._id)}
                  disabled={resolveMutation.isPending}
                >
                  {resolveMutation.isPending
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={styles.resolveBtnText}>Mark as Resolved</Text>
                  }
                </TouchableOpacity>
              </View>
            )}
          </SafeAreaView>
        )}
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  toggleBtn: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  toggleBtnActive: { backgroundColor: '#008235', borderColor: '#008235' },
  toggleText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  toggleTextActive: { color: '#fff' },
  list: { padding: 12, gap: 10 },
  emptyContainer: { flex: 1 },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14, gap: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  typeBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  typeText: { fontSize: 12, fontWeight: '700' },
  time: { fontSize: 12, color: '#9CA3AF' },
  msg: { fontSize: 13, color: '#374151', lineHeight: 18 },
  module: { fontSize: 11, color: '#9CA3AF' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#374151', marginTop: 12 },
  modal: { flex: 1, backgroundColor: '#fff' },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827', flex: 1, marginRight: 12 },
  modalBody: { flex: 1, padding: 16 },
  detailLabel: { fontSize: 12, fontWeight: '700', color: '#6B7280', marginTop: 16, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  detailValue: { fontSize: 14, color: '#111827', lineHeight: 20 },
  mono: { fontFamily: 'monospace', fontSize: 12, backgroundColor: '#F3F4F6', borderRadius: 6, padding: 10 },
  modalFooter: { padding: 16, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  resolveBtn: {
    backgroundColor: '#008235', paddingVertical: 14, borderRadius: 12, alignItems: 'center',
  },
  resolveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
