import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Platform,
  Animated,
  Easing,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { theme } from '../theme';
import { Lesson, Subgroup, DaySchedule } from '../types';
import {
  getLessonsForGroup,
  filterLessonsBySubgroup,
  isLessonCurrentlyActive,
} from '../utils/scheduleUtils';
import { getCurrentWeekType, getTodayDayIndex } from '../utils/weekDetector';
import scheduleData from '../data/schedule.json';

export interface ScheduleScreenProps {
  currentGroup?: { category: string; course: string; name: string };
  weekType: '1' | '2';
  onToggleWeek: () => void;
  onSelectLesson?: (lesson: Lesson) => void;
  selectedSubgroup?: Subgroup;
  onSelectSubgroup?: (sg: Subgroup) => void;
  onOpenGroupSelection?: () => void;
  // Optional backwards-compatible props
  data?: DaySchedule[];
  groupName?: string;
  currentWeekType?: '1' | '2';
  todayIndex?: number;
  onBack?: () => void;
  onRefresh?: () => void;
}

function triggerHaptic(style: 'light' | 'medium' | 'selection' = 'light') {
  try {
    if (style === 'selection') {
      Haptics.selectionAsync();
    } else if (style === 'medium') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  } catch {
    // Non-fatal fallback for non-haptic platforms
  }
}

/** Animated pulsing dot for active lesson */
const PulseDot: React.FC = () => {
  const anim = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0.35,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);

  return <Animated.View style={[styles.pulseDot, { opacity: anim }]} />;
};

/** Animated progress bar for the active lesson */
const LessonProgressBar: React.FC<{ progress: number; color?: string }> = ({
  progress,
  color,
}) => {
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.timing(animValue, {
      toValue: Math.max(0, Math.min(1, progress)),
      duration: 500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    anim.start();
    return () => {
      anim.stop();
    };
  }, [progress]);

  const widthInterpolation = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  const barColor = color || theme.accent;

  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressTrack}>
        <Animated.View
          style={[styles.progressFill, { width: widthInterpolation }]}
        >
          <LinearGradient
            colors={[barColor, barColor + 'AA']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </View>
    </View>
  );
};

function getTeacherAvatarLetters(teacher: string, teacherInitials?: string): string {
  if (teacherInitials) {
    const letters = teacherInitials
      .replace(/[^А-Яа-яЁёA-Za-z]/g, '')
      .toUpperCase();
    if (letters.length >= 2) return letters.slice(0, 2);
  }
  if (!teacher) return 'УП';
  const match =
    teacher.match(/([А-ЯЁ])\.[А-ЯЁ]\.\s*([А-ЯЁ])/u) ||
    teacher.match(/([А-ЯЁ])[а-яё]+\s+([А-ЯЁ])\./u);
  if (match) {
    return `${match[2]}${match[1]}`.toUpperCase();
  }
  const caps = teacher.replace(/[^А-ЯЁ]/g, '');
  if (caps.length >= 2) return caps.slice(0, 2);
  return (teacher.trim().slice(0, 2) || 'ПР').toUpperCase();
}

function formatRoom(room: string): string {
  if (!room || !room.trim()) {
    return 'Кабинет уточняется';
  }
  const clean = room.trim();
  if (
    clean.toLowerCase().includes('онлайн') ||
    clean.toLowerCase().includes('контур')
  ) {
    return 'Контур.Толк';
  }
  if (
    clean.startsWith('ауд') ||
    clean.startsWith('лаб') ||
    clean.startsWith('лек')
  ) {
    return clean;
  }
  return `ауд. ${clean}`;
}

function getTypeBadge(lesson: Lesson): {
  label: string;
  bg: string;
  color: string;
  border: string;
} {
  const code = lesson.typeCode;
  const sub = lesson.subgroup !== 'all' ? ` ${lesson.subgroup}п` : '';

  switch (code) {
    case 'lecture':
      return {
        label: `Лекция${sub}`,
        bg: 'rgba(10, 132, 255, 0.15)',
        color: '#0A84FF',
        border: 'rgba(10, 132, 255, 0.3)',
      };
    case 'lab':
      return {
        label: `Лаб${sub}`,
        bg: 'rgba(48, 209, 88, 0.15)',
        color: '#30D158',
        border: 'rgba(48, 209, 88, 0.3)',
      };
    case 'seminar':
      return {
        label: `Семинар${sub}`,
        bg: 'rgba(255, 159, 10, 0.15)',
        color: '#FF9F0A',
        border: 'rgba(255, 159, 10, 0.3)',
      };
    case 'practice':
      return {
        label: `Практика${sub}`,
        bg: 'rgba(191, 90, 242, 0.15)',
        color: '#BF5AF2',
        border: 'rgba(191, 90, 242, 0.3)',
      };
    default:
      return {
        label: lesson.type ? `${lesson.type}${sub}` : `Занятие${sub}`,
        bg: 'rgba(142, 142, 147, 0.15)',
        color: '#8E8E93',
        border: 'rgba(142, 142, 147, 0.3)',
      };
  }
}

const WEEKDAY_NAMES = [
  'Понедельник',
  'Вторник',
  'Среда',
  'Четверг',
  'Пятница',
  'Суббота',
];

const WEEKDAY_SHORTS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

const MONTHS_RU = [
  'января',
  'февраля',
  'марта',
  'апреля',
  'мая',
  'июня',
  'июля',
  'августа',
  'сентября',
  'октября',
  'ноября',
  'декабря',
];

export const ScheduleScreen: React.FC<ScheduleScreenProps> = ({
  currentGroup,
  weekType,
  onToggleWeek,
  onSelectLesson,
  selectedSubgroup: propSelectedSubgroup,
  onSelectSubgroup: propOnSelectSubgroup,
  onOpenGroupSelection,
  onRefresh,
  groupName: propGroupName,
  onBack,
}) => {
  const insets = useSafeAreaInsets();
  const [now, setNow] = useState<Date>(() => new Date());
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [localSubgroup, setLocalSubgroup] = useState<Subgroup>('all');
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedSubgroup = propSelectedSubgroup ?? localSubgroup;
  const onSelectSubgroup = propOnSelectSubgroup ?? setLocalSubgroup;
  const handleOpenGroup = onOpenGroupSelection || onBack;

  // Update current time every 60 seconds for real-time progress & countdowns
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 60_000);
    return () => clearInterval(timer);
  }, []);

  // Timer cleanup for handleRefresh
  useEffect(() => {
    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, []);

  const realCurrentWeek = getCurrentWeekType(now);
  const realTodayDayIdx = getTodayDayIndex(now); // 0=Mon ... 5=Sat, 6=Sun
  const isSunday = realTodayDayIdx === 6;
  const upcomingWeek = realCurrentWeek === '1' ? '2' : '1';

  // If today is Sunday and currently viewing current elapsed week, auto-navigate to upcoming week
  useEffect(() => {
    if (isSunday && weekType === realCurrentWeek) {
      onToggleWeek();
    }
  }, [isSunday, weekType, realCurrentWeek, onToggleWeek]);

  // Determine group coordinates
  const cat = currentGroup?.category || (currentGroup as any)?.cat || 'ПМ';
  const course = currentGroup?.course || '1';
  const groupName = currentGroup?.name || (currentGroup as any)?.groupName || propGroupName || 'ПМ-О-26/1';

  // Format date key so carouselDays is decoupled from minute ticks
  const dateKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;

  // Compute carousel days (Monday through Saturday)
  const carouselDays = useMemo(() => {
    const baseDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const currentDayOfWeek = baseDate.getDay(); // 0: Sun, 1: Mon, ... 6: Sat
    // On Sunday, advance to upcoming Monday (+1 day); otherwise find this week's Monday
    const mondayOffset = currentDayOfWeek === 0 ? 1 : 1 - currentDayOfWeek;
    const targetMonday = new Date(baseDate);
    targetMonday.setDate(baseDate.getDate() + mondayOffset);

    // If today is Sunday, base target week is upcomingWeek
    const baseWeek = currentDayOfWeek === 0 ? upcomingWeek : realCurrentWeek;
    // If viewing opposite week parity, offset by 7 days
    const weekDiff = weekType === baseWeek ? 0 : 7;

    return WEEKDAY_NAMES.slice(0, 6).map((weekday, i) => {
      const d = new Date(targetMonday);
      d.setDate(targetMonday.getDate() + i + weekDiff);

      const isToday =
        weekType === realCurrentWeek &&
        (currentDayOfWeek === 0 ? false : currentDayOfWeek - 1 === i);

      const lessons = getLessonsForGroup(
        scheduleData,
        cat,
        course,
        groupName,
        weekType,
        weekday
      );

      return {
        weekday,
        shortName: WEEKDAY_SHORTS[i],
        dateNum: d.getDate(),
        fullDateStr: `${d.getDate()} ${MONTHS_RU[d.getMonth()]}`,
        isToday,
        lessonsCount: lessons.length,
      };
    });
  }, [dateKey, weekType, realCurrentWeek, upcomingWeek, cat, course, groupName]);

  // Initial selected day: today if Monday-Saturday on current week, otherwise Monday (0)
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(() => {
    if (weekType === realCurrentWeek && realTodayDayIdx >= 0 && realTodayDayIdx <= 5) {
      return realTodayDayIdx;
    }
    return 0;
  });

  // Switch to today when parity changes back to current week, or Monday on Sunday
  useEffect(() => {
    if (weekType === realCurrentWeek && realTodayDayIdx >= 0 && realTodayDayIdx <= 5) {
      setSelectedDayIndex(realTodayDayIdx);
    } else if (realTodayDayIdx === 6) {
      setSelectedDayIndex(0);
    }
  }, [weekType, realCurrentWeek, realTodayDayIdx]);

  const activeDay = carouselDays[selectedDayIndex] || carouselDays[0];

  // Raw lessons for the active day
  const dayLessons = useMemo(() => {
    return getLessonsForGroup(
      scheduleData,
      cat,
      course,
      groupName,
      weekType,
      activeDay.weekday
    );
  }, [cat, course, groupName, weekType, activeDay.weekday]);

  // Filtered by student subgroup
  const filteredLessons = useMemo(() => {
    return filterLessonsBySubgroup(dayLessons, selectedSubgroup);
  }, [dayLessons, selectedSubgroup]);

  const handleRefresh = () => {
    triggerHaptic('medium');
    setRefreshing(true);
    onRefresh?.();
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }
    refreshTimerRef.current = setTimeout(() => {
      setRefreshing(false);
    }, 500);
  };

  const isTodayActive =
    weekType === realCurrentWeek &&
    realTodayDayIdx >= 0 &&
    realTodayDayIdx <= 5 &&
    selectedDayIndex === realTodayDayIdx;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Sticky Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + (Platform.OS === 'ios' ? 8 : 14),
          },
        ]}
      >
        {/* Top Header Row: Group Name Badge & Week Parity Switcher */}
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={styles.groupBadge}
            onPress={() => {
              triggerHaptic('selection');
              handleOpenGroup?.();
            }}
            activeOpacity={0.7}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <View style={styles.groupBadgeDot} />
            <Text style={styles.groupBadgeText} numberOfLines={1}>
              {groupName}
            </Text>
            <Ionicons
              name="chevron-down"
              size={14}
              color={theme.textSecondary}
              style={styles.groupBadgeIcon}
            />
          </TouchableOpacity>

          {/* Week Parity Switcher */}
          <View style={styles.weekSwitcher}>
            <TouchableOpacity
              style={[
                styles.weekSwitcherBtn,
                weekType === '1' && styles.weekSwitcherBtnActive,
              ]}
              onPress={() => {
                if (weekType !== '1') {
                  triggerHaptic('selection');
                  onToggleWeek();
                }
              }}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
            >
              <Text
                style={[
                  styles.weekSwitcherText,
                  weekType === '1' && styles.weekSwitcherTextActive,
                ]}
              >
                1 Неделя
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.weekSwitcherBtn,
                weekType === '2' && styles.weekSwitcherBtnActive,
              ]}
              onPress={() => {
                if (weekType !== '2') {
                  triggerHaptic('selection');
                  onToggleWeek();
                }
              }}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
            >
              <Text
                style={[
                  styles.weekSwitcherText,
                  weekType === '2' && styles.weekSwitcherTextActive,
                ]}
              >
                2 Неделя
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Date Headline */}
        <View style={styles.headlineRow}>
          <Text style={styles.headlineTitle}>
            {activeDay.weekday}, {activeDay.fullDateStr}
          </Text>
          {isTodayActive && (
            <View style={styles.todayBadge}>
              <Text style={styles.todayBadgeText}>Сегодня</Text>
            </View>
          )}
        </View>

        {/* Subgroup Filter Segmented Pills */}
        <View style={styles.subgroupControl}>
          <TouchableOpacity
            style={[
              styles.subgroupPill,
              selectedSubgroup === 'all' && styles.subgroupPillActive,
            ]}
            onPress={() => {
              triggerHaptic('selection');
              onSelectSubgroup('all');
            }}
            activeOpacity={0.7}
            hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
          >
            <Text
              style={[
                styles.subgroupPillText,
                selectedSubgroup === 'all' && styles.subgroupPillTextActive,
              ]}
            >
              Все ({dayLessons.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.subgroupPill,
              selectedSubgroup === '1' && styles.subgroupPillActive,
            ]}
            onPress={() => {
              triggerHaptic('selection');
              onSelectSubgroup('1');
            }}
            activeOpacity={0.7}
            hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
          >
            <Text
              style={[
                styles.subgroupPillText,
                selectedSubgroup === '1' && styles.subgroupPillTextActive,
              ]}
            >
              1 подгруппа
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.subgroupPill,
              selectedSubgroup === '2' && styles.subgroupPillActive,
            ]}
            onPress={() => {
              triggerHaptic('selection');
              onSelectSubgroup('2');
            }}
            activeOpacity={0.7}
            hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
          >
            <Text
              style={[
                styles.subgroupPillText,
                selectedSubgroup === '2' && styles.subgroupPillTextActive,
              ]}
            >
              2 подгруппа
            </Text>
          </TouchableOpacity>
        </View>

        {/* Horizontal Day Carousel Strip (Mon–Sat) */}
        <View style={styles.dayStrip}>
          {carouselDays.map((dayItem, index) => {
            const isActiveDay = selectedDayIndex === index;

            return (
              <TouchableOpacity
                key={dayItem.weekday}
                style={[
                  styles.dayCapsule,
                  isActiveDay && styles.dayCapsuleActive,
                  dayItem.isToday && !isActiveDay && styles.dayCapsuleToday,
                ]}
                onPress={() => {
                  triggerHaptic('selection');
                  setSelectedDayIndex(index);
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.dayCapsuleShort,
                    isActiveDay && styles.dayCapsuleShortActive,
                  ]}
                >
                  {dayItem.shortName}
                </Text>
                <Text
                  style={[
                    styles.dayCapsuleNum,
                    isActiveDay && styles.dayCapsuleNumActive,
                  ]}
                >
                  {dayItem.dateNum}
                </Text>

                {/* Dot for class indicator */}
                <View
                  style={[
                    styles.dayDot,
                    dayItem.lessonsCount > 0 && styles.dayDotHasClasses,
                    isActiveDay && styles.dayDotActive,
                  ]}
                />
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Schedule Card List */}
      <ScrollView
        style={styles.scrollList}
        contentContainerStyle={[
          styles.scrollListContent,
          {
            paddingBottom: insets.bottom + 80,
          },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.accent}
            colors={[theme.accent]}
          />
        }
      >
        {filteredLessons.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="calendar-outline"
              size={56}
              color={theme.textTertiary}
            />
            <Text style={styles.emptyTitle}>Нет занятий</Text>
            <Text style={styles.emptySub}>
              {selectedSubgroup !== 'all'
                ? `Для ${selectedSubgroup} подгруппы пары отсутствуют`
                : 'На этот день расписание занятий пусто'}
            </Text>
          </View>
        ) : (
          filteredLessons.map((lesson) => {
            let isActive = false;
            let progress = 0;
            let remainingMinutes = 0;

            if (isTodayActive) {
              const liveStatus = isLessonCurrentlyActive(lesson.time, now);
              isActive = liveStatus.isActive;
              progress = liveStatus.progress;
              remainingMinutes = liveStatus.remainingMinutes;
            }

            const badgeInfo = getTypeBadge(lesson);
            const teacherInitials = getTeacherAvatarLetters(
              lesson.teacher,
              lesson.teacherInitials
            );

            return (
              <TouchableOpacity
                key={lesson.id}
                style={[
                  styles.lessonCard,
                  isActive && styles.lessonCardLive,
                ]}
                onPress={() => {
                  triggerHaptic('light');
                  onSelectLesson?.(lesson);
                }}
                activeOpacity={0.7}
              >
                {/* Lesson Time & Type Badge */}
                <View style={styles.timeRow}>
                  {isActive ? (
                    <View style={styles.liveTimeWrap}>
                      <PulseDot />
                      <Text style={styles.liveTimeText}>
                        {lesson.time} • Идет пара ({remainingMinutes}м)
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.standardTimeText}>
                      {lesson.time} • {lesson.num} пара
                    </Text>
                  )}

                  <View
                    style={[
                      styles.typeBadge,
                      {
                        backgroundColor: badgeInfo.bg,
                        borderColor: badgeInfo.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.typeBadgeText,
                        { color: badgeInfo.color },
                      ]}
                    >
                      {badgeInfo.label}
                    </Text>
                  </View>
                </View>

                {/* Live Progress Bar */}
                {isActive && (
                  <LessonProgressBar
                    progress={progress}
                    color={theme.accent}
                  />
                )}

                {/* Subject Title */}
                <Text style={styles.subjectTitle} numberOfLines={2}>
                  {lesson.subject || lesson.raw || 'Учебное занятие'}
                </Text>

                {/* Footer: Teacher Avatar Chip & Room Pill */}
                <View style={styles.cardFooter}>
                  <View style={styles.teacherWrap}>
                    <View
                      style={[
                        styles.avatarChip,
                        isActive && styles.avatarChipActive,
                      ]}
                    >
                      <Text style={styles.avatarInitials}>
                        {teacherInitials}
                      </Text>
                    </View>
                    <Text style={styles.teacherName} numberOfLines={1}>
                      {lesson.teacher || 'Преподаватель кафедры'}
                    </Text>
                  </View>

                  <View style={styles.roomTag}>
                    <Ionicons
                      name={
                        (lesson.room || '').toLowerCase().includes('онлайн') ||
                        (lesson.room || '').toLowerCase().includes('контур')
                          ? 'globe-outline'
                          : 'location-sharp'
                      }
                      size={12}
                      color={theme.accent}
                      style={{ marginRight: 4 }}
                    />
                    <Text style={styles.roomTagText} numberOfLines={1}>
                      {formatRoom(lesson.room)}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
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
    backgroundColor: theme.bg,
    paddingHorizontal: theme.paddingHorizontal,
    borderBottomWidth: 0.5,
    borderBottomColor: theme.separatorLight,
    paddingBottom: 12,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  groupBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.bgSecondary,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.separatorLight,
    minHeight: 36,
  },
  groupBadgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.accent,
    marginRight: 8,
  },
  groupBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.textPrimary,
    letterSpacing: -0.2,
  },
  groupBadgeIcon: {
    marginLeft: 6,
  },
  weekSwitcher: {
    flexDirection: 'row',
    backgroundColor: theme.bgTertiary,
    borderRadius: 10,
    padding: 3,
  },
  weekSwitcherBtn: {
    minHeight: 36,
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  weekSwitcherBtnActive: {
    backgroundColor: theme.bgSecondary,
    ...theme.shadow,
  },
  weekSwitcherText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.textSecondary,
  },
  weekSwitcherTextActive: {
    color: theme.textPrimary,
    fontWeight: '700',
  },
  headlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  headlineTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.textPrimary,
    letterSpacing: -0.4,
  },
  todayBadge: {
    backgroundColor: 'rgba(10, 132, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: 'rgba(10, 132, 255, 0.3)',
  },
  todayBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.accent,
  },
  subgroupControl: {
    flexDirection: 'row',
    backgroundColor: theme.bgTertiary,
    borderRadius: 10,
    padding: 3,
    marginBottom: 12,
  },
  subgroupPill: {
    flex: 1,
    minHeight: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  subgroupPillActive: {
    backgroundColor: theme.bgSecondary,
    ...theme.shadow,
  },
  subgroupPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.textSecondary,
  },
  subgroupPillTextActive: {
    color: theme.textPrimary,
    fontWeight: '700',
  },
  dayStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  dayCapsule: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.bgSecondary,
    borderRadius: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: theme.separatorLight,
    minHeight: 56,
  },
  dayCapsuleActive: {
    backgroundColor: theme.accent,
    borderColor: theme.accent,
    ...theme.shadow,
  },
  dayCapsuleToday: {
    borderColor: theme.accent,
  },
  dayCapsuleShort: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.textSecondary,
    marginBottom: 2,
  },
  dayCapsuleShortActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  dayCapsuleNum: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.textPrimary,
  },
  dayCapsuleNumActive: {
    color: '#FFFFFF',
  },
  dayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 4,
    backgroundColor: 'transparent',
  },
  dayDotHasClasses: {
    backgroundColor: theme.accent,
  },
  dayDotActive: {
    backgroundColor: '#FFFFFF',
  },
  scrollList: {
    flex: 1,
  },
  scrollListContent: {
    paddingHorizontal: theme.paddingHorizontal,
    paddingTop: 14,
  },
  lessonCard: {
    backgroundColor: theme.bgCard,
    borderRadius: theme.borderRadius,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.separatorLight,
    ...theme.shadow,
  },
  lessonCardLive: {
    borderColor: theme.accent,
    borderWidth: 1.5,
    backgroundColor: 'rgba(10, 132, 255, 0.05)',
    shadowColor: theme.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  standardTimeText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.textSecondary,
    letterSpacing: -0.2,
  },
  liveTimeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveTimeText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.accent,
    letterSpacing: -0.2,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.accent,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  progressContainer: {
    marginVertical: 6,
  },
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  subjectTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.textPrimary,
    lineHeight: 20,
    letterSpacing: -0.2,
    marginBottom: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  teacherWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  avatarChip: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  avatarChipActive: {
    backgroundColor: theme.accent,
  },
  avatarInitials: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  teacherName: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.textSecondary,
    flex: 1,
  },
  roomTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.bgTertiary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 7,
  },
  roomTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.textPrimary,
    marginTop: 14,
  },
  emptySub: {
    fontSize: 14,
    color: theme.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
});
