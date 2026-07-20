import { getCircleLabel } from '@features/circles';

/**
 * Detail page metadata sections.
 *
 * Grouping matches the redesigned detail page mockup: three narrative
 * sections that read like a museum card — what it is, what it's made of,
 * where it came from — plus a slim "recording" line for the metadata that
 * doesn't belong in any of those.
 *
 * Each field's `get(record)` returns the display string (— for missing).
 * `mono: true` renders the value in the monospace font (key numbers,
 * accession codes, IDs).
 */

const dateFmt = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});
const dateTimeFmt = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const fmtDate = (iso) => (iso ? dateFmt.format(new Date(iso)) : '—');
const fmtDateTime = (iso) => (iso ? dateTimeFmt.format(new Date(iso)) : '—');

export const antiquityDetailConfig = {
  sections: [
    {
      id: 'identification',
      title: 'Identification',
      fields: [
        { label: 'Key number', get: (r) => r.key_no || '—', mono: true },
        {
          label: 'Accession number',
          get: (r) => r.accession_number || '—',
        },
        { label: 'Type', get: () => 'Antiquity' },
      ],
    },
    {
      id: 'material',
      title: 'Material and form',
      fields: [
        { label: 'Material', get: (r) => r.material || '—' },
        { label: 'Dimensions', get: (r) => r.dimensions || '—' },
        { label: 'Condition', get: (r) => r.condition || '—' },
      ],
    },
    {
      id: 'provenance',
      title: 'Provenance and context',
      fields: [
        {
          label: 'Provenance',
          get: (r) => r.provenance || '—',
          long: true,
        },
        { label: 'Period', get: (r) => r.period || '—' },
        {
          label: 'Recording circle',
          // getCircleLabel handles unknown codes gracefully — see @features/circles
          get: (r) => getCircleLabel(r.circle),
        },
      ],
    },
  ],
  /** Small caption strip below the sections — the boring but useful stuff. */
  meta: (r) => [
    { label: 'Created', value: fmtDateTime(r.created_at) },
    { label: 'Updated', value: fmtDateTime(r.updated_at) },
    r.created_by != null
      ? { label: 'Recorded by', value: `User #${r.created_by}` }
      : null,
  ].filter(Boolean),
};

export { fmtDate, fmtDateTime };
