import { Eye, RotateCcw } from 'lucide-react';

import Select from '@components/Select';
import { STATUS_LABEL } from '@features/antiquities/schema';
import styles from './FilterPanel.module.css';

const STATUS_ORDER = ['DRAFT', 'PENDING_SUPERVISOR', 'PENDING_ADMIN', 'PENDING_SUPERADMIN', 'PUBLISHED', 'RETURNED', 'REJECTED'];
const CIRCLES = ['DELHI', 'MUMBAI', 'CHENNAI', 'KOLKATA', 'JAIPUR', 'GUWAHATI'];

function Toggle({ checked, onChange, label, hint }) {
  return (
    <label className={styles.toggle}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className={styles.toggleText}>
        {label}
        {hint && <small>{hint}</small>}
      </span>
    </label>
  );
}

function ChipGroup({ label, options, value, onChange, colorFor }) {
  const toggle = (v) => onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  return (
    <fieldset className={styles.group}>
      <legend className={styles.groupLabel}>
        {label}
        {value.length > 0 && (
          <button type="button" className={styles.clearLink} onClick={() => onChange([])}>
            Clear
          </button>
        )}
      </legend>
      <div className={styles.chips}>
        {options.map((o) => {
          const on = value.includes(o.value);
          return (
            <button
              type="button"
              key={o.value}
              className={on ? styles.chipOn : styles.chip}
              aria-pressed={on}
              onClick={() => toggle(o.value)}
              title={o.title || o.label}
            >
              {colorFor && <span className={styles.swatch} style={{ background: colorFor(o.value) }} />}
              {o.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export default function FilterPanel({ state, update, reset, masters, theme, themeOptions, activeFilterCount, isPublic }) {
  const periodColor = theme.id === 'period' ? theme.color : null;
  const affColor = theme.id === 'affiliation' ? theme.color : null;
  const protColor = theme.id === 'protection' ? theme.color : null;
  const statusColor = theme.id === 'status' ? theme.color : null;

  return (
    <aside className={styles.panel} aria-label="Map filters">
      <section className={styles.section}>
        <h3 className={styles.heading}>Layers</h3>
        <Toggle checked={state.showBhs} onChange={(v) => update({ showBhs: v })} label="Built heritage & sites" />
        {state.showBhs && (
          <div className={styles.sub}>
            <Toggle checked={state.cluster} onChange={(v) => update({ cluster: v })} label="Cluster nearby sites" />
            <Toggle checked={state.heat} onChange={(v) => update({ heat: v })} label="Density heatmap" />
          </div>
        )}
        <Toggle checked={state.showAnt} onChange={(v) => update({ showAnt: v })} label="Antiquities" />
        {state.showAnt && (
          <div className={styles.sub}>
            <div className={styles.segment} role="radiogroup" aria-label="Antiquity position">
              {[
                ['found', 'Where found'],
                ['held', 'Where held now'],
              ].map(([v, l]) => (
                <button
                  type="button"
                  key={v}
                  role="radio"
                  aria-checked={state.antMode === v}
                  className={state.antMode === v ? styles.segOn : styles.seg}
                  onClick={() => update({ antMode: v })}
                >
                  {l}
                </button>
              ))}
            </div>
            <Toggle
              checked={state.dispersal}
              onChange={(v) => update({ dispersal: v })}
              label="Dispersal lines"
              hint="Findspot → holding museum"
            />
          </div>
        )}
      </section>

      <section className={styles.section}>
        <Select
          label="Colour by"
          size="sm"
          value={state.theme}
          onChange={(e) => update({ theme: e.target.value })}
          options={themeOptions}
        />
      </section>

      <section className={styles.section}>
        <div className={styles.headingRow}>
          <h3 className={styles.heading}>Filters</h3>
          {activeFilterCount > 0 && (
            <button type="button" className={styles.resetBtn} onClick={reset}>
              <RotateCcw size={12} /> Reset ({activeFilterCount})
            </button>
          )}
        </div>

        <ChipGroup
          label="Period"
          options={masters.periods.map((p) => ({ value: p.id, label: p.name.replace(/ \(.*\)/, ''), title: p.name }))}
          value={state.periods}
          onChange={(v) => update({ periods: v })}
          colorFor={periodColor}
        />
        <ChipGroup
          label="Cultural affiliation"
          options={masters.cultural_affiliations.map((a) => ({ value: a.id, label: a.name }))}
          value={state.affiliations}
          onChange={(v) => update({ affiliations: v })}
          colorFor={affColor}
        />
        <ChipGroup
          label="Protection (sites)"
          options={masters.protection_levels.map((p) => ({ value: p.id, label: p.name.replace(' protected', '') }))}
          value={state.protection}
          onChange={(v) => update({ protection: v })}
          colorFor={protColor}
        />

        <div className={styles.selects}>
          <Select
            label="Category"
            size="sm"
            value={state.category}
            onChange={(e) => update({ category: e.target.value })}
          >
            <option value="">All categories</option>
            <optgroup label="Built heritage">
              {masters.categories.filter((c) => c.applies_to === 'BHS').map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </optgroup>
            <optgroup label="Antiquities">
              {masters.categories.filter((c) => c.applies_to === 'ANTIQUITY').map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </optgroup>
          </Select>
          <Select
            label="Dynasty"
            size="sm"
            value={state.dynasty}
            onChange={(e) => update({ dynasty: e.target.value })}
            options={[{ value: '', label: 'All dynasties' }, ...masters.dynasties.map((d) => ({ value: d.id, label: d.name }))]}
          />
          <Select
            label="State"
            size="sm"
            value={state.state}
            onChange={(e) => update({ state: e.target.value })}
            options={[{ value: '', label: 'All states' }, ...masters.states.map((s) => ({ value: s.name, label: s.name }))]}
          />
          <Select
            label="Circle"
            size="sm"
            value={state.circle}
            onChange={(e) => update({ circle: e.target.value })}
            options={[{ value: '', label: 'All circles' }, ...CIRCLES.map((c) => ({ value: c, label: c[0] + c.slice(1).toLowerCase() }))]}
          />
        </div>

        {!state.pub && !isPublic && (
          <ChipGroup
            label="Workflow status"
            options={STATUS_ORDER.map((s) => ({ value: s, label: STATUS_LABEL[s].replace('Under ', '').replace(' for Correction', '') }))}
            value={state.statuses}
            onChange={(v) => update({ statuses: v })}
            colorFor={statusColor}
          />
        )}
      </section>

      {!isPublic && (
      <section className={`${styles.section} ${state.pub ? styles.pubOn : ''}`}>
        <label className={styles.toggle}>
          <input type="checkbox" checked={state.pub} onChange={(e) => update({ pub: e.target.checked, statuses: [] })} />
          <span className={styles.toggleText}>
            <span className={styles.pubLabel}><Eye size={14} /> Public view preview</span>
            <small>
              Published only. Unprotected sites shown on a ~5 km grid. Accession numbers and survey details hidden.
            </small>
          </span>
        </label>
      </section>
      )}

      {isPublic && (
        <section className={styles.section}>
          <p className={styles.note}>
            Showing published records only. Locations of unprotected sites and some findspots are
            shown approximately (within ~5 km) to protect them.
          </p>
        </section>
      )}
    </aside>
  );
}
