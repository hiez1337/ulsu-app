# UlsuNotSmart — Copilot Instructions

## Project Overview
Mobile university schedule app for ULSU (Ulyanovsk State University). Displays class schedules parsed from an Excel file (`Vesna2025_2026.xlsx`). Built with **Expo (React Native)** + **TypeScript**, dark Apple-style UI.

## Architecture & Data Flow
```
Excel (.xlsx) → convert_schedule_v2.py → schedule.json → App.tsx → Screens
```
- **No backend/API** — all data is static JSON bundled into the app
- `convert_schedule_v2.py` (openpyxl) parses Excel with auto-detection of header rows and group columns via regex `^[А-ЯA-Z]{2,}-[А-ЯA-Z]-\d{2}/\d`
- `src/data/schedule.json` structure: `{ Category → Course → GroupName → Week("1"|"2") → Day → [{num, time, text}] }`
- `App.tsx` is the root — manages navigation state, week toggle, and group persistence via AsyncStorage

## Key Files
- `App.tsx` — Entry point, state management, screen routing (no react-navigation)
- `src/screens/GroupSelectionScreen.tsx` — 2-level selection: direction → course (auto-selects group)
- `src/screens/ScheduleScreen.tsx` — Schedule display with week 1/2 toggle
- `src/theme.ts` — Centralized Apple dark theme tokens (all colors, spacing, shadows)
- `src/api/parser.ts` — TypeScript interfaces only (`ScheduleItem`, `DaySchedule`)
- `src/data/schedule.json` — Pre-generated schedule data (37 groups, ~6700 lines)

## Design Conventions
- **Dark theme only** — pure black (`#000000`) background, iOS system colors
- All colors/spacing come from `theme.ts` — never use hardcoded colors in components
- Apple HIG-inspired: large titles, card-based layouts, SF-style icons via `@expo/vector-icons` (Ionicons)
- `expo-linear-gradient` for subtle card gradients
- Translucent separators: `rgba(84, 84, 88, 0.35)`

## Build & Deploy
| Platform | Command | Notes |
|----------|---------|-------|
| Web (dev) | `npx expo start --web` | http://localhost:8081 |
| Android APK (local) | `$env:JAVA_HOME="C:\Program Files\Java\jdk-17"; cd android; .\gradlew.bat assembleRelease` | Requires `npx expo prebuild --platform android` first |
| iOS IPA | GitHub Actions → `Build iOS IPA (unsigned)` workflow | Uses `CODE_SIGNING_ALLOWED=NO`, install via AltStore/Sideloadly |
| OTA update | `eas update --branch preview --message "description"` | Updates Expo Go without rebuild |

## Data Pipeline (Excel → JSON)
When schedule Excel changes, regenerate JSON:
```
cd "D:\ULSU PROJECT"
python convert_schedule_v2.py
```
- Python 3.12 at `C:/Users/Ak417ytrfg/AppData/Local/Programs/Python/Python312/python.exe`
- Excel has 16 sheets (courses 1-5, magistratura, specialists, weeks 1 & 2)
- Sheet structures vary — header rows at row 3, 4, or 5 depending on sheet
- Week type detection: sheet names ending in `-2` or containing `IIн` = week 2

## Auto Week Detection (`src/utils/weekDetector.ts`)
- Sept 1 is always week "1"; weeks alternate 1→2→1→2 continuously (no reset between semesters)
- Reference point: Monday of the week containing Sept 1 of the current academic year
- `getCurrentWeekType()` — returns `"1"` or `"2"` for today; used to initialize `weekType` state
- `getTodayDayIndex()` — returns 0=Mon…5=Sat, 6=Sun; used to highlight today's card in ScheduleScreen
- Academic year: month ≥ Sep → current year, else previous year
- Manual toggle remains available as override

## Patterns & Gotchas
- Navigation is manual state-based (`currentGroup` state), not react-navigation
- `@ts-ignore` is used when accessing `scheduleData` keys dynamically — JSON shape isn't fully typed
- AsyncStorage persists last selected group across launches; going "back" doesn't clear storage
- Time mapping is hardcoded in `convert_schedule_v2.py` (8 pairs: 08:00–20:05)
- iOS build scheme must be `UlsuNotSmart` (from workspace name), not `EASClient`
- Language is Russian throughout the UI — keep all user-facing strings in Russian
- Today's schedule card has an accent border and "Сегодня" badge; list auto-scrolls to it
