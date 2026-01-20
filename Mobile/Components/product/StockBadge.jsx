import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * StockBadge - Displays product stock/quantity information
 * @param {number} quantity - Available quantity
 */
const StockBadge = React.memo(function StockBadge({ quantity }) {
  if (!quantity || quantity <= 0) {
    return (
      <View style={[styles.container, styles.outOfStock]}>
        <Ionicons name="alert-circle" size={18} color="#dc2626" />
        <Text style={[styles.text, styles.outOfStockText]}>Out of Stock</Text>
      </View>
    );
  }

  const isLowStock = quantity <= 5;
  const isLastOne = quantity === 1;

  return (
    <View style={[styles.container, isLowStock && styles.lowStock]}>
      <Ionicons
        name="cube-outline"
        size={18}
        color={isLowStock ? '#ea580c' : '#16a34a'}
      />
      <View style={styles.textContainer}>
        <Text style={[styles.text, isLowStock && styles.lowStockText]}>
          {quantity} {quantity === 1 ? 'Unit' : 'Units'} Available
        </Text>
        {isLastOne && (
          <Text style={styles.urgentText}>• Last one available!</Text>
        )}
        {!isLastOne && isLowStock && (
          <Text style={styles.lowStockWarning}>• Only {quantity} left in stock!</Text>
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginBottom: 12,
  },
  lowStock: {
    backgroundColor: '#fff7ed',
    borderColor: '#fed7aa',
  },
  outOfStock: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  textContainer: {
    flex: 1,
    marginLeft: 10,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  lowStockText: {
    color: '#111827',
  },
  outOfStockText: {
    color: '#dc2626',
    marginLeft: 10,
  },
  urgentText: {
    fontSize: 12,
    color: '#dc2626',
    fontWeight: '500',
    marginTop: 2,
  },
  lowStockWarning: {
    fontSize: 12,
    color: '#ea580c',
    fontWeight: '500',
    marginTop: 2,
  },
});

export default StockBadge;
