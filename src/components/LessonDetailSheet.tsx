import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  TextInput,
  PanResponder,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Lesson, TaskItem, Subgroup } from '../types';
import { theme } from '../theme';

export interface LessonDetailSheetProps {
  lesson: Lesson | null;
  visible: boolean;
  onClose: () => void;
  onToggleTask?: (taskId: string) => void;
  tasks?: TaskItem[];
  onAddTask?: (lessonId: string, title: string) => void;
}

interface TypeBadgeInfo {
  label: string;
  color: string;
  bg: string;
}

/** Get Apple HIG semantic color and display name for lesson type */
function getTypeBadgeInfo(lesson: Lesson): TypeBadgeInfo {
  const code = lesson.typeCode;
  const rawType = (lesson.type || '').toLowerCase();

  if (code === 'lecture' || rawType.includes('лек')) {
    return {
      label: 'Лекция',
      color: theme.accent, // #0A84FF
      bg: 'rgba(10, 132, 255, 0.16)',
    };
  }
  if (code === 'lab' || rawType.includes('лаб')) {
    return {
      label: 'Лабораторная работа',
      color: theme.purple, // #BF5AF2
      bg: 'rgba(191, 90, 242, 0.16)',
    };
  }
  if (code === 'seminar' || rawType.includes('сем')) {
    return {
      label: 'Семинар',
      color: theme.success, // #30D158
      bg: 'rgba(48, 209, 88, 0.16)',
    };
  }
  if (code === 'practice' || rawType.includes('прак') || rawType.includes('пр')) {
    return {
      label: 'Практика',
      color: theme.warning, // #FFD60A / Orange
      bg: 'rgba(255, 214, 10, 0.16)',
    };
  }
  return {
    label: lesson.type || 'Занятие',
    color: theme.textSecondary,
    bg: 'rgba(142, 142, 147, 0.16)',
  };
}

/** Format teacher information with avatar initials and department title */
function getTeacherInfo(lesson: Lesson) {
  const name = lesson.teacher?.trim();
  if (!name) {
    return {
      initials: '—',
      fullName: 'Преподаватель не указан',
      title: 'Кафедра уточняется',
    };
  }

  let initials = '';
  if (lesson.teacherInitials) {
    const letters = lesson.teacherInitials.replace(/[^А-Яа-яЁёA-Za-z]/g, '');
    if (letters.length >= 2) {
      initials = letters.slice(0, 2).toUpperCase();
    }
  }

  if (!initials) {
    const caps = name.match(/[А-ЯЁA-Z]/g);
    if (caps && caps.length >= 2) {
      initials = caps.slice(0, 2).join('');
    } else {
      initials = name.slice(0, 2).toUpperCase();
    }
  }

  const subj = (lesson.subject || '').toLowerCase();
  let title = 'Доцент кафедры ИТ';
  if (subj.includes('физик')) {
    title = 'Доцент кафедры общей физики';
  } else if (subj.includes('математ') || subj.includes('алгебр') || subj.includes('анализ')) {
    title = 'Доцент кафедры высшей математики';
  } else if (subj.includes('истор')) {
    title = 'Доцент кафедры истории';
  } else if (subj.includes('язык') || subj.includes('английск')) {
    title = 'Преподаватель кафедры иностранных языков';
  } else if (subj.includes('спорт') || subj.includes('физическ')) {
    title = 'Преподаватель кафедры физической культуры';
  }

  return {
    initials,
    fullName: name,
    title,
  };
}

/** Format room location and building details */
function getLocationInfo(lesson: Lesson) {
  const room = (lesson.room || '').trim();
  const bldg = (lesson.building || '').trim();

  if (!room) {
    return {
      roomTitle: 'Аудитория уточняется',
      buildingInfo: 'Корпус не назначен',
      isOnline: false,
    };
  }

  if (/контур|онлайн|online|дистант/i.test(room) || bldg.toLowerCase() === 'онлайн') {
    return {
      roomTitle: 'Онлайн-аудитория (Контур.Толк)',
      buildingInfo: 'Дистанционно • Онлайн-платформа Контур.Толк',
      isOnline: true,
    };
  }

  if (room === '3/118' || room === '118') {
    return {
      roomTitle: 'Аудитория 3/118 (Лаборатория 1С)',
      buildingInfo: 'Корпус 3 • 1 этаж, правое крыло',
      isOnline: false,
    };
  }

  const slashMatch = room.match(/^(\d+)\/(\d+)(.*)$/);
  if (slashMatch) {
    const k = slashMatch[1];
    const rNum = slashMatch[2];
    const floor = rNum.length >= 3 ? rNum[0] : (rNum.length >= 2 ? rNum[0] : '1');
    const wing = Number(floor) % 2 === 0 ? 'левое крыло' : 'правое крыло';
    return {
      roomTitle: `Аудитория ${room}`,
      buildingInfo: `Корпус ${k} • ${floor} этаж, ${wing}`,
      isOnline: false,
    };
  }

  const digitsMatch = room.match(/^(\d)(\d{2})(.*)$/);
  if (digitsMatch) {
    const floor = digitsMatch[1];
    const k = bldg || '1';
    return {
      roomTitle: `Аудитория ${room}`,
      buildingInfo: `Корпус ${k} • ${floor} этаж, центральное крыло`,
      isOnline: false,
    };
  }

  return {
    roomTitle: `Аудитория ${room}`,
    buildingInfo: bldg ? `Корпус ${bldg}` : 'Корпус 1 • Учебный корпус',
    isOnline: false,
  };
}

/** Format subgroup label and notes */
function getSubgroupInfo(subgroup: Subgroup) {
  if (subgroup === '1') {
    return {
      title: '1 подгруппа',
      note: 'Параллельно у 2 подгруппы может проводиться другое занятие',
    };
  }
  if (subgroup === '2') {
    return {
      title: '2 подгруппа',
      note: 'Параллельно у 1 подгруппы может проводиться другое занятие',
    };
  }
  return {
    title: 'Вся группа',
    note: 'Занятие проводится совместно для всех студентов группы',
  };
}

export const LessonDetailSheet: React.FC<LessonDetailSheetProps> = ({
  lesson,
  visible,
  onClose,
  onToggleTask,
  tasks: propsTasks,
  onAddTask,
}) => {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const isLargeScreen = windowWidth > 640;
  const [localTasks, setLocalTasks] = useState<TaskItem[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  // Synchronize tasks from AsyncStorage or props
  useEffect(() => {
    if (!visible || !lesson) return;

    if (propsTasks) {
      setLocalTasks(propsTasks);
      return;
    }

    let isMounted = true;
    const loadTasks = async () => {
      try {
        const raw = await AsyncStorage.getItem(`tasks:${lesson.id}`);
        if (raw && isMounted) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            setLocalTasks(parsed);
          }
        } else if (isMounted) {
          setLocalTasks([]);
        }
      } catch {
        if (isMounted) {
          setLocalTasks([]);
        }
      }
    };

    loadTasks();
    return () => {
      isMounted = false;
    };
  }, [visible, lesson?.id, propsTasks]);

  const handleClose = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onClose();
  }, [onClose]);

  const handleToggleTask = useCallback(
    async (taskId: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      onToggleTask?.(taskId);

      if (!lesson) return;

      const updated = localTasks.map((item) =>
        item.id === taskId ? { ...item, completed: !item.completed } : item
      );
      setLocalTasks(updated);

      try {
        await AsyncStorage.setItem(`tasks:${lesson.id}`, JSON.stringify(updated));
      } catch {
        // Ignore write error
      }
    },
    [lesson, localTasks, onToggleTask]
  );

  const handleAddTask = useCallback(
    async () => {
      const trimmed = newTaskTitle.trim();
      if (!trimmed || !lesson) return;

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      onAddTask?.(lesson.id, trimmed);

      const newTask: TaskItem = {
        id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        lessonId: lesson.id,
        title: trimmed,
        completed: false,
        createdAt: new Date().toISOString(),
      };

      const updated = [...localTasks, newTask];
      setLocalTasks(updated);
      setNewTaskTitle('');

      try {
        await AsyncStorage.setItem(`tasks:${lesson.id}`, JSON.stringify(updated));
      } catch {
        // Ignore write error
      }
    },
    [lesson, newTaskTitle, localTasks, onAddTask]
  );

  const handleDeleteTask = useCallback(
    async (taskId: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      if (!lesson) return;

      const updated = localTasks.filter((item) => item.id !== taskId);
      setLocalTasks(updated);

      try {
        await AsyncStorage.setItem(`tasks:${lesson.id}`, JSON.stringify(updated));
      } catch {
        // Ignore write error
      }
    },
    [lesson, localTasks]
  );

  // Swipe down gesture to dismiss
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 10,
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 60 || gestureState.vy > 0.5) {
          handleClose();
        }
      },
    })
  ).current;

  if (!lesson) {
    return null;
  }

  const typeInfo = getTypeBadgeInfo(lesson);
  const teacherInfo = getTeacherInfo(lesson);
  const locationInfo = getLocationInfo(lesson);
  const subgroupInfo = getSubgroupInfo(lesson.subgroup);

  const completedCount = localTasks.filter((t) => t.completed).length;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        style={[
          styles.modalRoot,
          isLargeScreen && styles.modalRootLarge,
        ]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableWithoutFeedback onPress={handleClose}>
          {Platform.OS === 'ios' ? (
            <BlurView
              intensity={30}
              tint="dark"
              style={StyleSheet.absoluteFillObject}
            />
          ) : (
            <View style={styles.backdrop} />
          )}
        </TouchableWithoutFeedback>

        <View
          style={[
            styles.sheetContainer,
            isLargeScreen
              ? styles.sheetContainerLarge
              : [
                  styles.sheetContainerMobile,
                  { paddingBottom: Math.max(insets.bottom, 20) },
                ],
          ]}
        >
          {/* Top Drag Handle Header with Gesture Responder */}
          <View {...panResponder.panHandlers} style={styles.topBar}>
            <View style={styles.dragHandle} />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={18} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header: Type Badge, Pair & Time */}
            <View style={styles.headerBlock}>
              <View style={styles.badgeRow}>
                <View style={[styles.typeBadge, { backgroundColor: typeInfo.bg }]}>
                  <Text style={[styles.typeBadgeText, { color: typeInfo.color }]}>
                    {typeInfo.label}
                  </Text>
                </View>
                <Text style={styles.timeText}>
                  {lesson.num} пара • {lesson.time}
                </Text>
              </View>

              {/* Subject Title */}
              <Text style={styles.subjectTitle}>{lesson.subject}</Text>
            </View>

            {/* Teacher Block */}
            <View style={styles.card}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>{teacherInfo.initials}</Text>
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardPrimaryText}>{teacherInfo.fullName}</Text>
                <Text style={styles.cardSecondaryText}>{teacherInfo.title}</Text>
              </View>
            </View>

            {/* Location Block */}
            <View style={styles.card}>
              <View style={styles.iconCircle}>
                <Ionicons
                  name={locationInfo.isOnline ? 'globe-outline' : 'location-sharp'}
                  size={20}
                  color={theme.accent}
                />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardPrimaryText}>{locationInfo.roomTitle}</Text>
                <Text style={styles.cardSecondaryText}>{locationInfo.buildingInfo}</Text>
              </View>
            </View>

            {/* Subgroup Block */}
            <View style={styles.card}>
              <View style={[styles.iconCircle, styles.subgroupIconCircle]}>
                <Ionicons name="people" size={20} color="#FF9F0A" />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardPrimaryText}>{subgroupInfo.title}</Text>
                <Text style={styles.cardSecondaryText}>{subgroupInfo.note}</Text>
              </View>
            </View>

            {/* Tasks / Homework Section */}
            <View style={styles.tasksSection}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeaderTitle}>ЗАДАНИЯ И ЗАМЕТКИ</Text>
                {localTasks.length > 0 && (
                  <View style={styles.counterBadge}>
                    <Text style={styles.counterText}>
                      {completedCount}/{localTasks.length}
                    </Text>
                  </View>
                )}
              </View>

              {/* Tasks List */}
              <View style={styles.tasksCard}>
                {localTasks.length === 0 ? (
                  <View style={styles.emptyTasksContainer}>
                    <Ionicons
                      name="clipboard-outline"
                      size={28}
                      color="rgba(235, 235, 245, 0.25)"
                    />
                    <Text style={styles.emptyTasksText}>
                      Нет добавленных заданий или заметок
                    </Text>
                  </View>
                ) : (
                  localTasks.map((task, index) => {
                    const isLast = index === localTasks.length - 1;
                    return (
                      <View
                        key={task.id}
                        style={[styles.taskRow, !isLast && styles.taskRowBorder]}
                      >
                        <TouchableOpacity
                          style={styles.taskCheckboxTouch}
                          onPress={() => handleToggleTask(task.id)}
                          activeOpacity={0.7}
                        >
                          <Ionicons
                            name={task.completed ? 'checkbox' : 'square-outline'}
                            size={22}
                            color={task.completed ? theme.accent : theme.textSecondary}
                          />
                          <Text
                            style={[
                              styles.taskTitle,
                              task.completed && styles.taskTitleCompleted,
                            ]}
                          >
                            {task.title}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.taskDeleteTouch}
                          onPress={() => handleDeleteTask(task.id)}
                          activeOpacity={0.7}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Ionicons
                            name="trash-outline"
                            size={16}
                            color="rgba(235, 235, 245, 0.3)"
                          />
                        </TouchableOpacity>
                      </View>
                    );
                  })
                )}
              </View>

              {/* Add Task Input Row */}
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Добавить задание или заметку..."
                  placeholderTextColor="rgba(235, 235, 245, 0.4)"
                  value={newTaskTitle}
                  onChangeText={setNewTaskTitle}
                  onSubmitEditing={handleAddTask}
                  returnKeyType="done"
                />
                <TouchableOpacity
                  style={[
                    styles.addButton,
                    !newTaskTitle.trim() && styles.addButtonDisabled,
                  ]}
                  onPress={handleAddTask}
                  disabled={!newTaskTitle.trim()}
                  activeOpacity={0.8}
                >
                  <Ionicons name="arrow-up" size={18} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default LessonDetailSheet;

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  modalRootLarge: {
    justifyContent: 'center',
    padding: 24,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  sheetContainer: {
    backgroundColor: theme.bgSecondary,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: 'rgba(84, 84, 88, 0.35)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    overflow: 'hidden',
  },
  sheetContainerMobile: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    maxHeight: '90%',
  },
  sheetContainerLarge: {
    borderRadius: 24,
    maxHeight: '85%',
  },
  topBar: {
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  dragHandle: {
    width: 32,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#3A3A3C',
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    top: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: theme.bgTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollArea: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 28,
  },
  headerBlock: {
    marginBottom: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 10,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  timeText: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.textSecondary,
  },
  subjectTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 24,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.bgTertiary,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(84, 84, 88, 0.25)',
  },
  cardContent: {
    flex: 1,
    marginLeft: 12,
  },
  cardPrimaryText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  cardSecondaryText: {
    fontSize: 13,
    color: theme.textSecondary,
    lineHeight: 18,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(10, 132, 255, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(10, 132, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.accent,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(10, 132, 255, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subgroupIconCircle: {
    backgroundColor: 'rgba(255, 159, 10, 0.16)',
  },
  tasksSection: {
    marginTop: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  sectionHeaderTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.textSecondary,
    letterSpacing: 0.5,
  },
  counterBadge: {
    backgroundColor: theme.bgTertiary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  counterText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.textSecondary,
  },
  tasksCard: {
    backgroundColor: theme.bgTertiary,
    borderRadius: 14,
    paddingHorizontal: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(84, 84, 88, 0.25)',
  },
  emptyTasksContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  emptyTasksText: {
    fontSize: 13,
    color: theme.textSecondary,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  taskRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(84, 84, 88, 0.35)',
  },
  taskCheckboxTouch: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
    minHeight: 44,
  },
  taskTitle: {
    fontSize: 15,
    color: '#FFFFFF',
    marginLeft: 10,
    flex: 1,
  },
  taskTitleCompleted: {
    color: theme.textSecondary,
    textDecorationLine: 'line-through',
  },
  taskDeleteTouch: {
    padding: 8,
    minHeight: 44,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  textInput: {
    flex: 1,
    height: 44,
    backgroundColor: theme.bgTertiary,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(84, 84, 88, 0.25)',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: theme.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonDisabled: {
    backgroundColor: 'rgba(10, 132, 255, 0.3)',
  },
});
