import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * ReviewFilters - Filter and sort controls for reviews
 * @param {number} filterRating - Currently active rating filter (null for all)
 * @param {string} sortBy - Current sort option
 * @param {function} onFilterChange - Callback when filter changes
 * @param {function} onSortChange - Callback when sort changes
 */
const ReviewFilters = React.memo(function ReviewFilters({ filterRating, sortBy, onFilterChange, onSortChange }) {
  const sortOptions = [
    { value: 'recent', label: 'Most Recent' },
    { value: 'helpful', label: 'Most Helpful' },
    { value: 'highest', label: 'Highest Rating' },
    { value: 'lowest', label: 'Lowest Rating' },
  ];

  const [showSortMenu, setShowSortMenu] = React.useState(false);

  const currentSortLabel = sortOptions.find(opt => opt.value === sortBy)?.label || 'Sort';

  return (
    <View style={styles.container}>
      {/* Rating filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersContainer}
      >
        <TouchableOpacity
          style={[styles.filterChip, filterRating === null && styles.filterChipActive]}
          onPress={() => onFilterChange(null)}
          activeOpacity={0.7}
        >
          <Text style={[styles.filterChipText, filterRating === null && styles.filterChipTextActive]}>
            All
          </Text>
        </TouchableOpacity>

        {[5, 4, 3, 2, 1].map((star) => (
          <TouchableOpacity
            key={star}
            style={[styles.filterChip, filterRating === star && styles.filterChipActive]}
            onPress={() => onFilterChange(star)}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterChipText, filterRating === star && styles.filterChipTextActive]}>
              {star} ★
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Sort dropdown */}
      <View style={styles.sortContainer}>
        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => setShowSortMenu(!showSortMenu)}
          activeOpacity={0.7}
        >
          <Text style={styles.sortButtonText}>{currentSortLabel}</Text>
          <Ionicons
            name={showSortMenu ? "chevron-up" : "chevron-down"}
            size={16}
            color="#6b7280"
          />
        </TouchableOpacity>

        {showSortMenu && (
          <View style={styles.sortMenu}>
            {sortOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.sortMenuItem,
                  sortBy === option.value && styles.sortMenuItemActive,
                ]}
                onPress={() => {
                  onSortChange(option.value);
                  setShowSortMenu(false);
                }}
              >
                <Text
                  style={[
                    styles.sortMenuItemText,
                    sortBy === option.value && styles.sortMenuItemTextActive,
                  ]}
                >
                  {option.label}
                </Text>
                {sortBy === option.value && (
                  <Ionicons name="checkmark" size={16} color="#16a34a" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingBottom: 12,
    gap: 8,
  },
  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  filterChipActive: {
    backgroundColor: '#16a34a',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#4b5563',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  sortContainer: {
    position: 'relative',
    zIndex: 10,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  sortButtonText: {
    fontSize: 13,
    color: '#374151',
    marginRight: 4,
  },
  sortMenu: {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: 4,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minWidth: 160,
  },
  sortMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  sortMenuItemActive: {
    backgroundColor: '#f0fdf4',
  },
  sortMenuItemText: {
    fontSize: 14,
    color: '#374151',
  },
  sortMenuItemTextActive: {
    color: '#16a34a',
    fontWeight: '600',
  },
});

export default ReviewFilters;
