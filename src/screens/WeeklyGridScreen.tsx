import React, { useState, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Lesson, Subgroup } from '../types';
import { parseRawLessonText } from '../api/parser';
import { theme } from '../theme';
import { LessonDetailSheet } from '../components/LessonDetailSheet';

export interface WeeklyGridScreenProps {
  scheduleData: any;
  selectedGroup: string;
  weekType: '1' | '2';
  onSelectLesson?: (lesson: Lesson) => void;
  onToggleWeek?: () => void;
  onBack?: () => void;
}

interface DayConfig {
  name: string;
  shortName: string;
  color: string;
}

const WEEK_DAYS: DayConfig[] = [
  { name: 'Понедельник', shortName: 'ПН', color: '#0A84FF' },
  { name: 'Вторник', shortName: 'ВТ', color: '#30D158' },
  { name: 'Среда', shortName: 'СР', color: '#FF9F0A' },
  { name: 'Четверг', shortName: 'ЧТ', color: '#BF5AF2' },
  { name: 'Пятница', shortName: 'ПТ', color: '#FF453A' },
  { name: 'Суббота', shortName: 'СБ', color: '#FFD60A' },
];

/**
 * Returns formatted Russian plural form for pair counts.
 */
function formatLessonCount(count: number): string {
  if (count === 0) {
    return '0 пар';
  }
  const rem10 = count % 10;
  const rem100 = count % 100;
  if (rem10 === 1 && rem100 !== 11) {
    return `${count} пара`;
  }
  if (rem10 >= 2 && rem10 <= 4 && (rem100 < 10 || rem100 >= 20)) {
    return `${count} пары`;
  }
  return `${count} пар`;
}

/**
 * Finds week schedule map for a given group across categories and courses.
 */
function findGroupWeekSchedule(
  scheduleData: any,
  selectedGroup: string,
  week: '1' | '2'
): Record<string, any[]> {
  if (!scheduleData || typeof scheduleData !== 'object') {
    return {};
  }

  for (const cat of Object.keys(scheduleData)) {
    const courses = scheduleData[cat] || {};
    for (const crs of Object.keys(courses)) {
      const groups = courses[crs] || {};
      if (groups[selectedGroup]) {
        return groups[selectedGroup][week] || {};
      }
    }
  }

  return {};
}

export const WeeklyGridScreen: React.FC<WeeklyGridScreenProps> = ({
  scheduleData,
  selectedGroup,
  weekType,
  onSelectLesson,
  onToggleWeek,
  onBack,
}) => {
  const insets = useSafeAreaInsets();
  const [internalLesson, setInternalLesson] = useState<Lesson | null>(null);

  // Group lessons parsed by day
  const weeklyMatrix = useMemo(() => {
    const weekSchedule = findGroupWeekSchedule(scheduleData, selectedGroup, weekType);

    return WEEK_DAYS.map((day, dayIndex) => {
      const dayKey = Object.keys(weekSchedule).find(
        (key) => key.toLowerCase() === day.name.toLowerCase()
      );
      const rawList = dayKey && Array.isArray(weekSchedule[dayKey]) ? weekSchedule[dayKey] : [];

      const parsedLessons: Lesson[] = [];
      for (const item of rawList) {
        const parsed = parseRawLessonText(item.num, item.time, item.text, dayIndex);
        parsedLessons.push(...parsed);
      }

      parsedLessons.sort((a, b) => {
        if (a.num !== b.num) {
          return a.num - b.num;
        }
        return a.subgroup.localeCompare(b.subgroup);
      });

      return {
        ...day,
        dayIndex,
        lessons: parsedLessons,
      };
    });
  }, [scheduleData, selectedGroup, weekType]);

  const handleLessonPress = useCallback(
    (lesson: Lesson) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (onSelectLesson) {
        onSelectLesson(lesson);
      } else {
        setInternalLesson(lesson);
      }
    },
    [onSelectLesson]
  );

  const handleToggleWeek = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggleWeek?.();
  }, [onToggleWeek]);

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

          <View style={styles.metaRow}>
            <View style={styles.metaPill}>
              <View style={styles.metaDot} />
              <Text style={styles.metaText}>
                {selectedGroup || 'ГРУППА'} • {weekType} НЕДЕЛЯ
              </Text>
            </View>

            {onToggleWeek && (
              <TouchableOpacity
                style={styles.weekToggleBtn}
                onPress={handleToggleWeek}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="swap-horizontal" size={14} color={theme.accent} />
                <Text style={styles.weekToggleText}>
                  {weekType === '1' ? 'Нед. 2' : 'Нед. 1'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <Text style={styles.largeTitle}>Сетка недели</Text>
        <Text style={styles.subtitle}>Полная учебная нагрузка понедельник–суббота</Text>
      </View>

      {/* 6-Day Schedule Matrix List */}
      <ScrollView
        style={styles.scrollList}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 80 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {weeklyMatrix.map((day) => {
          const hasLessons = day.lessons.length > 0;

          return (
            <View
              key={day.name}
              style={[styles.dayCard, { borderLeftColor: day.color }]}
            >
              {/* Day Header Row */}
              <View style={styles.dayHeader}>
                <View style={styles.dayTitleRow}>
                  <Text style={[styles.dayName, { color: day.color }]}>
                    {day.name.toUpperCase()}
                  </Text>
                </View>
                <View style={[styles.countBadge, { backgroundColor: day.color + '22' }]}>
                  <Text style={[styles.countBadgeText, { color: day.color }]}>
                    {formatLessonCount(day.lessons.length)}
                  </Text>
                </View>
              </View>

              {/* Day Lessons List */}
              {hasLessons ? (
                <View style={styles.lessonsContainer}>
                  {day.lessons.map((lesson, idx) => {
                    const isLast = idx === day.lessons.length - 1;

                    return (
                      <TouchableOpacity
                        key={lesson.id}
                        style={[styles.lessonRow, !isLast && styles.lessonRowBorder]}
                        onPress={() => handleLessonPress(lesson)}
                        activeOpacity={0.65}
                      >
                        {/* Pair Number Badge */}
                        <View style={styles.pairNumberBadge}>
                          <Text style={styles.pairNumberText}>#{lesson.num}</Text>
                        </View>

                        {/* Lesson Content Info */}
                        <View style={styles.lessonInfo}>
                          <View style={styles.lessonTitleRow}>
                            <Text
                              style={styles.subjectText}
                              numberOfLines={1}
                              ellipsizeMode="tail"
                            >
                              {lesson.subject}
                            </Text>

                            {lesson.subgroup !== 'all' && (
                              <View style={styles.subgroupBadge}>
                                <Text style={styles.subgroupBadgeText}>
                                  {lesson.subgroup}п
                                </Text>
                              </View>
                            )}
                          </View>

                          <View style={styles.lessonMetaRow}>
                            <Text style={styles.lessonTimeText}>{lesson.time}</Text>
                            {lesson.type ? (
                              <Text
                                style={styles.lessonTypeText}
                                numberOfLines={1}
                              >
                                • {lesson.type}
                              </Text>
                            ) : null}
                          </View>
                        </View>

                        {/* Room Location Tag */}
                        {lesson.room ? (
                          <View style={styles.roomTag}>
                            <Text
                              style={styles.roomTagText}
                              numberOfLines={1}
                            >
                              {lesson.room}
                            </Text>
                          </View>
                        ) : null}

                        <Ionicons
                          name="chevron-forward"
                          size={14}
                          color={theme.textTertiary}
                          style={styles.rowChevron}
                        />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : (
                <View style={styles.emptyDayContainer}>
                  <Text style={styles.emptyDayText}>Занятий нет</Text>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* Internal Modal Sheet Fallback */}
      {!onSelectLesson && (
        <LessonDetailSheet
          lesson={internalLesson}
          visible={!!internalLesson}
          onClose={() => setInternalLesson(null)}
        />
      )}
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
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.separatorLight,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
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
    fontWeight: '400',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    justifyContent: 'flex-end',
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 5,
  },
  metaDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.accent,
  },
  metaText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.accent,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  weekToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(10, 132, 255, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
    minHeight: 28,
  },
  weekToggleText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.accent,
  },
  largeTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.textPrimary,
    letterSpacing: -0.5,
    marginTop: 2,
  },
  subtitle: {
    fontSize: 13,
    color: theme.textSecondary,
    marginTop: 2,
  },
  scrollList: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.paddingHorizontal,
    paddingTop: 14,
    gap: 12,
  },
  dayCard: {
    backgroundColor: theme.bgSecondary,
    borderRadius: theme.borderRadiusSmall,
    borderLeftWidth: 3.5,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    ...theme.shadow,
    elevation: 2,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dayTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dayName: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  lessonsContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 8,
    overflow: 'hidden',
  },
  lessonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 10,
    minHeight: 44, // HIG standard min touch target
  },
  lessonRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.07)',
  },
  pairNumberBadge: {
    width: 28,
    alignItems: 'flex-start',
  },
  pairNumberText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.accent,
  },
  lessonInfo: {
    flex: 1,
    marginRight: 8,
  },
  lessonTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  subjectText: {
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '600',
    color: theme.textPrimary,
  },
  subgroupBadge: {
    backgroundColor: 'rgba(191, 90, 242, 0.2)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  subgroupBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.purple,
  },
  lessonMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 4,
  },
  lessonTimeText: {
    fontSize: 11,
    color: theme.textSecondary,
  },
  lessonTypeText: {
    fontSize: 11,
    color: theme.textSecondary,
    flexShrink: 1,
  },
  roomTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 4,
  },
  roomTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.textPrimary,
  },
  rowChevron: {
    marginLeft: 2,
  },
  emptyDayContainer: {
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyDayText: {
    fontSize: 12,
    color: theme.textSecondary,
    fontStyle: 'italic',
  },
});
