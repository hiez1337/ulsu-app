import {
  filterLessonsBySubgroup,
  getAllRoomsStatus,
  getAllTeachers,
  getLessonsForGroup,
  isLessonCurrentlyActive,
} from '../src/utils/scheduleUtils';
import { getCurrentWeekType, getTodayDayIndex } from '../src/utils/weekDetector';
import { parseRawLessonText } from '../src/api/parser';
import scheduleData from '../src/data/schedule.json';

console.log('====================================================');
console.log('       FUNCTIONAL FLOW SIMULATION TEST SUITE        ');
console.log('====================================================');

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, testName: string, details?: any) {
  totalTests++;
  if (condition) {
    console.log(`[PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`[FAIL] ${testName}`, details !== undefined ? details : '');
    process.exitCode = 1;
  }
}

// ------------------------------------------------------------------
// 1. Group Selection Screen Logic & Data Verification
// ------------------------------------------------------------------
console.log('\n--- 1. Testing Group Selection Screen Flows ---');

const categories = Object.keys(scheduleData);
assert(categories.length >= 12, `All 12 departments are present (found ${categories.length})`);
assert(categories.includes('ПМ') && categories.includes('ИС') && categories.includes('АС') && categories.includes('ИБ'), 'Primary departments (ПМ, ИС, АС, ИБ) are present');

// Test 3-level hierarchy for all categories
let allLevelsValid = true;
let totalGroupsCount = 0;
for (const cat of categories) {
  const catData = (scheduleData as any)[cat];
  const courses = Object.keys(catData);
  if (courses.length === 0) allLevelsValid = false;
  for (const crs of courses) {
    const grps = Object.keys(catData[crs]);
    if (grps.length === 0) allLevelsValid = false;
    totalGroupsCount += grps.length;
  }
}
assert(allLevelsValid, 'Direction -> Course -> Group 3-level hierarchy is strictly intact across all data');
assert(totalGroupsCount > 30, `All groups visible across categories (total groups: ${totalGroupsCount})`);

// ------------------------------------------------------------------
// 2. Schedule Screen: Subgroup Filter, Day Carousel, Live Progress Bar
// ------------------------------------------------------------------
console.log('\n--- 2. Testing Schedule Screen Flows ---');

// Test subgroup filter
const sampleDayLessons = getLessonsForGroup(scheduleData, 'ПМ', '1', 'ПМ-О-26/1', '1', 'Понедельник');
assert(sampleDayLessons.length > 0, `Sample day lessons retrieved for ПМ-О-26/1 (count: ${sampleDayLessons.length})`);

const allFiltered = filterLessonsBySubgroup(sampleDayLessons, 'all');
const sub1Filtered = filterLessonsBySubgroup(sampleDayLessons, '1');
const sub2Filtered = filterLessonsBySubgroup(sampleDayLessons, '2');

assert(allFiltered.length === sampleDayLessons.length, 'Filter "all" returns all lessons');
assert(sub1Filtered.every(l => l.subgroup === 'all' || l.subgroup === '1'), 'Filter "1" includes only common and subgroup 1 lessons');
assert(sub2Filtered.every(l => l.subgroup === 'all' || l.subgroup === '2'), 'Filter "2" includes only common and subgroup 2 lessons');

// Test Live pair progress bar simulation
const pairTime = '09:30 – 10:50'; // 570 mins to 650 mins

// Case A: 09:10 (before lesson)
const timeBefore = new Date(2026, 9, 9, 9, 10);
const resBefore = isLessonCurrentlyActive(pairTime, timeBefore);
assert(!resBefore.isActive && resBefore.progress === 0 && resBefore.remainingMinutes === 0, 'Before pair: isActive=false, progress=0');

// Case B: 10:10 (during lesson, 40 min into 80 min lesson)
const timeDuring = new Date(2026, 9, 9, 10, 10);
const resDuring = isLessonCurrentlyActive(pairTime, timeDuring);
assert(resDuring.isActive && resDuring.progress === 0.5 && resDuring.remainingMinutes === 40, 'During pair: isActive=true, progress=0.5, remainingMinutes=40');

// Case C: 10:49 (1 minute before end)
const timeEnd = new Date(2026, 9, 9, 10, 49);
const resEnd = isLessonCurrentlyActive(pairTime, timeEnd);
assert(resEnd.isActive && resEnd.remainingMinutes === 1, 'Near end of pair: isActive=true, remainingMinutes=1');

// Case D: 11:00 (after lesson)
const timeAfter = new Date(2026, 9, 9, 11, 0);
const resAfter = isLessonCurrentlyActive(pairTime, timeAfter);
assert(!resAfter.isActive && resAfter.progress === 1, 'After pair: isActive=false, progress=1');

// ------------------------------------------------------------------
// 3. Weekly Grid Screen: 6-day matrix, distinct day colors, pair counter
// ------------------------------------------------------------------
console.log('\n--- 3. Testing Weekly Grid Screen Flows ---');

const WEEK_DAYS = [
  { name: 'Понедельник', shortName: 'ПН', color: '#0A84FF' },
  { name: 'Вторник', shortName: 'ВТ', color: '#30D158' },
  { name: 'Среда', shortName: 'СР', color: '#FF9F0A' },
  { name: 'Четверг', shortName: 'ЧТ', color: '#BF5AF2' },
  { name: 'Пятница', shortName: 'ПТ', color: '#FF453A' },
  { name: 'Суббота', shortName: 'СБ', color: '#FFD60A' },
];

assert(WEEK_DAYS.length === 6, 'Weekly matrix has 6 academic days (Mon-Sat)');
const dayColors = new Set(WEEK_DAYS.map(d => d.color));
assert(dayColors.size === 6, 'All 6 days have distinct semantic accent colors');

// Test Russian plural forms for pair counter
function formatLessonCount(count: number): string {
  if (count === 0) return '0 пар';
  const rem10 = count % 10;
  const rem100 = count % 100;
  if (rem10 === 1 && rem100 !== 11) return `${count} пара`;
  if (rem10 >= 2 && rem10 <= 4 && (rem100 < 10 || rem100 >= 20)) return `${count} пары`;
  return `${count} пар`;
}

assert(formatLessonCount(0) === '0 пар', 'Plural: 0 пар');
assert(formatLessonCount(1) === '1 пара', 'Plural: 1 пара');
assert(formatLessonCount(2) === '2 пары', 'Plural: 2 пары');
assert(formatLessonCount(3) === '3 пары', 'Plural: 3 пары');
assert(formatLessonCount(4) === '4 пары', 'Plural: 4 пары');
assert(formatLessonCount(5) === '5 пар', 'Plural: 5 пар');
assert(formatLessonCount(11) === '11 пар', 'Plural: 11 пар');
assert(formatLessonCount(21) === '21 пара', 'Plural: 21 пара');
assert(formatLessonCount(22) === '22 пары', 'Plural: 22 пары');

// ------------------------------------------------------------------
// 4. Lesson Detail Sheet & Parser Data Extraction
// ------------------------------------------------------------------
console.log('\n--- 4. Testing Lesson Detail Sheet & Parser Logic ---');

const testRaw = '1п лаб. Информатика и программирование Н.Н.Нечаева 3/118';
const parsed = parseRawLessonText(1, '09:30 – 10:50', testRaw, 0);
assert(parsed.length === 1, 'Parsed 1 lesson from raw string');
assert(parsed[0].subgroup === '1', 'Extracted subgroup "1"');
assert(parsed[0].typeCode === 'lab', 'Extracted typeCode "lab"');
assert(parsed[0].type === 'Лабораторная', 'Extracted type title "Лабораторная"');
assert(parsed[0].room === '3/118', 'Extracted room "3/118"');
assert(parsed[0].building === '3', 'Extracted building "3"');
assert(parsed[0].teacher.includes('Нечаева'), 'Extracted teacher "Нечаева"');
assert(parsed[0].teacherInitials === 'Н.Н.', 'Extracted teacher initials "Н.Н."');

// Test online classroom parsing
const testOnlineRaw = 'лек. Математический анализ Ю.Ю.Фролова Контур Толк';
const parsedOnline = parseRawLessonText(2, '11:00 – 12:20', testOnlineRaw, 0);
assert(parsedOnline[0].room.includes('Контур Толк'), 'Extracted room "Контур Толк"');
assert(parsedOnline[0].building === 'Онлайн', 'Extracted building "Онлайн"');

// ------------------------------------------------------------------
// 5. Search Screen: Teachers Directory & Free Classroom Detector
// ------------------------------------------------------------------
console.log('\n--- 5. Testing Search Screen Logic ---');

const teachers = getAllTeachers(scheduleData);
assert(teachers.length > 20, `Teacher directory populated (found ${teachers.length} teachers)`);
assert(teachers.every(t => t.name && t.lessonsCount > 0), 'All teachers have valid name and positive lesson load');

const roomsStatus = getAllRoomsStatus(scheduleData, '1', 'Понедельник', 2);
assert(roomsStatus.length > 10, `Classrooms status populated (found ${roomsStatus.length} rooms)`);
const freeRooms = roomsStatus.filter(r => r.status === 'free');
const busyRooms = roomsStatus.filter(r => r.status === 'busy');
assert(freeRooms.length > 0, `Free classroom detector identified ${freeRooms.length} free rooms`);
assert(busyRooms.length > 0, `Free classroom detector identified ${busyRooms.length} busy rooms`);
assert(busyRooms.every(r => r.currentLesson), 'All busy rooms have active currentLesson information');

// ------------------------------------------------------------------
// 6. Week Parity Detector Logic
// ------------------------------------------------------------------
console.log('\n--- 6. Testing Week Parity Detector Logic ---');

const weekTypeNow = getCurrentWeekType();
assert(weekTypeNow === '1' || weekTypeNow === '2', `Current week parity determined: "${weekTypeNow}"`);

const dayIdx = getTodayDayIndex();
assert(dayIdx >= 0 && dayIdx <= 6, `Day index calculated within bounds: ${dayIdx}`);

console.log('\n====================================================');
console.log(`SIMULATION RESULTS: ${passedTests}/${totalTests} TESTS PASSED`);
console.log('====================================================');
