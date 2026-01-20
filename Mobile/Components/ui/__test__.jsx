/**
 * Component Import Test
 *
 * This file tests that all UI components can be imported and have the correct structure.
 * Run this test to verify Phase 1 refactoring was successful.
 */

import React from 'react';
import { View } from 'react-native';

// Test that all components can be imported from the barrel export
import {
  AnimatedCard,
  AnimatedButton,
  AnimatedInput,
  AnimatedToggle,
  SettingCard,
  PulseIcon,
} from './index';

/**
 * Simple test component to verify all UI components are properly exported
 * and can be rendered without errors.
 */
export default function UIComponentsTest() {
  return (
    <View style={{ flex: 1, padding: 20 }}>
      <AnimatedCard delay={0}>
        <AnimatedButton
          title="Test Button"
          onPress={() => console.log('Button pressed')}
          loading={false}
          variant="primary"
        />

        <AnimatedInput
          label="Test Input"
          value=""
          onChangeText={() => {}}
          placeholder="Enter text"
        />

        <AnimatedToggle
          value={false}
          onValueChange={() => {}}
          loading={false}
        />

        <SettingCard
          icon="settings"
          label="Test Setting"
          value="Test Value"
          onPress={() => {}}
          iconColor="#10B981"
          iconBg="#ECFDF5"
        />

        <PulseIcon size={6} color="#10B981" />
      </AnimatedCard>
    </View>
  );
}

// Component existence checks
console.log('✅ AnimatedCard imported:', typeof AnimatedCard === 'function');
console.log('✅ AnimatedButton imported:', typeof AnimatedButton === 'function');
console.log('✅ AnimatedInput imported:', typeof AnimatedInput === 'function');
console.log('✅ AnimatedToggle imported:', typeof AnimatedToggle === 'function');
console.log('✅ SettingCard imported:', typeof SettingCard === 'function');
console.log('✅ PulseIcon imported:', typeof PulseIcon === 'function');
