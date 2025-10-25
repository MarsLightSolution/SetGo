// Create a new component: SkeletonLoader.jsx
import React from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { useEffect, useRef } from 'react';

const SkeletonLoader = () => {
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1000,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const opacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={styles.container}>
      {/* Image Skeleton */}
      <Animated.View style={[styles.imageSkeleton, { opacity }]} />
      
      {/* Content Skeleton */}
      <View style={styles.card}>
        <Animated.View style={[styles.titleSkeleton, { opacity }]} />
        <Animated.View style={[styles.priceSkeleton, { opacity }]} />
        <View style={styles.metaRow}>
          <Animated.View style={[styles.metaItem, { opacity }]} />
          <Animated.View style={[styles.metaItem, { opacity }]} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  imageSkeleton: {
    width: '100%',
    height: 320,
    backgroundColor: '#e5e7eb',
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 8,
  },
  titleSkeleton: {
    height: 28,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    marginBottom: 12,
  },
  priceSkeleton: {
    height: 32,
    width: '40%',
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metaItem: {
    height: 20,
    width: 80,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
  },
});

export default SkeletonLoader;