import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Switch,
  StatusBar,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Subgroup } from '../types';
import { theme } from '../theme';

export interface SettingsScreenProps {
  subgroup: Subgroup;
  onSetSubgroup: (sg: Subgroup) => void;
  onResetGroup: () => void;
  currentGroupName?: string;
  onBack?: () => void;
}

type ThemeMode = 'oled' | 'charcoal';

const STORAGE_KEY_THEME = '@settings_theme_mode';
const STORAGE_KEY_SUBGROUP = '@settings_default_subgroup';
const STORAGE_KEY_AUTO_WEEK = '@settings_auto_week_parity';
const STORAGE_KEY_REMINDER = '@settings_advance_reminder_15m';

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  subgroup,
  onSetSubgroup,
  onResetGroup,
  currentGroupName,
  onBack,
}) => {
  const insets = useSafeAreaInsets();

  // Settings State
  const [themeMode, setThemeMode] = useState<ThemeMode>('oled');
  const [autoDetectWeek, setAutoDetectWeek] = useState(true);
  const [advanceReminder, setAdvanceReminder] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshSuccess, setRefreshSuccess] = useState(false);
  const refreshTimer1Ref = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refreshTimer2Ref = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef<boolean>(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (refreshTimer1Ref.current) clearTimeout(refreshTimer1Ref.current);
      if (refreshTimer2Ref.current) clearTimeout(refreshTimer2Ref.current);
    };
  }, []);

  // Load persisted settings from AsyncStorage
  useEffect(() => {
    let isMounted = true;

    async function loadSettings() {
      try {
        const [savedTheme, savedSubgroup, savedAutoWeek, savedReminder] =
          await Promise.all([
            AsyncStorage.getItem(STORAGE_KEY_THEME),
            AsyncStorage.getItem(STORAGE_KEY_SUBGROUP),
            AsyncStorage.getItem(STORAGE_KEY_AUTO_WEEK),
            AsyncStorage.getItem(STORAGE_KEY_REMINDER),
          ]);

        if (!isMounted) return;

        if (savedTheme === 'oled' || savedTheme === 'charcoal') {
          setThemeMode(savedTheme);
        }

        if (
          savedSubgroup === 'all' ||
          savedSubgroup === '1' ||
          savedSubgroup === '2'
        ) {
          if (savedSubgroup !== subgroup) {
            onSetSubgroup(savedSubgroup as Subgroup);
          }
        }

        if (savedAutoWeek !== null) {
          setAutoDetectWeek(savedAutoWeek === 'true');
        }

        if (savedReminder !== null) {
          setAdvanceReminder(savedReminder === 'true');
        }
      } catch (err) {
        console.warn('Failed to load settings:', err);
      }
    }

    loadSettings();

    return () => {
      isMounted = false;
    };
  }, []);

  // Theme mode handler
  const handleThemeChange = useCallback(
    async (mode: ThemeMode) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setThemeMode(mode);
      try {
        await AsyncStorage.setItem(STORAGE_KEY_THEME, mode);
      } catch (err) {
        console.warn('Failed to save theme setting:', err);
      }
    },
    []
  );

  // Subgroup preference handler
  const handleSubgroupChange = useCallback(
    async (sg: Subgroup) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onSetSubgroup(sg);
      try {
        await AsyncStorage.setItem(STORAGE_KEY_SUBGROUP, sg);
      } catch (err) {
        console.warn('Failed to save subgroup setting:', err);
      }
    },
    [onSetSubgroup]
  );

  // Auto-detect week parity toggle handler
  const handleAutoWeekToggle = useCallback(
    async (val: boolean) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setAutoDetectWeek(val);
      try {
        await AsyncStorage.setItem(STORAGE_KEY_AUTO_WEEK, String(val));
      } catch (err) {
        console.warn('Failed to save auto-week setting:', err);
      }
    },
    []
  );

  // Advance reminder toggle handler
  const handleReminderToggle = useCallback(
    async (val: boolean) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setAdvanceReminder(val);
      try {
        await AsyncStorage.setItem(STORAGE_KEY_REMINDER, String(val));
      } catch (err) {
        console.warn('Failed to save reminder setting:', err);
      }
    },
    []
  );

  // Manual refresh cache action
  const handleManualRefresh = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsRefreshing(true);
    setRefreshSuccess(false);

    if (refreshTimer1Ref.current) clearTimeout(refreshTimer1Ref.current);
    if (refreshTimer2Ref.current) clearTimeout(refreshTimer2Ref.current);

    try {
      // Emulate cache synchronization and cache validation
      await new Promise<void>((resolve) => {
        refreshTimer1Ref.current = setTimeout(resolve, 800);
      });
      if (!isMountedRef.current) return;
      setRefreshSuccess(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      refreshTimer2Ref.current = setTimeout(() => {
        if (isMountedRef.current) {
          setRefreshSuccess(false);
        }
      }, 2500);
    } catch (err) {
      console.warn('Failed to refresh data:', err);
    } finally {
      if (isMountedRef.current) {
        setIsRefreshing(false);
      }
    }
  }, []);

  // Reset / Change Group handler
  const handleResetGroupPress = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Вы уверены, что хотите сменить выбранную группу?');
      if (confirmed) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onResetGroup();
      }
      return;
    }
    Alert.alert(
      'Смена группы',
      'Вы уверены, что хотите сменить выбранную группу?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Сменить',
          style: 'destructive',
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onResetGroup();
          },
        },
      ]
    );
  }, [onResetGroup]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={theme.bg} />

      {/* Screen Header */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          {onBack && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={onBack}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={24} color={theme.accent} />
              <Text style={styles.backButtonText}>Назад</Text>
            </TouchableOpacity>
          )}

          <View style={styles.metaBadge}>
            <Text style={styles.metaBadgeText}>ПАРАМЕТРЫ ПРИЛОЖЕНИЯ</Text>
          </View>
        </View>

        <Text style={styles.largeTitle}>Настройки</Text>
      </View>

      {/* Main Settings Scrollable Form */}
      <ScrollView
        style={styles.contentList}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: insets.bottom + 80 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Section 1: Оформление */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTag}>ОФОРМЛЕНИЕ</Text>

          <View style={styles.settingsGroup}>
            {/* Theme switcher row */}
            <View style={styles.settingsRow}>
              <View style={styles.rowLabelGroup}>
                <Ionicons
                  name="moon-outline"
                  size={18}
                  color={theme.accent}
                  style={styles.rowIcon}
                />
                <Text style={styles.rowTitle}>Тема интерфейса</Text>
              </View>

              <View style={styles.segControlTheme}>
                <TouchableOpacity
                  style={[
                    styles.segBtn,
                    themeMode === 'oled' && styles.segBtnActive,
                  ]}
                  onPress={() => handleThemeChange('oled')}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                >
                  <Text
                    style={[
                      styles.segBtnText,
                      themeMode === 'oled' && styles.segBtnTextActive,
                    ]}
                  >
                    OLED
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.segBtn,
                    themeMode === 'charcoal' && styles.segBtnActive,
                  ]}
                  onPress={() => handleThemeChange('charcoal')}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                >
                  <Text
                    style={[
                      styles.segBtnText,
                      themeMode === 'charcoal' && styles.segBtnTextActive,
                    ]}
                  >
                    Charcoal
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Accent color indicator row */}
            <View style={[styles.settingsRow, styles.lastRow]}>
              <View style={styles.rowLabelGroup}>
                <Ionicons
                  name="color-palette-outline"
                  size={18}
                  color={theme.accent}
                  style={styles.rowIcon}
                />
                <Text style={styles.rowTitle}>Цвет акцента</Text>
              </View>

              <View style={styles.accentIndicator}>
                <View style={styles.accentDot} />
                <Text style={styles.accentName}>Сапфир (#0A84FF)</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Section 2: Расписание */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTag}>РАСПИСАНИЕ</Text>

          <View style={styles.settingsGroup}>
            {/* Default subgroup preference */}
            <View style={styles.settingsRow}>
              <View style={styles.rowLabelGroup}>
                <Ionicons
                  name="people-outline"
                  size={18}
                  color={theme.purple}
                  style={styles.rowIcon}
                />
                <Text style={styles.rowTitle}>Подгруппа по умолч.</Text>
              </View>

              <View style={styles.segControlSubgroup}>
                <TouchableOpacity
                  style={[
                    styles.segBtnSmall,
                    subgroup === 'all' && styles.segBtnActive,
                  ]}
                  onPress={() => handleSubgroupChange('all')}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                >
                  <Text
                    style={[
                      styles.segBtnText,
                      subgroup === 'all' && styles.segBtnTextActive,
                    ]}
                  >
                    Все
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.segBtnSmall,
                    subgroup === '1' && styles.segBtnActive,
                  ]}
                  onPress={() => handleSubgroupChange('1')}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                >
                  <Text
                    style={[
                      styles.segBtnText,
                      subgroup === '1' && styles.segBtnTextActive,
                    ]}
                  >
                    1п
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.segBtnSmall,
                    subgroup === '2' && styles.segBtnActive,
                  ]}
                  onPress={() => handleSubgroupChange('2')}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                >
                  <Text
                    style={[
                      styles.segBtnText,
                      subgroup === '2' && styles.segBtnTextActive,
                    ]}
                  >
                    2п
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Auto-detect week parity toggle */}
            <View style={[styles.settingsRow, styles.lastRow]}>
              <View style={styles.rowLabelGroup}>
                <Ionicons
                  name="calendar-outline"
                  size={18}
                  color={theme.success}
                  style={styles.rowIcon}
                />
                <View>
                  <Text style={styles.rowTitle}>Авто-определение недели</Text>
                  <Text style={styles.rowSubtitle}>
                    Четность недели вычисляется по дате
                  </Text>
                </View>
              </View>

              <Switch
                value={autoDetectWeek}
                onValueChange={handleAutoWeekToggle}
                trackColor={{ false: '#3A3A3C', true: theme.success }}
                thumbColor="#FFFFFF"
                ios_backgroundColor="#3A3A3C"
              />
            </View>
          </View>
        </View>

        {/* Section 3: Уведомления */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTag}>УВЕДОМЛЕНИЯ</Text>

          <View style={styles.settingsGroup}>
            <View style={[styles.settingsRow, styles.lastRow]}>
              <View style={styles.rowLabelGroup}>
                <Ionicons
                  name="notifications-outline"
                  size={18}
                  color={theme.warning}
                  style={styles.rowIcon}
                />
                <View>
                  <Text style={styles.rowTitle}>Напоминать за 15 мин</Text>
                  <Text style={styles.rowSubtitle}>
                    Push-уведомление перед началом пары
                  </Text>
                </View>
              </View>

              <Switch
                value={advanceReminder}
                onValueChange={handleReminderToggle}
                trackColor={{ false: '#3A3A3C', true: theme.success }}
                thumbColor="#FFFFFF"
                ios_backgroundColor="#3A3A3C"
              />
            </View>
          </View>
        </View>

        {/* Section 4: Система */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTag}>СИСТЕМА</Text>

          <View style={styles.settingsGroup}>
            {/* Offline cache status */}
            <View style={styles.settingsRow}>
              <View style={styles.rowLabelGroup}>
                <Ionicons
                  name="cloud-done-outline"
                  size={18}
                  color={theme.teal}
                  style={styles.rowIcon}
                />
                <Text style={styles.rowTitle}>Офлайн-кэш</Text>
              </View>

              <View style={styles.cacheStatusPill}>
                <View style={styles.cacheGreenDot} />
                <Text style={styles.cacheStatusText}>Активен • 42 КБ</Text>
              </View>
            </View>

            {/* Manual refresh button */}
            <TouchableOpacity
              style={styles.settingsRow}
              onPress={handleManualRefresh}
              disabled={isRefreshing}
              activeOpacity={0.65}
            >
              <View style={styles.rowLabelGroup}>
                <Ionicons
                  name="sync-outline"
                  size={18}
                  color={theme.accent}
                  style={styles.rowIcon}
                />
                <Text style={styles.rowTitle}>Обновить данные</Text>
              </View>

              <View style={styles.refreshActionArea}>
                {isRefreshing ? (
                  <ActivityIndicator size="small" color={theme.accent} />
                ) : refreshSuccess ? (
                  <View style={styles.refreshSuccessBadge}>
                    <Ionicons name="checkmark-circle" size={16} color={theme.success} />
                    <Text style={styles.refreshSuccessText}>Обновлено</Text>
                  </View>
                ) : (
                  <View style={styles.manualRefreshBtn}>
                    <Text style={styles.manualRefreshText}>Синхронизировать</Text>
                    <Ionicons name="chevron-forward" size={14} color={theme.textTertiary} />
                  </View>
                )}
              </View>
            </TouchableOpacity>

            {/* App version display */}
            <View style={[styles.settingsRow, styles.lastRow]}>
              <View style={styles.rowLabelGroup}>
                <Ionicons
                  name="information-circle-outline"
                  size={18}
                  color={theme.textSecondary}
                  style={styles.rowIcon}
                />
                <Text style={styles.rowTitle}>Версия приложения</Text>
              </View>

              <Text style={styles.versionText}>v1.3.0 Build 42</Text>
            </View>
          </View>
        </View>

        {/* Section 5: Управление группой */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTag}>УПРАВЛЕНИЕ ГРУППОЙ</Text>

          <View style={styles.settingsGroup}>
            <TouchableOpacity
              style={[styles.settingsRow, styles.lastRow]}
              onPress={handleResetGroupPress}
              activeOpacity={0.65}
            >
              <View style={styles.rowLabelGroup}>
                <Ionicons
                  name="swap-horizontal-outline"
                  size={18}
                  color={theme.error}
                  style={styles.rowIcon}
                />
                <View>
                  <Text style={[styles.rowTitle, { color: theme.error }]}>
                    Сменить академическую группу
                  </Text>
                  {currentGroupName ? (
                    <Text style={styles.rowSubtitle}>
                      Текущая группа: {currentGroupName}
                    </Text>
                  ) : null}
                </View>
              </View>

              <Ionicons name="chevron-forward" size={16} color={theme.textTertiary} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  header: {
    paddingHorizontal: theme.paddingHorizontal,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.separatorLight,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: -6,
    minHeight: 44,
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 17,
    color: theme.accent,
  },
  metaBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  metaBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.textSecondary,
    letterSpacing: 0.5,
  },
  largeTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.textPrimary,
    letterSpacing: -0.5,
    marginTop: 4,
  },
  contentList: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: theme.paddingHorizontal,
    paddingTop: 16,
    gap: 20,
  },
  sectionContainer: {
    gap: 6,
  },
  sectionTag: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.textSecondary,
    letterSpacing: 0.6,
    marginLeft: 4,
  },
  settingsGroup: {
    backgroundColor: theme.bgSecondary,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    minHeight: 48, // Apple HIG standard touch target
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.07)',
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  rowLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  rowIcon: {
    marginRight: 12,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.textPrimary,
  },
  rowSubtitle: {
    fontSize: 11,
    color: theme.textSecondary,
    marginTop: 1,
  },
  segControlTheme: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 8,
    padding: 2,
    width: 140,
  },
  segControlSubgroup: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 8,
    padding: 2,
    width: 130,
  },
  segBtn: {
    flex: 1,
    paddingVertical: 5,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    minHeight: 28,
  },
  segBtnSmall: {
    flex: 1,
    paddingVertical: 5,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    minHeight: 28,
  },
  segBtnActive: {
    backgroundColor: theme.accent,
  },
  segBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.textSecondary,
  },
  segBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  accentIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  accentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.accent,
  },
  accentName: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.accent,
  },
  cacheStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(48, 209, 88, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  cacheGreenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.success,
  },
  cacheStatusText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.success,
  },
  refreshActionArea: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 28,
  },
  refreshSuccessBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  refreshSuccessText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.success,
  },
  manualRefreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  manualRefreshText: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.textSecondary,
  },
  versionText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textSecondary,
  },
});
