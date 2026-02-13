# GTFS Data Processing Scripts

This directory contains scripts to process ZET Zagreb's GTFS transit data into optimized JSON chunks for frontend consumption.

## Overview

**Input:** `./data/*.txt` (GTFS CSV files, 114 MB)  
**Output:** `./public/data/` (optimized JSON chunks, 47 MB = 58.7% reduction)

## Usage

### Quick Start

```bash
./scripts/run.sh
```

Or manually:

```bash
python3 scripts/process_gtfs.py
```

### Output Structure

The processor generates the following file hierarchy:

```
public/data/
├── initial.json           # Critical initial load (456 KB)
│   ├── stops[]            # All 3,829 stops with lat/lon
│   ├── routes[]           # All 155 routes
│   ├── calendar{}         # Date → service_id mapping
│   └── feedVersion, feedStartDate, feedEndDate
│
├── routes/                # 155 files, avg 60 KB each
│   ├── 1.json             # Trip metadata for route 1
│   ├── 6.json             # Trip metadata for route 6
│   └── ...
│
├── timetables/            # 155 files, avg 190 KB each
│   ├── 1.json             # Full timetable for route 1
│   ├── 6.json             # Full timetable for route 6
│   └── ...
│
├── shapes/                # 150 files, avg 10 KB each
│   ├── 1.json             # Geographic paths for route 1
│   ├── 6.json             # Geographic paths for route 6
│   └── ...
│
├── stops/                 # 2,545 files, avg 3 KB each
│   ├── 98_1.json          # Departures at stop 98_1
│   ├── 264_2.json         # Departures at stop 264_2
│   └── ...
│
└── manifest.json          # Index of all generated files (41 KB)
```

## Data Format Details

### `initial.json`

```json
{
  "stops": [
    {
      "id": "98_1",
      "code": "1",
      "name": "Črnomerec",
      "lat": 45.815,
      "lon": 15.93493,
      "locationType": 0,
      "parentStation": "98"
    }
  ],
  "routes": [
    {
      "id": "6",
      "shortName": "6",
      "longName": "Črnomerec - Sopot",
      "type": 0
    }
  ],
  "calendar": {
    "20260216": "0_20",
    "20260217": "0_20"
  },
  "feedVersion": "000384",
  "feedStartDate": "20260216",
  "feedEndDate": "20301231"
}
```

### `routes/{route_id}.json`

```json
{
  "trips": [
    {
      "id": "0_20_601_6_10001",
      "serviceId": "0_20",
      "headsign": "Savski gaj-rotor",
      "direction": 0,
      "shapeId": "6_2"
    }
  ]
}
```

### `timetables/{route_id}.json`

```json
{
  "0_20_601_6_10001": [
    ["264_2", 1, 236],
    ["222_2", 2, 238],
    ["197_2", 3, 240]
  ]
}
```

**Format:** `[stopId, stopSequence, timeInMinutes]`  
**Time encoding:** Minutes from midnight (e.g., 236 = 03:56)

### `shapes/{route_id}.json`

```json
{
  "6_2": [
    [45.77769, 15.98681],
    [45.7777, 15.98697],
    [45.77772, 15.98740]
  ]
}
```

**Format:** Array of `[lat, lon]` pairs (5 decimal places = ~1m precision)

### `stops/{stop_id}.json`

```json
{
  "routes": ["6", "11", "31"],
  "departures": {
    "0_20": {
      "6": [284, 297, 310, 323, 337],
      "11": [278, 288, 299, 310, 321]
    },
    "0_21": {
      "6": [300, 330, 360, 390]
    }
  }
}
```

**Format:** Routes serving the stop, plus departure times grouped by service_id and route_id

## Frontend Utilities

### Decode Time (JavaScript)

```javascript
function minutesToTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

// Examples:
minutesToTime(236);   // "03:56"
minutesToTime(1451);  // "24:11" (next day)
```

### Service ID → Date Lookup

```javascript
// Load initial.json once at app start
const { calendar } = await fetch('/data/initial.json').then(r => r.json());

// Get service for today
const today = new Date().toISOString().slice(0, 10).replace(/-/g, ''); // "20260216"
const serviceId = calendar[today]; // "0_20"
```

## Optimization Techniques Applied

1. **Column dropping:** Removed empty/redundant columns (stop_headsign, pickup_type, drop_off_type, shape_dist_traveled, route_desc, etc.)
2. **Time compression:** HH:MM:SS strings → minute integers (50% size reduction)
3. **Coordinate rounding:** 6 decimals → 5 decimals (~1m precision, saves characters)
4. **Array-of-arrays:** `[[stopId, seq, time], ...]` instead of `[{s, q, t}, ...]` for timetables
5. **Deduplication:** arrival_time == departure_time → store only one
6. **Streaming:** Process 1.5M+ stop_times row-by-row without loading entire file into memory
7. **Compact JSON:** No whitespace (separators=(',', ':'))

## Statistics

| Metric | Value |
|--------|-------|
| Input size | 114.1 MB |
| Output size | 47.1 MB (uncompressed) |
| Compression ratio | 58.7% reduction |
| Total files | 3,007 |
| Stops processed | 3,829 |
| Routes processed | 155 |
| Trips processed | 93,156 |
| Stop times processed | 1,580,672 |

**Expected gzipped size:** ~8-12 MB (CDN/server compression)

## Requirements

- Python 3.7+ (no external dependencies)
- Input GTFS data in `./data/` directory

## Notes

- **Service IDs:** ZET uses exception-based calendar (all day-flags in calendar.txt are 0), dates are mapped in calendar_dates.txt
- **Time format:** Can exceed 24:00 for trips continuing past midnight (e.g., 24:11 = 00:11 next day)
- **Stop hierarchy:** Parent stations (locationType=1) and child platforms (locationType=0, with parentStation reference)
- **Route types:** 0 = Tram, 3 = Bus
- **Shape IDs:** Format `{route_id}_{variant}` (e.g., "6_2" = route 6, variant 2)
