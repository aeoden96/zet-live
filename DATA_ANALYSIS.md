# GTFS Data Analysis — ZET Zagreb Transit

**Feed:** v000384 | **Valid:** Feb 16 2026 - Dec 31 2030 | **Size:** 114 MB raw → 131.4 MB processed (~30 MB gzipped)

> **See [DATA_INDEX.md](DATA_INDEX.md) for complete data structure reference.**

---

## Source Data Summary

| File | Records | Size | Note |
|------|---------|------|------|
| `stop_times.txt` | 1,580,672 | 103 MB | **99% of total size** |
| `trips.txt` | 93,156 | 6.7 MB | 155 routes (20 trams, 136 buses) |
| `shapes.txt` | 74,668 | 3.8 MB | Geographic paths |
| `stops.txt` | 3,829 | 456 KB | Hierarchical (500 parents, 3,300 platforms) |
| `calendar_dates.txt` | 119 | 2.9 KB | Exception-based calendar |
| `routes.txt` | 155 | 15 KB | 20 trams, 136 buses |
| **Total** | **1,752,610** | **114.1 MB** | |

---

## Key Findings

### Calendar System
- **Exception-based only** (all `calendar.txt` day-flags = 0)
- Service IDs: `0_20` (weekdays), `0_21` (Sat), `0_22` (Sun), `0_23-0_28` (holidays)

### Route Distribution
- **20 tram routes:** 1-17, 31-34
- **136 bus routes:** 101-330
- **Avg trips/route:** 601 (max: 2,262)

### Stop Hierarchy
- **Format:** `stop_id = {parent}_{code}` for child platforms
- **Geographic center:** 45.789586°N, 15.976114°E (Zagreb)

### Data Redundancy (100% occurrence)
- `arrival_time == departure_time` → store single value
- Empty columns: `pickup_type`, `drop_off_type`, `shape_dist_traveled`, `trip_short_name`
- Time strings `"HH:MM:SS"` → convert to minutes (50% reduction)

---

## Compression Techniques Applied

### 1. Column Elimination (~30% savings)
Removed: `stop_headsign`, `pickup_type`, `drop_off_type`, `shape_dist_traveled`, `route_desc`, `route_url`, `route_color`, `stop_desc`, `zone_id`, `stop_url`

### 2. Time Encoding (50% savings)
`"04:01:00"` (8 bytes) → `241` minutes (3 bytes)

### 3. Coordinate Precision
8 decimals → 5 decimals (~1m accuracy)

### 4. Structure Optimization (30% savings)
Object format `{stopId, sequence, time}` → Array format `["264_2", 1, 236]`

### 5. Shape Simplification
Implicit array indexing, array-of-arrays: `[[lat, lon], ...]`

---

## Output Organization

**5,862 files in 9 indexes** (see [DATA_INDEX.md](DATA_INDEX.md) for details):

| Index | Files | Purpose | Size |
|-------|-------|---------|------|
| `initial.json` | 1 | Bootstrap: stops + routes | 456 KB |
| `manifest.json` | 1 | Metadata | 41 KB |
| `routes/` | 155 | Trip metadata | 60 KB avg |
| `timetables/` | 155 | Full schedules | 190 KB avg |
| `shapes/` | 150 | Geographic paths | 10 KB avg |
| `stops/` | 2,545 | Routes at stop | 3 KB avg |
| `route_stops/` | 155 | Stop lists (optimized) | 320 B avg |
| `stop_timetables/` | 2,545 | Pre-filtered departures | 30 KB avg |
| `route_active_trips/` | 155 | Trips+shapes for vehicles | 72 KB avg |

---

## Performance Gains

### Baseline Scenario
- **Initial load:** 456 KB
- **Route details:** ~260 KB (3 files)
- **Stop details:** 3 KB
- **Total:** ~720 KB per interaction

### With Optimizations
- **route_stops:** 320 B (99.7% reduction vs 190 KB timetable)
- **stop_timetables:** 30 KB (82% reduction vs 570 KB fetching all routes)
- **route_active_trips:** 72 KB (76% reduction vs 1,200 KB separate fetches)
- **Total savings:** ~22% additional reduction

---

## Recommendations

### Deployment
- **Enable gzip** (131.4 MB → ~30 MB)
- **Cache headers:** `Cache-Control: public, max-age=31536000` (feed valid 4+ years)
- **Version URL:** Include feed version for cache busting

### Frontend Strategy
- Show **parent stations only** on map (3,829 → 500 markers)
- **Cache** fetched chunks in memory
- **Prefetch** popular routes
- **Service Worker** for offline support
- **Virtual scrolling** for long lists

### Further Compression (Optional)
Delta-encoding + dictionary compression + binary format (MessagePack) → ~20-30 MB uncompressed  
**Trade-off:** Increased complexity for marginal gains (gzipped JSON already ~30 MB)

---

## Technical Details

**Tools:** Python 3 (stdlib only), streaming CSV parser  
**Processing time:** ~30s  
**Peak memory:** ~200 MB  
**Scripts:** `scripts/process_gtfs.py`, `scripts/run.sh`
