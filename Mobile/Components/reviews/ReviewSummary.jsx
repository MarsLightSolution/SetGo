import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import StarRating from './StarRating';

/**
 * ReviewSummary - Displays overall rating summary with breakdown
 * @param {object} summary - { averageRating, totalReviews, ratingBreakdown }
 * @param {function} onFilterPress - Callback when a rating bar is pressed
 * @param {number} activeFilter - Currently active filter rating
 */
const ReviewSummary = React.memo(function ReviewSummary({ summary, onFilterPress, activeFilter }) {
  if (!summary || summary.totalReviews === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>No Reviews Yet</Text>
        <Text style={styles.emptySubtitle}>Be the first to review this product!</Text>
      </View>
    );
  }

  const { averageRating, totalReviews, ratingBreakdown } = summary;

  return (
    <View style={styles.container}>
      {/* Left side - Average rating */}
      <View style={styles.averageSection}>
        <Text style={styles.averageRating}>{averageRating.toFixed(1)}</Text>
        <StarRating rating={averageRating} size="large" />
        <Text style={styles.totalReviews}>{totalReviews} reviews</Text>
      </View>

      {/* Right side - Rating breakdown */}
      <View style={styles.breakdownSection}>
        {[5, 4, 3, 2, 1].map((star) => {
          const count = ratingBreakdown?.[star] || 0;
          const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
          const isActive = activeFilter === star;

          return (
            <TouchableOpacity
              key={star}
              style={[styles.breakdownRow, isActive && styles.breakdownRowActive]}
              onPress={() => onFilterPress?.(star)}
              activeOpacity={0.7}
            >
              <Text style={styles.starLabel}>{star} ★</Text>
              <View style={styles.barContainer}>
                <View
                  style={[
                    styles.barFill,
                    { width: `${percentage}%` },
                    isActive && styles.barFillActive,
                  ]}
                />
              </View>
              <Text style={styles.countLabel}>{count}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    marginBottom: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9ca3af',
  },
  averageSection: {
    alignItems: 'center',
    paddingRight: 20,
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
    minWidth: 100,
  },
  averageRating: {
    fontSize: 42,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 48,
  },
  totalReviews: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 4,
  },
  breakdownSection: {
    flex: 1,
    paddingLeft: 16,
    justifyContent: 'center',
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  breakdownRowActive: {
    backgroundColor: '#f0fdf4',
  },
  starLabel: {
    width: 36,
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  barContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#f59e0b',
    borderRadius: 4,
  },
  barFillActive: {
    backgroundColor: '#16a34a',
  },
  countLabel: {
    width: 28,
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'right',
  },
});

export default ReviewSummary;
