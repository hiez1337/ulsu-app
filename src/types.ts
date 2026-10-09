export type Subgroup = 'all' | '1' | '2';

export type LessonType = 'lecture' | 'lab' | 'practice' | 'seminar' | 'other';

export interface Lesson {
  id: string;
  num: number;
  time: string;
  subject: string;
  type: string;
  typeCode: LessonType;
  teacher: string;
  teacherInitials: string;
  room: string;
  building?: string;
  subgroup: Subgroup;
  raw: string;
  isActive?: boolean;
}

export interface ScheduleItem {
  time: string;
  place: string;
  subject: string;
  teacher: string;
  type: string;
  num: number;
}

export interface DaySchedule {
  date: string;
  weekday: string;
  lessons: Lesson[];
  items?: ScheduleItem[];
}

export interface GroupInfo {
  category: string;
  course: string;
  name: string;
  studentCount?: number;
}

export interface TaskItem {
  id: string;
  lessonId: string;
  title: string;
  completed: boolean;
  createdAt: string;
}

export interface RoomStatus {
  room: string;
  building: string;
  status: 'free' | 'busy';
  availableUntil?: string;
  currentLesson?: string;
}

export interface TeacherInfo {
  name: string;
  department: string;
  lessonsCount: number;
  schedulePreview?: string;
}

export type ActiveTab = 'schedule' | 'weekly' | 'search' | 'settings';
