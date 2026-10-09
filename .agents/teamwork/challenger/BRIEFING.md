# Briefing for Subagent: Challenger

## Role Objective
Perform adversarial stress-testing and edge-case probing on the ULSU Schedule application.

## Test Areas
1. **Network Absence & Offline Operation**:
   - Inspect data loading in `App.tsx` and `src/utils/scheduleUtils.ts`.
   - Verify fallback mechanism when remote HTTP requests fail or network is unavailable.
2. **Persistence Integrity (AsyncStorage)**:
   - Verify serialization/deserialization for selected group, subgroup, and theme mode.
   - Test behavior when storage keys contain invalid, null, or corrupted data.
3. **Empty States & Weekday Boundaries**:
   - Verify day carousel when selected day has zero lessons (Sunday, free weekday).
   - Verify subgroup filter combinations resulting in zero lessons.
   - Check week parity toggle consistency between Week 1 and Week 2.
   - Verify auto-detection boundary logic in `src/utils/weekDetector.ts`.

## Constraints
- Prohibited: Do NOT modify production source code.
- Required: Record results in `.agents/teamwork/challenger/handoff.md` following the 5-component protocol:
  1. Observation
  2. Logic Chain
  3. Caveats
  4. Conclusion
  5. Verification Method
