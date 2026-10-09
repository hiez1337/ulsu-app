# Adversarial Reliability and Edge-Case Audit Report

## 1. Observation

The stress audit evaluated the ULSU schedule application across three core domains:
- Domain 1: Offline resilience and dataset integrity.
- Domain 2: Schedule edge cases, date boundaries, and week parity.
- Domain 3: Persistence and state recovery.

### Table of Discovered Vulnerabilities and Edge Cases

| ID | Domain | File Path | Line Number | Severity | Description |
|:---|:---|:---|:---|:---|:---|
| VULN-01 | Week Parity | `src/utils/weekDetector.ts` | 28 | High | `Math.floor` date division causes mid-week parity inversions during timezone offset transitions. |
| VULN-02 | Week Parity | `src/utils/weekDetector.ts` | 45 | Medium | Calendar week containing September 1 changes parity on Tuesday when September 1 is Tuesday. |
| VULN-03 | Week Boundaries | `src/utils/weekDetector.ts` | 71–73 | Medium | `WEEKDAY_NAMES` contains 6 elements. Sunday index 6 returns `undefined`. |
| VULN-04 | Empty Day / UI | `src/screens/ScheduleScreen.tsx` | 280–322 | Medium | Sunday navigation displays Monday of the previous calendar week without an explicit Sunday indicator. |
| VULN-05 | Room Query | `src/screens/SearchScreen.tsx` | 152–155 | Low | Sunday navigation defaults to Monday. Search displays classroom occupancy for Monday during Sunday queries. |
| VULN-06 | Parser Crash | `src/api/parser.ts` | 24–32 | Medium | Non-string input to `parseRawLessonText` throws `TypeError: rawText.trim is not a function`. |
| VULN-07 | Array Null Pointer | `src/utils/scheduleUtils.ts` | 73, 175, 254 | Medium | Null or undefined items in lesson arrays throw `TypeError: Cannot read properties of null`. |
| VULN-08 | Object Traversal | `App.tsx` | 57 | Low | Object key traversal evaluates prototype properties when keys match inherited object methods. |
| VULN-09 | Persistence Scope | `src/screens/SettingsScreen.tsx` | 58–61 | Low | Settings for theme mode, auto-detect week, and reminders persist in storage but do not connect to application logic. |

### Dataset Verification Facts
- The static file `src/data/schedule.json` contains 12 departments, 38 academic groups, and 1230 lessons.
- The static file contains zero syntax errors and zero empty groups.
- The repository contains zero remote HTTP network requests, external fetch calls, or CDN assets.
- Fifty-four weekday slots (11.8% of group schedules) contain zero classes and show empty states correctly.

---

## 2. Logic Chain

### VULN-01: Timezone Shift Flaw in `weekDetector.ts`
- **Mechanism**: Line 28 divides millisecond difference by `24 * 60 * 60 * 1000` using `Math.floor()`.
- **Failure**: A one-hour clock change (daylight saving or legal timezone shift) reduces the day ratio to 209.958.
- **Impact**: `Math.floor(209.958)` returns 209 instead of 210. Week parity inverts from Week 2 to Week 1 on Tuesday morning.
- **Resolution**: Use `Math.round(diffMs / (24 * 60 * 60 * 1000))` to absorb one-hour offset variations.

### VULN-02: Academic Year Cutoff Flaw in `weekDetector.ts`
- **Mechanism**: Line 45 checks `month >= 8` to determine academic year.
- **Failure**: When September 1 is a Tuesday, Monday August 31 belongs to the new academic week. The condition `month >= 8` evaluates to false on August 31.
- **Impact**: August 31 uses the previous academic year reference Monday. September 1 uses the new reference Monday. Parity flips mid-week.
- **Resolution**: Calculate the reference Monday for September 1 of the calendar year. If current date is on or after that reference Monday, use that academic year.

### VULN-03: Array Out-of-Bounds on Sunday
- **Mechanism**: `getTodayDayIndex()` returns index 6 for Sunday.
- **Failure**: `WEEKDAY_NAMES` contains only 6 strings (Monday through Saturday, indices 0 to 5).
- **Impact**: Accessing `WEEKDAY_NAMES[6]` produces `undefined`.
- **Resolution**: Add `'Воскресенье'` to `WEEKDAY_NAMES` or guard Sunday access explicitly.

### VULN-04 & VULN-05: Sunday Schedule and Room Search Fallbacks
- **Mechanism**: `ScheduleScreen.tsx` sets `mondayOffset = -6` on Sunday.
- **Failure**: The screen shows Monday of the elapsed week. Students preparing for Monday see stale schedule data.
- **Impact**: `SearchScreen.tsx` queries room occupancy for Monday instead of Sunday.
- **Resolution**: On Sunday, point `ScheduleScreen` to next Monday or render an explicit Sunday weekend status view. In `SearchScreen`, display a "Занятия отсутствуют" state on Sunday.

### VULN-06 & VULN-07: Type Guards in Parser and Schedule Utils
- **Mechanism**: `parseRawLessonText` assumes `rawText` is a string. `scheduleUtils.ts` iterates over array items without checking null values.
- **Failure**: Non-string or null data causes application crashes during parsing.
- **Impact**: Corrupted storage or external imports crash the UI thread.
- **Resolution**: Add `if (typeof rawText !== 'string' || !rawText.trim()) return [];` to `parseRawLessonText`. Add null guards before accessing `item.num`.

### VULN-08: Object Traversal Prototype Pollution Guard
- **Mechanism**: `App.tsx` evaluates `scheduleData[category]?.[course]?.[name]`.
- **Failure**: If `category` equals `'__proto__'`, `course` equals `'toString'`, and `name` equals `'call'`, the expression evaluates to a truthy function.
- **Resolution**: Validate that `Object.prototype.hasOwnProperty.call(scheduleData, category)` is true before reading properties.

---

## 3. Caveats

1. The current application runs fully offline with zero remote APIs. Remote synchronization failures cannot occur in production currently.
2. The manual refresh action in `SettingsScreen.tsx` is an emulated timer delay. It does not update local schedule data.
3. Windows development environment: Testing date shifts requires synthetic Date instances. System clock changes require administrative permissions.

---

## 4. Conclusion

**Verdict**: `REQUEST_CHANGES`

The application satisfies offline resilience criteria. The static bundle functions without internet access.
However, six reliability vulnerabilities require code remediation:
1. Fix date arithmetic in `src/utils/weekDetector.ts` (replace `Math.floor` with `Math.round`).
2. Correct the academic year transition boundary in `src/utils/weekDetector.ts`.
3. Guard Sunday index access in `WEEKDAY_NAMES` and handle Sunday views in `ScheduleScreen.tsx` and `SearchScreen.tsx`.
4. Add primitive type validation in `src/api/parser.ts`.
5. Add null item checks in `src/utils/scheduleUtils.ts`.
6. Add `hasOwnProperty` verification in `App.tsx` to prevent prototype traversal.

---

## 5. Verification Method

Execute the following commands to reproduce findings and verify fixes:

1. Run the unified stress test suite:
   ```bash
   npx tsx scripts/qa_challenger_stress_test.ts
   ```
2. Verify TypeScript compilation:
   ```bash
   npx tsc --noEmit
   ```
3. Run existing functional flows test suite:
   ```bash
   npx tsx scripts/test_functional_flows.ts
   ```
