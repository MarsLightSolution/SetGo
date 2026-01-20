import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import ReviewSummary from './ReviewSummary';
import ReviewFilters from './ReviewFilters';
import ReviewItem from './ReviewItem';
import logger from '../../utils/logger';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

/**
 * ReviewSection - Complete review section with summary, filters, and list
 * @param {string} productId - The product ID to fetch reviews for
 * @param {string} currentUserId - Current user's ID
 */
const ReviewSection = ({ productId, currentUserId }) => {
  const [reviewSummary, setReviewSummary] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterRating, setFilterRating] = useState(null);
  const [sortBy, setSortBy] = useState('recent');

  const reviewsPerPage = 10;

  // Fetch review summary
  const fetchReviewSummary = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/reviews/product/${productId}/summary`);

      if (!res.ok) {
        logger.log('Review summary fetch failed:', res.status);
        return;
      }

      const result = await res.json();

      if (result.success && result.data) {
        const transformedSummary = {
          averageRating: result.data.averageRating || 0,
          totalReviews: result.data.totalReviews || 0,
          ratingBreakdown: {
            5: result.data.distribution?.fiveStar || 0,
            4: result.data.distribution?.fourStar || 0,
            3: result.data.distribution?.threeStar || 0,
            2: result.data.distribution?.twoStar || 0,
            1: result.data.distribution?.oneStar || 0,
          },
        };
        setReviewSummary(transformedSummary);
      }
    } catch (error) {
      logger.error('Error fetching review summary:', error);
    }
  }, [productId]);

  // Fetch reviews
  const fetchReviews = useCallback(async (page = 1, append = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      let url = `${API_URL}/reviews/product/${productId}?page=${page}&limit=${reviewsPerPage}&sortBy=${sortBy}`;

      if (filterRating) {
        url += `&rating=${filterRating}`;
      }

      const res = await fetch(url);

      if (!res.ok) {
        logger.log('Reviews fetch failed:', res.status);
        return;
      }

      const result = await res.json();

      if (result.success) {
        const reviewsData = result.data || [];

        const transformedReviews = reviewsData.map((review) => ({
          ...review,
          buyerName: review.buyerId?.username || review.buyerId?.profileName || 'Anonymous',
          verified: review.isVerifiedPurchase || false,
          sellerResponse: review.sellerResponse
            ? {
                responseText: review.sellerResponse.text,
                respondedAt: review.sellerResponse.respondedAt,
              }
            : null,
        }));

        if (append) {
          setReviews((prev) => [...prev, ...transformedReviews]);
        } else {
          setReviews(transformedReviews);
        }

        setTotalPages(result.pagination?.totalPages || 1);
      }
    } catch (error) {
      logger.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [productId, filterRating, sortBy]);

  // Mark review as helpful
  const handleMarkHelpful = useCallback(async (reviewId) => {
    if (!currentUserId) {
      Alert.alert('Login Required', 'Please login to mark reviews as helpful');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/reviews/${reviewId}/helpful`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUserId }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        if (errorData.message?.includes('already marked')) {
          Alert.alert('Notice', "You've already marked this as helpful");
        } else {
          throw new Error('Failed to mark review as helpful');
        }
        return;
      }

      Alert.alert('Success', 'Review marked as helpful!');
      fetchReviews(1, false);
    } catch (error) {
      logger.error('Error marking review as helpful:', error);
      Alert.alert('Error', 'Failed to mark review as helpful');
    }
  }, [currentUserId, fetchReviews]);

  // Handle filter change
  const handleFilterChange = useCallback((rating) => {
    setFilterRating(rating);
    setCurrentPage(1);
  }, []);

  // Handle sort change
  const handleSortChange = useCallback((sort) => {
    setSortBy(sort);
    setCurrentPage(1);
  }, []);

  // Handle load more
  const handleLoadMore = useCallback(() => {
    if (currentPage < totalPages && !loadingMore) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      fetchReviews(nextPage, true);
    }
  }, [currentPage, totalPages, loadingMore, fetchReviews]);

  // Initial fetch
  useEffect(() => {
    if (productId) {
      fetchReviewSummary();
      fetchReviews(1, false);
    }
  }, [productId, fetchReviewSummary, fetchReviews]);

  // Refetch when filters change
  useEffect(() => {
    if (productId) {
      fetchReviews(1, false);
    }
  }, [filterRating, sortBy]);

  if (loading && !reviews.length) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#16a34a" />
        <Text style={styles.loadingText}>Loading reviews...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Customer Reviews</Text>

      {/* Review Summary */}
      <ReviewSummary
        summary={reviewSummary}
        onFilterPress={handleFilterChange}
        activeFilter={filterRating}
      />

      {/* Filters (only show if there are reviews) */}
      {reviewSummary && reviewSummary.totalReviews > 0 && (
        <ReviewFilters
          filterRating={filterRating}
          sortBy={sortBy}
          onFilterChange={handleFilterChange}
          onSortChange={handleSortChange}
        />
      )}

      {/* Reviews List */}
      {reviews.length > 0 ? (
        <>
          {reviews.map((review) => (
            <ReviewItem
              key={review._id}
              review={review}
              onHelpfulPress={handleMarkHelpful}
              currentUserId={currentUserId}
            />
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <View style={styles.paginationContainer}>
              <TouchableOpacity
                style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled]}
                onPress={() => {
                  if (currentPage > 1) {
                    setCurrentPage(currentPage - 1);
                    fetchReviews(currentPage - 1, false);
                  }
                }}
                disabled={currentPage === 1}
              >
                <Text style={[styles.paginationButtonText, currentPage === 1 && styles.paginationButtonTextDisabled]}>
                  Previous
                </Text>
              </TouchableOpacity>

              <Text style={styles.paginationInfo}>
                Page {currentPage} of {totalPages}
              </Text>

              <TouchableOpacity
                style={[styles.paginationButton, currentPage === totalPages && styles.paginationButtonDisabled]}
                onPress={handleLoadMore}
                disabled={currentPage === totalPages || loadingMore}
              >
                {loadingMore ? (
                  <ActivityIndicator size="small" color="#16a34a" />
                ) : (
                  <Text style={[styles.paginationButtonText, currentPage === totalPages && styles.paginationButtonTextDisabled]}>
                    Next
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </>
      ) : (
        !loading && reviewSummary?.totalReviews > 0 && (
          <View style={styles.noMatchContainer}>
            <Text style={styles.noMatchText}>No reviews match your filter.</Text>
            <TouchableOpacity
              style={styles.clearFilterButton}
              onPress={() => handleFilterChange(null)}
            >
              <Text style={styles.clearFilterText}>Clear Filter</Text>
            </TouchableOpacity>
          </View>
        )
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  loadingContainer: {
    backgroundColor: '#fff',
    padding: 32,
    marginTop: 8,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  noMatchContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  noMatchText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  clearFilterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  clearFilterText: {
    fontSize: 14,
    color: '#16a34a',
    fontWeight: '600',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    gap: 12,
  },
  paginationButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  paginationButtonDisabled: {
    opacity: 0.5,
  },
  paginationButtonText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  paginationButtonTextDisabled: {
    color: '#9ca3af',
  },
  paginationInfo: {
    fontSize: 13,
    color: '#6b7280',
  },
});

export default ReviewSection;
