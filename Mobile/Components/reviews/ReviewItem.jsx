import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import StarRating from './StarRating';

/**
 * ReviewItem - Displays a single review with optional seller response
 * @param {object} review - The review data
 * @param {function} onHelpfulPress - Callback when helpful button is pressed
 * @param {string} currentUserId - Current user's ID to prevent double marking
 */
const ReviewItem = React.memo(function ReviewItem({ review, onHelpfulPress, currentUserId }) {
  const {
    _id,
    buyerName,
    rating,
    reviewText,
    createdAt,
    verified,
    helpfulCount = 0,
    helpfulBy = [],
    sellerResponse,
  } = review;

  const hasMarkedHelpful = helpfulBy?.includes(currentUserId);
  const buyerInitial = buyerName?.charAt(0)?.toUpperCase() || 'U';

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <View style={styles.container}>
      {/* Header row */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{buyerInitial}</Text>
        </View>
        <View style={styles.headerInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.buyerName}>{buyerName || 'Anonymous'}</Text>
            {verified && (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>✓ Verified</Text>
              </View>
            )}
          </View>
          <View style={styles.ratingRow}>
            <StarRating rating={rating} size="small" />
            <Text style={styles.dateText}>{formatDate(createdAt)}</Text>
          </View>
        </View>
      </View>

      {/* Review text */}
      <Text style={styles.reviewText}>{reviewText}</Text>

      {/* Seller response */}
      {sellerResponse && (
        <View style={styles.sellerResponse}>
          <Text style={styles.sellerResponseLabel}>Seller Response:</Text>
          <Text style={styles.sellerResponseText}>
            {sellerResponse.responseText || sellerResponse.text}
          </Text>
          {sellerResponse.respondedAt && (
            <Text style={styles.responseDate}>
              {formatDate(sellerResponse.respondedAt)}
            </Text>
          )}
        </View>
      )}

      {/* Helpful button */}
      <TouchableOpacity
        style={[styles.helpfulButton, hasMarkedHelpful && styles.helpfulButtonActive]}
        onPress={() => onHelpfulPress?.(_id)}
        disabled={hasMarkedHelpful}
        activeOpacity={0.7}
      >
        <Text style={[styles.helpfulText, hasMarkedHelpful && styles.helpfulTextActive]}>
          👍 Helpful ({helpfulCount})
        </Text>
      </TouchableOpacity>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  header: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#9ca3af',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  headerInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  buyerName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginRight: 8,
  },
  verifiedBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  verifiedText: {
    fontSize: 11,
    color: '#16a34a',
    fontWeight: '600',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    color: '#9ca3af',
    marginLeft: 8,
  },
  reviewText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
    marginBottom: 12,
  },
  sellerResponse: {
    backgroundColor: '#f9fafb',
    borderLeftWidth: 3,
    borderLeftColor: '#16a34a',
    padding: 12,
    borderRadius: 4,
    marginBottom: 12,
  },
  sellerResponseLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  sellerResponseText: {
    fontSize: 13,
    color: '#4b5563',
    lineHeight: 20,
  },
  responseDate: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 8,
  },
  helpfulButton: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
  },
  helpfulButtonActive: {
    backgroundColor: '#dcfce7',
  },
  helpfulText: {
    fontSize: 13,
    color: '#6b7280',
  },
  helpfulTextActive: {
    color: '#16a34a',
  },
});

export default ReviewItem;
