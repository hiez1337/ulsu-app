import React, { useRef, useCallback, useState, useEffect, useMemo } from 'react';
import { 
  StyleSheet, Text, View, FlatList, TouchableOpacity, 
  Platform, Animated, RefreshControl, Easing 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { DaySchedule, ScheduleItem } from '../api/parser';
import { WEEKDAY_NAMES } from '../utils/weekDetector';
import { theme } from '../theme';

interface ScheduleScreenProps {
  data: DaySchedule[];
  groupName: string;
  weekType: "1" | "2";
  currentWeekType: "1" | "2";
  todayIndex: number;
  onBack: () => void;
  onToggleWeek: () => void;
  onRefresh: () => void;
}

const DAY_ICONS: Record<string, string> = {
  'Понедельник': '🟦',
  'Вторник': '🟩',
  'Среда': '🟧',
  'Четверг': '🟪',
  'Пятница': '🟥',
  'Суббота': '🟨',
  'Воскресенье': '⬜',
};

const DAY_COLORS: Record<string, string> = {
  'Понедельник': '#0A84FF',
  'Вторник': '#30D158',
  'Среда': '#FF9F0A',
  'Четверг': '#BF5AF2',
  'Пятница': '#FF453A',
  'Суббота': '#FFD60A',
  'Воскресенье': '#8E8E93',
};

/** Parse "HH:MM" to total minutes since midnight */
function parseTimeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.trim().split(':').map(Number);
  return h * 60 + m;
}

/** Parse "08:30 – 10:00" → { start, end } in minutes */
function parseLessonTimeRange(timeRange: string): { start: number; end: number } | null {
  // handle both "–" (en dash) and "-" (hyphen)
  const parts = timeRange.split(/[–\-]/);
  if (parts.length < 2) return null;
  const start = parseTimeToMinutes(parts[0]);
  const end = parseTimeToMinutes(parts[1]);
  if (isNaN(start) || isNaN(end)) return null;
  return { start, end };
}

/** Get current time as minutes since midnight */
function getCurrentMinutes(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

/** Animated progress bar for the currently active lesson */
const LessonProgressBar = ({ progress, dayColor }: { progress: number; dayColor: string }) => {
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animValue, {
      toValue: progress,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const widthInterpolation = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressFill, { width: widthInterpolation }]}> 
          <LinearGradient
            colors={[dayColor, dayColor + 'AA']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </View>
    </View>
  );
};

const ScheduleItemComponent = ({ item, isLast, isActive, progress, dayColor }: { 
  item: ScheduleItem; isLast: boolean; isActive: boolean; progress: number; dayColor: string 
}) => (
  <View style={[styles.lessonRow, !isLast && styles.lessonBorder]}>
    <View style={styles.timeCol}>
      <View style={[styles.numBadge, isActive && { backgroundColor: dayColor + '30' }]}>
        <Text style={[styles.numBadgeText, isActive && { color: dayColor }]}>{item.num}</Text>
      </View>
      <Text style={styles.timeText}>{item.time}</Text>
    </View>
    <View style={styles.lessonContent}>
      <Text style={[styles.lessonText, isActive && styles.lessonTextActive]}>{item.place}</Text>
      {isActive && <LessonProgressBar progress={progress} dayColor={dayColor} />}
    </View>
  </View>
);

export const ScheduleScreen: React.FC<ScheduleScreenProps> = ({ 
  data, groupName, weekType, currentWeekType, todayIndex, onBack, onToggleWeek, onRefresh 
}) => {
  const flatListRef = useRef<FlatList>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [currentMinutes, setCurrentMinutes] = useState(getCurrentMinutes);

  // Update current time every 30 seconds for live progress
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentMinutes(getCurrentMinutes());
    }, 30_000);
    return () => clearInterval(timer);
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    onRefresh();
    setTimeout(() => setRefreshing(false), 500);
  }, [onRefresh]);

  // Show "Today" badge only when viewing the current week
  const isViewingCurrentWeek = weekType === currentWeekType;

  // Find today's card index in the filtered data array
  const todayDataIndex = data.findIndex(
    d => WEEKDAY_NAMES.indexOf(d.weekday) === todayIndex
  );

  // Auto-scroll to today's card when data changes
  const onListLayout = useCallback(() => {
    if (todayDataIndex > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({ 
          index: todayDataIndex, 
          animated: true, 
          viewPosition: 0.1 
        });
      }, 300);
    }
  }, [todayDataIndex]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={theme.accent} />
          <Text style={styles.backBtnText}>Назад</Text>
        </TouchableOpacity>
        <Text style={styles.groupTitle}>{groupName}</Text>

        {/* Week Toggle */}
        <View style={styles.weekToggleContainer}>
          <TouchableOpacity
            style={[styles.weekToggleBtn, weekType === '1' && styles.weekToggleActive]}
            onPress={() => weekType !== '1' && onToggleWeek()}
            activeOpacity={0.7}
          >
            <Text style={[styles.weekToggleText, weekType === '1' && styles.weekToggleTextActive]}>
              1 неделя
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.weekToggleBtn, weekType === '2' && styles.weekToggleActive]}
            onPress={() => weekType !== '2' && onToggleWeek()}
            activeOpacity={0.7}
          >
            <Text style={[styles.weekToggleText, weekType === '2' && styles.weekToggleTextActive]}>
              2 неделя
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Schedule List */}
      <FlatList
        ref={flatListRef}
        data={data}
        keyExtractor={(item, index) => item.weekday + index}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onLayout={onListLayout}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.accent}
            colors={[theme.accent]}
          />
        }
        onScrollToIndexFailed={(info) => {
          flatListRef.current?.scrollToOffset({ offset: info.averageItemLength * info.index, animated: true });
        }}
        renderItem={({ item }) => {
          const isToday = isViewingCurrentWeek && WEEKDAY_NAMES.indexOf(item.weekday) === todayIndex;
          const dayColor = DAY_COLORS[item.weekday] || theme.accent;
          return (
            <View style={[styles.dayCard, isToday && styles.dayCardToday]}>
              <View style={styles.dayHeader}>
                <View style={[styles.dayDot, { backgroundColor: dayColor }]} />
                <Text style={styles.dayTitle}>{item.weekday}</Text>
                {isToday && (
                  <View style={styles.todayBadge}>
                    <Text style={styles.todayBadgeText}>Сегодня</Text>
                  </View>
                )}
                <Text style={styles.dayCount}>{item.items.length} {getPairWord(item.items.length)}</Text>
              </View>
              <View style={styles.dayBody}>
                {item.items.map((lesson: ScheduleItem, idx: number) => {
                  let isActive = false;
                  let progress = 0;
                  if (isToday) {
                    const range = parseLessonTimeRange(lesson.time);
                    if (range && currentMinutes >= range.start && currentMinutes <= range.end) {
                      isActive = true;
                      const total = range.end - range.start;
                      progress = total > 0 ? (currentMinutes - range.start) / total : 0;
                    }
                  }
                  return (
                    <ScheduleItemComponent 
                      key={idx} 
                      item={lesson} 
                      isLast={idx === item.items.length - 1}
                      isActive={isActive}
                      progress={progress}
                      dayColor={dayColor}
                    />
                  );
                })}
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color={theme.textTertiary} />
            <Text style={styles.emptyTitle}>Нет занятий</Text>
            <Text style={styles.emptyText}>Расписание для этой недели пусто</Text>
          </View>
        }
      />
    </View>
  );
};

function getPairWord(count: number): string {
  if (count === 1) return 'пара';
  if (count >= 2 && count <= 4) return 'пары';
  return 'пар';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingHorizontal: theme.paddingHorizontal,
    paddingBottom: 16,
    backgroundColor: theme.bg,
    borderBottomWidth: 0.5,
    borderBottomColor: theme.separatorLight,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    marginLeft: -6,
  },
  backBtnText: {
    color: theme.accent,
    fontSize: 17,
  },
  groupTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.textPrimary,
    letterSpacing: -0.3,
    marginBottom: 16,
  },
  weekToggleContainer: {
    flexDirection: 'row',
    backgroundColor: theme.bgTertiary,
    borderRadius: 10,
    padding: 3,
  },
  weekToggleBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  weekToggleActive: {
    backgroundColor: theme.bgSecondary,
    ...theme.shadow,
  },
  weekToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textSecondary,
  },
  weekToggleTextActive: {
    color: theme.textPrimary,
  },
  listContent: {
    paddingHorizontal: theme.paddingHorizontal,
    paddingTop: 16,
    paddingBottom: 40,
  },
  dayCard: {
    backgroundColor: theme.bgCard,
    borderRadius: theme.borderRadius,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.separatorLight,
  },
  dayCardToday: {
    borderColor: theme.accent,
    borderWidth: 1.5,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: theme.separatorLight,
  },
  dayDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  dayTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.textPrimary,
    flex: 1,
  },
  dayCount: {
    fontSize: 13,
    color: theme.textSecondary,
  },
  todayBadge: {
    backgroundColor: theme.accentLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 8,
  },
  todayBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.accent,
  },
  dayBody: {
    paddingHorizontal: 16,
  },
  lessonRow: {
    flexDirection: 'row',
    paddingVertical: 14,
    alignItems: 'flex-start',
  },
  lessonBorder: {
    borderBottomWidth: 0.5,
    borderBottomColor: theme.separatorLight,
  },
  timeCol: {
    width: 80,
    alignItems: 'flex-start',
    paddingRight: 12,
  },
  numBadge: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: theme.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  numBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.accent,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.textSecondary,
  },
  lessonContent: {
    flex: 1,
  },
  lessonText: {
    fontSize: 15,
    color: theme.textPrimary,
    lineHeight: 21,
  },
  lessonTextActive: {
    fontWeight: '600',
  },
  progressContainer: {
    marginTop: 10,
    marginBottom: 2,
  },
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    overflow: 'hidden',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.textPrimary,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 15,
    color: theme.textSecondary,
    marginTop: 6,
  },
});
