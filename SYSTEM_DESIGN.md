# Pitching Validation - System Design & Documentation

## 1. Overview

A browser-based tool for validating bowling machine accuracy by comparing **configured (set)** pitch positions against **actual** measured pitching points. It connects to a file server, lets users browse session CSVs, visualize ball placements on a cricket pitch, and generate validation reports.

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Browser (Client)                     │
│                                                          │
│  index.html ──┬── styles.css          (base UI styles)   │
│               ├── pitch-mapping.css   (pitch visual)     │
│               ├── pitch-mapping.js    (CSV parse, pitch) │
│               └── app.js              (nav, modal, bulk) │
│                                                          │
│  External CDN:                                           │
│   - Axios (HTTP requests)                                │
│   - Lucide (icons)                                       │
│   - Google Fonts (Outfit)                                │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP GET
                       ▼
         ┌─────────────────────────┐
         │  File Server (nginx/    │
         │  static server)         │
         │  http://192.168.0.111   │
         │  :6060                  │
         │                         │
         │  /userId/               │
         │    /bookingId/          │
         │      /sessionId/        │
         │        session.csv      │
         │        video.mp4        │
         └─────────────────────────┘
```

**No backend logic** — purely client-side. The file server just serves directory listings and static files.

---

## 3. File Structure

| File | Purpose |
|---|---|
| `index.html` | Single-page shell: header, toolbar, content area, modal |
| `app.js` | File browser, navigation, modal, CSV upload (single + bulk), bulk report |
| `pitch-mapping.js` | CSV parser, pitch visualization, ball detail, session report generator |
| `styles.css` | Base layout, file browser, modal, CSV table styles |
| `pitch-mapping.css` | Pitch canvas, ball dots, detail panel, param table styles |

---

## 4. Data Flow

### 4.1 CSV Input

CSV files come from the bowling machine system. Each row = one ball delivery.

**Expected CSV columns:**

| Column | Type | Description |
|---|---|---|
| `Ball ID` | string/int | Identifier for each ball |
| `Session ID` | string | Session identifier |
| `x` | float (0-300) | Config target X on pitch canvas |
| `y` | float (0-100) | Config target Y on pitch canvas |
| `speed` | float | Configured ball speed (km/h) |
| `Release speed` | float | Actual measured release speed (km/h) |
| `Pitching point x` | float (cm) | Actual X landing point in centimeters (-150 to +150) |
| `Pitching point z` | float (cm) | Actual Z landing point in centimeters (0 to 1000) |
| `Video URL` | string | URL to the ball delivery video |
| `Pan (Set)` / `Pan (Read)` | float | Pan angle set vs read |
| `M-Tilt (Set)` / `M-Tilt (Read)` | float | Main tilt set vs read |
| `L-Tilt (Set)` / `L-Tilt (Read)` | float | Left tilt set vs read |
| `R-Tilt (Set)` / `R-Tilt (Read)` | float | Right tilt set vs read |
| `L-rpm (Set)` / `L-rpm (Read)` | float | Left wheel RPM set vs read |
| `R-rpm (Set)` / `R-rpm (Read)` | float | Right wheel RPM set vs read |

### 4.2 CSV Parsing (`parseCSV`)

RFC-compliant parser handling:
- Quoted fields with commas inside
- Escaped quotes (`""`)
- Multi-line values within quotes
- Returns `string[][]` (array of rows, each row = array of cells)

---

## 5. Coordinate System & Calculations

### 5.1 Pitch Canvas

The visual pitch represents a cricket pitch viewed top-down:

```
        0%              33.33%           66.66%            100%
        ├────────────────┼────────────────┼─────────────────┤
        │  Outside Off   │    Inline      │  Outside Leg    │
 0%  ───┼────────────────┼────────────────┼─────────────────┤  ← Stumps
        │   Full Toss    │                │                 │  8%
 8%  ───┼────────────────┼────────────────┼─────────────────┤
        │    Yorkers     │                │                 │  8%
 16% ───┼────────────────┼────────────────┼─────────────────┤
        │  Half Volley   │                │                 │  16%
 32% ───┼────────────────┼────────────────┼─────────────────┤
        │     Full       │                │                 │  16%
 48% ───┼────────────────┼────────────────┼─────────────────┤
        │    Length      │                │                 │  16%
 64% ───┼────────────────┼────────────────┼─────────────────┤
        │ Back of Length │                │                 │  16%
 80% ───┼────────────────┼────────────────┼─────────────────┤
        │    Shorts      │                │                 │  20%
100% ───┴────────────────┴────────────────┴─────────────────┘
```

- **X axis** = pitch width = 300 units = 300cm (3 meters)
- **Y axis** = pitch length = 100 units = 1000cm (10 meters)

### 5.2 Config (Set) Values — Canvas Coordinates

Read directly from CSV `x` and `y` columns:
- `x`: 0-300 (canvas units, maps to pitch width)
- `y`: 0-100 (canvas units, maps to pitch length)

**Plotting on canvas:**
```
left% = x / 3          (0-300 → 0-100%)
top%  = y               (0-100 → 0-100%)
```

**Line classification** (`getLineLabel`):
```
x / 3 <= 33.33%  →  "Outside Off"
x / 3 <= 66.66%  →  "Inline"
x / 3 >  66.66%  →  "Outside Leg"
```

**Length classification** (`getLengthLabel`):
```
y < 8    →  "Full Toss"
y <= 16  →  "Yorkers"
y <= 32  →  "Half Volley"
y <= 48  →  "Full"
y <= 64  →  "Length"
y <= 80  →  "Back of Length"
y > 80   →  "Shorts"
```

### 5.3 Actual (Measured) Values — Real-world cm

Read from CSV `Pitching point x` and `Pitching point z`:
- `pitchXcm`: centimeters, centered at 0. Range: roughly -150 to +150
- `pitchZcm`: centimeters, 0 = batsman end. Range: 0 to 1000

**Converting cm → canvas coordinates for plotting:**
```
actualX = pitchXcm + 150              (shift to 0-300 range)
actualY = pitchZcm / 1000 * 80        (scale to 0-80 pitchable area)
```

**Plotting on canvas:**
```
left% = actualX / 3     (0-300 → 0-100%)
top%  = actualY          (0-80 → 0-80%)
```

> Note: Actual balls plot within 0-80% Y range (pitchable area). The Shorts zone (80-100%) is beyond normal bowling machine range.

### 5.4 Config → cm Conversion (for reports)

Used in `processSessionBalls` for the session report:
```
configXcm = x - 150               (canvas 0-300 → cm -150 to +150)
configYcm = y / 100 * 1000        (canvas 0-100 → cm 0 to 1000)
```

### 5.5 Conversion Summary Table

| Direction | X formula | Y formula |
|---|---|---|
| cm → canvas | `cm + 150` | `cm / 1000 * 80` |
| canvas → cm | `canvas - 150` | `canvas / 100 * 1000` |
| canvas → plot % | `canvas / 3` | `canvas` (direct %) |

---

## 6. Machine Parameters (Pan / Tilt / RPM)

### 6.1 Parameters Tracked

| Parameter | Set Column | Read Column | Has Diff |
|---|---|---|---|
| Pan | `Pan (Set)` | `Pan (Read)` | Yes |
| M-Tilt | `M-Tilt (Set)` | `M-Tilt (Read)` | Yes |
| L-Tilt | `L-Tilt (Set)` | `L-Tilt (Read)` | Yes |
| R-Tilt | `R-Tilt (Set)` | `R-Tilt (Read)` | Yes |
| L-RPM | `L-rpm (Set)` | `L-rpm (Read)` | No* |
| R-RPM | `R-rpm (Set)` | `R-rpm (Read)` | No* |

> *RPM read values are marked as inaccurate (shown with `*` indicator). Diff is not computed for RPM.

### 6.2 Difference Calculation

```
diff = |set - read|
```

**Color coding:**

| Diff | Class | Color | Meaning |
|---|---|---|---|
| 0 | `match` | Green | Perfect match |
| 1-50 | `off` | Yellow | Slight deviation |
| > 50 | `bad` | Red | Significant deviation |

**Sign:** Shows `+N` if read > set, `-N` if read < set.

---

## 7. User Flows

### 7.1 File Browser Flow

```
App Init → navigate("/")
    │
    ├── fetchDirectory(path)          GET http://server/path
    │       │
    │       └── parseDirectoryListing()   Parse HTML <a> links
    │               │
    │               └── renderFiles()     Grid or List view
    │
    ├── Click folder → navigate(path + folder/)
    │
    └── Click file → openFile(name, path)
            │
            ├── Image → <img> preview
            ├── Video → <video> player
            ├── Audio → <audio> player
            ├── CSV   → renderCSVTable() → [Pitch Mapping] button
            ├── Text  → <pre> view
            ├── PDF   → <iframe> embed
            └── Other → Download prompt
```

### 7.2 Single CSV Upload Flow

```
[Upload CSV] button → FileReader reads .csv
    │
    └── handleCsvUpload()
            │
            ├── renderPitchMapping(csvText)     ← Opens directly in Pitch Map view
            ├── selectBall(0)                   ← Auto-select first ball
            │
            └── Modal shows:
                    [Table View]  [Generate Report]  [Close]
```

### 7.3 Bulk Upload Flow

```
[Bulk Upload] → openBulkUploadModal()
    │
    ├── renderBulkUploadUI()      File picker with checkboxes
    │       │
    │       ├── [Add Files] → addBulkFiles() → FileReader per file
    │       ├── [Show Pitch Map] → startBulkView()
    │       │       │
    │       │       ├── renderBulkTabs()        Scrollable tab bar
    │       │       └── selectBulkCsv(0)        Load first file's pitch map
    │       │
    │       └── [Generate Report] → generateBulkReport()
    │                                    │
    │                                    └── Downloads pitching_validation_report.csv
    │
    └── Tab switching: selectBulkCsv(i) → renderPitchMapping(file.data)
```

### 7.4 Pitch Mapping Interaction

```
renderPitchMapping(csv)
    │
    ├── LEFT PANEL: Pitch Canvas
    │       │
    │       ├── Length bands (colored zones)
    │       ├── Line dividers (33%/66%)
    │       ├── Stumps at top
    │       ├── Red dots = Config positions (hidden until selected)
    │       ├── Blue dots = Actual positions (hidden until selected)
    │       └── Legend: Config (red) / Actual (blue)
    │
    └── RIGHT PANEL: Detail
            │
            ├── Ball selector buttons: [All] [Ball 1 (120 km/h)] [Ball 2] ...
            │
            ├── selectBall(i):
            │       ├── Shows 1 red dot + 1 blue dot on canvas
            │       ├── Config section: Speed, Line, Length, X, Y
            │       ├── Actual section: Release Speed, Line, Length, X(cm), Y(cm)
            │       ├── Param table: Pan/Tilt/RPM — Set vs Read vs Diff
            │       └── Video player (if URL present)
            │
            └── selectAllBalls():
                    ├── Shows 1 red "C" dot + ALL blue dots on canvas
                    └── Summary table: all balls × all params
```

---

## 8. Report Generation

### 8.1 Session Report (`generateSessionReport`)

Triggered by **Generate Report** button. Outputs CSV with:

**Columns:** `Session ID, Ball ID, Release Speed (km/h), Config Speed (km/h), Config X (cm), Config Y (cm), Actual X (cm), Actual Z (cm)`

**Per-session average row:** Marked with `**AVERAGE**` in Session ID column.

**Calculation per ball:**
```
Config X (cm) = x - 150
Config Y (cm) = y / 100 * 1000
Actual X (cm) = pitchXcm (raw from CSV)
Actual Z (cm) = pitchZcm (raw from CSV)
```

**Averages:**
```
Avg Release Speed = sum(releaseSpeed) / count
Avg Config Speed  = sum(speed) / count
Avg Config X      = sum(configXcm) / count
Avg Config Y      = sum(configYcm) / count
Avg Actual X      = sum(pitchXcm) / count
Avg Actual Z      = sum(pitchZcm) / count
```

### 8.2 Bulk Report (`generateBulkReport`)

Triggered from bulk upload view. Richer than session report.

**Columns:** Session File (no .csv ext), Ball ID, Release Speed, Speed, Line (Config), Length (Config), Config X, Config Y, Line (Actual), Length (Actual), Actual X, Actual Y, Pitch X (cm), Pitch Z (cm), Pan Set/Read/Diff, M-Tilt Set/Read/Diff, L-Tilt Set/Read/Diff, R-Tilt Set/Read/Diff, L-RPM Set/Read, R-RPM Set/Read

---

## 9. State Management

All state is in global variables (no framework):

| Variable | Type | Purpose |
|---|---|---|
| `currentPath` | string | Current file browser directory |
| `allItems` | array | Current directory listing |
| `viewMode` | `'grid'` / `'list'` | File browser view mode |
| `currentFileUrl` | string | URL of currently previewed file |
| `currentCsvData` | string | Raw CSV text of current file |
| `pitchBalls` | array | Parsed ball objects for current CSV |
| `pitchColIdx` | object | Column name → index map for current CSV |
| `bulkCsvFiles` | array | `{name, data, checked}` for bulk mode |
| `activeBulkIndex` | int | Currently selected tab in bulk view |
| `bulkMode` | bool | Whether bulk upload is active |

---

## 10. Function Reference

### app.js

| Function | Description |
|---|---|
| `getExt(name)` | Extract file extension |
| `getFileType(name)` | Classify file into type (image/video/audio/doc/code/archive/other) |
| `getIcon(name, isDir)` | Return Lucide icon HTML for file type |
| `escapeHtml(str)` | Sanitize string for safe HTML insertion |
| `fetchDirectory(path)` | HTTP GET directory listing from server |
| `parseDirectoryListing(html)` | Parse server HTML into `{name, href, isDir, size}[]` |
| `navigate(path)` | Load and render a directory |
| `goBack()` | Navigate to parent directory |
| `navigateToInput()` | Navigate to path typed in breadcrumb input |
| `renderFiles(items)` | Render file grid/list in content area |
| `filterFiles()` | Filter displayed files by search input |
| `setView(mode)` | Toggle grid/list view |
| `openFile(name, path)` | Open file preview modal (handles all file types) |
| `closeModal()` | Close the preview modal |
| `downloadFile()` | Trigger browser download of current file |
| `handleCsvUpload(event)` | Handle single CSV file upload |
| `openBulkUploadModal()` | Open bulk upload UI |
| `renderBulkUploadUI()` | Render file list with checkboxes for bulk upload |
| `addBulkFiles(event)` | Read multiple CSV files into memory |
| `removeBulkFile(index)` | Remove a file from bulk list |
| `startBulkView()` | Switch from upload UI to pitch map tabs view |
| `renderBulkTabs()` | Render scrollable tab bar for bulk files |
| `selectBulkCsv(index)` | Load a specific bulk file's pitch mapping |
| `generateBulkReport()` | Generate and download bulk CSV report |

### pitch-mapping.js

| Function | Description |
|---|---|
| `parseCSV(text)` | RFC-compliant CSV parser → `string[][]` |
| `renderCSVTable(csvText)` | Render CSV as HTML table |
| `getLineLabel(x)` | Classify X coordinate into line (Outside Off / Inline / Outside Leg) |
| `getLengthLabel(y)` | Classify Y coordinate into length zone |
| `parsePitchBalls(csvText)` | Parse CSV into ball objects with all computed fields |
| `renderPitchMapping(csvText)` | Render full pitch mapping UI (canvas + detail panel) |
| `selectBall(index)` | Select a single ball — show dots + detail |
| `selectAllBalls()` | Show all balls overview with summary table |
| `configXtoCm(x)` | Convert config X (0-300) to cm (-150 to +150) |
| `configYtoCm(y)` | Convert config Y (0-100) to cm (0 to 1000) |
| `processSessionBalls(csvData, sessionName)` | Process balls for session report with averages |
| `generateSessionReport()` | Generate and download session report CSV |
| `showPitchMapping()` | Switch modal view to pitch mapping |
| `showCSVTable()` | Switch modal view to raw CSV table |

---

## 11. External Dependencies

| Library | Version | Purpose |
|---|---|---|
| Axios | latest (CDN) | HTTP requests to file server |
| Lucide | latest (CDN) | SVG icon library |
| Google Fonts (Outfit) | - | Typography |

No build tools, no bundler, no framework. Plain vanilla JS served as static files.
