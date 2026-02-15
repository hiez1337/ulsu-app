import React from 'react';
import { 
  StyleSheet, Text, View, FlatList, TouchableOpacity, 
  Platform, Animated 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { DaySchedule, ScheduleItem } from '../api/parser';
import { theme } from '../theme';

interface ScheduleScreenProps {
  data: DaySchedule[];
  groupName: string;
  weekType: "1" | "2";
  onBack: () => void;
  onToggleWeek: () => void;
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

const ScheduleItemComponent = ({ item, isLast }: { item: ScheduleItem; isLast: boolean }) => (
  <View style={[styles.lessonRow, !isLast && styles.lessonBorder]}>
    <View style={styles.timeCol}>
      <View style={styles.numBadge}>
        <Text style={styles.numBadgeText}>{item.num}</Text>
      </View>
      <Text style={styles.timeText}>{item.time}</Text>
    </View>
    <View style={styles.lessonContent}>
      <Text style={styles.lessonText}>{item.place}</Text>
    </View>
  </View>
);

export const ScheduleScreen: React.FC<ScheduleScreenProps> = ({ 
  data, groupName, weekType, onBack, onToggleWeek 
}) => {
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
        data={data}
        keyExtractor={(item, index) => item.weekday + index}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.dayCard}>
            <View style={styles.dayHeader}>
              <View style={[styles.dayDot, { backgroundColor: DAY_COLORS[item.weekday] || theme.accent }]} />
              <Text style={styles.dayTitle}>{item.weekday}</Text>
              <Text style={styles.dayCount}>{item.items.length} {getPairWord(item.items.length)}</Text>
            </View>
            <View style={styles.dayBody}>
              {item.items.map((lesson, index) => (
                <ScheduleItemComponent 
                  key={index} 
                  item={lesson} 
                  isLast={index === item.items.length - 1}
                />
              ))}
            </View>
          </View>
        )}
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
