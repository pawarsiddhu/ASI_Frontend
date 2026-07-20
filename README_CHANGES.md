# ASI Internal Portal — Visual Overhaul (this drop)

This src/ replaces the previous flat "dashboard" pattern with a **workspace**
pattern that puts real work in front of the user, and rebuilds the record
detail page as a museum-card layout with a proper trust anchor and workflow
history panel.

## What changed

### 1. Responsive shell (fixed)

`AppShell.jsx` — the mobile drawer now engages at **1023px** (was 767px).
Between 1024–1279px the sidebar auto-collapses to icons-only by default;
above 1280px it defaults to expanded. Container width capped at 1200px.

Result: tablets and small laptops no longer get the full sidebar wedged
next to a shrinking content area.

### 2. Dashboards → Workspaces (replaced)

Removed: `DashboardLayout`, `PageHeader`, `StatGrid`, `QuickActions`,
`ActivityFeed` (StatCard grid + Quick Actions tiles + Activity Feed).
Removed hook: `useDashboardData`.

Added — `src/features/dashboard/components/`:
- `Workspace.jsx` — new shared shell (header + children stack)
- `WorkspaceHeader.jsx` — Georgia serif title, eyebrow, subtitle, actions
- `HeroList.jsx` — record queue with photo thumbnails, key numbers,
  status pills, per-row role-conditional action buttons
- `RecordThumb.jsx` — real image when available, warm bronze/stone
  gradient fallback with icon
- `StatusPill.jsx` — compact colored pill using tokens; the app-wide
  status vocabulary
- `MetricStrip.jsx` — thin bordered horizontal band (numbers, not tiles)
- `ActivityStrip.jsx` — slim divider'd list with colored dots
- `CircleTiles.jsx` — RD-only overview of the six circles

Added hook: `useWorkspaceData(role)` — same data source as before (record
list aggregated client-side), new output shape: `heroRecords`, `metrics`,
`activity`, `circles`.

All 5 role dashboards rewritten to use `Workspace`. Operator/Supervisor/
Admin/SuperAdmin follow the same shape (hero list of records needing action
+ metric strip + activity strip). RD replaces the hero list with CircleTiles.

### 3. Detail page (rebuilt)

`AntiquityDetailPage.jsx` — new two-column museum-card layout.

New sub-components under `features/antiquities/components/`:
- `RecordImageMat.jsx` — matted image with warm cream mat, gold border,
  italic Georgia caption. Placeholder gradient when no image.
- `MetadataSections.jsx` — three sections (Identification / Material and
  form / Provenance and context) with Georgia serif headings and a
  two-column label/value grid inside each. Slim meta strip at the bottom.
- `WorkflowHistoryPanel.jsx` — the star of the sidebar. Status rail at top
  (5 stops: Op → Sup → Adm → SA → Pub) with amber "returned once" flag if
  applicable; below it, an event timeline with colored left borders per
  action type (teal=forward, amber=return, red=reject, gold=publish,
  maroon=create); notes render as italic Georgia evidence blocks on warm
  amber wash under the event they belong to. Collapses to 3 events with
  "Show N earlier" toggle.
- `TrustAnchorCard.jsx` — rebuilt with thin gold accent bar across top,
  truncated tx hash click-to-copy, verify inline with 4 result states
  (idle / loading / result / error).

New: `src/utils/formatRelative.js` — small "2h ago" / "yesterday" utility
used everywhere for time-since strings.

### 4. Detail config

`features/antiquities/detailConfig.js` — sections regrouped to match the
new mockup (3 narrative sections) plus a `meta` function for the bottom
strip.

## Not changed (out of scope for this drop)

- BHS list, detail, and create pages — still use the old components.
  Same pattern-clone applies when we get to BHS proper.
- Antiquities list page (`AntiquitiesTable`, `FilterBar`, `AntiquitiesListPage`)
  and create/edit forms — same visual grammar, but not rebuilt yet.
- Reports page — still uses `SimpleBarChart` (kept).
- Sidebar / Header / Login page — unchanged.

## Kept for other consumers

- `SimpleBarChart` — still used by the reports page.
- `StatusBadge` (in antiquities/components) — still used by BHS pages
  and the antiquities list table.
- `WorkflowStepper`, `ImageGallery` — still used by BHSDetailPage.

Once BHS gets its pattern-clone pass, these can be retired along with
the corresponding BHS-side rewrites.

## Files to look at first

Frontend readers arriving cold:
1. `features/dashboard/components/Workspace.jsx` — the new page shell
2. `features/dashboard/operator/OperatorDashboard.jsx` — the reference
   role dashboard using it
3. `features/antiquities/AntiquityDetailPage.jsx` — the new detail layout
4. `features/antiquities/components/WorkflowHistoryPanel.jsx` — the
   status rail + event timeline pattern
