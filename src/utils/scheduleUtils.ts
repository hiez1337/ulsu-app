import {
  Lesson,
  RoomStatus,
  Subgroup,
  TeacherInfo,
} from '../types';
import { parseRawLessonText } from '../api/parser';
import defaultScheduleData from '../data/schedule.json';

// Shield default schedule dataset against prototype pollution traversal
if (defaultScheduleData && typeof defaultScheduleData === 'object') {
  Object.setPrototypeOf(defaultScheduleData, null);
  for (const cat of Object.keys(defaultScheduleData)) {
    const catObj = (defaultScheduleData as any)[cat];
    if (catObj && typeof catObj === 'object') {
      Object.setPrototypeOf(catObj, null);
    }
  }
}

const WEEKDAY_LIST = [
  'Понедельник',
  'Вторник',
  'Среда',
  'Четверг',
  'Пятница',
  'Суббота',
  'Воскресенье',
];

/**
 * Filters a list of lessons by student subgroup.
 * If subgroup is 'all', returns all lessons.
 * Otherwise returns common lessons ('all') and subgroup-specific lessons ('1' or '2').
 */
export function filterLessonsBySubgroup(
  lessons: Lesson[],
  subgroup: Subgroup
): Lesson[] {
  if (subgroup === 'all') {
    return lessons;
  }
  return lessons.filter(
    (lesson) => lesson.subgroup === 'all' || lesson.subgroup === subgroup
  );
}

/**
 * Scans schedule data and determines availability status for all known classrooms
 * during a specified week, weekday, and pair number.
 */
export function getAllRoomsStatus(
  scheduleData: any,
  currentWeek: string,
  dayName: string,
  currentPairNum: number
): RoomStatus[] {
  const roomLessonsMap = new Map<
    string,
    {
      building: string;
      lessons: Array<{
        num: number;
        time: string;
        subject: string;
        teacher: string;
        group: string;
      }>;
    }
  >();

  if (!scheduleData || typeof scheduleData !== 'object') {
    return [];
  }

  for (const cat of Object.keys(scheduleData)) {
    const courses = scheduleData[cat] || {};
    for (const crs of Object.keys(courses)) {
      const groups = courses[crs] || {};
      for (const grp of Object.keys(groups)) {
        const weekData = groups[grp]?.[currentWeek] || {};
        const dayKey = Object.keys(weekData).find(
          (k) => k.toLowerCase() === dayName.toLowerCase()
        );
        if (dayKey && Array.isArray(weekData[dayKey])) {
          for (const rawLesson of weekData[dayKey]) {
            if (!rawLesson || typeof rawLesson !== 'object') continue;
            const parsedList = parseRawLessonText(
              rawLesson.num,
              rawLesson.time,
              rawLesson.text,
              0
            );
            for (const l of parsedList) {
              if (l.room && l.room.trim() !== '') {
                const roomName = l.room.trim();
                if (!roomLessonsMap.has(roomName)) {
                  roomLessonsMap.set(roomName, {
                    building:
                      l.building ||
                      (roomName.includes('/') ? roomName.split('/')[0] : '1'),
                    lessons: [],
                  });
                }
                roomLessonsMap.get(roomName)!.lessons.push({
                  num: l.num,
                  time: l.time,
                  subject: l.subject,
                  teacher: l.teacher,
                  group: grp,
                });
              }
            }
          }
        }
      }
    }
  }

  const result: RoomStatus[] = [];
  for (const [room, info] of roomLessonsMap.entries()) {
    const currentLesson = info.lessons.find((l) => l.num === currentPairNum);
    const status: 'free' | 'busy' = currentLesson ? 'busy' : 'free';

    let availableUntil: string | undefined;
    let currentLessonStr: string | undefined;

    if (currentLesson) {
      currentLessonStr = `${currentLesson.subject} (${currentLesson.group}${
        currentLesson.teacher ? ', ' + currentLesson.teacher : ''
      })`;
    } else {
      const nextLesson = info.lessons
        .filter((l) => l.num > currentPairNum)
        .sort((a, b) => a.num - b.num)[0];
      if (nextLesson) {
        availableUntil = nextLesson.time.split(/[–—\-]/)[0].trim();
      } else {
        availableUntil = 'До конца дня';
      }
    }

    result.push({
      room,
      building: info.building,
      status,
      availableUntil,
      currentLesson: currentLessonStr,
    });
  }

  result.sort((a, b) => {
    if (a.building !== b.building) {
      return a.building.localeCompare(b.building, undefined, { numeric: true });
    }
    return a.room.localeCompare(b.room, undefined, { numeric: true });
  });

  return result;
}

/**
 * Collects all unique teachers across all categories, courses, and groups in schedule data.
 * Computes the total lesson count and preview of subjects taught.
 */
export function getAllTeachers(scheduleData: any): TeacherInfo[] {
  if (!scheduleData || typeof scheduleData !== 'object') {
    return [];
  }

  const teacherMap = new Map<
    string,
    {
      lessonsCount: number;
      subjects: Set<string>;
    }
  >();

  for (const cat of Object.keys(scheduleData)) {
    const courses = scheduleData[cat] || {};
    for (const crs of Object.keys(courses)) {
      const groups = courses[crs] || {};
      for (const grp of Object.keys(groups)) {
        for (const wk of ['1', '2']) {
          const weekData = groups[grp]?.[wk] || {};
          for (const day of Object.keys(weekData)) {
            const rawLessons = weekData[day];
            if (Array.isArray(rawLessons)) {
              for (const rawLesson of rawLessons) {
                if (!rawLesson || typeof rawLesson !== 'object') continue;
                const parsedList = parseRawLessonText(
                  rawLesson.num,
                  rawLesson.time,
                  rawLesson.text,
                  0
                );
                for (const l of parsedList) {
                  if (l.teacher && l.teacher.trim() !== '') {
                    const tName = l.teacher.trim();
                    if (!teacherMap.has(tName)) {
                      teacherMap.set(tName, {
                        lessonsCount: 0,
                        subjects: new Set<string>(),
                      });
                    }
                    const tEntry = teacherMap.get(tName)!;
                    tEntry.lessonsCount++;
                    if (l.subject && l.subject.trim() !== '') {
                      tEntry.subjects.add(l.subject.trim());
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  const result: TeacherInfo[] = [];
  for (const [name, info] of teacherMap.entries()) {
    result.push({
      name,
      department: 'ФИТТ',
      lessonsCount: info.lessonsCount,
      schedulePreview: Array.from(info.subjects).slice(0, 3).join(', '),
    });
  }

  result.sort((a, b) => a.name.localeCompare(b.name, 'ru'));
  return result;
}

/**
 * Retrieves and parses all lessons for a specific group, week, and day.
 */
export function getLessonsForGroup(
  scheduleData: any,
  category: string,
  course: string,
  groupName: string,
  week: '1' | '2',
  dayName: string
): Lesson[] {
  if (!scheduleData || typeof scheduleData !== 'object') {
    return [];
  }

  if (
    !category ||
    !Object.prototype.hasOwnProperty.call(scheduleData, category)
  ) {
    return [];
  }
  const courseObj = scheduleData[category];
  if (
    !course ||
    !courseObj ||
    !Object.prototype.hasOwnProperty.call(courseObj, course)
  ) {
    return [];
  }
  const groupObj = courseObj[course]?.[groupName];
  if (!groupObj || typeof groupObj !== 'object') {
    return [];
  }

  const weekObj = groupObj[week];
  if (!weekObj || typeof weekObj !== 'object') {
    return [];
  }

  const dayKey = Object.keys(weekObj).find(
    (k) => k.toLowerCase() === dayName.toLowerCase()
  );
  if (!dayKey || !Array.isArray(weekObj[dayKey])) {
    return [];
  }

  const rawLessons = weekObj[dayKey];
  const dayIndex = WEEKDAY_LIST.findIndex(
    (d) => d.toLowerCase() === dayName.toLowerCase()
  );

  const lessons: Lesson[] = [];
  for (const item of rawLessons) {
    if (!item || typeof item !== 'object') continue;
    const parsed = parseRawLessonText(
      item.num,
      item.time,
      item.text,
      dayIndex >= 0 ? dayIndex : 0
    );
    lessons.push(...parsed);
  }

  lessons.sort((a, b) => {
    if (a.num !== b.num) {
      return a.num - b.num;
    }
    return a.subgroup.localeCompare(b.subgroup);
  });

  return lessons;
}

/**
 * Parses time range string "HH:MM – HH:MM" into start and end minute values.
 */
function parseLessonTimeRange(
  timeRange: string
): { start: number; end: number } | null {
  if (!timeRange) {
    return null;
  }
  const match = timeRange.match(
    /(\d{1,2}):(\d{2})\s*[–—\-]\s*(\d{1,2}):(\d{2})/
  );
  if (!match) {
    return null;
  }
  const start = parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
  const end = parseInt(match[3], 10) * 60 + parseInt(match[4], 10);
  return { start, end };
}

/**
 * Determines whether a lesson is currently active based on its time string.
 * Returns active status flag, completion progress between 0 and 1, and remaining minutes.
 */
export function isLessonCurrentlyActive(
  lessonTime: string,
  currentTime?: Date
): { isActive: boolean; progress: number; remainingMinutes: number } {
  const range = parseLessonTimeRange(lessonTime);
  if (!range) {
    return { isActive: false, progress: 0, remainingMinutes: 0 };
  }

  const now = currentTime || new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  if (currentMinutes >= range.start && currentMinutes <= range.end) {
    const total = range.end - range.start;
    const progress =
      total > 0
        ? Math.min(1, Math.max(0, (currentMinutes - range.start) / total))
        : 0;
    return {
      isActive: true,
      progress: Math.round(progress * 100) / 100,
      remainingMinutes: range.end - currentMinutes,
    };
  }

  return {
    isActive: false,
    progress: currentMinutes > range.end ? 1 : 0,
    remainingMinutes: 0,
  };
}

export interface DetailedScheduleEntry {
  day: string;
  num: number;
  time: string;
  subject: string;
  type: string;
  room: string;
  teacher: string;
  group: string;
  week: '1' | '2';
}

/**
 * Retrieves all lessons taught by a specific teacher across all groups.
 */
export function getTeacherSchedule(
  scheduleData: any,
  teacherName: string,
  week?: '1' | '2'
): DetailedScheduleEntry[] {
  if (!scheduleData || !teacherName) return [];
  const target = teacherName.trim().toLowerCase();
  const weeksToScan = week ? [week] : ['1', '2'];
  const entries: DetailedScheduleEntry[] = [];

  for (const cat of Object.keys(scheduleData)) {
    const courses = scheduleData[cat] || {};
    for (const crs of Object.keys(courses)) {
      const groups = courses[crs] || {};
      for (const grp of Object.keys(groups)) {
        for (const wk of weeksToScan) {
          const weekData = groups[grp]?.[wk] || {};
          for (const day of Object.keys(weekData)) {
            const rawLessons = weekData[day];
            if (Array.isArray(rawLessons)) {
              for (const rawLesson of rawLessons) {
                if (!rawLesson || typeof rawLesson !== 'object') continue;
                const parsedList = parseRawLessonText(
                  rawLesson.num,
                  rawLesson.time,
                  rawLesson.text,
                  0
                );
                for (const l of parsedList) {
                  if (l.teacher && l.teacher.trim().toLowerCase() === target) {
                    entries.push({
                      day,
                      num: l.num,
                      time: l.time,
                      subject: l.subject,
                      type: l.type,
                      room: l.room || 'Ауд. уточняется',
                      teacher: l.teacher,
                      group: grp,
                      week: wk as '1' | '2',
                    });
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  entries.sort((a, b) => {
    const dayDiff =
      WEEKDAY_LIST.indexOf(a.day) - WEEKDAY_LIST.indexOf(b.day);
    if (dayDiff !== 0) return dayDiff;
    if (a.num !== b.num) return a.num - b.num;
    return a.group.localeCompare(b.group);
  });

  return entries;
}

/**
 * Retrieves all lessons held in a specific room across all groups.
 */
export function getRoomSchedule(
  scheduleData: any,
  roomName: string,
  week?: '1' | '2'
): DetailedScheduleEntry[] {
  if (!scheduleData || !roomName) return [];
  const target = roomName.trim().toLowerCase();
  const weeksToScan = week ? [week] : ['1', '2'];
  const entries: DetailedScheduleEntry[] = [];

  for (const cat of Object.keys(scheduleData)) {
    const courses = scheduleData[cat] || {};
    for (const crs of Object.keys(courses)) {
      const groups = courses[crs] || {};
      for (const grp of Object.keys(groups)) {
        for (const wk of weeksToScan) {
          const weekData = groups[grp]?.[wk] || {};
          for (const day of Object.keys(weekData)) {
            const rawLessons = weekData[day];
            if (Array.isArray(rawLessons)) {
              for (const rawLesson of rawLessons) {
                if (!rawLesson || typeof rawLesson !== 'object') continue;
                const parsedList = parseRawLessonText(
                  rawLesson.num,
                  rawLesson.time,
                  rawLesson.text,
                  0
                );
                for (const l of parsedList) {
                  if (l.room && l.room.trim().toLowerCase() === target) {
                    entries.push({
                      day,
                      num: l.num,
                      time: l.time,
                      subject: l.subject,
                      type: l.type,
                      room: l.room,
                      teacher: l.teacher || 'Преподаватель уточняется',
                      group: grp,
                      week: wk as '1' | '2',
                    });
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  entries.sort((a, b) => {
    const dayDiff =
      WEEKDAY_LIST.indexOf(a.day) - WEEKDAY_LIST.indexOf(b.day);
    if (dayDiff !== 0) return dayDiff;
    if (a.num !== b.num) return a.num - b.num;
    return a.group.localeCompare(b.group);
  });

  return entries;
}
