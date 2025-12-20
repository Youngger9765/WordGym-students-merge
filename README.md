# WordGym-students-merge
國高中英文單字學習網站

## Quick Start

### Development
```bash
npm install
npm run dev
```

### Build for Production
```bash
npm run build
```

The built file will be in `dist/index.html` as a single self-contained HTML file.

## Opening the Built File

### Option 1: Double-click (Direct file:// access)
You can directly open `dist/index.html` in your browser. The app automatically detects file:// protocol and uses a CORS proxy (allorigins.win) to load Google Sheets data.

**Note**: First load may be slower due to CORS proxy. Subsequent loads use cached data from localStorage.

### Option 2: Local HTTP Server (Recommended)
For better performance and no CORS proxy dependency:

```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000

# Node.js (if you have http-server installed)
npx http-server dist -p 8000

# Using Vite preview
npm run preview
```

Then open `http://localhost:8000` in your browser.

## Google Sheets Integration

### How it Works
- The app loads vocabulary data from Google Sheets on first launch
- Data is cached in localStorage for offline use
- File protocol: Uses JSONP via CORS proxy (allorigins.win)
- HTTP protocol: Direct fetch (faster, no proxy needed)

### CORS Solution
The original `index.html` and the built TypeScript version both face the same limitation: browsers block `fetch()` requests from `file://` protocol due to security restrictions.

**Solution implemented:**
1. Detect if running from `file://` protocol
2. If yes: Use JSONP with CORS proxy (allorigins.win)
3. If no: Use direct fetch (normal behavior)

See `/Users/young/project/WordGym-students-merge/src/services/googleSheetLoader.ts` for implementation details.

### Configuration
Edit `/Users/young/project/WordGym-students-merge/src/config/googleSheet.ts` to change:
- Google Sheet ID
- Sheet tabs (gid)
- Enable/disable auto-loading

## Project Structure

```
src/
├── components/      # React components
├── config/         # Configuration files
├── hooks/          # Custom React hooks
├── services/       # Business logic (Google Sheets loader, etc.)
├── types/          # TypeScript type definitions
├── utils/          # Utility functions
├── main.tsx        # Application entry point
└── App.tsx         # Root React component

index.html          # Vite entry point (loads src/main.tsx)
dist/
└── index.html      # Single-file production build

Old files (archived):
├── index-standalone-old.html  # Original single-file HTML (pre-TypeScript)
├── index-new.html             # (if exists)
└── index-old.html             # (if exists)
```

## Technical Notes

### TypeScript Migration
The project has been migrated from a single-file HTML/JavaScript application to a modern TypeScript/React/Vite stack while maintaining the single-file deployment capability.

### CORS Fix Implementation
The Google Sheets loader automatically detects the protocol and chooses the appropriate loading method:
- **file:// protocol**: Uses JSONP with allorigins.win CORS proxy
- **http(s):// protocol**: Uses direct fetch (Google Sheets has CORS headers)

This enables the built `dist/index.html` to work both when:
1. Double-clicked (opens as file://)
2. Served via any HTTP server

### Build Process
1. TypeScript compilation (tsc)
2. Vite bundling with React
3. Single-file plugin combines all assets into one HTML file
4. Result: Self-contained 194KB HTML file with all JavaScript, CSS, and assets inlined
<!-- Last updated: 2025年12月20日 週六 15時07分53秒 CST -->
