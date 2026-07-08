# ASI Internal Portal

Frontend for the National Mission on Monuments and Antiquities (NMMA), Archaeological Survey of India.

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). It redirects to `/login`.

## Try Day 2 Phase 2 — Create form

1. Log in as Operator (`operator@nmma` / `password`).
2. From the dashboard, click **New Antiquity Record**, or from the Antiquities list, click **New Record**.
3. Fill in the form. Sections: Identification / Physical / Historical / Custody / Documentation.
4. Try submitting with fields missing — you'll see a red error summary at the top, inline errors on each field, and the first invalid field gets focus.
5. Fill required fields (name, accession no., category, material, condition, period, cultural affiliation, circle) and click **Save as Draft** — you're taken back to the list and your record appears at the top with status "Draft".
6. Refresh the page — mock data is in-memory so the record disappears (that's expected for the mock).
7. Try Cancel with unsaved changes — confirmation dialog appears. Try browser back with unsaved changes — beforeunload warning fires.

## Deferred to Phase 2b (next session)

- Edit page (`/records/antiquities/:id/edit`)
- Save & Forward action with comment modal
- Image upload UI (drag-drop, thumbnails, reorder)
- Field-level real-time validation on blur

## Status

- ✅ **Phase 1** — Scaffolding & config
- ✅ **Phase 2** — Design system + 13 shared components (Button, Input, Textarea, Select, Card, Badge, Modal, Spinner, Toast, EmptyState, StatCard, Skeleton, Pagination)
- ✅ **Phase 3** — Auth, permissions, routing
- ✅ **Phase 4** — AppShell + real login page + lazy routes
- ✅ **Phase 5** — Real dashboards for all 5 roles
- ✅ **Day 2 Phase 1** — Antiquities list (data model, 43 mock records, filters, sort, pagination)
- ✅ **Day 2 Phase 2 (slim)** — Antiquity create form (config-driven, validation, save as draft)
- ⏳ **Day 2 Phase 2b** — Edit page + Save & Forward + image upload
- ⏳ **Day 2 Phase 3** — Detail page + workflow actions + audit timeline
- ⏳ **Day 2 Phase 4** — Polish

## Form architecture

The form is **config-driven**. `src/features/antiquities/form/formConfig.js` declares sections and fields as data:

```js
{ name: 'material', type: 'select', label: 'Primary Material', required: true, options: [...] }
```

`FormField.jsx` dispatches on `type` (text / textarea / select / number / date) and renders the right shared component. `validation.js` walks the same config to check required fields, min values, max length.

**To add a field:** add one entry to `formConfig.js`. Nothing else changes. The Built Heritage form in a future sprint will reuse the same renderer with its own config.

## Mock users

| Email              | Role              | Password   |
|--------------------|-------------------|------------|
| operator@nmma      | Operator          | password   |
| supervisor@nmma    | Supervisor        | password   |
| admin@nmma         | Admin             | password   |
| superadmin@nmma    | Super Admin       | password   |
| rd@nmma            | Regional Director | password   |

## API contract added this phase

```
POST /api/antiquities
  Body: { name, accessionNo, category, material, ..., all form fields }
  Response: full Antiquity object with server-assigned id, recordedBy, recordedAt, status='draft'
```

## Bundle sizes (production)

- App code: **~47 kB gzipped**
- React vendor: **~51 kB gzipped**
- Redux vendor: **~15 kB gzipped**
- CSS (design system + shell): **~6 kB gzipped**
- Shared DashboardLayout: **~4 kB gzipped**
- AntiquitiesListPage chunk: **~4.5 kB gzipped**
- AntiquityCreatePage chunk: **~4 kB gzipped**
- Shared antiquitiesApi chunk: **~2 kB gzipped**

Well under the SoW's 2.5s desktop budget.
