/**
 * Automatic academic week type detection for ULSU.
 *
 * Rules (from the official ULSU calendar):
 *   • Sept 1 always starts as week "1" (первая неделя).
 *   • Weeks alternate 1 → 2 → 1 → 2 … without reset between semesters.
 *   • Each academic week runs Mon–Sun.
 *
 * Algorithm:
 *   1. Determine the current academic year:
 *        month ≥ 9  →  academicYear = thisYear
 *        month < 9  →  academicYear = thisYear − 1
 *   2. Find the Monday of the week that contains Sept 1 of that year.
 *      This is the "reference Monday" — the start of week‑1.
 *   3. Count full weeks from that Monday to today.
 *   4. Even index (0, 2, 4…) → "1",  odd index (1, 3, 5…) → "2".
 */

export type WeekType = '1' | '2';

/** Returns `"1"` or `"2"` for the current date. */
export function getCurrentWeekType(now: Date = new Date()): WeekType {
  const refMonday = getAcademicStartMonday(now);

  // Difference in whole days (both dates at midnight, local time)
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffMs = todayMidnight.getTime() - refMonday.getTime();
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

  const weekIndex = Math.floor(diffDays / 7);

  // weekIndex 0 = first week = "1", weekIndex 1 = "2", etc.
  return weekIndex % 2 === 0 ? '1' : '2';
}

/**
 * Returns the Monday of the week containing Sept 1
 * of the current academic year.
 */
function getAcademicStartMonday(now: Date): Date {
  const month = now.getMonth(); // 0-based (0=Jan, 8=Sep)
  const year = now.getFullYear();

  // Academic year starts in September
  const academicYear = month >= 8 ? year : year - 1; // month 8 = Sep

  const sept1 = new Date(academicYear, 8, 1); // Sept 1

  // JS getDay(): 0=Sun, 1=Mon … 6=Sat
  // We need offset to go back to Monday.
  // Mon=1→0, Tue=2→1, Wed=3→2, Thu=4→3, Fri=5→4, Sat=6→5, Sun=0→6
  const dow = sept1.getDay();
  const offsetToMonday = dow === 0 ? 6 : dow - 1;

  const monday = new Date(academicYear, 8, 1 - offsetToMonday);
  return monday;
}

/**
 * Returns the index (0‑based) of the current day of the week
 * where 0=Пн, 1=Вт, … 5=Сб, 6=Вс.
 * Returns -1 outside Mon–Sat (shouldn't happen since Sun=6).
 */
export function getTodayDayIndex(now: Date = new Date()): number {
  const dow = now.getDay(); // 0=Sun, 1=Mon … 6=Sat
  // Convert to Mon=0 … Sun=6
  return dow === 0 ? 6 : dow - 1;
}

/** Day names used in the schedule, Mon→Sat */
export const WEEKDAY_NAMES = [
  'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота',
];
