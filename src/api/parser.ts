// This file now mainly provides TypeScript interfaces for the schedule.
// The scraping logic below is kept for reference but not used in the Excel-based flow.

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
  items: ScheduleItem[];
}

export interface StudentInfo {
  name: string;
  birthDate: string;
  phone: string;
  email: string;
  faculty: string;
  level: string;
  specialty: string;
  profile: string;
  educationForm: string;
  basis: string;
  course: string;
  group: string;
}

// These functions are deprecated as we now use `schedule.json`
/*
export const parseStudentInfo = (html: string): StudentInfo | null => {
   ...
};

export const parseSchedule = (html: string): DaySchedule[] => {
   ...
};
*/
