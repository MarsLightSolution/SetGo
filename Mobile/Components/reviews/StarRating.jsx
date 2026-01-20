import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * StarRating - Displays star ratings with optional half stars
 * @param {number} rating - The rating value (0-5)
 * @param {string} size - Size variant: 'small', 'medium', 'large'
 * @param {boolean} showValue - Whether to show the numeric value
 */
const StarRating = React.memo(function StarRating({ rating = 0, size = 'medium', showValue = false }) {
  const sizes = {
    small: { star: 12, text: 10 },
    medium: { star: 16, text: 14 },
    large: { star: 24, text: 18 },
  };

  const { star: starSize, text: textSize } = sizes[size] || sizes.medium;

  const renderStars = () => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    // Full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Text key={`full-${i}`} style={[styles.star, styles.filledStar, { fontSize: starSize }]}>
          ★
        </Text>
      );
    }

    // Half star
    if (hasHalfStar) {
      stars.push(
        <Text key="half" style={[styles.star, styles.filledStar, { fontSize: starSize }]}>
          ⯨
        </Text>
      );
    }

    // Empty stars
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Text key={`empty-${i}`} style={[styles.star, styles.emptyStar, { fontSize: starSize }]}>
          ★
        </Text>
      );
    }

    return stars;
  };

  return (
    <View style={styles.container}>
      <View style={styles.starsContainer}>{renderStars()}</View>
      {showValue && (
        <Text style={[styles.ratingValue, { fontSize: textSize }]}>
          {rating.toFixed(1)}
        </Text>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  star: {
    marginRight: 1,
  },
  filledStar: {
    color: '#f59e0b',
  },
  emptyStar: {
    color: '#d1d5db',
  },
  ratingValue: {
    marginLeft: 6,
    fontWeight: '600',
    color: '#374151',
  },
});

export default StarRating;
