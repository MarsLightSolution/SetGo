import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  StyleSheet,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome';

const { width } = Dimensions.get('window');

// Custom Confirmation Dialog Component
const ConfirmDialog = ({ visible, onConfirm, onCancel, action = 'pause', adIsSellStatus = false }) => {
  const isBoost = action === 'boost';
  const isPause = action === 'pause';
  const isDelete = action === 'delete';

  const getTitle = () => {
    if (isBoost) return 'Confirm Boost Ad';
    if (isPause) return adIsSellStatus ? 'Resume Listing' : 'Pause Listing';
    return 'Confirm Delete Ad';
  };

  const getMessage = () => {
    if (isBoost) return 'Are you sure you want to boost this ad? This will increase its visibility.';
    if (isPause) {
      return adIsSellStatus
        ? 'Do you want to resume listing? This will make your ad visible again.'
        : 'Are you sure you want to pause this listing? It will be hidden from listings.';
    }
    return 'Are you sure you want to delete this ad? This action cannot be undone.';
  };

  const getConfirmText = () => {
    if (isBoost) return 'Yes, Boost';
    if (isPause) return adIsSellStatus ? 'Yes, Resume' : 'Yes, Pause';
    return 'Yes, Delete';
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{getTitle()}</Text>
          <Text style={styles.modalMessage}>{getMessage()}</Text>
          <View style={styles.modalButtons}>
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.confirmButton,
                isBoost && styles.boostButton,
                isPause && (adIsSellStatus ? styles.resumeButton : styles.pauseButton),
                isDelete && styles.deleteButton,
              ]}
              onPress={onConfirm}
            >
              <Text style={styles.confirmButtonText}>{getConfirmText()}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Helper function to get localized text
const getLocalizedText = (field) => {
  if (!field) return '';
  if (typeof field === 'string') return field;
  return field.en || field.az || field.ru || '';
};

export default function UserInfo() {
  const navigation = useNavigation();
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedAdId, setExpandedAdId] = useState(null);
  const [confirmAdId, setConfirmAdId] = useState(null);
  const [confirmAction, setConfirmAction] = useState('pause');
  const [userName, setUserName] = useState('');
  const [userCreatedAt, setUserCreatedAt] = useState('');
  const scrollViewRef = useRef(null);

  useEffect(() => {
    loadUserData();
    fetchUserAds();
  }, []);

  const loadUserData = async () => {
    try {
      const name = await AsyncStorage.getItem('userName');
      const createdAt = await AsyncStorage.getItem('userCreatedAt');
      setUserName(name || 'Unknown User');
      setUserCreatedAt(createdAt || new Date().toISOString());
    } catch (error) {
      console.log('Error loading user data:', error);
    }
  };

  const fetchUserAds = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      const accessToken = await AsyncStorage.getItem('token');

      if (!userId || !accessToken) {
        setAds([]);
        setLoading(false);
        return;
      }

      const serverUrl = process.env.EXPO_PUBLIC_API_URL || 'http://51.20.123.49/api';
      
      const response = await axios.get(
        `${serverUrl}/api/products/user/${userId}/ads`,
        {
          headers: { 
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data && Array.isArray(response.data.data)) {
        setAds(response.data.data);
      } else {
        setAds([]);
      }
    } catch (err) {
      setAds([]);
      if (err.response && err.response.status === 401) {
        Alert.alert('Error', 'You are not authorized. Please log in again.');
        navigation.navigate('Login');
      } else {
        Alert.alert('Error', 'Failed to load your products.');
      }
    } finally {
      setLoading(false);
    }
  };

  const pauseAd = async (id) => {
    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      const currentAd = ads.find((ad) => ad._id === id);
      const wasPaused = currentAd?.isSell === true;

      const serverUrl = process.env.EXPO_PUBLIC_API_URL || 'http://51.20.123.49/api';
      
      await axios.patch(
        `${serverUrl}/api/products/mark-sold/${id}`,
        {},
        {
          headers: { 
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      setAds((prev) =>
        prev.map((ad) => (ad._id === id ? { ...ad, isSell: !ad.isSell } : ad))
      );

      Alert.alert('Success', wasPaused ? 'Listing resumed!' : 'Listing paused!');
    } catch (err) {
      Alert.alert('Error', 'Failed to update ad status. Please try again.');
      if (err.response && err.response.status === 401) {
        navigation.navigate('Login');
      }
    } finally {
      setConfirmAdId(null);
    }
  };

  const boostAd = async (id) => {
    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      const serverUrl = process.env.EXPO_PUBLIC_API_URL || 'http://51.20.123.49/api';

      await axios.put(
        `${serverUrl}/api/products/priority/${id}`,
        {},
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      setAds((prev) =>
        prev.map((ad) =>
          ad._id === id
            ? { ...ad, priority: true, boostExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }
            : ad
        )
      );

      Alert.alert('Success', 'Ad boosted successfully! Priority increased for better visibility.');
    } catch (err) {
      Alert.alert('Error', 'Failed to boost ad. Please try again.');
      if (err.response && err.response.status === 401) {
        navigation.navigate('Login');
      }
    } finally {
      setConfirmAdId(null);
    }
  };

  const deleteAd = async (id) => {
    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      const serverUrl = process.env.EXPO_PUBLIC_API_URL || 'http://51.20.123.49/api';

      await axios.delete(`${serverUrl}/api/products/product/${id}`, {
        headers: { 
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      setAds((prev) => prev.filter((ad) => ad._id !== id));
      Alert.alert('Success', 'Ad deleted successfully!');
    } catch (err) {
      Alert.alert('Error', 'Failed to delete ad. Please try again.');
      if (err.response && err.response.status === 401) {
        navigation.navigate('Login');
      }
    } finally {
      setConfirmAdId(null);
    }
  };

  const handleEdit = (id) => {
    navigation.navigate('EditForm', { id });
  };

  const handlePause = (id) => {
    setConfirmAction('pause');
    setConfirmAdId(id);
  };

  const handleBoost = (id) => {
    setConfirmAction('boost');
    setConfirmAdId(id);
  };

  const handleDelete = (id) => {
    setConfirmAction('delete');
    setConfirmAdId(id);
  };

  const handlePreview = (id) => {
    navigation.navigate('ProductDetail', { id });
  };

  const toggleExpand = (id) => {
    setExpandedAdId(expandedAdId === id ? null : id);
  };

  const formatUserSinceDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
    });
  };

  const getInitials = (name) => {
    if (!name) return 'NA';
    const words = name.split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const renderAdCard = (ad) => {
    const displayTitle = getLocalizedText(ad.title) || 'Untitled Product';
    const displayDescription = getLocalizedText(ad.description) || 'No description';
    const serverUrl = process.env.EXPO_PUBLIC_API_URL || 'http://51.20.123.49/api';
    const baseUrl = serverUrl.replace('/api', ''); // Remove /api for image URLs

    return (
      <TouchableOpacity
        key={ad._id}
        style={styles.adCard}
        onPress={() => handlePreview(ad._id)}
        activeOpacity={0.7}
      >
        <View style={styles.imageContainer}>
          {ad.pictures?.[0] ? (
            <Image
              source={{
                uri: `${baseUrl}/${ad.pictures[0].replace(/\\/g, '/')}`,
              }}
              style={styles.adImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.noImageContainer}>
              <Text style={styles.noImageText}>No Image Available</Text>
            </View>
          )}
        </View>

        <View style={styles.adContent}>
          <Text style={styles.adTitle} numberOfLines={1}>
            {displayTitle}
          </Text>
          <Text style={styles.adDescription} numberOfLines={expandedAdId === ad._id ? undefined : 3}>
            {displayDescription}
          </Text>
          {displayDescription.length > 80 && (
            <TouchableOpacity onPress={(e) => {
              e.stopPropagation();
              toggleExpand(ad._id);
            }}>
              <Text style={styles.showMoreText}>
                {expandedAdId === ad._id ? 'Show Less' : 'Show More'}
              </Text>
            </TouchableOpacity>
          )}
          <Text style={styles.adPrice}>{ad.price} ₼</Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.iconButton} 
              onPress={(e) => {
                e.stopPropagation();
                handleEdit(ad._id);
              }}
            >
              <Icon name="edit" size={16} color="#16a34a" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.iconButton, 
                ad.isSell ? styles.resumeIconButton : styles.pauseIconButton
              ]}
              onPress={(e) => {
                e.stopPropagation();
                handlePause(ad._id);
              }}
            >
              <Icon name={ad.isSell ? 'play' : 'pause'} size={16} color={ad.isSell ? '#16a34a' : '#ca8a04'} />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.iconButton, ad.priority && styles.disabledButton]}
              onPress={(e) => {
                e.stopPropagation();
                if (!ad.priority) handleBoost(ad._id);
              }}
              disabled={ad.priority}
            >
              <Icon name="rocket" size={16} color={ad.priority ? '#9ca3af' : '#2563eb'} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.iconButton} 
              onPress={(e) => {
                e.stopPropagation();
                handleDelete(ad._id);
              }}
            >
              <Icon name="trash" size={16} color="#dc2626" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.iconButton} 
              onPress={(e) => {
                e.stopPropagation();
                handlePreview(ad._id);
              }}
            >
              <Icon name="eye" size={16} color="#4b5563" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#16a34a" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ConfirmDialog
        visible={confirmAdId !== null}
        onConfirm={() =>
          confirmAction === 'boost'
            ? boostAd(confirmAdId)
            : confirmAction === 'pause'
            ? pauseAd(confirmAdId)
            : deleteAd(confirmAdId)
        }
        onCancel={() => setConfirmAdId(null)}
        action={confirmAction}
        adIsSellStatus={ads.find((ad) => ad._id === confirmAdId)?.isSell || false}
      />

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        {/* Banner Section */}
        <View style={styles.bannerSection}>
          <Image
            source={require('../../assets/images/banner1.png')} // Make sure to add your banner image
            style={styles.bannerImage}
            resizeMode="cover"
          />
          <View style={styles.bannerOverlay}>
            <TouchableOpacity style={styles.joinButton}>
              <Text style={styles.joinButtonText}>Join Now</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.profileCard}>
            <View style={styles.profileHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{getInitials(userName)}</Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{userName}</Text>
                <Text style={styles.profileAdsCount}>{ads.length} ads available</Text>
              </View>
            </View>
            
            <View style={styles.profileDetails}>
              <View style={styles.detailItem}>
                <Icon name="user" size={14} color="#6b7280" />
                <Text style={styles.detailText}>Private User</Text>
              </View>
              <View style={styles.detailItem}>
                <Icon name="clock-o" size={14} color="#6b7280" />
                <Text style={styles.detailText}>Active since {formatUserSinceDate(userCreatedAt)}</Text>
              </View>
              <View style={styles.detailItem}>
                <Icon name="check" size={14} color="#16a34a" />
                <Text style={styles.detailText}>Verified Profile</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Ads Section */}
        {ads.length === 0 ? (
          <View style={styles.noAdsSection}>
            <View style={styles.noAdsCard}>
              <Image
                source={require('../../assets/images/nodata.png')} // Make sure to add your nodata image
                style={styles.noDataImage}
                resizeMode="contain"
              />
              <Text style={styles.noAdsTitle}>Treasure in Basement</Text>
              <Text style={styles.noAdsText}>Manage your ads here</Text>
              <Text style={styles.noAdsText}>Start advertising easily</Text>
              <TouchableOpacity
                style={styles.placeAdButton}
                onPress={() => navigation.navigate('Form')}
              >
                <Text style={styles.placeAdButtonText}>Place an Ad</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.adsSection}>
            <View style={styles.adsCard}>
              <View style={styles.adsHeader}>
                <Text style={styles.adsTitle}>My Published Ads</Text>
                <View style={styles.scrollButtons}>
                  <TouchableOpacity
                    style={styles.scrollButton}
                    onPress={() => scrollViewRef.current?.scrollTo({ x: -300, animated: true })}
                  >
                    <Text style={styles.scrollButtonText}>←</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.scrollButton}
                    onPress={() => scrollViewRef.current?.scrollTo({ x: 300, animated: true })}
                  >
                    <Text style={styles.scrollButtonText}>→</Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              <ScrollView
                ref={scrollViewRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.adsScrollContent}
              >
                {ads.map(renderAdCard)}
              </ScrollView>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  
  // Banner Section
  bannerSection: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 16,
  },
  bannerImage: {
    width: '100%',
    height: 233,
    borderRadius: 12,
  },
  bannerOverlay: {
    position: 'absolute',
    bottom: 40,
    left: 32,
  },
  joinButton: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  joinButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  
  // Profile Section
  profileSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#4b5563',
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  profileAdsCount: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  profileDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 4,
  },
  
  // No Ads Section
  noAdsSection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  noAdsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  noDataImage: {
    width: 200,
    height: 200,
    marginBottom: 16,
  },
  noAdsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  noAdsText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
    textAlign: 'center',
  },
  placeAdButton: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  placeAdButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  
  // Ads Section
  adsSection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  adsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  adsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  adsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  scrollButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  scrollButton: {
    width: 32,
    height: 32,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  scrollButtonText: {
    fontSize: 18,
    color: '#6b7280',
  },
  adsScrollContent: {
    paddingRight: 16,
  },
  
  // Ad Card
  adCard: {
    width: 260,
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    backgroundColor: '#fff',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    height: 176,
    backgroundColor: '#f3f4f6',
  },
  adImage: {
    width: '100%',
    height: '100%',
  },
  noImageContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  noImageText: {
    color: '#6b7280',
    fontSize: 14,
  },
  adContent: {
    padding: 16,
  },
  adTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  adDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
    lineHeight: 20,
  },
  showMoreText: {
    fontSize: 14,
    color: '#2563eb',
    marginTop: 4,
    fontWeight: '500',
  },
  adPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#15803d',
    marginTop: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
    justifyContent: 'center',
  },
  iconButton: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    padding: 8,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resumeIconButton: {
    borderColor: '#16a34a',
  },
  pauseIconButton: {
    borderColor: '#ca8a04',
  },
  disabledButton: {
    backgroundColor: '#f3f4f6',
    borderColor: '#e5e7eb',
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: width - 64,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: '#9ca3af',
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  cancelButtonText: {
    color: '#374151',
    fontSize: 14,
  },
  confirmButton: {
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  boostButton: {
    backgroundColor: '#2563eb',
  },
  pauseButton: {
    backgroundColor: '#ca8a04',
  },
  resumeButton: {
    backgroundColor: '#16a34a',
  },
  deleteButton: {
    backgroundColor: '#dc2626',
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});