import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Linking } from 'react-native';
import MapView, { Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';

const ProductLocationMap = React.memo(function ProductLocationMap({
  latitude,
  longitude,
  title,
  postalCode,
  street,
}) {
  if (
    latitude == null ||
    longitude == null ||
    typeof latitude !== 'number' ||
    typeof longitude !== 'number'
  ) {
    return null;
  }

  const RADIUS_METERS = 500;

  const region = {
    latitude,
    longitude,
    latitudeDelta: 0.015,
    longitudeDelta: 0.015,
  };

  const handleOpenInMaps = () => {
    const label = title || 'Product Location';
    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${latitude},${longitude}`,
      android: `geo:0,0?q=${latitude},${longitude}(${label})`,
    });

    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Linking.openURL(
          `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
        );
      }
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.mapWrapper}>
        <MapView
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={region}
          scrollEnabled={false}
          zoomEnabled={false}
          rotateEnabled={false}
          pitchEnabled={false}
          toolbarEnabled={false}
          showsUserLocation={false}
          showsMyLocationButton={false}
          showsCompass={false}
          loadingEnabled={true}
          loadingIndicatorColor="#16a34a"
          loadingBackgroundColor="#f9fafb"
        >
          <Circle
            center={{ latitude, longitude }}
            radius={RADIUS_METERS}
            fillColor="rgba(22, 163, 106, 0.15)"
            strokeColor="rgba(22, 163, 106, 0.4)"
            strokeWidth={2}
          />
        </MapView>
      </View>

      <View style={styles.infoRow}>
        <View style={styles.locationInfo}>
          <Ionicons name="location" size={20} color="#16a34a" />
          <View style={styles.locationTextContainer}>
            <Text style={styles.locationText}>{postalCode || 'Unknown Location'}</Text>
            {street ? (
              <Text style={styles.streetText} numberOfLines={1}>{street}</Text>
            ) : null}
          </View>
        </View>
        <TouchableOpacity
          style={styles.openButton}
          onPress={handleOpenInMaps}
          activeOpacity={0.7}
        >
          <Ionicons name="navigate-outline" size={16} color="#fff" />
          <Text style={styles.openButtonText}>Open in Maps</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  mapWrapper: {
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  map: {
    flex: 1,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  locationInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationTextContainer: {
    flex: 1,
  },
  locationText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  streetText: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  openButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16a34a',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    gap: 6,
  },
  openButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});

export default ProductLocationMap;
