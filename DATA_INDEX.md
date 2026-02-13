# Data Index Reference

Single source of truth for all processed GTFS data structures in `/public/data/`.

**Source:** 114 MB GTFS → 131.4 MB optimized (5,862 files, ~30 MB gzipped)  
**Feed:** ZET Zagreb, v000384, valid Feb 16 2026 - Dec 31 2030

---

## Index Overview

| Index | Files | Avg Size | Purpose | Use Case |
|-------|-------|----------|---------|----------|
| **initial.json** | 1 | 456 KB | App bootstrap | Startup: display map + route list |
| **manifest.json** | 1 | 41 KB | Metadata | Feed version, file catalog |
| **routes/{id}.json** | 155 | 60 KB | Trip metadata | Route details view |
| **timetables/{id}.json** | 155 | 190 KB | Full schedules | Route timetable view |
| **shapes/{id}.json** | 150 | 10 KB | Geographic paths | Draw route on map |
| **stops/{id}.json** | 2,545 | 3 KB | Routes at stop | Stop details panel |
| **route_stops/{id}.json** | 155 | 320 B | Stop list | Highlight route stops |
| **stop_timetables/{id}.json** | 2,545 | 30 KB | Pre-filtered departures | Stop timetable (5x faster) |
| **route_active_trips/{id}.json** | 155 | 72 KB | Trips + shapes | Estimate vehicle positions (76% smaller) |

---

## 1. Initial Load

**File:** `initial.json` (456 KB)

```typescript
{
  feedVersion: "000384",
  validFrom: "2026-02-16",
  validUntil: "2030-12-31",
  stops: [
    {
      stop_id: "264_2",
      name: "Savski most",
      lat: 45.79397,
      lon: 15.96766,
      location_type: 0,
      parent_station: "264"
    }
    // ... 3,829 stops
  ],
  routes: [
    {
      route_id: "6",
      short_name: "6",
      long_name: "Črnomerec - Sopot",
      type: 0  // 0=tram, 3=bus
    }
    // ... 155 routes
  ],
  calendar: {
    "2026-02-16": "0_20",  // service_id for this date
    // ... 119 dates
  }
}
```

**Purpose:** Bootstrap app with all stops/routes for map display

---

## 2. Route Data (3 files per route)

### 2a. routes/{route_id}.json (60 KB avg)

```typescript
{
  trips: [
    {
      trip_id: "0_20_601_6_10001",
      headsign: "Savski gaj-rotor",
      direction_id: 0,
      service_id: "0_20",
      shape_id: "6_2"
    }
    // ... all trips for this route
  ]
}
```

### 2b. timetables/{route_id}.json (190 KB avg)

```typescript
{
  "0_20_601_6_10001": [
    ["264_2", 1, 236],  // [stop_id, sequence, time_in_minutes]
    ["222_2", 2, 238],
    // ... all stops for this trip
  ]
  // ... all trips
}
```

### 2c. shapes/{route_id}.json (10 KB avg)

```typescript
{
  "6_2": [
    [45.77769, 15.98681],  // [lat, lon]
    [45.7777, 15.98697],
    // ... polyline points
  ]
  // ... all shape variants
}
```

---

## 3. Stop Data (2 files per stop)

### 3a. stops/{stop_id}.json (3 KB avg)

```typescript
{
  routes: ["6", "11", "31"],  // routes serving this stop
  departures: {
    "0_20": {  // service_id (weekdays)
      "6": [236, 264, 292],  // departure times in minutes
      "11": [240, 268, 296]
    },
    "0_21": { /* Saturdays */ },
    "0_22": { /* Sundays */ }
  }
}
```

### 3b. stop_timetables/{stop_id}.json (30 KB avg)

```typescript
{
  "6": {
    "0_20_601_6_10001": { time: 284, sequence: 15 },
    "0_20_601_6_10002": { time: 297, sequence: 15 }
    // ... all trips for route 6 at this stop
  },
  "11": { /* similar */ }
  // ... all routes at this stop
}
```

**Benefit:** Pre-filtered timetable (vs fetching full 190 KB route timetable)

---

## 4. Optimized Indexes

### 4a. route_stops/{route_id}.json (320 B avg)

```typescript
{
  stops: ["264_2", "222_2", "197_2", ...]  // 15-70 stops
}
```

**Benefit:** Lightweight stop list (vs 190 KB timetable)  
**Savings:** 260-600x reduction

### 4b. route_active_trips/{route_id}.json (72 KB avg)

```typescript
{
  trips: [
    {
      id: "0_20_601_6_10001",
      headsign: "Savski gaj-rotor",
      direction: 0,
      shapeId: "6_2",
      start: 236,  // departure time (minutes)
      end: 277     // arrival time (minutes)
    }
    // ... all trips
  ],
  shapes: {
    "6_2": [[45.77769, 15.98681], ...],
    // ... all shapes for this route
  }
}
```

**Benefit:** Combined trips+shapes for vehicle estimation  
**Savings:** 76% reduction vs separate fetches (1,200 KB → 72 KB)  
**Note:** Schedule-based estimation only (no real GPS)

---

## Data Encoding

### Time Format
- **Storage:** Minutes since midnight (integer)
- **Example:** `284` = 04:44 (284 ÷ 60 = 4h 44m)
- **Range:** 0-1530 (00:00 to 25:30 next day)

### Timetable Format
- **Array format:** `[stop_id, sequence, time]`
- **Saves ~30%** vs object format `{stopId, sequence, time}`

### Coordinates
- **Precision:** 5 decimals (~1m accuracy)
- **Example:** `45.77769, 15.98681`

---

## Loading Strategy

```typescript
// Phase 1: Startup
const initial = await fetch('/data/initial.json');
// → 456 KB, display map + route list

// Phase 2: Route click
const [trips, timetable, shapes] = await Promise.all([
  fetch(`/data/routes/${routeId}.json`),
  fetch(`/data/timetables/${routeId}.json`),
  fetch(`/data/shapes/${routeId}.json`)
]);
// → ~260 KB total

// Phase 3: Stop click
const departures = await fetch(`/data/stops/${stopId}.json`);
// → 3 KB

// Optimized: Vehicle estimation
const data = await fetch(`/data/route_active_trips/${routeId}.json`);
// → 72 KB (76% savings vs Phase 2)

// Optimized: Stop timetable
const timetable = await fetch(`/data/stop_timetables/${stopId}.json`);
// → 30 KB (82% savings vs fetching all route timetables)

// Optimized: Route stops highlight
const {stops} = await fetch(`/data/route_stops/${routeId}.json`);
// → 320 bytes (99.7% savings vs Phase 2)
```

---

## Summary

**Total files:** 5,862  
**Total size:** 131.4 MB uncompressed (~30 MB gzipped)  
**Baseline interaction:** ~720 KB (initial + route details + stop details)  
**With optimizations:** ~560 KB (22% additional savings)

**Optimizations delivered:**
- ✅ Stop timetables: 82% reduction (570 KB → 100 KB)
- ✅ Vehicle positions: 76% reduction (1,200 KB → 280 KB)
- ✅ Route stops: 99.7% reduction (190 KB → 320 B)
