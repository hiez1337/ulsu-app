# Project Specification: Production Reliability Audit & Release Preparation

## 1. Scope
Perform a comprehensive reliability audit, production configuration, and quality assurance gate for the ULSU Mobile Schedule Application (`ulsu-app`).

## 2. Milestones
- **M1: Fan-Out Adversarial Review Panel**: Run 3 parallel background review subagents:
  - Challenger: Offline capability, empty state handling, and persistence.
  - UI Inspector: Apple HIG adherence, OLED contrast, touch target dimensions ($\ge 44 \times 44$ pt).
  - Performance Auditor: Virtualization/list performance, memory leaks, hook cleanup, bundle size.
- **M2: Worker Remediation & Production Configuration**:
  - Update `app.json` for production (display name, slug, bundleId, orientation, icons, splash).
  - Remediate all issues identified by M1 reviewers.
- **M3: Victory Gate Audit**:
  - Independent verification of TypeScript types (`npx tsc --noEmit`).
  - Independent verification of production web build (`npx expo export -p web`).
  - Execution of 5-component handoff report.
  - Binary gate decision (`CLEAN` / `VETO`).

## 3. Acceptance Criteria
- **AC1**: Complete offline capability without network dependency during startup or browsing.
- **AC2**: 100% adherence to Apple HIG touch target standard ($\ge 44 \times 44$ pt) across all components.
- **AC3**: Zero memory leaks or active uncleared intervals in lifecycle hooks.
- **AC4**: Production-ready metadata in `app.json` for iOS/Android/Web.
- **AC5**: 0 TypeScript compilation errors (`tsc --noEmit`).
- **AC6**: 0 build errors during `expo export -p web`.
- **AC7**: Binary verdict of `CLEAN` from Victory Auditor.
