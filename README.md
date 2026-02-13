# ZET Live — Zagreb Public Transit Tracker

A frontend-only web application for tracking Zagreb's public transport in real-time. Built with React, TypeScript, and optimized GTFS data processing.

**Geographic Center:** 45.789586°N, 15.976114°E (Zagreb, Croatia)

## 🎯 Project Overview

ZET Live displays Zagreb's public transport network (trams and buses) on an interactive map, providing:
- Real-time stop locations and route information
- Schedule data and departure times
- Route visualization with geographic paths
- Nearest stop finder based on user location

This is a **static, frontend-only application** — all transit data is pre-processed into optimized JSON chunks and served from a CDN, requiring no backend server.

## 📊 Data Source

Transit data from **ZET (Zagrebački Električni Tramvaj)**:
- **Source:** https://www.zet.hr/gtfs-scheduled/latest
- **Format:** GTFS (General Transit Feed Specification)
- **Coverage:** 155 routes (20 trams, 136 buses), 3,829 stops, 93K+ trips
- **Raw size:** 114 MB → **Processed:** 131.4 MB (5,862 files, ~30 MB gzipped)

> **See [DATA_INDEX.md](DATA_INDEX.md) for complete data structure reference.**

## ✨ Features

### Data Processing
- ⚡ **Optimized chunking** — 9 specialized indexes for different use cases
- 📦 **Smart compression** — Time encoding, deduplication, format optimization
- 🎯 **Access-pattern-based** — By route, by stop, by function
- 🚀 **Fast loading** — 456 KB initial, 320B-72KB per interaction

### Tech Stack
- ⚡ **Vite 7** - Lightning-fast build tool
- ⚛️ **React 19** - Latest React with TypeScript
- 🎨 **Tailwind CSS v4** + **DaisyUI 5** - Styled components
- 🧪 **Vitest 4** - Comprehensive testing
- 🗺️ **GTFS Processing** - Python-based data pipeline (no external dependencies)

## 🚀 Quick Start

### Prerequisites

- **Node.js 20+** and **Yarn** (for frontend)
- **Python 3.7+** (for data processing, stdlib only)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/zet-live
cd zet-live

# Install frontend dependencies
yarn install

# Process GTFS data (first time only)
./scripts/run.sh

# Start development server
yarn dev
```

### Available Scripts

```bash
# Frontend
yarn dev              # Start dev server at http://localhost:5173
yarn build            # Build for production
yarn preview          # Preview production build
yarn lint             # Run ESLint
yarn test             # Run tests

# Data Processing
./scripts/run.sh                # Process GTFS data (recommended)
python3 scripts/process_gtfs.py # Run processor directly

# Testing
python3 tests/test_functional_requirements.py  # Test all optimizations
```

## 🧪 Testing

Validate functional requirements and measure data fetch sizes:

```bash
python3 tests/test_functional_requirements.py
```

Tests all 5 requirements (A1-A3, B1-B2) and confirms optimizations:
- **A1:** Routes at stop → ~10 KB ✅
- **A2:** Timetables at stop → ~100 KB (82% reduction) ✅
- **A3:** Draw routes → ~90 KB ✅
- **B1:** Vehicle positions → ~252 KB (79% reduction) ✅
- **B2:** Stops on route → ~650 bytes (99.7% reduction) ✅

See [tests/README.md](tests/README.md) for details.

## 📁 Project Structure

```
zet-live/
├── data/                # Raw GTFS (114 MB)
├── public/data/         # Processed JSON (131.4 MB, 5,862 files)
│   ├── initial.json     # Bootstrap data (456 KB)
│   ├── routes/          # Per-route metadata (155 files)
│   ├── timetables/      # Per-route schedules (155 files)
│   ├── shapes/          # Geographic paths (150 files)
│   ├── stops/           # Per-stop departures (2,545 files)
│   ├── route_stops/     # Optimized stop lists (155 files)
│   ├── stop_timetables/ # Optimized stop schedules (2,545 files)
│   ├── route_active_trips/ # Optimized vehicle data (155 files)
│   └── manifest.json
├── scripts/
│   ├── process_gtfs.py  # Data processor
│   ├── run.sh           # Runner script
│   └── README.md
├── src/
│   ├── utils/gtfs.ts    # TypeScript utilities
│   ├── App.tsx
│   └── components/
├── DATA_INDEX.md        # 📋 Data structure reference (START HERE)
├── DATA_ANALYSIS.md     # Analysis report
├── FUNCTIONAL_REQUIREMENTS.md # Requirements analysis
├── USAGE_EXAMPLES.md    # Code examples
└── README.md
```

## 📋 Functional Requirements

**See [FUNCTIONAL_REQUIREMENTS.md](FUNCTIONAL_REQUIREMENTS.md) for detailed feasibility analysis.**

### Quick Summary

**For Selected Stop:**
- A1: Show route numbers → 🟢 Easy (3 KB, ready)
- A2: Show timetables → 🟢 Easy (~30 KB, ✅ optimized with `stop_timetables/`)
- A3: Draw route paths → 🟡 Moderate (30 KB, acceptable)

**For Selected Route:**
- B1: Vehicle locations → 🟢 Easy (~72 KB, ✅ optimized with `route_active_trips/`)
- B2: List all stops → � Easy (~320 bytes, ✅ optimized with `route_stops/`)

---

## 📖 Documentation

**📋 [DATA_INDEX.md](DATA_INDEX.md)** — Start here: Complete data structure reference  
**📊 [DATA_ANALYSIS.md](DATA_ANALYSIS.md)** — Analysis & compression techniques  
**✅ [FUNCTIONAL_REQUIREMENTS.md](FUNCTIONAL_REQUIREMENTS.md)** — Requirements & feasibility  
**💻 [USAGE_EXAMPLES.md](USAGE_EXAMPLES.md)** — Code examples  
**🔧 [scripts/README.md](scripts/README.md)** — Data processing pipeline

## 🎨 Data Loading

**See [DATA_INDEX.md](DATA_INDEX.md)** for complete loading strategy and all 9 indexes.

**Quick reference:**
- **Startup:** `initial.json` (456 KB) — all stops + routes
- **Route click:** 3 files (~260 KB) — or use `route_active_trips/` (72 KB)
- **Stop click:** `stops/{id}.json` (3 KB) — or use `stop_timetables/` (30 KB)
- **Cache:** Store fetched data in memory to avoid re-downloading

## 📊 Performance Metrics

| Metric | Value |
|--------|-------|
| **Initial load** | 456 KB |
| **Route interaction** | 72-260 KB (optimized/baseline) |
| **Stop interaction** | 3-30 KB (simple/timetable) |
| **Total processed** | 131.4 MB uncompressed |
| **With gzip** | ~30 MB (estimated) |
| **Processing time** | ~30 seconds |
| **Total files** | 5,862 JSON files |
| **Optimizations** | 22% additional savings |

## 🚢 Deployment

### GitHub Pages

1. Enable GitHub Pages in repository settings
2. Update `package.json` with your repository name
3. Push to main branch — automatic deployment via GitHub Actions

### CDN Deployment

```bash
# Build for production
yarn build

# Deploy dist/ folder to your CDN
# Ensure gzip compression is enabled
# Set long cache headers (data valid for 4 years)
```

**Recommended headers:**
```
Cache-Control: public, max-age=31536000
Content-Encoding: gzip
```

## 🔧 Development

### Adding New Features

1. **Fetch data** using utilities from [src/utils/gtfs.ts](src/utils/gtfs.ts)
2. **See examples** in [USAGE_EXAMPLES.md](USAGE_EXAMPLES.md)
3. **Test** with Vitest
4. **Cache** fetched data to avoid redundant requests

### Modifying Data Processing

1. Edit [scripts/process_gtfs.py](scripts/process_gtfs.py)
2. Run `./scripts/run.sh` to regenerate data
3. Check output in `public/data/`
4. See [scripts/README.md](scripts/README.md) for details

## 🤝 Contributing

Improvements welcome! Areas of interest:
- UI/UX enhancements
- Performance optimizations
- Additional data transformations
- GTFS-Realtime integration (if ZET provides API)

## 📄 License

MIT — Feel free to use and modify.

## 🙏 Acknowledgments

- **ZET Zagreb** for providing GTFS data
- **GTFS specification** by Google Transit
- Built with modern web technologies and ❤️

---

**Status:** Data processing complete ✅ | Frontend implementation in progress 🚧
