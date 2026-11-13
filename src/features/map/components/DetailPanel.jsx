import { useMemo } from 'react';
import {
  X, Crosshair, Radar, Landmark, Package, Building2, Lock, ArrowRight,
  Hammer, Shovel, Building, ChevronDown, FilePenLine,
} from 'lucide-react';

import StatusBadge from '@features/antiquities/components/StatusBadge';
import PhotoStrip from './PhotoStrip';
import { formatKm, formatYear, formatYearRange, haversineKm, snapToGrid } from '../utils/geo';
import { makeScale } from '../utils/timeScale';
import styles from './DetailPanel.module.css';

/**
 * DetailPanel — the "story card" for a selected site, object or museum.
 *
 * Reading order is deliberate: photo → plain-language summary → the four
 * facts a visitor wants (when / what / where / protected) → a picture of
 * time → related records → nearby → technical details (collapsed).
 *
 * It reads the FULL dataset (not just the filtered result) so links still
 * work when the other end is filtered out; those links are dimmed.
 */

const NEARBY_KM = 50;
const NEARBY_MAX = 5;
const CERTAINTY = { exact: 'exact', approx: 'approximate', century: 'to the century', stylistic: 'by style' };

function Row({ label, children, restricted }) {
  if (children == null || children === '' || children === false) return null;
  return (
    <div className={styles.row}>
      <dt>
        {label}
        {restricted && <Lock size={10} className={styles.lock} aria-label="Staff only" />}
      </dt>
      <dd>{children}</dd>
    </div>
  );
}

function Fact({ label, children }) {
  if (!children) return null;
  return (
    <div className={styles.fact}>
      <span className={styles.factLabel}>{label}</span>
      <span className={styles.factValue}>{children}</span>
    </div>
  );
}

function coordsText(coords, props, publicMode) {
  if (!coords) return null;
  if (publicMode && (props.display_precision === 'approximate' || props.location_generalised)) {
    const [lng, lat] = snapToGrid(coords);
    return `≈ ${lat.toFixed(2)}°N, ${lng.toFixed(2)}°E (shown approximately, ~5 km)`;
  }
  return `${coords[1].toFixed(4)}°N, ${coords[0].toFixed(4)}°E`;
}

function RecordLink({ label, sub, onClick, dim }) {
  return (
    <li>
      <button type="button" className={`${styles.link} ${dim ? styles.dim : ''}`} onClick={onClick}>
        <span className={styles.linkText}>
          {label}
          {sub && <small>{sub}</small>}
        </span>
        <ArrowRight size={13} />
      </button>
    </li>
  );
}

/** Eight era cells with the record's date span highlighted. */
function EraStrip({ periods, start, end, colorFor }) {
  const scale = useMemo(() => makeScale(periods), [periods]);
  if (start == null) return null;
  const a = (scale.toPos(start) / scale.total) * 100;
  const b = (scale.toPos(end ?? start) / scale.total) * 100;
  return (
    <div className={styles.era}>
      <div className={styles.eraCells}>
        {scale.eras.map((e) => (
          <span key={e.id} className={styles.eraCell} style={{ '--c': colorFor(e.id) }} title={e.name} />
        ))}
        <span className={styles.eraSpan} style={{ left: `${a}%`, width: `${Math.max(1.2, b - a)}%` }} />
      </div>
      <div className={styles.eraEnds}>
        <span>{formatYear(scale.eras[0].start_year)}</span>
        <span>{formatYear(scale.eras[scale.eras.length - 1].end_year)}</span>
      </div>
    </div>
  );
}

/** " — the Classical period" or " — from the Early Historic to the Classical period". */
function eraPhrase(periods, start, end) {
  if (start == null) return '';
  const hit = [...periods]
    .sort((a, b) => a.start_year - b.start_year)
    .filter((e) => start < e.end_year && (end ?? start) >= e.start_year);
  if (!hit.length) return '';
  if (hit.length === 1) return ` — the ${hit[0].name} period`;
  return ` — from the ${hit[0].name} to the ${hit[hit.length - 1].name} period`;
}

function Steps({ steps }) {
  return (
    <ol className={styles.steps}>
      {steps.map(({ icon: Icon, title, text, muted }) => (
        <li key={title} className={muted ? styles.stepMuted : undefined}>
          <span className={styles.stepIcon}><Icon size={13} /></span>
          <span className={styles.stepBody}>
            <strong>{title}</strong>
            <span>{text}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}

function SummaryBox({ text, status }) {
  if (!text) return null;
  return (
    <div className={styles.summary}>
      <p>{text}</p>
      {status === 'draft' && (
        <span className={styles.draft}>
          <FilePenLine size={11} aria-hidden="true" /> Draft — pending ASI verification
        </span>
      )}
    </div>
  );
}

export default function DetailPanel({
  selection,
  lookup,
  masters,
  periodColor,
  visibleIds,
  publicMode,
  onSelect,
  onClose,
  onZoom,
  onRadius,
  hideOnPhone = false,
}) {
  const L = lookup;

  // Nearby sites: from the full (viewer-visible) dataset, not the filter.
  const nearby = useMemo(() => {
    if (!selection || selection.kind === 'museum') return [];
    const r = selection.record;
    const here = selection.kind === 'bhs' ? r._rawCoords : r._rawFind;
    if (!here) return [];
    return Object.values(L.bhsById)
      .filter((b) => b.id !== r.id && (!publicMode || b.status === 'PUBLISHED'))
      .map((b) => ({ b, km: haversineKm(here, b._rawCoords) }))
      .filter((x) => x.km <= NEARBY_KM)
      .sort((x, y) => x.km - y.km)
      .slice(0, NEARBY_MAX);
  }, [selection, L, publicMode]);

  if (!selection) return null;
  const { kind, record } = selection;

  // ---------------- Museum ----------------
  if (kind === 'museum') {
    const held = L.antByMuseum[record.id] || [];
    const visible = held.filter((a) => visibleIds.ant.has(a.id));
    const far = held.filter((a) => a._movedKm > 100).length;
    return (
      <aside className={`${styles.panel} ${hideOnPhone ? styles.phoneHidden : ''}`} aria-label="Museum details">
        <header className={styles.header}>
          <span className={styles.kind}><Building2 size={13} /> Holding museum</span>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Close details"><X size={16} /></button>
          <h2 className={styles.title}>{record.name}</h2>
        </header>
        <div className={styles.body}>
          <p className={styles.lead}>
            Holds <strong>{held.length}</strong> object{held.length === 1 ? '' : 's'} in this register
            {far > 0 && <> — <strong>{far}</strong> of them were found more than 100 km away</>}.
            Turn on <em>Dispersal lines</em> to see where they came from.
          </p>
          <h3 className={styles.subhead}>Objects matching your filters ({visible.length})</h3>
          <ul className={styles.links}>
            {visible.slice(0, 40).map((a) => (
              <RecordLink
                key={a.id}
                label={a.title}
                sub={[L.category[a.category_id], a._movedKm != null ? `found ${formatKm(a._movedKm)} away` : 'findspot unknown'].join(' · ')}
                onClick={() => onSelect({ kind: 'ant', id: a.id })}
              />
            ))}
            {visible.length > 40 && <li className={styles.more}>+ {visible.length - 40} more — narrow the filters</li>}
            {visible.length === 0 && <li className={styles.more}>None match the current filters.</li>}
          </ul>
        </div>
      </aside>
    );
  }

  const p = record;
  const isBhs = kind === 'bhs';
  const coords = isBhs ? p._rawCoords : p._rawFind;
  const filteredOut = !(isBhs ? visibleIds.bhs : visibleIds.ant).has(p.id);
  const period = masters.periods.find((x) => x.id === p.period_id);
  const dynasty = L.dynasty[p.dynasty_id];
  const when = [formatYearRange(p.date_start, p.date_end), dynasty ? `${dynasty}` : null].filter(Boolean).join(' · ');
  const museum = !isBhs ? L.museum[p.museum_id] : null;
  const site = !isBhs && p.bhs_id ? L.bhsById[p.bhs_id] : null;
  const foundHere = isBhs ? L.antBySite[p.id] || [] : [];

  const antSteps = !isBhs && [
    {
      icon: Hammer,
      title: 'Made',
      text: `${formatYearRange(p.date_start, p.date_end)}${period ? `, ${period.name} period` : ''}`,
    },
    coords
      ? {
        icon: Shovel,
        title: p.find_year ? `Found in ${p.find_year}` : 'Found',
        text: site ? `At ${site.title}` : p.find_location_text,
      }
      : { icon: Shovel, title: 'Found', text: 'Findspot not recorded', muted: true },
    {
      icon: Building,
      title: 'Now',
      text: `${museum?.name || 'Unknown'}${p._movedKm != null && p._movedKm > 5 ? ` — ${formatKm(p._movedKm)} from where it was found` : ''}`,
    },
  ];

  return (
    <aside className={`${styles.panel} ${hideOnPhone ? styles.phoneHidden : ''}`} aria-label={isBhs ? 'Site details' : 'Antiquity details'}>
      <div className={styles.scroller}>
        <PhotoStrip images={p.images} alt={p.title} representative={p.image_is_representative} />

        <header className={styles.header}>
          <span className={styles.kind}>
            {isBhs ? <><Landmark size={13} /> Built heritage</> : <><Package size={13} /> Antiquity</>}
            {p.is_dummy && <span className={styles.dummy}>demo record</span>}
          </span>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Close details"><X size={16} /></button>
          <h2 className={styles.title}>{p.title}</h2>
          <div className={styles.meta}>
            <code>{isBhs ? p.bh_code : p.key_no}</code>
            {!publicMode && <StatusBadge status={p.status} />}
          </div>
          {filteredOut && <p className={styles.notice}>Outside your current filters — opened from a link.</p>}
        </header>

        <div className={styles.body}>
          <SummaryBox text={p.summary} status={p.summary_status} />

          <div className={styles.actions}>
            {coords && (
              <button type="button" className={styles.action} onClick={() => onZoom(coords)}>
                <Crosshair size={13} /> Zoom to
              </button>
            )}
            {coords && (
              <button type="button" className={styles.action} onClick={() => onRadius(coords, 25)}>
                <Radar size={13} /> Everything within 25 km
              </button>
            )}
          </div>

          <div className={styles.facts}>
            <Fact label="When">{when}</Fact>
            <Fact label="What">
              {[
                L.category[p.category_id],
                !isBhs && L.material[p.material_id],
                L.affiliation[p.cultural_affiliation_id],
              ].filter(Boolean).join(' · ')}
            </Fact>
            {isBhs ? (
              <>
                <Fact label="Where">{[p.district, p.state].filter(Boolean).join(', ')}</Fact>
                <Fact label="Protected">
                  {[L.protection[p.protection_level], p.is_world_heritage ? 'World Heritage' : null].filter(Boolean).join(' · ')}
                </Fact>
              </>
            ) : (
              <>
                <Fact label="Found">{coords ? (site ? site.title : p.find_location_text) : 'Not recorded'}</Fact>
                <Fact label="Kept at">
                  {museum && (
                    <button type="button" className={styles.inline} onClick={() => onSelect({ kind: 'museum', id: p.museum_id })}>
                      {museum.name}
                    </button>
                  )}
                </Fact>
              </>
            )}
          </div>

          <h3 className={styles.subhead}>{isBhs ? 'In time' : 'Its journey'}</h3>
          {isBhs ? (
            <>
              <EraStrip periods={masters.periods} start={p.date_start} end={p.date_end} colorFor={periodColor} />
              <p className={styles.caption}>
                {formatYearRange(p.date_start, p.date_end)}
                {eraPhrase(masters.periods, p.date_start, p.date_end)}
                {p.date_certainty ? ` (dated ${CERTAINTY[p.date_certainty] || p.date_certainty})` : ''}.
              </p>
            </>
          ) : (
            <Steps steps={antSteps} />
          )}

          {isBhs && (
            <>
              <h3 className={styles.subhead}>Found at this site ({foundHere.length})</h3>
              <ul className={styles.links}>
                {foundHere.map((a) => (
                  <RecordLink
                    key={a.id}
                    label={a.title}
                    sub={`${L.category[a.category_id]} · now at ${L.museum[a.museum_id]?.name.split(',')[0]}`}
                    dim={!visibleIds.ant.has(a.id)}
                    onClick={() => onSelect({ kind: 'ant', id: a.id })}
                  />
                ))}
                {!foundHere.length && <li className={styles.more}>No objects in the register are linked to this site yet.</li>}
              </ul>
            </>
          )}

          {site && (
            <>
              <h3 className={styles.subhead}>Came from</h3>
              <ul className={styles.links}>
                <RecordLink
                  label={site.title}
                  sub={L.category[site.category_id]}
                  dim={!visibleIds.bhs.has(site.id)}
                  onClick={() => onSelect({ kind: 'bhs', id: site.id })}
                />
              </ul>
            </>
          )}

          {nearby.length > 0 && (
            <>
              <h3 className={styles.subhead}>Nearby sites</h3>
              <ul className={styles.links}>
                {nearby.map(({ b, km }) => (
                  <RecordLink
                    key={b.id}
                    label={b.title}
                    sub={`${formatKm(km)} away · ${L.category[b.category_id]}`}
                    dim={!visibleIds.bhs.has(b.id)}
                    onClick={() => onSelect({ kind: 'bhs', id: b.id })}
                  />
                ))}
              </ul>
            </>
          )}

          <details className={styles.tech}>
            <summary>
              Technical details <ChevronDown size={14} aria-hidden="true" />
            </summary>
            <dl className={styles.grid}>
              <Row label={isBhs ? 'BH code' : 'Key no.'}>{isBhs ? p.bh_code : p.key_no}</Row>
              <Row label="Period">{period?.name}</Row>
              <Row label="Dynasty">{dynasty || 'Not attributed'}</Row>
              <Row label="Date certainty">{CERTAINTY[p.date_certainty] || p.date_certainty}</Row>
              <Row label="Original text">{p.period_text && <q className={styles.raw}>{p.period_text}</q>}</Row>
              {isBhs && <Row label="Style">{p.architectural_style}</Row>}
              {!isBhs && (
                <>
                  <Row label="Iconography">{p.subject_iconography}</Row>
                  <Row label="Inscription">{p.inscription_script && `${p.inscription_script} script, ${p.inscription_language}`}</Row>
                  <Row label="Dimensions">
                    {p.height_cm != null && `${p.height_cm} × ${p.width_cm} × ${p.depth_cm} cm${p.weight_g ? ` · ${p.weight_g} g` : ''}`}
                  </Row>
                  <Row label="Discovery">{L.discovery[p.discovery_type]}</Row>
                </>
              )}
              <Row label="Coordinates">{coords ? coordsText(coords, p, publicMode) : 'Unknown'}</Row>
              {isBhs && <Row label="State LGD">{p.state_lgd}</Row>}
              <Row label="Precision" restricted>{!publicMode && L.precision[isBhs ? p.location_precision : p.find_precision]}</Row>
              <Row label="Coord. source" restricted>{!publicMode && p.coordinate_source}</Row>
              <Row label="Public display" restricted>{!publicMode && p.display_precision}</Row>
              <Row label="Accession no." restricted>{!publicMode && !isBhs && p.accession_number}</Row>
              <Row label="Source">
                {(p.source_ids || []).map((s) => L.source[s]).filter(Boolean).join('; ') || 'NMMA field documentation'}
              </Row>
            </dl>
          </details>
        </div>
      </div>
    </aside>
  );
}
