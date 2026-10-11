import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, ActivityIndicator, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ScheduleScreen,
  GroupSelectionScreen,
  WeeklyGridScreen,
  SearchScreen,
  SettingsScreen,
  ThemeMode,
} from './src/screens';
import { Navigation, LessonDetailSheet } from './src/components';
import { ActiveTab, Subgroup, Lesson } from './src/types';
import { getCurrentWeekType } from './src/utils/weekDetector';
import scheduleData from './src/data/schedule.json';

const STORAGE_KEY_GROUP = 'lastSelectedGroup';
const STORAGE_KEY_SUBGROUP = '@settings_default_subgroup';
const STORAGE_KEY_THEME = '@settings_theme_mode';
const STORAGE_KEY_AUTO_WEEK = '@settings_auto_week_parity';

function getInitialWeekType(): '1' | '2' {
  const now = new Date();
  const current = getCurrentWeekType(now);
  if (now.getDay() === 0) {
    return current === '1' ? '2' : '1';
  }
  return current;
}

function AppContent() {
  const [currentGroup, setCurrentGroup] = useState<{
    category: string;
    course: string;
    name: string;
  } | null>(null);
  const [isSelectingGroup, setIsSelectingGroup] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('schedule');
  const [weekType, setWeekType] = useState<'1' | '2'>(getInitialWeekType);
  const [selectedSubgroup, setSelectedSubgroup] = useState<Subgroup>('all');
  const [themeMode, setThemeMode] = useState<ThemeMode>('oled');
  const [autoDetectWeek, setAutoDetectWeek] = useState<boolean>(true);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [isDetailSheetVisible, setIsDetailSheetVisible] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load saved preferences on startup
  useEffect(() => {
    let isMounted = true;

    async function loadPreferences() {
      try {
        const [savedGroupRaw, savedSubgroupRaw, savedThemeRaw, savedAutoWeekRaw] =
          await Promise.all([
            AsyncStorage.getItem(STORAGE_KEY_GROUP),
            AsyncStorage.getItem(STORAGE_KEY_SUBGROUP),
            AsyncStorage.getItem(STORAGE_KEY_THEME),
            AsyncStorage.getItem(STORAGE_KEY_AUTO_WEEK),
          ]);

        if (!isMounted) return;

        if (savedGroupRaw) {
          try {
            const parsed = JSON.parse(savedGroupRaw);
            if (parsed && typeof parsed === 'object') {
              const category = parsed.category || parsed.cat;
              const course = parsed.course;
              const name = parsed.name;

              // Verify group still exists in dataset safely without prototype pollution
              if (
                typeof category === 'string' &&
                typeof course === 'string' &&
                typeof name === 'string' &&
                Object.prototype.hasOwnProperty.call(scheduleData, category) &&
                Object.prototype.hasOwnProperty.call((scheduleData as any)[category], course) &&
                Object.prototype.hasOwnProperty.call((scheduleData as any)[category][course], name)
              ) {
                setCurrentGroup({ category, course, name });
              }
            }
          } catch {
            // Ignore parse error
          }
        }

        if (
          savedSubgroupRaw === '1' ||
          savedSubgroupRaw === '2' ||
          savedSubgroupRaw === 'all'
        ) {
          setSelectedSubgroup(savedSubgroupRaw);
        }

        if (savedThemeRaw === 'oled' || savedThemeRaw === 'charcoal') {
          setThemeMode(savedThemeRaw);
        }

        if (savedAutoWeekRaw !== null) {
          setAutoDetectWeek(savedAutoWeekRaw === 'true');
        }
      } catch {
        // Ignore read error
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadPreferences();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSelectGroup = useCallback(
    (category: string, course: string, name: string) => {
      const group = { category, course, name };
      setCurrentGroup(group);
      setIsSelectingGroup(false);
      setActiveTab('schedule');
      AsyncStorage.setItem(STORAGE_KEY_GROUP, JSON.stringify(group)).catch(() => {});
    },
    []
  );

  const handleSelectSubgroup = useCallback((subgroup: Subgroup) => {
    setSelectedSubgroup(subgroup);
    AsyncStorage.setItem(STORAGE_KEY_SUBGROUP, subgroup).catch(() => {});
  }, []);

  const handleSelectLesson = useCallback((lesson: Lesson) => {
    setSelectedLesson(lesson);
    setIsDetailSheetVisible(true);
  }, []);

  const handleCloseDetailSheet = useCallback(() => {
    setIsDetailSheetVisible(false);
  }, []);

  const handleToggleWeek = useCallback(() => {
    setWeekType((prev) => (prev === '1' ? '2' : '1'));
  }, []);

  const handleSelectThemeMode = useCallback((mode: ThemeMode) => {
    setThemeMode(mode);
    AsyncStorage.setItem(STORAGE_KEY_THEME, mode).catch(() => {});
  }, []);

  const handleSelectAutoDetectWeek = useCallback((val: boolean) => {
    setAutoDetectWeek(val);
    AsyncStorage.setItem(STORAGE_KEY_AUTO_WEEK, String(val)).catch(() => {});
    if (val) {
      setWeekType(getInitialWeekType());
    }
  }, []);

  const handleRefresh = useCallback(() => {
    if (autoDetectWeek) {
      setWeekType(getInitialWeekType());
    }
  }, [autoDetectWeek]);

  const rootBgColor = themeMode === 'charcoal' ? '#121214' : '#000000';

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: rootBgColor }]}>
        <StatusBar style="light" backgroundColor={rootBgColor} />
        <ActivityIndicator size="large" color="#0A84FF" />
      </View>
    );
  }

  if (!currentGroup || isSelectingGroup) {
    return (
      <View style={[styles.container, { backgroundColor: rootBgColor }]}>
        <StatusBar style="light" backgroundColor={rootBgColor} />
        <View style={[styles.appWrapper, { backgroundColor: rootBgColor }]}>
          <GroupSelectionScreen
            onSelectGroup={handleSelectGroup}
            initialCategory={currentGroup?.category}
            initialCourse={currentGroup?.course}
            initialGroup={currentGroup?.name}
            onBack={currentGroup ? () => setIsSelectingGroup(false) : undefined}
          />
        </View>
      </View>
    );
  }

  const renderActiveTabContent = () => {
    switch (activeTab) {
      case 'schedule':
        return (
          <ScheduleScreen
            currentGroup={currentGroup}
            weekType={weekType}
            onToggleWeek={handleToggleWeek}
            selectedSubgroup={selectedSubgroup}
            onSelectSubgroup={handleSelectSubgroup}
            onOpenGroupSelection={() => setIsSelectingGroup(true)}
            onSelectLesson={handleSelectLesson}
            onRefresh={handleRefresh}
          />
        );
      case 'weekly':
        return (
          <WeeklyGridScreen
            scheduleData={scheduleData}
            selectedGroup={currentGroup.name}
            weekType={weekType}
            selectedSubgroup={selectedSubgroup}
            onSelectSubgroup={handleSelectSubgroup}
            onSelectLesson={handleSelectLesson}
            onToggleWeek={handleToggleWeek}
            onBack={() => setActiveTab('schedule')}
          />
        );
      case 'search':
        return (
          <SearchScreen
            scheduleData={scheduleData}
            currentWeek={weekType}
            onBack={() => setActiveTab('schedule')}
          />
        );
      case 'settings':
        return (
          <SettingsScreen
            subgroup={selectedSubgroup}
            onSetSubgroup={handleSelectSubgroup}
            onResetGroup={() => setIsSelectingGroup(true)}
            currentGroupName={currentGroup.name}
            onBack={() => setActiveTab('schedule')}
            themeMode={themeMode}
            onSetThemeMode={handleSelectThemeMode}
            autoDetectWeek={autoDetectWeek}
            onSetAutoDetectWeek={handleSelectAutoDetectWeek}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: rootBgColor }]}>
      <StatusBar style="light" backgroundColor={rootBgColor} />
      <View style={[styles.appWrapper, { backgroundColor: rootBgColor }]}>
        <View style={styles.contentContainer}>
          {renderActiveTabContent()}
        </View>
        <Navigation
          activeTab={activeTab}
          onSelectTab={setActiveTab}
        />
      </View>
      <LessonDetailSheet
        visible={isDetailSheetVisible}
        lesson={selectedLesson}
        onClose={handleCloseDetailSheet}
      />
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
  },
  appWrapper: {
    flex: 1,
    width: '100%',
    maxWidth: 720,
    backgroundColor: '#000000',
    borderLeftWidth: Platform.OS === 'web' ? 1 : 0,
    borderRightWidth: Platform.OS === 'web' ? 1 : 0,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  contentContainer: {
    flex: 1,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
