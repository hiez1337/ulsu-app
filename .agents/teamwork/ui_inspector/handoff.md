# UI/UX and Apple HIG Inspection Report

- **Auditor Role**: UI/UX & Apple HIG Inspector
- **Audit Date**: 2026-10-09
- **Target Application**: ULSU Schedule Mobile Application
- **Verdict**: REQUEST_CHANGES

---

## 1. Observation

This audit evaluates the application against Apple Human Interface Guidelines and OLED dark mode specifications.
The inspection covers seven components:
- `src/components/Navigation.tsx`
- `src/screens/ScheduleScreen.tsx`
- `src/screens/WeeklyGridScreen.tsx`
- `src/screens/SearchScreen.tsx`
- `src/screens/SettingsScreen.tsx`
- `src/screens/GroupSelectionScreen.tsx`
- `src/components/LessonDetailSheet.tsx`

### Table 1: Touch Target Measurement Summary

| Component File | Interactive Element | Measured Size (pt) | HitSlop Applied | Effective Target (pt) | Apple HIG Standard | Compliance Status |
|:---|:---|:---|:---|:---|:---|:---|
| `Navigation.tsx` (line 117) | `tabButton` | $44 \times 44$ | 6 pt all sides | $56 \times 56$ | $\ge 44 \times 44$ pt | PASS |
| `ScheduleScreen.tsx` (line 385) | `groupBadge` | $100 \times 36$ | 6 pt all sides | $112 \times 48$ | $\ge 44 \times 44$ pt | PASS |
| `ScheduleScreen.tsx` (line 413) | `weekSwitcherBtn` | $70 \times 30$ | top/bottom: 6 pt | $78 \times 42$ | $\ge 44 \times 44$ pt | **FAIL** (-2 pt) |
| `ScheduleScreen.tsx` (line 475) | `subgroupPill` | $110 \times 34$ | top/bottom: 6 pt | $118 \times 46$ | $\ge 44 \times 44$ pt | PASS |
| `ScheduleScreen.tsx` (line 538) | `dayCapsule` | $54 \times 56$ | None | $54 \times 56$ | $\ge 44 \times 44$ pt | PASS |
| `WeeklyGridScreen.tsx` (line 153) | `backButton` | $60 \times 44$ | 10 pt all sides | $80 \times 64$ | $\ge 44 \times 44$ pt | PASS |
| `WeeklyGridScreen.tsx` (line 173) | `weekToggleBtn` | $65 \times 28$ | 8 pt all sides | $81 \times 44$ | $\ge 44 \times 44$ pt | PASS |
| `WeeklyGridScreen.tsx` (line 230) | `lessonRow` | $335 \times 44$ | None | $335 \times 44$ | $\ge 44 \times 44$ pt | PASS |
| `SearchScreen.tsx` (line 300) | `backButton` | $60 \times 44$ | 10 pt all sides | $80 \times 64$ | $\ge 44 \times 44$ pt | PASS |
| `SearchScreen.tsx` (line 333) | `clearBtn` | $22 \times 22$ | 10 pt all sides | $42 \times 42$ | $\ge 44 \times 44$ pt | **FAIL** (-2 pt) |
| `SearchScreen.tsx` (line 348) | `filterPill` | $80 \times 32$ | top/bottom: 6 pt | $88 \times 44$ | $\ge 44 \times 44$ pt | PASS |
| `SearchScreen.tsx` (line 550) | `modalCloseBtn` | $36 \times 36$ | 10 pt all sides | $56 \times 56$ | $\ge 44 \times 44$ pt | PASS |
| `SearchScreen.tsx` (line 562) | `modalWeekBtn` | $95 \times 29$ | None | $95 \times 29$ | $\ge 44 \times 44$ pt | **FAIL** (-15 pt) |
| `SettingsScreen.tsx` (line 253) | `segBtn` | $70 \times 28$ | top/bottom: 8 pt | $82 \times 44$ | $\ge 44 \times 44$ pt | PASS |
| `SettingsScreen.tsx` (line 331) | `segBtnSmall` | $43.3 \times 28$ | 8 pt V, 6 pt H | $55.3 \times 44$ | $\ge 44 \times 44$ pt | PASS |
| `SettingsScreen.tsx` (line 474) | `settingsRow` | $335 \times 48$ | None | $335 \times 48$ | $\ge 44 \times 44$ pt | PASS |
| `GroupSelectionScreen.tsx` (line 323) | `dirCard` | $335 \times 58$ | None | $335 \times 58$ | $\ge 44 \times 44$ pt | PASS |
| `GroupSelectionScreen.tsx` (line 405) | `segBtn` | $80 \times 38$ | top/bottom: 5 pt | $86 \times 48$ | $\ge 44 \times 44$ pt | PASS |
| `GroupSelectionScreen.tsx` (line 447) | `groupChip` | $160 \times 64$ | None | $160 \times 64$ | $\ge 44 \times 44$ pt | PASS |
| `GroupSelectionScreen.tsx` (line 499) | `primaryBtn` | $335 \times 50$ | None | $335 \times 50$ | $\ge 44 \times 44$ pt | PASS |
| `LessonDetailSheet.tsx` (line 393) | `closeButton` | $30 \times 30$ | 10 pt all sides | $50 \times 50$ | $\ge 44 \times 44$ pt | PASS |
| `LessonDetailSheet.tsx` (line 497) | `taskCheckboxTouch` | $280 \times 44$ | None | $280 \times 44$ | $\ge 44 \times 44$ pt | PASS |
| `LessonDetailSheet.tsx` (line 516) | `taskDeleteTouch` | $44 \times 44$ | 8 pt all sides | $60 \times 60$ | $\ge 44 \times 44$ pt | PASS |
| `LessonDetailSheet.tsx` (line 545) | `addButton` | $44 \times 44$ | None | $44 \times 44$ | $\ge 44 \times 44$ pt | PASS |

### Table 2: OLED Theme and Background Surfaces

| File Path | Component Element | Configured Color | Prescribed HIG Token | Evaluation Status |
|:---|:---|:---|:---|:---|
| `App.tsx` (line 228) | Root Container | `#000000` | True OLED Black (`#000000`) | PASS |
| `Navigation.tsx` (line 56) | `FALLBACK_BG` | `rgba(20, 20, 22, 0.95)` | `theme.bgSecondary` (`#1C1C1E`) | MINOR MISMATCH |
| `ScheduleScreen.tsx` (line 742) | Screen Canvas | `theme.bg` (`#000000`) | True OLED Black (`#000000`) | PASS |
| `ScheduleScreen.tsx` (line 923) | `lessonCard` | `theme.bgCard` (`#1C1C1E`) | Elevated Card (`#1C1C1E`) | PASS |
| `WeeklyGridScreen.tsx` (line 413) | `dayCard` | `theme.bgSecondary` (`#1C1C1E`) | Elevated Card (`#1C1C1E`) | PASS |
| `SearchScreen.tsx` (line 817) | `filterSegment` | `rgba(255, 255, 255, 0.05)` | `theme.bgTertiary` (`#2C2C2E`) | DISCREPANCY |
| `SearchScreen.tsx` (line 1019) | `modalSheet` | `#1C1C1E` | Elevated Card (`#1C1C1E`) | PASS |
| `SearchScreen.tsx` (line 1135) | `modalEntriesContainer` | `#2C2C2E` | Secondary Group (`#2C2C2E`) | PASS |
| `SettingsScreen.tsx` (line 629) | `settingsGroup` | `theme.bgSecondary` (`#1C1C1E`) | Elevated Group (`#1C1C1E`) | PASS |
| `SettingsScreen.tsx` (line 669) | `segControlTheme` | `rgba(255, 255, 255, 0.08)` | `theme.bgTertiary` (`#2C2C2E`) | DISCREPANCY |
| `LessonDetailSheet.tsx` (line 582) | `sheetContainer` | `#1C1C1E` (Hardcoded) | `theme.bgSecondary` (`#1C1C1E`) | HARDCODED TOKEN |
| `LessonDetailSheet.tsx` (line 668) | `card` | `#2C2C2E` (Hardcoded) | `theme.bgTertiary` (`#2C2C2E`) | HARDCODED TOKEN |

### Table 3: Typography and Text Contrast Findings

| File Path | Line | Text Element | Size / Style | Color Token | Contrast Ratio | WCAG 2.1 AA Threshold |
|:---|:---|:---|:---|:---|:---|:---|
| `GroupSelectionScreen.tsx` | 564 | `headerLarge` | 34 pt, Bold | `theme.textPrimary` (`#FFF`) | 21.0:1 | PASS ($\ge 3.0:1$) |
| `WeeklyGridScreen.tsx` | 393 | `largeTitle` | 28 pt, Bold | `theme.textPrimary` (`#FFF`) | 21.0:1 | PASS (Misnamed Scale) |
| `WeeklyGridScreen.tsx` | 509 | `lessonTypeText` | 11 pt, Regular | `theme.textTertiary` (30% white) | 3.4:1 | **FAIL** ($< 4.5:1$) |
| `SearchScreen.tsx` | 866 | `sectionCountBadge` | 11 pt, Regular | `theme.textTertiary` (30% white) | 3.4:1 | **FAIL** ($< 4.5:1$) |
| `SearchScreen.tsx` | 916 | `teacherCount` | 10 pt, Regular | `theme.textTertiary` (30% white) | 3.4:1 | **FAIL** ($< 4.5:1$) |
| `SettingsScreen.tsx` | 663 | `rowSubtitle` | 11 pt, Regular | `theme.textTertiary` (30% white) | 3.4:1 | **FAIL** ($< 4.5:1$) |
| `LessonDetailSheet.tsx` | 655 | `timeText` | 13 pt, Medium | `#8E8E93` (Hardcoded) | 4.8:1 | PASS (Hardcoded Token) |

### Table 4: Safe Area Insets and Responsive Layout Findings

| Component | Safe Area Hook Implementation | Top Notch / Dynamic Island Handling | Home Indicator Handling | Tablet / Desktop Modal Presentation |
|:---|:---|:---|:---|:---|
| `Navigation.tsx` | `useSafeAreaInsets` | N/A (Bottom bar) | `Math.max(insets.bottom, 8)` | Clamped to `maxWidth: 680` |
| `ScheduleScreen.tsx` | `useSafeAreaInsets` | `insets.top + (iOS ? 8 : 14)` | `insets.bottom + 80` in scroll list | Clamped by `appWrapper` (`maxWidth: 720`) |
| `WeeklyGridScreen.tsx` | `useSafeAreaInsets` | `paddingTop: insets.top` | `insets.bottom + 80` in scroll list | Clamped by `appWrapper` (`maxWidth: 720`) |
| `SearchScreen.tsx` | `useSafeAreaInsets` | `paddingTop: insets.top` | `insets.bottom + 80` in scroll list | Modal sheet adapts at 768 px breakpoint |
| `SettingsScreen.tsx` | `useSafeAreaInsets` | `paddingTop: insets.top` | `insets.bottom + 80` in scroll list | Clamped by `appWrapper` (`maxWidth: 720`) |
| `GroupSelectionScreen.tsx` | `useSafeAreaInsets` | `insets.top + (iOS ? 12 : 20)` | `Math.max(insets.bottom, 16)` | Bottom bar pinned with safe area |
| `LessonDetailSheet.tsx` | `useSafeAreaInsets` | N/A (Sheet presentation) | `Math.max(insets.bottom, 20)` | Centers floating dialog at 640 px breakpoint |

---

## 2. Logic Chain

### 2.1 Touch Target Standard (Apple HIG)
Apple Human Interface Guidelines mandate a minimum interactive target size of $44 \times 44$ pt.
Small touch targets cause tap failure and user frustration on mobile displays.
The inspector identified three definite touch target violations:
1. `src/screens/SearchScreen.tsx` (lines 562–612):
   - Segmented buttons for week selection (`Все недели`, `1 Неделя`, `2 Неделя`) have 29 pt height.
   - The developer omitted `hitSlop` on these buttons.
   - The effective touch target is 15 pt below the Apple HIG minimum.
2. `src/screens/SearchScreen.tsx` (lines 333–339):
   - The clear button in the search field measures $22 \times 22$ pt.
   - The developer added `hitSlop` of 10 pt.
   - The effective target area is $42 \times 42$ pt, falling 2 pt short of $44 \times 44$ pt.
3. `src/screens/ScheduleScreen.tsx` (lines 401–447):
   - The week switcher buttons measure 30 pt in height.
   - The developer added `hitSlop` of 6 pt on top and bottom.
   - The effective height is 42 pt, which falls 2 pt short of the 44 pt requirement.

### 2.2 Text Contrast Standard (WCAG 2.1 AA & Apple HIG)
Apple HIG requires readable contrast for secondary text:
- Body and content text below 18 pt requires a minimum contrast ratio of 4.5:1.
- The `theme.textTertiary` token (`rgba(235, 235, 245, 0.30)`) provides a 3.4:1 contrast ratio against `#1C1C1E`.
- `WeeklyGridScreen.tsx`, `SearchScreen.tsx`, and `SettingsScreen.tsx` use `theme.textTertiary` on 10 pt and 11 pt text.
- This creates low readability in low-light environments.
- Small informational text must use `theme.textSecondary` (`rgba(235, 235, 245, 0.60)`), which provides a 9.8:1 contrast ratio.

### 2.3 Semantic Design Tokens Decoupling
The file `src/theme.ts` centralizes design constants.
`src/components/LessonDetailSheet.tsx` uses raw hex values:
- `#1C1C1E` instead of `theme.bgSecondary`
- `#2C2C2E` instead of `theme.bgTertiary`
- `#8E8E93` instead of `theme.textSecondary`
This pattern breaks centralized theme modifications.

### 2.4 Missing Specification Feature
Section 5 of `DESIGN_SPECIFICATION.md` specifies a Dynamic Island Activity Module in `LessonDetailSheet.tsx`.
`LessonDetailSheet.tsx` omits this component.
While `ScheduleScreen.tsx` includes a live progress element, `LessonDetailSheet.tsx` lacks the Dynamic Island banner.

---

## 3. Caveats

### Platform Differences
1. **iOS Platform**:
   - `expo-blur` functions with native performance.
   - Native haptics work as expected via `expo-haptics`.
   - `useSafeAreaInsets` correctly supplies home indicator and dynamic island values.
2. **Android Platform**:
   - `BlurView` may decrease frame rates on low-tier GPUs.
   - Android navigation bars require minimum 48 dp touch target compliance.
   - Android hardware back button requires synchronization with modal sheet dismiss handlers.
3. **Web Platform**:
   - `Platform.OS === 'web'` disables haptics.
   - Layout relies on `maxWidth: 720` in `App.tsx` to maintain mobile aspect ratio.
   - Window confirms replace native alert dialogs.

---

## 4. Conclusion

**Verdict**: REQUEST_CHANGES

The application demonstrates strong alignment with Apple dark mode and OLED surfaces.
However, concrete non-compliant touch targets and text contrast failures require remediation.

### Required Changes:
1. In `src/screens/SearchScreen.tsx`:
   - Add `hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}` to `modalWeekBtn` (lines 562–612).
   - Set `minHeight: 38` on `modalWeekBtn` (line 1077).
   - Increase `hitSlop` on `clearBtn` to `12` pt (line 335).
   - Replace `theme.textTertiary` with `theme.textSecondary` on lines 866 and 916.
2. In `src/screens/ScheduleScreen.tsx`:
   - Increase `hitSlop` on `weekSwitcherBtn` to `{{ top: 8, bottom: 8, left: 6, right: 6 }}` (lines 413, 437).
3. In `src/screens/WeeklyGridScreen.tsx`:
   - Replace `theme.textTertiary` with `theme.textSecondary` in `lessonTypeText` (line 509).
4. In `src/screens/SettingsScreen.tsx`:
   - Replace `theme.textTertiary` with `theme.textSecondary` in `rowSubtitle` (line 663).
5. In `src/components/LessonDetailSheet.tsx`:
   - Replace hardcoded color values (`#1C1C1E`, `#2C2C2E`, `#8E8E93`) with imports from `src/theme.ts`.

---

## 5. Verification Method

Follow these procedural steps to verify all remediations:

1. Open `src/screens/SearchScreen.tsx`.
2. Inspect line 1077 for `minHeight: 38` and lines 562–612 for `hitSlop`.
3. Verify that $38 + 8 + 8 = 54 \ge 44$ pt.
4. Inspect line 335 for `hitSlop` of 12 pt ($22 + 24 = 46 \ge 44$ pt).
5. Open `src/screens/ScheduleScreen.tsx`.
6. Inspect lines 413 and 437 for `hitSlop` of 8 pt vertical ($30 + 16 = 46 \ge 44$ pt).
7. Run TypeScript verification:
   ```bash
   npx tsc --noEmit
   ```
8. Run test suite:
   ```bash
   npx ts-node scripts/test_functional_flows.ts
   ```
9. Confirm all checks pass without errors.
