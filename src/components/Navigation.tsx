import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ActiveTab } from '../types';

export interface NavigationProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
}

interface TabItemConfig {
  key: ActiveTab;
  label: string;
  activeIcon: keyof typeof Ionicons.glyphMap;
  inactiveIcon: keyof typeof Ionicons.glyphMap;
}

const TABS: TabItemConfig[] = [
  {
    key: 'schedule',
    label: 'День',
    activeIcon: 'calendar',
    inactiveIcon: 'calendar-outline',
  },
  {
    key: 'weekly',
    label: 'Неделя',
    activeIcon: 'grid',
    inactiveIcon: 'grid-outline',
  },
  {
    key: 'search',
    label: 'Поиск',
    activeIcon: 'search',
    inactiveIcon: 'search-outline',
  },
  {
    key: 'settings',
    label: 'Настройки',
    activeIcon: 'settings',
    inactiveIcon: 'settings-outline',
  },
];

const ACTIVE_COLOR = '#0A84FF';
const INACTIVE_COLOR = '#8E8E93';
const FALLBACK_BG = 'rgba(20, 20, 22, 0.95)';

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onSelectTab,
}) => {
  const insets = useSafeAreaInsets();

  const handleSelectTab = (tabKey: ActiveTab) => {
    if (activeTab !== tabKey) {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {
        // Fallback for environments without haptics
      }
      onSelectTab(tabKey);
    }
  };

  const isBlurAvailable = Platform.OS === 'ios' || Platform.OS === 'android';

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: Math.max(insets.bottom, 8),
          backgroundColor: isBlurAvailable ? undefined : FALLBACK_BG,
        },
      ]}
    >
      {isBlurAvailable ? (
        <BlurView
          intensity={85}
          tint="dark"
          style={StyleSheet.absoluteFill}
        />
      ) : (
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: FALLBACK_BG },
          ]}
        />
      )}

      <View style={styles.tabsRow}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          const color = isActive ? ACTIVE_COLOR : INACTIVE_COLOR;
          const iconName = isActive ? tab.activeIcon : tab.inactiveIcon;

          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tabButton}
              onPress={() => handleSelectTab(tab.key)}
              activeOpacity={0.7}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={tab.label}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Ionicons
                name={iconName}
                size={23}
                color={color}
              />
              <Text
                style={[
                  styles.tabLabel,
                  { color },
                  isActive && styles.tabLabelActive,
                ]}
                numberOfLines={1}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

export default Navigation;

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: 48,
    paddingHorizontal: 8,
    width: '100%',
    maxWidth: 680,
    alignSelf: 'center',
  },
  tabButton: {
    flex: 1,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
    letterSpacing: -0.24,
  },
  tabLabelActive: {
    fontWeight: '600',
  },
});
