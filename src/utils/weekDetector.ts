/**
 * Automatic academic week type detection for ULSU.
 *
 * Rules (from the official ULSU calendar):
 *   • Sept 1 always starts as week "1" (первая неделя).
 *   • Weeks alternate 1 → 2 → 1 → 2 … without reset between semesters.
 *   • Each academic week runs Mon–Sun.
 *
 * Algorithm:
 *   1. Calculate the reference Monday for September 1 of this calendar year.
 *   2. If current date is on or after that reference Monday, use current year;
 *      otherwise, use the previous year.
 *   3. Count whole weeks using UTC midnight to avoid DST and timezone drift.
 *   4. Even index (0, 2, 4…) → "1", odd index (1, 3, 5…) → "2".
 */

export type WeekType = '1' | '2';

/** Returns `"1"` or `"2"` for the specified date. */
export function getCurrentWeekType(now: Date = new Date()): WeekType {
  const year = now.getFullYear();
  const todayUtc = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const thisYearStartMonday = getAcademicStartMonday(year);

  // If today is on or after reference Monday of Sept 1 this year, use this year; otherwise last year
  const refMonday =
    todayUtc.getTime() >= thisYearStartMonday.getTime()
      ? thisYearStartMonday
      : getAcademicStartMonday(year - 1);

  const diffMs = todayUtc.getTime() - refMonday.getTime();
  const diffDays = Math.round(diffMs / (24 * 60 * 60 * 1000));
  const weekIndex = Math.floor(diffDays / 7);

  // weekIndex 0 = first week = "1", weekIndex 1 = "2", etc.
  return weekIndex % 2 === 0 ? '1' : '2';
}

/**
 * Returns the Monday of the week containing Sept 1
 * of the given academic year at UTC midnight.
 */
function getAcademicStartMonday(year: number): Date {
  const sept1 = new Date(Date.UTC(year, 8, 1));
  const dow = sept1.getUTCDay(); // 0=Sun, 1=Mon … 6=Sat
  // Mon=1→0, Tue=2→1, Wed=3→2, Thu=4→3, Fri=5→4, Sat=6→5, Sun=0→6
  const offsetToMonday = (dow + 6) % 7;
  return new Date(Date.UTC(year, 8, 1 - offsetToMonday));
}

/**
 * Returns the index (0‑based) of the current day of the week
 * where 0=Пн, 1=Вт, … 5=Сб, 6=Вс.
 */
export function getTodayDayIndex(now: Date = new Date()): number {
  const dow = now.getDay(); // 0=Sun, 1=Mon … 6=Sat
  // Convert to Mon=0 … Sun=6
  return dow === 0 ? 6 : dow - 1;
}

/** Day names used in the schedule, Mon→Sun */
export const WEEKDAY_NAMES = [
  'Понедельник',
  'Вторник',
  'Среда',
  'Четверг',
  'Пятница',
  'Суббота',
  'Воскресенье',
];
