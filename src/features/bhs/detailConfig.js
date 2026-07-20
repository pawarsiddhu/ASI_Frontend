import { FileText, MapPin, Tag, ScrollText, Landmark, Info } from 'lucide-react';
import { getCircleLabel } from '@features/circles';

/**
 * BHS detail page layout config with per-section icons for a visually rich
 * layout. Same shape as antiquities' config, different field set.
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

const shortLedgerKey = (key) => {
  if (!key) return '—';
  if (key.length <= 16) return key;
  return `${key.slice(0, 8)}…${key.slice(-4)}`;
};

/** Format lat/lng as a compact "19.076°N, 72.878°E" string. */
const fmtCoords = (lat, lng) => {
  if (lat == null || lng == null) return '—';
  const ns = lat >= 0 ? 'N' : 'S';
  const ew = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(4)}°${ns}, ${Math.abs(lng).toFixed(4)}°${ew}`;
};

export const bhsDetailConfig = {
  sections: [
    {
      id: 'identification',
      title: 'Identification',
      icon: FileText,
      fields: [
        { label: 'Site Name', get: (r) => r.title || '—', wide: true },
        {
          label: 'BH Code',
          get: (r) => r.bh_code || '—',
          mono: true,
        },
      ],
    },
    {
      id: 'location',
      title: 'Location',
      icon: MapPin,
      fields: [
        {
          label: 'Coordinates',
          get: (r) => fmtCoords(r.latitude, r.longitude),
          mono: true,
          wide: true,
        },
        { label: 'State / UT', get: (r) => r.state || '—' },
        { label: 'District', get: (r) => r.district || '—' },
      ],
    },
    {
      id: 'classification',
      title: 'Classification',
      icon: Tag,
      fields: [
        { label: 'Category', get: (r) => r.category || '—' },
        { label: 'Protection Status', get: (r) => r.protection_status || '—' },
      ],
    },
    {
      id: 'historical',
      title: 'Historical & Physical',
      icon: ScrollText,
      fields: [
        { label: 'Period / Dynasty', get: (r) => r.period || '—' },
        { label: 'Condition', get: (r) => r.condition || '—' },
      ],
    },
    {
      id: 'custody',
      title: 'Custody',
      icon: Landmark,
      fields: [
        {
          label: 'ASI Circle',
          // getCircleLabel handles unknown codes gracefully — see @features/circles
          get: (r) => getCircleLabel(r.circle),
        },
      ],
    },
    {
      id: 'meta',
      title: 'Record Metadata',
      icon: Info,
      fields: [
        { label: 'Record ID', get: (r) => r.id, mono: true },
        {
          label: 'Ledger Key',
          get: (r) => shortLedgerKey(r.ledger_key),
          mono: true,
        },
        {
          label: 'Created By (user id)',
          get: (r) => (r.created_by != null ? `#${r.created_by}` : '—'),
        },
        { label: 'Created', get: (r) => fmtDateTime(r.created_at) },
        { label: 'Last Updated', get: (r) => fmtDateTime(r.updated_at) },
      ],
    },
  ],
};

export { fmtDate, fmtDateTime };
