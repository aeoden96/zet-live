# Functional Requirements — Feasibility Analysis

> **See [DATA_INDEX.md](DATA_INDEX.md) for complete data structure reference.**

Analysis of functional requirements against optimized data organization.

**Legend:** 🟢 Easy | 🟡 Moderate | 🔴 Impossible (requires external API)

---

## Requirements Summary

| ID | Requirement | Status | Fetch Size | Index Used |
|----|-------------|--------|------------|------------|
| **A1** | Route numbers at stop | 🟢 Easy | 3 KB | `stops/{id}.json` |
| **A2** | Timetable at stop | 🟢 Easy | 30 KB avg | `stop_timetables/{id}.json` |
| **A3** | Draw routes at stop | 🟡 Moderate | 30 KB (N×10) | `shapes/{id}.json` |
| **B1** | Vehicle positions (estimated) | 🟢 Easy | 72 KB avg | `route_active_trips/{id}.json` |
| **B2** | Stops on route | 🟢 Easy | 320 bytes | `route_stops/{id}.json` |

---

## A. Stop Requirements

### A1: Route Numbers at Stop
**Fetch:** `stops/98_1.json` (3 KB)
```typescript
const { routes } = await fetch(`/data/stops/98_1.json`).then(r => r.json());
// Returns: ["6", "11", "31"]
```

### A2: Timetable at Stop
**Fetch:** `stop_timetables/98_1.json` (30 KB avg, 115 KB max)  
**Optimization:** 82% reduction vs fetching all route timetables (570 KB → 100 KB)
```typescript
const stopTimetable = await fetch(`/data/stop_timetables/98_1.json`).then(r => r.json());
// Returns: { route_id: { trip_id: { time, sequence } } }
```

### A3: Draw Routes Passing Through Stop
**Fetch:** Multiple `shapes/{route_id}.json` files (10 KB each)  
**Total:** N routes × 10 KB (~30 KB for typical stop)
```typescript
const { routes } = await fetch(`/data/stops/98_1.json`).then(r => r.json());
const shapes = await Promise.all(
  routes.map(id => fetch(`/data/shapes/${id}.json`).then(r => r.json()))
);
```

---

## B. Route Requirements

### B1: Vehicle Positions (Schedule-Based Estimation)
**Fetch:** `route_active_trips/6.json` (72 KB avg, 285 KB max)  
**Optimization:** 76% reduction vs separate fetches (1,200 KB → 280 KB)

**⚠️ Limitations:**
- Schedule-based only (no real GPS)
- Ignores delays, traffic, disruptions
- Assumes linear progress between stops

**✅ Advantages:**
- Works offline
- Shows service frequency/distribution
- Single fetch includes trips + shapes

```typescript
async function estimateVehicles(routeId: string) {
  const { trips, shapes } = await fetch(`/data/route_active_trips/${routeId}.json`)
    .then(r => r.json());
  
  const now = new Date().getHours() * 60 + new Date().getMinutes();
  
  return trips
    .filter(t => now >= t.start && now <= t.end)
    .map(t => ({
      tripId: t.id,
      headsign: t.headsign,
      progress: (now - t.start) / (t.end - t.start),
      position: shapes[t.shapeId][Math.floor(progress * shapes[t.shapeId].length)]
    }));
}
```

**For real-time tracking:** Use ZET GTFS-Realtime API (if available):
- `https://www.zet.hr/gtfs-realtime/vehicle-positions`
- `https://www.zet.hr/gtfs-realtime/trip-updates`

### B2: Stops on Route
**Fetch:** `route_stops/6.json` (320 bytes avg, 725 bytes max)  
**Optimization:** 99.7% reduction vs full timetable (190 KB → 320 B)
```typescript
const { stops } = await fetch(`/data/route_stops/6.json`).then(r => r.json());
// Returns: ["100_1", "100_2", "101_1", ..., "274_2"]
stops.forEach(stopId => highlightStop(stopId));
```

---

## Performance Summary

| Requirement | Baseline | Optimized | Savings |
|-------------|----------|-----------|---------|
| **A2** Timetable at stop | 570 KB | 100 KB | 82% |
| **B1** Vehicle positions | 1,200 KB | 280 KB | 76% |
| **B2** Stops on route | 190 KB | 320 B | 99.7% |

**Total optimized interaction:** ~560 KB (vs ~720 KB baseline, 22% savings)

---

## Implementation Status

**✅ All requirements implemented** with optimized indexes:
- `route_stops/` — 155 files, 320 B avg
- `stop_timetables/` — 2,545 files, 30 KB avg
- `route_active_trips/` — 155 files, 72 KB avg

**Data output:** 131.4 MB (5,862 files, ~30 MB gzipped)
