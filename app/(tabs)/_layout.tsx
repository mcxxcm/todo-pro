import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { Glass, Spacing } from '@/constants/tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme() === 'dark' ? 'dark' : 'light';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: () => (
          <BlurView
            tint={colorScheme === 'dark' ? 'dark' : 'light'}
            intensity={Glass.blurIntensity[colorScheme]}
            style={StyleSheet.absoluteFill}
          />
        ),
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: Glass.background[colorScheme],
          borderTopColor: Glass.border[colorScheme],
          borderTopWidth: StyleSheet.hairlineWidth,
          elevation: 0,
          ...Platform.select({
            ios: {
              shadowColor: '#000',
              shadowOpacity: colorScheme === 'dark' ? 0.3 : 0.06,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: -4 },
            },
          }),
        },
        tabBarLabelStyle: {
          fontWeight: '600',
          fontSize: 11,
          letterSpacing: 0.2,
          marginTop: Spacing.xxs,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: '收件箱',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: '设置',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="gearshape.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
