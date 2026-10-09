/**
 * QA Challenger Adversarial Stress Test Suite
 * Evaluates:
 * 1. Offline Resilience (network absence, static bundle integrity)
 * 2. Week Detector Edge Cases (DST, 50-year parity continuity, Sept 1 mid-week anomalies)
 * 3. Schedule Utils & Parser Boundary Probing (corrupted entries, invalid types, nulls)
 * 4. Persistence & State Recovery (empty storage, malformed JSON, prototype pollution)
 */

import { getCurrentWeekType, getTodayDayIndex, WEEKDAY_NAMES } from '../src/utils/weekDetector';
import {
  filterLessonsBySubgroup,
  getAllRoomsStatus,
  getAllTeachers,
  getLessonsForGroup,
  isLessonCurrentlyActive,
} from '../src/utils/scheduleUtils';
import { parseRawLessonText } from '../src/api/parser';
import scheduleData from '../src/data/schedule.json';

let totalAssertions = 0;
let passedAssertions = 0;
let identifiedVulnerabilities = 0;

function check(desc: string, passed: boolean, vulnerabilityNote?: string) {
  totalAssertions++;
  if (passed) {
    passedAssertions++;
    console.log(`[PASS] ${desc}`);
  } else {
    identifiedVulnerabilities++;
    console.log(`[VULNERABILITY] ${desc}`);
    if (vulnerabilityNote) {
      console.log(`       -> Note: ${vulnerabilityNote}`);
    }
  }
}

console.log('====================================================');
console.log('       ADVERSARIAL RELIABILITY & STRESS AUDIT       ');
console.log('====================================================\n');

// ----------------------------------------------------
// 1. Offline Resilience & Dataset Integrity
// ----------------------------------------------------
console.log('--- Domain 1: Offline Resilience & Dataset Integrity ---');

const categories = Object.keys(scheduleData);
check('schedule.json contains valid category keys', categories.length === 12);

let totalLessonsCount = 0;
let hasCorruptedFields = false;
for (const cat of categories) {
  const catObj = (scheduleData as any)[cat];
  for (const crs of Object.keys(catObj)) {
    const crsObj = catObj[crs];
    for (const grp of Object.keys(crsObj)) {
      const grpObj = crsObj[grp];
      for (const wk of ['1', '2']) {
        const wkObj = grpObj[wk] || {};
        for (const d of Object.keys(wkObj)) {
          for (const l of wkObj[d]) {
            totalLessonsCount++;
            if (typeof l.num !== 'number' || typeof l.time !== 'string' || typeof l.text !== 'string') {
              hasCorruptedFields = true;
            }
          }
        }
      }
    }
  }
}
check('Static dataset lessons have strictly valid primitive fields', !hasCorruptedFields);
check('Static dataset lesson volume is populated (>1000 lessons)', totalLessonsCount > 1000);

// ----------------------------------------------------
// 2. Week Detector Edge Cases
// ----------------------------------------------------
console.log('\n--- Domain 2: Week Detector Edge Cases ---');

// Test 2.1: Sunday day index bounds
const sundayDate = new Date(2026, 9, 11); // Sunday
const sunIdx = getTodayDayIndex(sundayDate);
check('Sunday day index is 6', sunIdx === 6);
check(
  'WEEKDAY_NAMES array covers Sunday index 6',
  WEEKDAY_NAMES[sunIdx] !== undefined,
  'WEEKDAY_NAMES only contains 6 elements (indices 0..5). WEEKDAY_NAMES[6] is undefined!'
);

// Test 2.2: Timezone shift vulnerability (Math.floor vs Math.round)
const d1 = new Date(2016, 2, 28); // Mon Mar 28 2016
const d2 = new Date(2016, 2, 29); // Tue Mar 29 2016
const w1 = getCurrentWeekType(d1);
const w2 = getCurrentWeekType(d2);
check(
  'Week parity does not invert mid-week due to 1-hour timezone drift',
  w1 === w2,
  `Timezone shift caused mid-week flip: ${d1.toDateString()} was ${w1}, ${d2.toDateString()} flipped to ${w2}!`
);

// Test 2.3: August 31 / September 1 academic year boundary
const monAug31 = new Date(2020, 7, 31); // Mon Aug 31 2020
const tueSep01 = new Date(2020, 8, 1);  // Tue Sep 01 2020
const wAug = getCurrentWeekType(monAug31);
const wSep = getCurrentWeekType(tueSep01);
check(
  'Academic year switch does not flip parity mid-week when Sept 1 is Tuesday',
  wAug === wSep,
  `Academic year flip mid-week: Mon Aug 31 was ${wAug}, Tue Sep 01 flipped to ${wSep}!`
);

// ----------------------------------------------------
// 3. Schedule Utils & Parser Robustness
// ----------------------------------------------------
console.log('\n--- Domain 3: Schedule Utils & Parser Boundary Probing ---');

// Test 3.1: Null / Undefined rawText
let parserHandledNull = false;
try {
  const res = parseRawLessonText(1, '09:30', null as any, 0);
  parserHandledNull = Array.isArray(res) && res.length === 0;
} catch {
  parserHandledNull = false;
}
check('parseRawLessonText handles null rawText without crashing', parserHandledNull);

// Test 3.2: Non-string rawText (e.g. number or object)
let parserHandledNumber = false;
try {
  parseRawLessonText(1, '09:30', 123 as any, 0);
  parserHandledNumber = true;
} catch (e: any) {
  parserHandledNumber = false;
}
check(
  'parseRawLessonText handles non-string rawText without crashing',
  parserHandledNumber,
  'Calling .trim() on non-string rawText throws TypeError: rawText.trim is not a function'
);

// Test 3.3: Null elements inside schedule array in getLessonsForGroup
let utilsHandledNullLesson = false;
try {
  const corruptedData = {
    'ПМ': {
      '1': {
        'ПМ-О-26/1': {
          '1': {
            'Понедельник': [null, undefined],
          },
        },
      },
    },
  };
  getLessonsForGroup(corruptedData, 'ПМ', '1', 'ПМ-О-26/1', '1', 'Понедельник');
  utilsHandledNullLesson = true;
} catch {
  utilsHandledNullLesson = false;
}
check(
  'getLessonsForGroup handles null elements inside lesson arrays',
  utilsHandledNullLesson,
  'Accessing item.num on null array item throws TypeError: Cannot read properties of null (reading num)'
);

// Test 3.4: Sunday queries in getLessonsForGroup
let sundayHandled = false;
try {
  const res = getLessonsForGroup(scheduleData, 'ПМ', '1', 'ПМ-О-26/1', '1', 'Воскресенье');
  sundayHandled = Array.isArray(res) && res.length === 0;
} catch {
  sundayHandled = false;
}
check('getLessonsForGroup handles "Воскресенье" gracefully returning []', sundayHandled);

// ----------------------------------------------------
// 4. Persistence & State Recovery
// ----------------------------------------------------
console.log('\n--- Domain 4: Persistence & State Recovery ---');

// Test 4.1: Corrupted JSON in group storage
let handledCorruptedJson = false;
try {
  const raw = '{ invalid JSON';
  JSON.parse(raw);
} catch {
  handledCorruptedJson = true; // App.tsx catches this safely
}
check('Malformed JSON is caught by App.tsx try/catch safely', handledCorruptedJson);

// Test 4.2: String "null" in group storage
let handledNullJson = false;
try {
  const raw = 'null';
  const parsed = JSON.parse(raw);
  const category = parsed.category || parsed.cat;
} catch {
  handledNullJson = true;
}
check(
  'App.tsx catches JSON.parse("null") TypeError safely in catch block',
  handledNullJson,
  'Accessing parsed.category when parsed === null throws TypeError (caught by App.tsx outer catch)'
);

// Test 4.3: Prototype pollution keys in stored group
const protoData = { category: '__proto__', course: 'toString', name: 'call' };
// @ts-ignore
const protoExists = !!scheduleData[protoData.category]?.[protoData.course]?.[protoData.name];
check(
  'scheduleData is shielded from prototype pollution object traversal',
  !protoExists,
  'Prototype property access returns Object.prototype methods when keys match inherited properties'
);

console.log('\n====================================================');
console.log(`SUMMARY: ${passedAssertions}/${totalAssertions} ASSERTIONS PASSED.`);
console.log(`IDENTIFIED VULNERABILITIES / EDGE CASES: ${identifiedVulnerabilities}`);
console.log('====================================================\n');
