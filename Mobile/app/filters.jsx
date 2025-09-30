import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import Icon from 'react-native-vector-icons/Feather';
import { useFilters } from '../context/FilterContext';
import { CATEGORIES, CONDITIONS } from '../constants/Categories';

export default function FilterScreen() {
  const router = useRouter();
  const { filters, updateFilters, resetFilters } = useFilters();
  
  const [localFilters, setLocalFilters] = useState(filters);
  const [useLocation, setUseLocation] = useState(false);

  const handleApplyFilters = () => {
    updateFilters(localFilters);
    router.back();
  };

  const handleResetFilters = () => {
    resetFilters();
    setLocalFilters({
      searchQuery: '',
      category: '',
      minPrice: null,
      maxPrice: null,
      condition: '',
      city: '',
      postalCode: '',
      latitude: null,
      longitude: null,
      radius: 0,
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Icon name="x" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Filters</Text>
        <TouchableOpacity onPress={handleResetFilters}>
          <Text style={styles.resetText}>Reset</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Category Filter */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Category</Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.name}
                style={[
                  styles.categoryChip,
                  localFilters.category === cat.name && styles.categoryChipActive
                ]}
                onPress={() => setLocalFilters({ ...localFilters, category: cat.name })}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    localFilters.category === cat.name && styles.categoryChipTextActive
                  ]}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Price Range */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Price Range</Text>
          <View style={styles.priceInputs}>
            <View style={styles.priceInputContainer}>
              <Text style={styles.priceLabel}>Min Price</Text>
              <TextInput
                style={styles.priceInput}
                placeholder="0"
                keyboardType="numeric"
                value={localFilters.minPrice?.toString() || ''}
                onChangeText={(text) => setLocalFilters({ 
                  ...localFilters, 
                  minPrice: text ? parseInt(text) : null 
                })}
              />
            </View>
            <Text style={styles.priceSeparator}>-</Text>
            <View style={styles.priceInputContainer}>
              <Text style={styles.priceLabel}>Max Price</Text>
              <TextInput
                style={styles.priceInput}
                placeholder="10000"
                keyboardType="numeric"
                value={localFilters.maxPrice?.toString() || ''}
                onChangeText={(text) => setLocalFilters({ 
                  ...localFilters, 
                  maxPrice: text ? parseInt(text) : null 
                })}
              />
            </View>
          </View>
        </View>

        {/* Condition Filter */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Condition</Text>
          <View style={styles.conditionButtons}>
            {CONDITIONS.map((cond) => (
              <TouchableOpacity
                key={cond}
                style={[
                  styles.conditionButton,
                  localFilters.condition === cond && styles.conditionButtonActive
                ]}
                onPress={() => setLocalFilters({ 
                  ...localFilters, 
                  condition: localFilters.condition === cond ? '' : cond 
                })}
              >
                <Text
                  style={[
                    styles.conditionButtonText,
                    localFilters.condition === cond && styles.conditionButtonTextActive
                  ]}
                >
                  {cond}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Location Filter */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          
          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>Use my current location</Text>
            <Switch
              value={useLocation}
              onValueChange={setUseLocation}
              trackColor={{ false: '#D1D5DB', true: '#4ADE80' }}
              thumbColor={useLocation ? '#FFFFFF' : '#F3F4F6'}
            />
          </View>

          {!useLocation && (
            <>
              <TextInput
                style={styles.input}
                placeholder="City"
                value={localFilters.city}
                onChangeText={(text) => setLocalFilters({ ...localFilters, city: text })}
              />
              <TextInput
                style={styles.input}
                placeholder="Postal Code"
                value={localFilters.postalCode}
                onChangeText={(text) => setLocalFilters({ ...localFilters, postalCode: text })}
              />
            </>
          )}

          {useLocation && (
            <View style={styles.radiusContainer}>
              <Text style={styles.radiusLabel}>
                Search Radius: {localFilters.radius} km
              </Text>
              <View style={styles.sliderContainer}>
                <Text style={styles.sliderValue}>0 km</Text>
                <View style={styles.sliderTrack}>
                  <View style={[styles.sliderFill, { width: `${localFilters.radius}%` }]} />
                </View>
                <Text style={styles.sliderValue}>100 km</Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.applyButton} onPress={handleApplyFilters}>
          <Text style={styles.applyButtonText}>Apply Filters</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#4ADE80',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  resetText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryChipActive: {
    backgroundColor: '#DCFCE7',
    borderColor: '#4ADE80',
  },
  categoryChipText: {
    fontSize: 14,
    color: '#6B7280',
  },
  categoryChipTextActive: {
    color: '#16A34A',
    fontWeight: '600',
  },
  priceInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  priceInputContainer: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  priceInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
  },
  priceSeparator: {
    fontSize: 18,
    color: '#6B7280',
    marginTop: 20,
  },
  conditionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  conditionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  conditionButtonActive: {
    backgroundColor: '#DCFCE7',
    borderColor: '#4ADE80',
  },
  conditionButtonText: {
    fontSize: 14,
    color: '#6B7280',
  },
  conditionButtonTextActive: {
    color: '#16A34A',
    fontWeight: '600',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  switchLabel: {
    fontSize: 14,
    color: '#1F2937',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
  },
  radiusContainer: {
    marginTop: 12,
  },
  radiusLabel: {
    fontSize: 14,
    color: '#1F2937',
    marginBottom: 8,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sliderValue: {
    fontSize: 12,
    color: '#6B7280',
  },
  sliderTrack: {
    flex: 1,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
  },
  sliderFill: {
    height: '100%',
    backgroundColor: '#4ADE80',
    borderRadius: 2,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  applyButton: {
    backgroundColor: '#4ADE80',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});