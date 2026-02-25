# UlsuNotSmart — Copilot Instructions

## Project Overview
Mobile university schedule app for ULSU (Ulyanovsk State University). Displays class schedules parsed from an Excel file (`Vesna2025_2026.xlsx`). Built with **Expo SDK 54** (React Native 0.81) + **TypeScript 5**, dark Apple-style UI. Version **1.2.0**.

## Architecture & Data Flow
```
Excel (.xlsx) → convert_schedule_v2.py → src/data/schedule.json → App.tsx → Screens
```
- **No backend/API** — all data is static JSON bundled into the app.
- `convert_schedule_v2.py` (openpyxl) parses Excel with auto-detection of header rows and group columns via regex `^[А-ЯA-Z]{2,}-[А-ЯA-Z]-\d{2}/\d`.
- `src/data/schedule.json` structure: `{ Category → Course → GroupName → Week("1"|"2") → Day → [{num, time, text}] }`.
- `App.tsx` is the root — manages navigation state, week toggle, group persistence (AsyncStorage), and passes `currentWeekType`/`onRefresh` to screens.
- Navigation is **manual state-based** (`currentGroup` state in App.tsx), not react-navigation.

## Key Files & Structure
```
App.tsx                          — Entry point, state, screen routing
src/
├── screens/
│   ├── GroupSelectionScreen.tsx  — 2-level selection: direction → course (auto-selects group)
│   └── ScheduleScreen.tsx       — Schedule display, week toggle, live progress bar, pull-to-refresh
├── api/parser.ts                — TypeScript interfaces only (ScheduleItem, DaySchedule)
├── data/schedule.json           — Pre-generated schedule data (~37 groups)
├── utils/weekDetector.ts        — Academic week type detection (exports getCurrentWeekType, getTodayDayIndex, WEEKDAY_NAMES)
├── components/                  — (empty, components are inline in screens)
└── theme.ts                     — Centralized Apple dark theme tokens
```

## Design Conventions
- **Dark theme only** — pure black `#000` bg, iOS system colors. All styling via `theme.ts`.
- Never hardcode colors — import from `theme`. Example: `theme.accent` (#0A84FF), `theme.bgCard` (#1C1C1E).
- Day color coding: `DAY_COLORS` map in ScheduleScreen (Mon=blue, Tue=green, Wed=orange, Thu=purple, Fri=red, Sat=yellow).
- Apple HIG-inspired: large titles, card layouts, `@expo/vector-icons` (Ionicons).
- `expo-linear-gradient` for gradients. Translucent separators: `rgba(84, 84, 88, 0.35)`.
- **Language: Russian** — all user-facing strings must be in Russian.

## Real-Time Features in ScheduleScreen
- **Live progress bar**: `parseLessonTimeRange()` parses time strings like `"08:30 – 10:00"` → determines if a lesson is active now. `LessonProgressBar` renders animated gradient fill (color matches day). Updates via `setInterval` every 30 seconds.
- **"Сегодня" badge**: Only shown when `weekType === currentWeekType` (the `isViewingCurrentWeek` guard). Auto-scrolls FlatList to today's card.
- **Pull-to-refresh**: `RefreshControl` on FlatList calls `onRefresh()` → resets `weekType` to detected current week.

## Auto Week Detection (`src/utils/weekDetector.ts`)
- Sept 1 = week "1"; weeks alternate 1→2→1→2 continuously (no semester reset).
- Reference: Monday of the week containing Sept 1 of the academic year.
- `getCurrentWeekType(now?)` → `"1" | "2"`. `getTodayDayIndex(now?)` → 0=Mon…6=Sun.
- Academic year boundary: month ≥ Sep → current year, else previous year.

## Build & Deploy
| Platform | Command | Notes |
|----------|---------|-------|
| Dev | `npx expo start --web` | localhost:8081 |
| Android APK | `npx expo prebuild --platform android --clean` then apply gradle patches, then `cd android; $env:JAVA_HOME="C:\Program Files\Java\jdk-17"; .\gradlew.bat assembleRelease` | Output: `android/app/build/outputs/apk/release/UlsuNotSmart_1.2.apk` |
| iOS IPA | GitHub Actions → `Build iOS IPA (unsigned)` workflow | `CODE_SIGNING_ALLOWED=NO`, install via AltStore/Sideloadly |

### Android Build — Critical Workflow
1. `npx expo prebuild --platform android --clean` regenerates `android/` from Expo template.
2. **Post-prebuild gradle patches** (must be reapplied after every prebuild):
   - `android/gradle.properties`: `reactNativeArchitectures=arm64-v8a` (single arch, ~22MB APK vs 67MB with 4 archs)
   - `android/gradle.properties`: `org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=1024m`
   - `android/app/build.gradle`: `enableMinifyInReleaseBuilds = ... ?: true` (R8 minification)
   - `android/app/build.gradle`: output naming block inside `release { }` → `outputFileName = "UlsuNotSmart_X.X.apk"`
3. Version is in TWO places: `app.json` → `version` and `android/app/build.gradle` → `versionName`/`versionCode`.

## Data Pipeline (Excel → JSON)
```
cd "D:\ULSU PROJECT"
python convert_schedule_v2.py
```
- Python 3.12, openpyxl. Excel has 16 sheets (courses 1-5, magistratura, specialists, weeks 1 & 2).
- Sheet structures vary — header rows at 3, 4, or 5. Week 2 detection: sheet names ending `-2` or containing `IIн`.
- Time mapping hardcoded in script (8 pairs: 08:00–20:05).

## Patterns & Gotchas
- `@ts-ignore` used when accessing `scheduleData` keys dynamically — JSON shape isn't fully typed.
- AsyncStorage persists last selected group; going "back" doesn't clear storage (acts as "quick re-select").
- `ScheduleItem.place` holds the full lesson text (subject + teacher + room combined). `subject`/`teacher`/`type` fields exist in the interface but are empty strings — all info is in `place`.
- iOS build scheme auto-derived from workspace name (not "EASClient").
- `src/components/` is empty — all components are co-located in screen files.
- Commit messages use conventional format: `v1.2.0: Short description` with `-m` flags for multi-line (not `\n` literals).
- When amending commits, use `git commit --amend -m "title" -m "bullet1" -m "bullet2"` to avoid escaped `\n`.

