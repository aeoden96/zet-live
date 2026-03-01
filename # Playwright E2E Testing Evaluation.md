# Playwright E2E Testing Evaluation

## 1. Overall Structure & Standards — Good foundation, some gaps

**Strengths:**
- Clean fixture pattern in `fixtures.ts` — onboarding suppression via `localStorage` is idiomatic Playwright
- Well-documented test files with clear `test.describe` blocks and comments explaining selector choices
- Deep-link-driven navigation testing (`?route=1&dir=A&stop=106_1`) is smart for a SPA
- Docker-based execution via `docker-compose.playwright.yml` ensures reproducibility
- Console error monitoring in smoke tests is a solid defensive pattern

**Issues:**
- **E2E tests don't run in CI** — `ci.yml` only runs `tsc`, `lint`, and `knip`. The tests exist but have zero enforcement value
- **Chromium only** — for a mobile-first transit app, missing WebKit (Safari) and mobile viewport testing is a significant blind spot
- **No mobile viewport tests at all** — this is a transit app people use on phones

---

## 2. Mocking — Excellent approach, limited scope

The GTFS-RT mock in `realtime-mock.ts` is notably well-done:
- Uses actual protobuf encoding via `gtfs-realtime-bindings` — tests the real decode pipeline, not a JSON shortcut
- `page.route()` intercepts at network level, which is the correct Playwright pattern
- Registered before `page.goto()` to catch the first poll cycle

**What's missing:**
- **Static GTFS data is not mocked** — tests depend on real files in `public/data/`. If GTFS data updates change stop names or route descriptions, tests break for non-functional reasons
- **Only 2 tests use the realtime mock** — the mock infrastructure exists but is underutilized. No tests verify that vehicle markers actually appear on the map, or that the stop panel shows approaching vehicles
- **No error response mocking** — no test simulates a 500, timeout, or malformed protobuf to verify error handling/fallback UI
- **No geolocation mock** — the "Moja lokacija" button and `NearbyStopsModal` are untestable without `page.context().setGeolocation()`

---

## 3. Test Rigor — Shallow for a map-centric app

**32 tests** across 5 spec files. Coverage breakdown:

| Area | Tests | Depth |
|------|-------|-------|
| Smoke/boot | 5 | Solid — title, errors, shell presence |
| Navigation/routing | 10 | Adequate — all 4 modes + settings page |
| Search | 5 | Good — open, filter, type, select |
| Realtime feed | 2 | Minimal — only badge presence, no marker verification |
| Route/stop info | 10 | Good for happy path, no edge cases |

**Key rigor gaps:**

1. **No map interaction tests** — the core feature. No test clicks a stop on the map, verifies markers render, checks polylines, or tests zoom behavior
2. **No negative/error path tests** — what happens when data fails to load? When the realtime feed returns errors? When a deep link has an invalid stop ID?
3. **No behavioral tests for buttons** — "Obriši predmemoriju" existence is tested but clicking it is not; same for direction toggle, theme toggle
4. **Cycling/city modes are smoke-only** — URL check + no errors, zero content assertions for cycling mode
5. **No service alerts testing** — `ServiceAlerts` component has no test coverage
6. **No onboarding flow test** — the wizard is suppressed everywhere; no test verifies it works for first-time users
7. **Timetable content not verified** — the "Red vožnje" tab click is tested but actual departure times are never asserted

---

## 4. Screenshot Testing — Yes, but conditionally

**Verdict: Worth adding for specific static-ish components, NOT for map views.**

**Good candidates (deterministic content):**
- Settings page — fully static, no map dependency
- Search modal with route list — driven by static GTFS data
- Route info bar — small, predictable component
- Stop info panel — controlled content
- Onboarding wizard steps — static content per step

**Bad candidates (flaky by nature):**
- Map views — tile loading order, network timing, and Leaflet rendering differences across runs make these extremely flaky
- Vehicle markers — depend on mocked positions + map zoom state
- Any view with animated transitions

**Prerequisites before adding screenshots:**
1. **E2E must run in CI first** — without CI enforcement, screenshots become stale and nobody notices
2. Use `toHaveScreenshot({ maxDiffPixelRatio: 0.01 })` with a tolerance threshold
3. Mask or clip out the map tile area in any screenshot that includes it
4. Store snapshots in `tests-e2e/__screenshots__/` (committed to repo — this is standard Playwright practice)
5. Add an `--update-snapshots` script for intentional UI changes

**Repo size concern:** Screenshot PNGs are typically 20–100 KB each. For ~10–15 screenshots, that's 0.5–2 MB — negligible for a repo that already has GeoJSON files.

---

## Improvement Priorities

| Priority | Issue | Impact |
|----------|-------|--------|
| **Critical** | E2E tests not in CI | Tests have zero enforcement value today |
| **High** | No mobile viewport testing | Core audience uses phones |
| **High** | No map interaction tests | Core feature entirely untested at E2E level |
| **Medium** | Static data coupling | GTFS data updates can cause false failures |
| **Medium** | No error path testing | Only happy paths covered |
| **Medium** | Realtime mock underutilized | 2 tests for the app's headline feature |
| **Low** | Screenshot testing | Valuable but depends on CI being set up first |
| **Low** | Cross-browser (WebKit) | Nice to have for Safari mobile users |