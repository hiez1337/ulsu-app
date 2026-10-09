# Visual and Functional Design Specification: ULSU Schedule Application

This document defines the mobile design specification for the ULSU schedule mobile application.
The implementation targets React Native with Expo SDK 54, Apple iOS 18 design conventions, and Apple Human Interface Guidelines (HIG).

---

## 1. Design System Tokens & Semantic Constants

The design system implements pure OLED black aesthetics, high-contrast surfaces, and iOS semantic color accents.

| Token Name | Hex / RGBA Value | WCAG Ratio | Semantic Usage |
|:---|:---|:---|:---|
| `theme.bg` | `#000000` | 21:1 | OLED Pitch Black canvas |
| `theme.bgSecondary` | `#1C1C1E` | 14.2:1 | Elevated card surfaces and list modules |
| `theme.bgTertiary` | `#2C2C2E` | 10.5:1 | Segmented controls and pressed item states |
| `theme.textPrimary` | `#FFFFFF` | 21:1 | Primary titles and subject headings |
| `theme.textSecondary` | `rgba(235, 235, 245, 0.60)` | 9.8:1 | Subtitles, time ranges, and teacher metadata |
| `theme.textTertiary` | `rgba(235, 235, 245, 0.30)` | 4.6:1 | Chevrons and inactive week indicator dots |
| `theme.accent` | `#0A84FF` | 5.2:1 | Apple Blue, lecture badge, active selection |
| `theme.success` | `#30D158` | 4.8:1 | Apple Green, laboratory badge, live timer |
| `theme.warning` | `#FF9F0A` | 6.1:1 | Apple Orange, seminar badge, practice classes |
| `theme.purple` | `#BF5AF2` | 4.9:1 | Colloquium and special mathematics courses |
| `theme.error` | `#FF453A` | 4.7:1 | Occupied classroom indicator |
| `theme.separator` | `rgba(84, 84, 88, 0.35)` | N/A | Table row divider borders |

### Typography Scale (Apple SF Pro)
- **Large Title**: 34pt, SemiBold / Bold, -0.4px letter spacing.
- **Title 2**: 22pt, Bold, -0.3px letter spacing.
- **Headline**: 17pt, SemiBold, -0.4px letter spacing.
- **Body**: 17pt, Regular, -0.4px letter spacing.
- **Subheadline**: 15pt, Regular, -0.2px letter spacing.
- **Footnote / Caption**: 12pt–13pt, Regular / Medium, 0px letter spacing.

### Touch Target Standard
- Minimum interactive touch target dimension is **44×44 pt** across all touchable surfaces.
- Segmented pills implement an internal target area of 44×44 pt via hitSlop and touch container wrappers.

---

## 2. Screen 1: GroupSelectionScreen (3-Level Navigation Hierarchy)

### Problem Statement & Bug Resolution
Previous implementations collapsed Course and Group selection into a single flat transition.
When a course contained multiple groups (for example, `ПМ-О-26/1` and `ПМ-О-26/2`), the selector assigned `groups[0]` automatically.
The updated architecture provides an explicit 3-level hierarchy:
1. **Level 1**: Direction (Direction code and full faculty name).
2. **Level 2**: Course (Segmented course pills: 1, 2, 3, 4).
3. **Level 3**: Group (Discrete selection tiles for every registered group in the selected course).

### Visual Layout Structure
1. Sticky Header with `BlurView`:
   - Top label: `ФМИАТ • УлГУ`.
   - Large Title: `Выбор группы`.
2. Level 1 Section (`1. Направление`):
   - Vertical card collection for academic directions (`ПМ`, `ИС`, `АС`, `ИБ`).
   - Selected direction displays an `#0A84FF` border and checkmark indicator.
3. Level 2 Section (`2. Курс обучения`):
   - Horizontal segmented control with options: `1 курс`, `2 курс`, `3 курс`, `4 курс`.
   - Pill height: 36pt, minimum touch target: 44pt.
4. Level 3 Section (`3. Группа`):
   - Multi-column group grid containing discrete tiles (`ПМ-О-26/1`, `ПМ-О-26/2`).
   - Card metadata displays student count and academic shift.
5. Bottom Action:
   - Primary button: `Открыть расписание` (Gradient `#0A84FF` to `#5E5CE6`, 48pt height).

---

## 3. Screen 2: ScheduleScreen (Daily View & Real-Time Engine)

### Component Architecture
1. Header Module:
   - Top row displays active group badge (`ПМ-О-26/1`) and Week parity toggle (`1 Неделя` / `2 Нед.`).
   - Date headline displays active day and month (`Вторник, 13 окт`).
2. Subgroup Filter Segment:
   - Segmented control options: `Все (4)`, `1 подгруппа`, `2 подгруппа`.
   - Filter filters schedule items in real time without screen reload.
3. Horizontal Calendar Carousel:
   - 6-day capsule strip (Monday through Saturday).
   - Each capsule contains day abbreviation, date number, and study load dot indicator.
4. Lesson Card Elements:
   - Pair index and time window (`09:30 – 10:50 • 2 пара`).
   - Type badge with semantic background (`badge-lab` for laboratory, `badge-sem` for seminar, `badge-lec` for lecture).
   - Subject title in bold SF Pro font.
   - Teacher avatar chip with initials (`НН` for Н.Н. Нечаева, `СИ` for И.А. Санников).
   - Classroom location tag (`ауд. 3/118`).
5. Live Progress Bar Component:
   - The card activates when current time falls within lesson duration.
   - Header badge shows remaining duration (`Идет пара (35м)`).
   - Progress fill bar animates dynamically using cubic easing.

---

## 4. Screen 3: WeeklyGridScreen (Weekly Matrix Grid)

### Component Architecture
1. High-Density Overview:
   - Renders complete 6-day study program in a unified compact layout.
   - Eliminates excessive vertical scrolling.
2. Day Matrix Groups:
   - **Понедельник**: `#0A84FF` left accent border, 3 lessons (Алгебра и геометрия, Информатика, Python).
   - **Вторник**: `#30D158` left accent border, 4 lessons (Информатика, 1С: Предприятие, Матанализ, Информатика).
   - **Среда**: `#FF9F0A` left accent border, 3 lessons (Дискретная математика, Алгебра и геометрия, Матанализ).
   - **Четверг**: `#BF5AF2` left accent border, 3 lessons (Физкультура, Аппаратные средства, История России).
   - **Пятница**: `#FF453A` left accent border, 2 lessons (Аппаратные средства, Математический анализ).
   - **Суббота**: `#FFD60A` left accent border, 2 lessons (Русский язык).
3. Metrics & Badges:
   - Each day header displays pair counter badge (for example, `4 пары`).
   - Lesson rows display lesson index, subject name, and room number.

---

## 5. Screen 4: LessonDetailSheet (Modal Bottom Sheet + Dynamic Island)

### Component Architecture
1. Dynamic Island Activity Module:
   - Top pill banner represents iOS Dynamic Island Live Activity.
   - Left side: Pulsing status dot and lesson badge (`● 1С: Лаб • ауд. 3/118`).
   - Right side: Countdown timer (`28м ост.`).
2. Bottom Sheet Container:
   - Surface background: `#1C1C1E`.
   - Top handle pill dimensions: 26×3 pt with `#3A3A3C` fill.
3. Content Modules:
   - **Lesson Header**: Type badge (`Лабораторная работа`) and timing badge (`2 пара • 09:30–10:50`).
   - **Teacher Bio Card**: Avatar chip, full name (`Нечаева Надежда Николаевна`), academic title (`Доцент кафедры информационных технологий`).
   - **Location Card**: Classroom `3/118`, building `Корпус 3`, floor navigation details.
   - **Subgroup Card**: Assigned subgroup (`1 подгруппа`) with cross-subgroup classroom reference (`2 подгруппа: ауд. 505`).
   - **Homework Task Checklist**: Interactive checkbox list for student laboratory tasks.
   - **Student Note Card**: Personal editable student notes with persistence in `AsyncStorage`.

---

## 6. Screen 5: SearchScreen (Directory & Free Room Finder)

### Component Architecture
1. Search Bar Module:
   - Apple iOS search input with magnifying glass icon and instant clear button.
   - Real-time text filter with 250ms debouncing.
2. Category Filter Chips:
   - Horizontal pill filters: `Все`, `Преподаватели`, `Аудитории`, `Свободные`.
   - 44×44 pt touch targets with active blue highlight.
3. Teacher Directory Results:
   - `Санников И.А.` — Доцент каф. ИТ, лек. 332, лаб. 601.
   - `Нечаева Н.Н.` — Доцент каф. ИТ, лаб. 3/118.
   - `Фролова Ю.Ю.` — Доцент каф. алгебры и геометрии, ауд. 417.
   - Direct button to navigate to teacher schedule.
4. Live Free Room Finder (Slot 10:00):
   - `3/211` — Status: `СВОБОДНА` (Green badge `#30D158`, free until 14:05).
   - `3/420` — Status: `СВОБОДНА` (Green badge `#30D158`, free until 12:45).
   - `332` — Status: `ЗАНЯТА` (Red badge `#FF453A`, Lecture by Санников И.А.).
   - `3/118` — Status: `ЗАНЯТА` (Red badge `#FF453A`, Lab by Нечаева Н.Н.).

---

## 7. Screen 6: SettingsScreen (Preferences & Notifications)

### Component Architecture
1. Grouped iOS Card Structure:
   - Section 1: **Оформление (Appearance)**:
     - Theme toggle: `OLED Pure Black` (`#000000`) vs `Charcoal Dark` (`#1C1C1E`).
     - Accent color indicator: Sapphire Blue (`#0A84FF`).
   - Section 2: **Расписание (Schedule Preferences)**:
     - Default subgroup control: `Все` / `1п` / `2п`.
     - Automatic week parity detection: iOS toggle switch (`#30D158`).
   - Section 3: **Уведомления (Notifications)**:
     - 15-minute lesson reminder alert: iOS toggle switch.
     - Sound selector: `Тритон ›`.
   - Section 4: **Система (System & Cache)**:
     - Offline cache status: `● Активен (42 КБ)`.
     - Manual database refresh action button.
     - Application version display: `v1.3.0 (Build 2026.10)`.
