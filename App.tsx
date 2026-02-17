import React, { useState, useEffect } from 'react';
import { StyleSheet, View, StatusBar, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScheduleScreen } from './src/screens/ScheduleScreen';
import { GroupSelectionScreen } from './src/screens/GroupSelectionScreen';
import { DaySchedule } from './src/api/parser';
import { theme } from './src/theme';
import { getCurrentWeekType, getTodayDayIndex } from './src/utils/weekDetector';
import scheduleData from './src/data/schedule.json';

const STORAGE_KEY = 'lastSelectedGroup';

export default function App() {
  const [currentGroup, setCurrentGroup] = useState<{cat: string, course: string, name: string} | null>(null);
  const [weekType, setWeekType] = useState<"1" | "2">(getCurrentWeekType());
  const todayIndex = getTodayDayIndex();
  const currentWeekType = getCurrentWeekType(); // Real-time current week
  const [isLoading, setIsLoading] = useState(true);

  const refreshWeekType = () => {
    setWeekType(getCurrentWeekType());
  };

  // Restore last selected group on launch
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(value => {
        if (value) {
          try {
            const saved = JSON.parse(value);
            // Verify the group still exists in schedule data
            // @ts-ignore
            if (scheduleData[saved.cat]?.[saved.course]?.[saved.name]) {
              setCurrentGroup(saved);
            }
          } catch {}
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  // Save group whenever it changes
  const selectGroup = (cat: string, course: string, name: string) => {
    const group = { cat, course, name };
    setCurrentGroup(group);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(group));
  };

  const clearGroup = () => {
    setCurrentGroup(null);
    // Don't clear storage — keep last choice for quick re-select
  };

  const buildScheduleForGroup = (cat: string, course: string, groupName: string): DaySchedule[] => {
    // @ts-ignore
    const groupData = scheduleData[cat]?.[course]?.[groupName];
    if (!groupData) return [];

    const currentWeekSchedule = groupData[weekType] || {};
    
    const days = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"];
    
    const schedule: DaySchedule[] = [];
    
    days.forEach(day => {
       const key = Object.keys(currentWeekSchedule).find(k => k.toLowerCase() === day.toLowerCase());
       if (key && currentWeekSchedule[key] && currentWeekSchedule[key].length > 0) {
          schedule.push({
             date: "",
             weekday: day,
             items: currentWeekSchedule[key].map((lesson: any) => ({
                num: lesson.num,
                time: lesson.time,
                place: lesson.text,
                subject: "",
                teacher: "",
                type: ""
             }))
          });
       }
    });

    return schedule;
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <StatusBar barStyle="light-content" backgroundColor={theme.bg} />
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  if (!currentGroup) {
    return (
      <>
        <StatusBar barStyle="light-content" backgroundColor={theme.bg} />
        <GroupSelectionScreen 
          onSelectGroup={selectGroup} 
        />
      </>
    );
  }

  const data = buildScheduleForGroup(currentGroup.cat, currentGroup.course, currentGroup.name);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.bg} />
      <ScheduleScreen 
        data={data} 
        groupName={currentGroup.name}
        weekType={weekType}
        currentWeekType={currentWeekType}
        todayIndex={todayIndex}
        onBack={clearGroup}
        onToggleWeek={() => setWeekType(w => w === '1' ? '2' : '1')}
        onRefresh={refreshWeekType}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
