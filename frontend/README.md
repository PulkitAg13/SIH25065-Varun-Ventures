# JalSanrakshakAI — Developer Guide

This document helps developers quickly understand the codebase and where to make changes for common features like the Assessment form, satellite map, geocoding, and progress tank.

## Tech stack
- Vite + React 18 + TypeScript
- TailwindCSS + shadcn/ui (Radix primitives)
- react-router-dom
- Leaflet + react-leaflet (satellite tiles via Esri World Imagery)

## Run locally
Prereqs: Node 18+ and npm

```sh
npm install
npm run dev
# build
npm run build
```

## Environment variables
No API key is required for address geocoding (uses OpenStreetMap Nominatim). No special env vars needed.

## Project structure (key paths)
- `src/pages/Assessment.tsx` — Main multi-step form page (most edits happen here)
- `src/components/MapLocator.tsx` — Reusable Leaflet satellite map component
- `src/components/WaterTank.tsx` — Tank visualization that fills based on progress
- `src/main.tsx` — Global CSS and Leaflet CSS import
- `src/components/ui/*` — shadcn/ui building blocks (Button, Card, Select, etc.)
- `tailwind.config.ts` — Design tokens, themes, animations

## Assessment form — where to change what
File: `src/pages/Assessment.tsx`

Sections (steps):
- Step 1 (Basic Information): name, address (with geocoding), number of dwellers
- Step 2 (Property Details): Google Earth CTA, roof area, open space
- Step 3 (Roof Specifications): roof type, soil type, roof age
- Step 4 (Review): summary of entered details

Common edits:
- Add/rename a field
	- Update `interface FormData` at top.
	- Initialize new fields in `useState<FormData>(...)`.
	- Render inputs in the appropriate Step UI.
	- If it affects progress, include it in the `formCompletion` checks.

- Change labels or helper text
	- Edit the corresponding `<Label>` / `<p className="text-xs ...">` blocks within the step.

- Move the Google Earth helper
	- The CTA block is in Step 2 above the roof area input. Search for "Helper: Google Earth CTA (above roof area)".

- Progress/tank filling rule
	- See `formCompletion` computed value near the top of the component. It maps to `<WaterTank progress={formCompletion} />` in the sidebar. Adjust required fields or weighting there.

## Map & satellite view
File: `src/components/MapLocator.tsx`

Features:
- Satellite tiles via Esri World Imagery
- Red pin marker
- Geolocation "Locate Me" button (optional)
- Click-to-place and draggable pin (when `interactive` is true)
- Controlled mode (pass `position={[lat, lng]}`) for read-only displays

Important props:
- `position?: [number, number] | null` — When provided, the map centers and shows the pin here.
- `interactive?: boolean` — Enable/disable click/drag interactions.
- `showLocateButton?: boolean` — Show/hide the "Locate Me" button.
- `onLocate?(lat, lng)` — Called when user locates/adjusts the pin.

Where it's used:
- Assessment Sidebar card "Detected Location" renders `MapLocator` in read-only mode once coordinates are known.

Leaflet CSS:
- Imported globally in `src/main.tsx`:
	```ts
	import 'leaflet/dist/leaflet.css';
	```

## Geocoding (OpenStreetMap Nominatim)
File: `src/pages/Assessment.tsx`

- Function `geocodeAddress(address)` calls OSM Nominatim (no key needed).
- Debounced by ~5s after user stops typing in the Location/Address field (inside a `useEffect`).
- On success, `formData.latitude` and `formData.longitude` are set.
- The right sidebar renders the satellite map with those coordinates (read-only) and sends them to Google Earth.

Google Earth link:
- Function `generateGoogleEarthLink()` prioritizes coordinates if available, else falls back to address.

## Water tank progress
File: `src/components/WaterTank.tsx` and usage in `Assessment.tsx`

- `WaterTank` accepts a `progress` number (0–100) to fill the tank.
- In `Assessment.tsx`, it is bound to `formCompletion` so it updates live as a user fills the form.
- To change how completion is calculated, modify the `checks` array in `formCompletion`.

## UI library notes
- shadcn/ui components live under `src/components/ui/` and wrap Radix primitives.
- Tailwind tokens (colors, shadows, animations) are defined in `tailwind.config.ts` and CSS variables.

## Routing
- Pages live in `src/pages/`. The app uses `react-router-dom` for navigation; see `src/App.tsx` for route config.

## Troubleshooting
- Map tiles/controls not styled:
	- Ensure `import 'leaflet/dist/leaflet.css'` exists in `src/main.tsx`.
- Geocoding not working:
		- Nominatim may rate-limit; try again after a short delay or reduce request frequency.
- Map doesn’t show in sidebar:
	- It renders only after coordinates are detected. Type a full address and wait ~5s.
- TypeScript warnings in Map component:
	- We intentionally alias some react-leaflet components to avoid prop typing false positives. Leave as-is unless refactoring types.

## Contributing
- Use TypeScript and keep components small and focused.
- Follow existing patterns for shadcn/ui and Tailwind classes.
- Prefer controlled props and lifting state when you need to drive UI from parent components.


