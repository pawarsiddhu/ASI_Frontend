# Heritage Map: full build (Days 1–4)

## Install

1. Replace your `src/` folder with the one in this zip.
2. Replace `package.json` and `package-lock.json`. These add `maplibre-gl`.
3. Copy the 4 images in `public/monuments/` over yours. They're the same pictures, compressed (13 MB → 1.2 MB).
4. Run `npm install`.
5. Start with `VITE_USE_MOCKS=true` in `.env.development`.

See **DEMO_SCRIPT.md** for the walkthrough.

## What's in it

| Feature | Where |
|---|---|
| Public Heritage Map, no login | `/explore`, linked from the landing page banner and the public header |
| Staff Map Explorer | `/map`, in the sidebar |
| Find box: fly to a monument, object, museum, district or state | top of the map |
| **Smart search**: plain English → filters, shown as chips. Rule-based, no AI. | same box |
| Near me (50 km) | https or localhost only |
| **Story card**: photos, draft summary, when/what/where, era strip, object journey, found here, nearby, technical details | click any dot or row |
| **Guided stories** (3) | Stories button |
| Time slider with play, draw box/radius, measure, colour by, clustering, heatmap, dispersal lines | map toolbar / filters |
| CSV + GeoJSON export, shareable URL | page header |
| Dynasty filter (new) | filter panel |
| Phones: filters collapse behind a button | |

## Files

```
src/features/map/
  MapExplorerPage.jsx        page (mode="staff" | "public")
  mapApi.js                  RTK Query: /map/* (staff) and /public/map/* (public)
  components/
    MapCanvas.jsx            the only file that talks to MapLibre (basemap swap here)
    DetailPanel.jsx          story card
    PlaceSearch.jsx          find box + smart search row
    StoryPlayer.jsx          stories menu + step card
    FilterPanel, TimeSlider, Legend, ResultsTable, PhotoStrip
  utils/
    smartSearch.js           plain English → filters (rule-based)
    stories.js               the 3 guided stories (content, easy to add more)
    filterFeatures.js        the single filter pipeline
    timeScale.js, geo.js, themes.js, exportGeo.js
  hooks/useMapUrlState.js    every view lives in the URL
src/mocks/data/
  mapSeed.js                 dummy data in the proposed schema = data spec for backend
  mapSummaries.js            draft summaries for the 40 named monuments
```

## Public safety (backend must copy this)

The public map calls `GET /public/map/masters` and `GET /public/map/features?layer=bhs|antiquities`.
`publicFeatureCollection()` in `mapSeed.js` shows the rules the **real backend must enforce on the server**:

1. Return PUBLISHED records only.
2. Snap sensitive coordinates to a ~5 km grid. Omit `hidden` records entirely.
3. Never send restricted fields (`PUBLIC_HIDDEN_FIELDS`).

## Photos to replace (hidden for now)

| File | Problem |
|---|---|
| `ajanta-caves.jpg`, `ajanta-caves-2.jpg` | They show **Ellora's Kailasa temple**, not Ajanta. Only `-3` is used. |
| `rani-ki-vav-2.jpg` | Looks like **Modhera Sun Temple** (watermarked "Sun Temple") |
| `fatehpur-sikri-2.jpg` | Has a "4K ULTRAHD" video watermark |
| `bairat-monastery.jpg` | Doesn't appear to match the Bairat ruins, so check it |
| `vikramashila.jpg` | Has a phone-camera watermark at the bottom left; minor, but worth replacing |

After replacing, un-hide them in `SITE_PHOTOS` in `mapSeed.js`.

## Known, not from this change

- `result.map is not a function` in the console comes from existing code and was there before the map work.
- `/search` has no mock, so the backend server must be running for it.
