import { useState } from 'react';
import {
  View, Text, TouchableOpacity, Modal, FlatList,
  StyleSheet, SafeAreaView, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * CustomSelect — in-app styled dropdown replacing native Picker.
 *
 * Props:
 *   label        string   — field label shown above the button
 *   value        string   — currently selected value
 *   options      Array<{ label: string, value: string }>
 *   onChange     fn(value) — called when user picks an option
 *   placeholder  string   — shown when nothing is selected
 *   error        string   — error message shown below
 *   required     bool
 */
export default function CustomSelect({
  label,
  value,
  options = [],
  onChange,
  placeholder = 'Select an option',
  error,
  required = false,
}) {
  const [open, setOpen] = useState(false);

  const selected = options.find(o => o.value === value);

  return (
    <View style={styles.wrapper}>
      {label ? (
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      ) : null}

      <TouchableOpacity
        style={[styles.button, error && styles.buttonError]}
        onPress={() => setOpen(true)}
        activeOpacity={0.7}
      >
        <Text style={[styles.buttonText, !selected && styles.placeholder]}>
          {selected ? selected.label : placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color="#6B7280" />
      </TouchableOpacity>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setOpen(false)} />
        <SafeAreaView style={styles.sheet}>
          <StatusBar barStyle="dark-content" />

          {/* Header */}
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>{label || 'Select'}</Text>
            <TouchableOpacity onPress={() => setOpen(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={22} color="#374151" />
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          {/* Options list */}
          <FlatList
            data={options}
            keyExtractor={item => item.value}
            renderItem={({ item }) => {
              const isSelected = item.value === value;
              return (
                <TouchableOpacity
                  style={[styles.option, isSelected && styles.optionSelected]}
                  onPress={() => { onChange(item.value); setOpen(false); }}
                  activeOpacity={0.65}
                >
                  <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                    {item.label}
                  </Text>
                  {isSelected && <Ionicons name="checkmark" size={18} color="#008235" />}
                </TouchableOpacity>
              );
            }}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 4 },

  label: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 6 },
  required: { color: '#EF4444' },

  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  buttonError: { borderColor: '#EF4444' },
  buttonText: { fontSize: 15, color: '#111827', flex: 1 },
  placeholder: { color: '#9CA3AF' },
  errorText: { fontSize: 12, color: '#EF4444', marginTop: 4 },

  // Modal
  backdrop: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  sheetTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
  divider: { height: 1, backgroundColor: '#F3F4F6' },

  listContent: { paddingBottom: 24 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  optionSelected: { backgroundColor: '#F0FFF4' },
  optionText: { fontSize: 15, color: '#374151' },
  optionTextSelected: { color: '#008235', fontWeight: '600' },
  separator: { height: 1, backgroundColor: '#F9FAFB', marginHorizontal: 20 },
});
