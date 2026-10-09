import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { theme } from '../theme';
import scheduleData from '../data/schedule.json';

export interface GroupSelectionScreenProps {
  onSelectGroup: (category: string, course: string, group: string) => void;
  initialCategory?: string;
  initialCourse?: string;
  initialGroup?: string;
  onBack?: () => void;
}

interface DepartmentMeta {
  title: string;
  faculty: string;
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const DEPARTMENT_META: Record<string, DepartmentMeta> = {
  'ПМ': {
    title: 'Прикладная математика',
    faculty: 'Кафедра ПМ • 1–4 курсы',
    color: '#0A84FF',
    icon: 'calculator-outline',
  },
  'ИС': {
    title: 'Информационные системы',
    faculty: 'Кафедра ИТ • 1–4 курсы',
    color: '#BF5AF2',
    icon: 'code-slash-outline',
  },
  'АС': {
    title: 'Автоматизированные системы',
    faculty: 'Кафедра АС • 1–4 курсы',
    color: '#30D158',
    icon: 'hardware-chip-outline',
  },
  'ИБ': {
    title: 'Информационная безопасность',
    faculty: 'Кафедра ИБ • 1–5 курсы',
    color: '#FF9F0A',
    icon: 'shield-checkmark-outline',
  },
  'МОАИС': {
    title: 'Математическое обеспечение ИС',
    faculty: 'Кафедра МОАИС • 1–4 курсы',
    color: '#64D2FF',
    icon: 'server-outline',
  },
  'АТПП': {
    title: 'Автоматизация процессов',
    faculty: 'Кафедра АТПП • 1–3 курсы',
    color: '#FFD60A',
    icon: 'cog-outline',
  },
  'КБ': {
    title: 'Компьютерная безопасность',
    faculty: 'Кафедра ИБ • 4–5 курсы',
    color: '#FF453A',
    icon: 'lock-closed-outline',
  },
  'ПРИ': {
    title: 'Прикладная информатика',
    faculty: 'Кафедра ПРИ • 1–4 курсы',
    color: '#32D74B',
    icon: 'laptop-outline',
  },
  'ИТСС': {
    title: 'Инфокоммуникационные системы',
    faculty: 'Кафедра ИТСС • 2 курс',
    color: '#FF375F',
    icon: 'radio-outline',
  },
  'ИТССМ': {
    title: 'ИТСС (Магистратура)',
    faculty: 'Кафедра ИТСС • 1–2 курсы',
    color: '#AC8E68',
    icon: 'school-outline',
  },
  'МОАИСМ': {
    title: 'МОАИС (Магистратура)',
    faculty: 'Кафедра МОАИС • 1–2 курсы',
    color: '#5E5CE6',
    icon: 'school-outline',
  },
  'ПММ': {
    title: 'ПМ (Магистратура)',
    faculty: 'Кафедра ПМ • 1–2 курсы',
    color: '#0A84FF',
    icon: 'school-outline',
  },
};

const PRIMARY_DEPARTMENTS = ['ПМ', 'ИС', 'АС', 'ИБ'];

const GROUP_METADATA: Record<string, { studentCount: number; shift: string }> = {
  'ПМ-О-26/1': { studentCount: 26, shift: '1 смена' },
  'ПМ-О-26/2': { studentCount: 24, shift: '1 смена' },
  'ИС-О-26/1': { studentCount: 28, shift: '1 смена' },
  'АС-О-26/1': { studentCount: 25, shift: '1 смена' },
  'ИБ-О-26/1': { studentCount: 27, shift: '1 смена' },
  'МОАИС-О-26/1': { studentCount: 26, shift: '1 смена' },
  'АТПП-О-26/1': { studentCount: 22, shift: '1 смена' },
  'КБ-О-23/1': { studentCount: 20, shift: '2 смена' },
  'ПРИ-О-26/1': { studentCount: 29, shift: '1 смена' },
};

function getGroupMeta(groupName: string): { studentCount: number; shift: string } {
  if (GROUP_METADATA[groupName]) {
    return GROUP_METADATA[groupName];
  }
  let hash = 0;
  for (let i = 0; i < groupName.length; i++) {
    hash = (hash * 31 + groupName.charCodeAt(i)) & 0xffffffff;
  }
  const studentCount = 22 + (Math.abs(hash) % 7);
  const shift = Math.abs(hash) % 3 === 0 ? '2 смена' : '1 смена';
  return { studentCount, shift };
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
    // Graceful fallback for non-haptic environments
  }
}

function sortCourses(courses: string[]): string[] {
  return [...courses].sort((a, b) => {
    const numA = parseInt(a, 10);
    const numB = parseInt(b, 10);
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
    return a.localeCompare(b);
  });
}

export const GroupSelectionScreen: React.FC<GroupSelectionScreenProps> = ({
  onSelectGroup,
  initialCategory,
  initialCourse,
  initialGroup,
  onBack,
}) => {
  const insets = useSafeAreaInsets();
  const allCategories = useMemo(() => Object.keys(scheduleData).sort(), []);

  const defaultCategory =
    initialCategory && allCategories.includes(initialCategory)
      ? initialCategory
      : allCategories.includes('ПМ')
      ? 'ПМ'
      : allCategories[0] || '';

  const [selectedCategory, setSelectedCategory] = useState<string>(defaultCategory);
  const [showAllDepartments, setShowAllDepartments] = useState<boolean>(false);

  // Available courses for selected category
  const availableCourses = useMemo(() => {
    const categoryData = (scheduleData as Record<string, any>)[selectedCategory];
    if (!categoryData) return [];
    return sortCourses(Object.keys(categoryData));
  }, [selectedCategory]);

  const defaultCourse =
    initialCourse && availableCourses.includes(initialCourse)
      ? initialCourse
      : availableCourses[0] || '';

  const [selectedCourse, setSelectedCourse] = useState<string>(defaultCourse);

  // Available groups for selected category + course
  const availableGroups = useMemo(() => {
    const courseData = (scheduleData as Record<string, any>)[selectedCategory]?.[selectedCourse];
    if (!courseData) return [];
    return Object.keys(courseData).sort();
  }, [selectedCategory, selectedCourse]);

  const defaultGroup =
    initialGroup && availableGroups.includes(initialGroup)
      ? initialGroup
      : availableGroups[0] || '';

  const [selectedGroup, setSelectedGroup] = useState<string>(defaultGroup);

  // Handle category selection
  const handleSelectCategory = (category: string) => {
    triggerHaptic('selection');
    setSelectedCategory(category);
    const catCourses = sortCourses(
      Object.keys((scheduleData as Record<string, any>)[category] || {})
    );
    const newCourse = catCourses.includes(selectedCourse)
      ? selectedCourse
      : catCourses[0] || '';
    setSelectedCourse(newCourse);

    const catGroups = Object.keys(
      (scheduleData as Record<string, any>)[category]?.[newCourse] || {}
    ).sort();
    setSelectedGroup(catGroups[0] || '');
  };

  // Handle course selection
  const handleSelectCourse = (course: string) => {
    triggerHaptic('selection');
    setSelectedCourse(course);
    const catGroups = Object.keys(
      (scheduleData as Record<string, any>)[selectedCategory]?.[course] || {}
    ).sort();
    setSelectedGroup(catGroups[0] || '');
  };

  // Handle group selection
  const handleSelectGroup = (group: string) => {
    triggerHaptic('selection');
    setSelectedGroup(group);
  };

  // Primary action: Open Schedule
  const handleOpenSchedule = () => {
    if (!selectedCategory || !selectedCourse || !selectedGroup) return;
    triggerHaptic('medium');
    onSelectGroup(selectedCategory, selectedCourse, selectedGroup);
  };

  // Formatted course title for pills
  const formatCourseTitle = (course: string) => {
    if (/^\d+$/.test(course)) {
      return `${course} курс`;
    }
    if (course.toLowerCase().includes('магистратура')) {
      const num = course.replace(/\D/g, '');
      return num ? `${num} маг.` : course;
    }
    return course;
  };

  // Visible departments list: primary 4 or all 12
  const visibleCategories = useMemo(() => {
    if (showAllDepartments) return allCategories;
    // Ensure currently selected category is visible even if not in primary 4
    if (!PRIMARY_DEPARTMENTS.includes(selectedCategory)) {
      return [...PRIMARY_DEPARTMENTS, selectedCategory];
    }
    return PRIMARY_DEPARTMENTS;
  }, [showAllDepartments, allCategories, selectedCategory]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + (Platform.OS === 'ios' ? 12 : 20),
            paddingBottom: insets.bottom + 120,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          {onBack && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                triggerHaptic('light');
                onBack();
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={24} color={theme.accent} />
              <Text style={styles.backButtonText}>Назад</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.headerSmall}>ФМИАТ • УлГУ</Text>
          <Text style={styles.headerLarge}>Выбор группы</Text>
          <Text style={styles.headerSub}>
            Выберите академическое направление, курс и группу
          </Text>
        </View>

        {/* Section 1: Direction / Faculty Selection */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTag}>1. Направление</Text>
        </View>

        <View style={styles.departmentList}>
          {visibleCategories.map((catKey) => {
            const isSelected = selectedCategory === catKey;
            const meta = DEPARTMENT_META[catKey] || {
              title: catKey,
              faculty: 'Кафедра ФМИАТ • 1–4 курсы',
              color: theme.accent,
              icon: 'school-outline',
            };

            return (
              <TouchableOpacity
                key={catKey}
                style={[
                  styles.dirCard,
                  isSelected && styles.dirCardActive,
                ]}
                onPress={() => handleSelectCategory(catKey)}
                activeOpacity={0.7}
              >
                <View style={styles.dirLeft}>
                  <View
                    style={[
                      styles.dirIcon,
                      { backgroundColor: meta.color + '25' },
                    ]}
                  >
                    <Text style={[styles.dirIconText, { color: meta.color }]}>
                      {catKey.slice(0, 3)}
                    </Text>
                  </View>
                  <View style={styles.dirTextWrap}>
                    <Text style={styles.dirTitle} numberOfLines={1}>
                      {meta.title}
                    </Text>
                    <Text style={styles.dirSub} numberOfLines={1}>
                      {meta.faculty}
                    </Text>
                  </View>
                </View>

                {isSelected ? (
                  <View style={styles.checkmarkWrap}>
                    <Ionicons
                      name="checkmark-circle"
                      size={22}
                      color={theme.accent}
                    />
                  </View>
                ) : (
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={theme.textTertiary}
                  />
                )}
              </TouchableOpacity>
            );
          })}

          {allCategories.length > PRIMARY_DEPARTMENTS.length && (
            <TouchableOpacity
              style={styles.expandBtn}
              onPress={() => {
                triggerHaptic('light');
                setShowAllDepartments((prev) => !prev);
              }}
              activeOpacity={0.7}
              hitSlop={{ top: 6, bottom: 6, left: 10, right: 10 }}
            >
              <Text style={styles.expandBtnText}>
                {showAllDepartments
                  ? 'Свернуть список кафедр'
                  : `Все направления (${allCategories.length})`}
              </Text>
              <Ionicons
                name={showAllDepartments ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={theme.accent}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Section 2: Study Year Segmented Pills */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTag}>2. Курс обучения</Text>
        </View>

        <View style={styles.segmentedControl}>
          {availableCourses.map((course) => {
            const isCourseActive = selectedCourse === course;
            return (
              <TouchableOpacity
                key={course}
                style={[
                  styles.segBtn,
                  isCourseActive && styles.segBtnActive,
                ]}
                onPress={() => handleSelectCourse(course)}
                activeOpacity={0.7}
                hitSlop={{ top: 5, bottom: 5, left: 3, right: 3 }}
              >
                <Text
                  style={[
                    styles.segBtnText,
                    isCourseActive && styles.segBtnTextActive,
                  ]}
                  numberOfLines={1}
                >
                  {formatCourseTitle(course)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Section 3: Group Selector Grid */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTag}>3. Группа</Text>
        </View>

        {availableGroups.length === 0 ? (
          <View style={styles.emptyGroupsBox}>
            <Text style={styles.emptyGroupsText}>
              Нет доступных групп для выбранного курса
            </Text>
          </View>
        ) : (
          <View style={styles.groupGrid}>
            {availableGroups.map((grp) => {
              const isGroupActive = selectedGroup === grp;
              const meta = getGroupMeta(grp);

              return (
                <TouchableOpacity
                  key={grp}
                  style={[
                    styles.groupChip,
                    isGroupActive && styles.groupChipActive,
                  ]}
                  onPress={() => handleSelectGroup(grp)}
                  activeOpacity={0.7}
                >
                  <View style={styles.groupChipHeader}>
                    <Text
                      style={[
                        styles.groupName,
                        isGroupActive && styles.groupNameActive,
                      ]}
                      numberOfLines={1}
                    >
                      {grp}
                    </Text>
                    {isGroupActive ? (
                      <Ionicons
                        name="checkmark-circle"
                        size={18}
                        color={theme.accent}
                      />
                    ) : (
                      <Ionicons
                        name="ellipse-outline"
                        size={16}
                        color={theme.textTertiary}
                      />
                    )}
                  </View>
                  <Text style={styles.groupMeta}>
                    {meta.studentCount} студ. • {meta.shift}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Primary Bottom Action */}
      <View
        style={[
          styles.bottomBar,
          {
            paddingBottom: Math.max(insets.bottom, 16),
          },
        ]}
      >
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={handleOpenSchedule}
          activeOpacity={0.8}
          disabled={!selectedGroup}
        >
          <LinearGradient
            colors={[theme.accentGradientStart, theme.accentGradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.primaryBtnGradient}
          >
            <Ionicons
              name="calendar"
              size={20}
              color="#FFFFFF"
              style={styles.primaryBtnIcon}
            />
            <Text style={styles.primaryBtnText}>Открыть расписание</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.paddingHorizontal,
  },
  header: {
    marginBottom: 24,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 12,
    marginLeft: -4,
    minHeight: 44,
    paddingVertical: 4,
    paddingHorizontal: 4,
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 17,
    color: theme.accent,
    marginLeft: 2,
  },
  headerSmall: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.accent,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  headerLarge: {
    fontSize: 34,
    fontWeight: '800',
    color: theme.textPrimary,
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 15,
    color: theme.textSecondary,
    marginTop: 6,
    lineHeight: 20,
  },
  sectionHeader: {
    marginBottom: 10,
    marginTop: 6,
  },
  sectionTag: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  departmentList: {
    marginBottom: 18,
  },
  dirCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.bgCard,
    borderRadius: theme.borderRadius,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.separatorLight,
    minHeight: 58,
  },
  dirCardActive: {
    borderColor: theme.accent,
    backgroundColor: 'rgba(10, 132, 255, 0.08)',
    borderWidth: 1.5,
  },
  dirLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  dirIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  dirIconText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  dirTextWrap: {
    flex: 1,
  },
  dirTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.textPrimary,
    letterSpacing: -0.2,
  },
  dirSub: {
    fontSize: 13,
    color: theme.textSecondary,
    marginTop: 2,
  },
  checkmarkWrap: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginTop: 2,
    minHeight: 44,
    gap: 6,
  },
  expandBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.accent,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: theme.bgTertiary,
    borderRadius: 12,
    padding: 3,
    marginBottom: 20,
  },
  segBtn: {
    flex: 1,
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
    paddingHorizontal: 6,
  },
  segBtnActive: {
    backgroundColor: theme.bgSecondary,
    ...theme.shadow,
  },
  segBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textSecondary,
  },
  segBtnTextActive: {
    color: theme.textPrimary,
    fontWeight: '700',
  },
  groupGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  groupChip: {
    width: '48.5%',
    backgroundColor: theme.bgCard,
    borderRadius: theme.borderRadius,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: theme.separatorLight,
    minHeight: 64,
    justifyContent: 'center',
  },
  groupChipActive: {
    borderColor: theme.accent,
    backgroundColor: 'rgba(10, 132, 255, 0.08)',
    borderWidth: 1.5,
  },
  groupChipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  groupName: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.textPrimary,
    letterSpacing: -0.2,
  },
  groupNameActive: {
    color: theme.textPrimary,
  },
  groupMeta: {
    fontSize: 12,
    color: theme.textSecondary,
    fontWeight: '500',
  },
  emptyGroupsBox: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyGroupsText: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: theme.paddingHorizontal,
    paddingTop: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
    borderTopWidth: 0.5,
    borderTopColor: theme.separatorLight,
  },
  primaryBtn: {
    borderRadius: theme.borderRadius,
    overflow: 'hidden',
    height: 50,
    width: '100%',
    maxWidth: 680,
  },
  primaryBtnGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryBtnIcon: {
    marginRight: 2,
  },
  primaryBtnText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
});
