import React, { useState, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Platform,
  Modal,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RoomStatus, TeacherInfo } from '../types';
import {
  getAllRoomsStatus,
  getAllTeachers,
  getTeacherSchedule,
  getRoomSchedule,
  DetailedScheduleEntry,
} from '../utils/scheduleUtils';
import { getTodayDayIndex, WEEKDAY_NAMES } from '../utils/weekDetector';
import { theme } from '../theme';

export interface SearchScreenProps {
  scheduleData: any;
  currentWeek: '1' | '2';
  onSelectTeacher?: (teacherName: string) => void;
  onSelectRoom?: (room: string) => void;
  onBack?: () => void;
}

type FilterCategory = 'all' | 'teachers' | 'rooms' | 'free';

interface FilterOption {
  key: FilterCategory;
  label: string;
}

const FILTER_OPTIONS: FilterOption[] = [
  { key: 'all', label: 'Все' },
  { key: 'teachers', label: 'Преподаватели' },
  { key: 'rooms', label: 'Аудитории' },
  { key: 'free', label: 'Свободные' },
];

/**
 * Calculates current pair slot and display time string.
 */
function getActivePairSlot(): { pairNum: number; timeFormatted: string; label: string } {
  const now = new Date();
  const mins = now.getHours() * 60 + now.getMinutes();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const timeFormatted = `${hh}:${mm}`;

  if (mins < 570) {
    return { pairNum: 1, timeFormatted, label: '1 пара (08:00–09:20)' };
  }
  if (mins < 660) {
    return { pairNum: 2, timeFormatted, label: '2 пара (09:30–10:50)' };
  }
  if (mins < 765) {
    return { pairNum: 3, timeFormatted, label: '3 пара (11:00–12:20)' };
  }
  if (mins < 855) {
    return { pairNum: 4, timeFormatted, label: '4 пара (12:45–14:05)' };
  }
  if (mins < 945) {
    return { pairNum: 5, timeFormatted, label: '5 пара (14:15–15:35)' };
  }
  if (mins < 1035) {
    return { pairNum: 6, timeFormatted, label: '6 пара (15:45–17:05)' };
  }
  if (mins < 1125) {
    return { pairNum: 7, timeFormatted, label: '7 пара (17:15–18:35)' };
  }
  if (mins < 1215) {
    return { pairNum: 8, timeFormatted, label: '8 пара (18:45–20:05)' };
  }

  // Outside study hours: fallback to daytime pair 2 for demonstration
  return { pairNum: 2, timeFormatted: '10:00', label: '2 пара (09:30–10:50)' };
}

/**
 * Extracts initials from teacher full name for avatar display.
 */
function getInitials(name: string): string {
  if (!name) return '??';
  const cleaned = name.trim();
  const prefixMatch = cleaned.match(/^([А-Яа-яЁё])\.?\s*([А-Яа-яЁё])?\.?\s*([А-Яа-яЁё][а-яё]+)/u);
  if (prefixMatch) {
    const firstInitial = prefixMatch[1];
    const surnameInitial = prefixMatch[3][0];
    return `${firstInitial}${surnameInitial}`.toUpperCase();
  }
  const suffixMatch = cleaned.match(/^([А-Яа-яЁё][а-яё]+)\s+([А-Яа-яЁё])\.?/u);
  if (suffixMatch) {
    const surnameInitial = suffixMatch[1][0];
    const firstInitial = suffixMatch[2];
    return `${surnameInitial}${firstInitial}`.toUpperCase();
  }
  const letters = cleaned.replace(/[^А-Яа-яЁёA-Za-z]/gu, '');
  if (letters.length >= 2) {
    return letters.slice(0, 2).toUpperCase();
  }
  return (letters[0] || '?').toUpperCase();
}

function formatPairCount(count: number): string {
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

function getModalTypeBadge(type: string): { label: string; bg: string; color: string } {
  const t = (type || '').toLowerCase();
  if (t.includes('лек')) {
    return { label: 'Лекция', bg: 'rgba(10, 132, 255, 0.15)', color: '#0A84FF' };
  }
  if (t.includes('пр')) {
    return { label: 'Практика', bg: 'rgba(48, 209, 88, 0.15)', color: '#30D158' };
  }
  if (t.includes('лаб')) {
    return { label: 'Лабораторная', bg: 'rgba(255, 159, 10, 0.15)', color: '#FF9F0A' };
  }
  return { label: type || 'Занятие', bg: 'rgba(235, 235, 245, 0.1)', color: '#EBEBF5' };
}

export const SearchScreen: React.FC<SearchScreenProps> = ({
  scheduleData,
  currentWeek,
  onSelectTeacher,
  onSelectRoom,
  onBack,
}) => {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('all');

  // Compute active academic day and pair number
  const todayIndex = getTodayDayIndex();
  const currentDayName =
    todayIndex >= 0 && todayIndex <= 6 ? WEEKDAY_NAMES[todayIndex] : 'Понедельник';

  const activeSlot = useMemo(() => getActivePairSlot(), []);

  // In-memory caching for teacher and room detailed queries
  const teacherScheduleCache = React.useRef(new Map<string, DetailedScheduleEntry[]>());
  const roomScheduleCache = React.useRef(new Map<string, DetailedScheduleEntry[]>());

  const getCachedTeacherSchedule = useCallback(
    (teacherName: string) => {
      const key = teacherName.trim().toLowerCase();
      if (!teacherScheduleCache.current.has(key)) {
        teacherScheduleCache.current.set(
          key,
          getTeacherSchedule(scheduleData, teacherName)
        );
      }
      return teacherScheduleCache.current.get(key)!;
    },
    [scheduleData]
  );

  const getCachedRoomSchedule = useCallback(
    (roomName: string) => {
      const key = roomName.trim().toLowerCase();
      if (!roomScheduleCache.current.has(key)) {
        roomScheduleCache.current.set(
          key,
          getRoomSchedule(scheduleData, roomName)
        );
      }
      return roomScheduleCache.current.get(key)!;
    },
    [scheduleData]
  );

  // Retrieve all teachers from schedule data
  const teachersList = useMemo(() => {
    return getAllTeachers(scheduleData);
  }, [scheduleData]);

  // Retrieve room statuses for active day and pair slot
  const roomsList = useMemo(() => {
    return getAllRoomsStatus(
      scheduleData,
      currentWeek,
      currentDayName,
      activeSlot.pairNum
    );
  }, [scheduleData, currentWeek, currentDayName, activeSlot.pairNum]);

  // Filter teachers based on query and filter tab
  const filteredTeachers = useMemo(() => {
    if (activeFilter === 'rooms' || activeFilter === 'free') {
      return [];
    }

    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      return teachersList;
    }

    return teachersList.filter((teacher) => {
      const matchName = teacher.name.toLowerCase().includes(q);
      const matchDept = teacher.department.toLowerCase().includes(q);
      const matchSubjects = (teacher.schedulePreview || '').toLowerCase().includes(q);
      return matchName || matchDept || matchSubjects;
    });
  }, [teachersList, searchQuery, activeFilter]);

  // Filter rooms based on query and filter tab
  const filteredRooms = useMemo(() => {
    if (activeFilter === 'teachers') {
      return [];
    }

    const q = searchQuery.trim().toLowerCase();

    return roomsList.filter((room) => {
      if (activeFilter === 'free' && room.status !== 'free') {
        return false;
      }

      if (!q) {
        return true;
      }

      const matchRoom = room.room.toLowerCase().includes(q);
      const matchBuilding = room.building.toLowerCase().includes(q);
      const matchLesson = (room.currentLesson || '').toLowerCase().includes(q);
      return matchRoom || matchBuilding || matchLesson;
    });
  }, [roomsList, searchQuery, activeFilter]);

  const handleFilterPress = useCallback((category: FilterCategory) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveFilter(category);
  }, []);

  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768;

  const [activeModal, setActiveModal] = useState<{
    type: 'teacher' | 'room';
    title: string;
    subtitle: string;
    entries: DetailedScheduleEntry[];
  } | null>(null);
  const [modalWeek, setModalWeek] = useState<'all' | '1' | '2'>('all');

  const handleTeacherPress = useCallback(
    (teacherName: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (onSelectTeacher) {
        onSelectTeacher(teacherName);
        return;
      }
      const entries = getCachedTeacherSchedule(teacherName);
      setActiveModal({
        type: 'teacher',
        title: teacherName,
        subtitle: `Преподаватель • Всего занятий: ${entries.length}`,
        entries,
      });
      setModalWeek('all');
    },
    [onSelectTeacher, getCachedTeacherSchedule]
  );

  const handleRoomPress = useCallback(
    (roomName: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (onSelectRoom) {
        onSelectRoom(roomName);
        return;
      }
      const entries = getCachedRoomSchedule(roomName);
      setActiveModal({
        type: 'room',
        title: `Аудитория ${roomName}`,
        subtitle: `Аудиторный фонд • Всего занятий: ${entries.length}`,
        entries,
      });
      setModalWeek('all');
    },
    [onSelectRoom, getCachedRoomSchedule]
  );

  const handleCloseModal = useCallback(() => {
    setActiveModal(null);
  }, []);

  const modalEntries = useMemo(() => {
    if (!activeModal) return [];
    if (modalWeek === 'all') return activeModal.entries;
    return activeModal.entries.filter((item) => item.week === modalWeek);
  }, [activeModal, modalWeek]);

  const modalGroupedByDay = useMemo(() => {
    const map = new Map<string, DetailedScheduleEntry[]>();
    for (const item of modalEntries) {
      const list = map.get(item.day) || [];
      list.push(item);
      map.set(item.day, list);
    }
    return Array.from(map.entries());
  }, [modalEntries]);

  const hasResults = filteredTeachers.length > 0 || filteredRooms.length > 0;

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
            <Text style={styles.metaBadgeText}>СПРАВОЧНИК • УлГУ</Text>
          </View>
        </View>

        <Text style={styles.largeTitle}>Поиск и аудитории</Text>

        {/* Search Input Box */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={theme.textTertiary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Преподаватель, аудитория или предмет..."
            placeholderTextColor={theme.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
            autoCapitalize="none"
            clearButtonMode="while-editing"
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={styles.clearBtn}
            >
              <Ionicons name="close-circle" size={18} color={theme.textTertiary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Segmented Filter Pills */}
        <View style={styles.filterSegment}>
          {FILTER_OPTIONS.map((option) => {
            const isActive = activeFilter === option.key;

            return (
              <TouchableOpacity
                key={option.key}
                style={[styles.filterPill, isActive && styles.filterPillActive]}
                onPress={() => handleFilterPress(option.key)}
                activeOpacity={0.7}
                hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    isActive && styles.filterPillTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Main Content Area */}
      <ScrollView
        style={styles.contentList}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: insets.bottom + 80 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Teachers Section */}
        {filteredTeachers.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                ПРЕПОДАВАТЕЛИ ({filteredTeachers.length})
              </Text>
            </View>

            <View style={styles.cardGroup}>
              {filteredTeachers.map((teacher, index) => {
                const isLast = index === filteredTeachers.length - 1;

                return (
                  <TouchableOpacity
                    key={teacher.name}
                    style={[styles.teacherRow, !isLast && styles.rowDivider]}
                    onPress={() => handleTeacherPress(teacher.name)}
                    activeOpacity={0.65}
                  >
                    <View style={styles.teacherAvatar}>
                      <Text style={styles.teacherAvatarText}>
                        {getInitials(teacher.name)}
                      </Text>
                    </View>

                    <View style={styles.teacherDetails}>
                      <Text
                        style={styles.teacherName}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {teacher.name}
                      </Text>
                      <Text
                        style={styles.teacherSub}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {teacher.schedulePreview || teacher.department}
                      </Text>
                      <Text style={styles.teacherCount}>
                        Нагрузка: {formatPairCount(teacher.lessonsCount)}
                      </Text>
                    </View>

                    <View style={styles.scheduleActionBtn}>
                      <Text style={styles.scheduleActionText}>Расписание</Text>
                      <Ionicons name="chevron-forward" size={14} color={theme.accent} />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Classroom Availability Section */}
        {filteredRooms.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {activeFilter === 'free'
                  ? `СВОБОДНЫЕ АУДИТОРИИ СЕЙЧАС (${activeSlot.timeFormatted})`
                  : `АУДИТОРИИ (${activeSlot.timeFormatted} • ${activeSlot.label})`}
              </Text>
              <Text style={styles.sectionCountBadge}>
                {filteredRooms.length} ауд.
              </Text>
            </View>

            <View style={styles.cardGroup}>
              {filteredRooms.map((room, index) => {
                const isFree = room.status === 'free';
                const isLast = index === filteredRooms.length - 1;

                return (
                  <TouchableOpacity
                    key={room.room}
                    style={[styles.roomRow, !isLast && styles.rowDivider]}
                    onPress={() => handleRoomPress(room.room)}
                    activeOpacity={0.65}
                  >
                    <View style={styles.roomLeft}>
                      <View style={styles.roomTitleRow}>
                        <View
                          style={[
                            styles.statusDot,
                            { backgroundColor: isFree ? theme.success : theme.error },
                          ]}
                        />
                        <Text style={styles.roomName}>ауд. {room.room}</Text>
                      </View>

                      <Text
                        style={styles.roomStatusDesc}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {isFree
                          ? `Свободна до ${room.availableUntil || 'конца дня'} • Корпус ${room.building}`
                          : `${room.currentLesson || 'Идет занятие'} • Корпус ${room.building}`}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.roomPill,
                        isFree ? styles.roomPillFree : styles.roomPillBusy,
                      ]}
                    >
                      <Text
                        style={[
                          styles.roomPillText,
                          isFree ? styles.roomPillTextFree : styles.roomPillTextBusy,
                        ]}
                      >
                        {isFree ? 'СВОБОДНА' : 'ЗАНЯТА'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Empty State */}
        {!hasResults && (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={48} color={theme.textTertiary} />
            <Text style={styles.emptyStateTitle}>Ничего не найдено</Text>
            <Text style={styles.emptyStateSubtitle}>
              {searchQuery
                ? `По запросу «${searchQuery}» ничего не найдено`
                : 'Нет доступных элементов в выбранной категории'}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Schedule Detail Sheet Modal */}
      <Modal
        visible={!!activeModal}
        transparent
        animationType="fade"
        onRequestClose={handleCloseModal}
      >
        <View style={[styles.modalRoot, isLargeScreen && styles.modalRootLarge]}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={handleCloseModal}
          />
          <View
            style={[
              styles.modalSheet,
              isLargeScreen ? styles.modalSheetLarge : styles.modalSheetMobile,
            ]}
          >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderInfo}>
                <Text style={styles.modalTitle} numberOfLines={1}>
                  {activeModal?.title}
                </Text>
                <Text style={styles.modalSubtitle}>
                  {activeModal?.subtitle}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={handleCloseModal}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Parity Filter Switcher */}
            <View style={styles.modalWeekSwitcher}>
              <TouchableOpacity
                style={[
                  styles.modalWeekBtn,
                  modalWeek === 'all' && styles.modalWeekBtnActive,
                ]}
                onPress={() => setModalWeek('all')}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
              >
                <Text
                  style={[
                    styles.modalWeekBtnText,
                    modalWeek === 'all' && styles.modalWeekBtnTextActive,
                  ]}
                >
                  Все недели
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalWeekBtn,
                  modalWeek === '1' && styles.modalWeekBtnActive,
                ]}
                onPress={() => setModalWeek('1')}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
              >
                <Text
                  style={[
                    styles.modalWeekBtnText,
                    modalWeek === '1' && styles.modalWeekBtnTextActive,
                  ]}
                >
                  1 Неделя
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalWeekBtn,
                  modalWeek === '2' && styles.modalWeekBtnActive,
                ]}
                onPress={() => setModalWeek('2')}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
              >
                <Text
                  style={[
                    styles.modalWeekBtnText,
                    modalWeek === '2' && styles.modalWeekBtnTextActive,
                  ]}
                >
                  2 Неделя
                </Text>
              </TouchableOpacity>
            </View>

            {/* Lessons List Grouped By Weekday */}
            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {modalGroupedByDay.length === 0 ? (
                <View style={styles.modalEmpty}>
                  <Ionicons
                    name="calendar-outline"
                    size={40}
                    color={theme.textTertiary}
                  />
                  <Text style={styles.modalEmptyText}>
                    Занятия не найдены для выбранной недели
                  </Text>
                </View>
              ) : (
                modalGroupedByDay.map(([dayName, dayEntries]) => (
                  <View key={dayName} style={styles.modalDayBlock}>
                    <View style={styles.modalDayHeader}>
                      <Text style={styles.modalDayTitle}>{dayName.toUpperCase()}</Text>
                      <Text style={styles.modalDayCount}>
                        {formatPairCount(dayEntries.length)}
                      </Text>
                    </View>

                    <View style={styles.modalEntriesContainer}>
                      {dayEntries.map((entry, idx) => {
                        const badge = getModalTypeBadge(entry.type);
                        const isLastEntry = idx === dayEntries.length - 1;

                        return (
                          <View
                            key={`${entry.day}-${entry.week}-${entry.num}-${entry.group}-${idx}`}
                            style={[
                              styles.modalEntryRow,
                              !isLastEntry && styles.modalEntryBorder,
                            ]}
                          >
                            <View style={styles.modalEntryTop}>
                              <View style={styles.modalEntrySlot}>
                                <Text style={styles.modalEntryPair}>
                                  #{entry.num}
                                </Text>
                                <Text style={styles.modalEntryTime}>
                                  {entry.time}
                                </Text>
                              </View>

                              <View
                                style={[
                                  styles.modalTypePill,
                                  { backgroundColor: badge.bg },
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.modalTypePillText,
                                    { color: badge.color },
                                  ]}
                                >
                                  {badge.label}
                                </Text>
                              </View>

                              <View style={styles.modalWeekTag}>
                                <Text style={styles.modalWeekTagText}>
                                  {entry.week} нед.
                                </Text>
                              </View>
                            </View>

                            <Text style={styles.modalEntrySubject}>
                              {entry.subject}
                            </Text>

                            <View style={styles.modalEntryBottom}>
                              <View style={styles.modalGroupBadge}>
                                <Ionicons
                                  name="people"
                                  size={12}
                                  color={theme.accent}
                                />
                                <Text style={styles.modalGroupBadgeText}>
                                  {entry.group}
                                </Text>
                              </View>

                              {activeModal?.type === 'teacher' ? (
                                <View style={styles.modalMetaBadge}>
                                  <Ionicons
                                    name="location"
                                    size={12}
                                    color={theme.teal}
                                  />
                                  <Text style={styles.modalMetaBadgeText}>
                                    ауд. {entry.room}
                                  </Text>
                                </View>
                              ) : (
                                <View style={styles.modalMetaBadge}>
                                  <Ionicons
                                    name="person"
                                    size={12}
                                    color={theme.purple}
                                  />
                                  <Text style={styles.modalMetaBadgeText}>
                                    {entry.teacher}
                                  </Text>
                                </View>
                              )}
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    marginVertical: 4,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.bgSecondary,
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 38,
    marginTop: 8,
    marginBottom: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: theme.textPrimary,
    paddingVertical: 0,
  },
  clearBtn: {
    padding: 2,
  },
  filterSegment: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 9,
    padding: 3,
    gap: 4,
  },
  filterPill: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 7,
    minHeight: 32, // HIG touch friendly
  },
  filterPillActive: {
    backgroundColor: theme.accent,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.textSecondary,
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  contentList: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: theme.paddingHorizontal,
    paddingTop: 14,
    gap: 16,
  },
  section: {
    gap: 6,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.textSecondary,
    letterSpacing: 0.5,
  },
  sectionCountBadge: {
    fontSize: 11,
    color: theme.textSecondary,
  },
  cardGroup: {
    backgroundColor: theme.bgSecondary,
    borderRadius: theme.borderRadiusSmall,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  teacherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    minHeight: 52,
  },
  teacherAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(10, 132, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  teacherAvatarText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.accent,
  },
  teacherDetails: {
    flex: 1,
    marginRight: 8,
  },
  teacherName: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.textPrimary,
  },
  teacherSub: {
    fontSize: 11,
    color: theme.textSecondary,
    marginTop: 1,
  },
  teacherCount: {
    fontSize: 10,
    color: theme.textSecondary,
    marginTop: 1,
  },
  scheduleActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 6,
    gap: 2,
    minHeight: 44, // HIG standard touch target
  },
  scheduleActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.accent,
  },
  roomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    minHeight: 48,
  },
  roomLeft: {
    flex: 1,
    marginRight: 10,
  },
  roomTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  roomName: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.textPrimary,
  },
  roomStatusDesc: {
    fontSize: 11,
    color: theme.textSecondary,
    marginTop: 2,
    marginLeft: 13,
  },
  roomPill: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
  },
  roomPillFree: {
    backgroundColor: 'rgba(48, 209, 88, 0.15)',
  },
  roomPillBusy: {
    backgroundColor: 'rgba(255, 69, 58, 0.15)',
  },
  roomPillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  roomPillTextFree: {
    color: theme.success,
  },
  roomPillTextBusy: {
    color: theme.error,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 10,
  },
  emptyStateTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: theme.textPrimary,
  },
  emptyStateSubtitle: {
    fontSize: 13,
    color: theme.textTertiary,
    textAlign: 'center',
    paddingHorizontal: 30,
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  modalRootLarge: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalSheet: {
    backgroundColor: '#1C1C1E',
    maxHeight: '88%',
    overflow: 'hidden',
  },
  modalSheetMobile: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    width: '100%',
  },
  modalSheetLarge: {
    borderRadius: 24,
    width: '100%',
    maxWidth: 640,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.separatorLight,
  },
  modalHeaderInfo: {
    flex: 1,
    marginRight: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.textPrimary,
    letterSpacing: -0.3,
  },
  modalSubtitle: {
    fontSize: 13,
    color: theme.textSecondary,
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalWeekSwitcher: {
    flexDirection: 'row',
    backgroundColor: '#000000',
    padding: 4,
    borderRadius: 10,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
  },
  modalWeekBtn: {
    flex: 1,
    minHeight: 44,
    justifyContent: 'center',
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  modalWeekBtnActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
  },
  modalWeekBtnText: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.textSecondary,
  },
  modalWeekBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  modalScroll: {
    flexGrow: 0,
  },
  modalScrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    paddingTop: 8,
  },
  modalEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 8,
  },
  modalEmptyText: {
    fontSize: 14,
    color: theme.textTertiary,
    textAlign: 'center',
  },
  modalDayBlock: {
    marginTop: 12,
  },
  modalDayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  modalDayTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.accent,
    letterSpacing: 0.5,
  },
  modalDayCount: {
    fontSize: 12,
    color: theme.textTertiary,
  },
  modalEntriesContainer: {
    backgroundColor: '#2C2C2E',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  modalEntryRow: {
    padding: 12,
  },
  modalEntryBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  modalEntryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  modalEntrySlot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modalEntryPair: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.accent,
    backgroundColor: 'rgba(10, 132, 255, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  modalEntryTime: {
    fontSize: 12,
    color: theme.textSecondary,
    fontWeight: '500',
  },
  modalTypePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  modalTypePillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  modalWeekTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  modalWeekTagText: {
    fontSize: 11,
    color: theme.textSecondary,
    fontWeight: '600',
  },
  modalEntrySubject: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.textPrimary,
    marginBottom: 8,
    lineHeight: 20,
  },
  modalEntryBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  modalGroupBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(10, 132, 255, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  modalGroupBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.accent,
  },
  modalMetaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  modalMetaBadgeText: {
    fontSize: 12,
    color: theme.textSecondary,
  },
});
