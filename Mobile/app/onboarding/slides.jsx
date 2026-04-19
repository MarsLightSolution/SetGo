import { useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

const { width, height } = Dimensions.get('window');

const SLIDE_META = [
  { id: '1', icon: 'cart',        iconBg: '#E8F5E9', iconColor: '#008235', titleKey: 'onboarding.slide1Title', bodyKey: 'onboarding.slide1Body' },
  { id: '2', icon: 'storefront',  iconBg: '#E3F2FD', iconColor: '#1976D2', titleKey: 'onboarding.slide2Title', bodyKey: 'onboarding.slide2Body' },
  { id: '3', icon: 'chatbubbles', iconBg: '#FFF3E0', iconColor: '#E65100', titleKey: 'onboarding.slide3Title', bodyKey: 'onboarding.slide3Body' },
];

export default function SlidesScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { language } = useLocalSearchParams();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef(null);

  const goToGate = () => {
    router.replace({ pathname: '/onboarding/gate', params: { language: language || 'en' } });
  };

  const handleNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
    } else {
      goToGate();
    }
  };

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index ?? 0);
    }
  }).current;

  const SLIDES = SLIDE_META.map((s) => ({ ...s, title: t(s.titleKey), body: t(s.bodyKey) }));

  const renderSlide = ({ item }) => (
    <View style={styles.slide}>
      <View style={[styles.iconArea, { backgroundColor: item.iconBg }]}>
        <View style={styles.iconCircle}>
          <Ionicons name={item.icon} size={80} color={item.iconColor} />
        </View>
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.body}>{item.body}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <SafeAreaView style={styles.safe}>

        {/* Top bar — dots + skip */}
        <View style={styles.topBar}>
          <View style={styles.dots}>
            {SLIDES.map((_, i) => (
              <View
                key={i}
                style={[styles.dot, i === activeIndex && styles.dotActive]}
              />
            ))}
          </View>
          <TouchableOpacity onPress={goToGate} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.skip}>{t('common.skip')}</Text>
          </TouchableOpacity>
        </View>

        {/* Slides */}
        <FlatList
          ref={flatListRef}
          data={SLIDES}
          renderItem={renderSlide}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
          style={styles.flatList}
        />

        {/* Next / Get Started button */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.button} onPress={handleNext} activeOpacity={0.85}>
            <Text style={styles.buttonText}>
              {activeIndex === SLIDES.length - 1 ? t('onboarding.getStarted') : t('common.next')}
            </Text>
            <Ionicons name="arrow-forward" size={18} color="#ffffff" />
          </TouchableOpacity>
        </View>

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  safe: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 12,
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D1FAE5',
  },
  dotActive: {
    width: 24,
    backgroundColor: '#008235',
    borderRadius: 4,
  },
  skip: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '500',
  },
  flatList: {
    flex: 1,
  },
  slide: {
    width,
    flex: 1,
  },
  iconArea: {
    height: height * 0.42,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 32,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  body: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 26,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#008235',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
