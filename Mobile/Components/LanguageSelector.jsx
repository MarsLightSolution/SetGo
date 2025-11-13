import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../context/LanguageContext';

const LanguageSelector = ({ visible, onClose }) => {
  const { t } = useTranslation();
  const { currentLanguage, changeLanguage } = useLanguage();

  const languages = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'az', label: 'Azərbaycan', flag: '🇦🇿' },
    { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  ];

  const handleLanguageSelect = async (languageCode) => {
    await changeLanguage(languageCode);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>{t('selectLanguage')}</Text>
          
          {languages.map((lang) => (
            <TouchableOpacity
              key={lang.code}
              style={[
                styles.languageButton,
                currentLanguage === lang.code && styles.activeLanguage,
              ]}
              onPress={() => handleLanguageSelect(lang.code)}
            >
              <Text style={styles.flag}>{lang.flag}</Text>
              <Text
                style={[
                  styles.languageText,
                  currentLanguage === lang.code && styles.activeLanguageText,
                ]}
              >
                {lang.label}
              </Text>
              {currentLanguage === lang.code && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </TouchableOpacity>
          ))}

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    marginBottom: 10,
  },
  activeLanguage: {
    backgroundColor: '#007AFF',
  },
  flag: {
    fontSize: 24,
    marginRight: 12,
  },
  languageText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  activeLanguageText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  checkmark: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
  },
  closeButton: {
    marginTop: 15,
    padding: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
});

export default LanguageSelector;