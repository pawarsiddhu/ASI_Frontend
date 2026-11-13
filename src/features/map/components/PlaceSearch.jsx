import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Search, Landmark, Package, Building2, MapPin, X, Filter, Sparkles } from 'lucide-react';

import styles from './PlaceSearch.module.css';

/**
 * PlaceSearch — the one "find" box. Type a monument, object, museum,
 * district or state; pick a suggestion and the map flies there.
 *
 * If the text reads like a question ("buddhist caves in maharashtra"), the
 * first row is a SMART SEARCH that turns it into filters (see
 * utils/smartSearch.js — rule-based, no AI). Otherwise the first row
 * filters the map + table by plain text. Enter picks the first row.
 *
 * Suggestions come from the records already loaded, so it works offline
 * and only ever offers things the viewer is allowed to see.
 */

const MAX_PER_GROUP = 4;

const ICON = { bhs: Landmark, ant: Package, museum: Building2, state: MapPin, district: MapPin };
const KIND_LABEL = { bhs: 'Site', ant: 'Object', museum: 'Museum', state: 'State', district: 'District' };

function score(hay, q) {
  const h = hay.toLowerCase();
  if (h.startsWith(q)) return 0;
  if (h.includes(` ${q}`)) return 1;
  if (h.includes(q)) return 2;
  return -1;
}

export default function PlaceSearch({ index, activeQuery, onPick, onFilter, onClearFilter, parse, onSmart }) {
  const [text, setText] = useState('');
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(0);
  const wrapRef = useRef(null);
  const listId = useId();

  const q = text.trim().toLowerCase();

  const suggestions = useMemo(() => {
    if (q.length < 2) return [];
    const byKind = {};
    index.forEach((item) => {
      let best = score(item.label, q);
      (item.alt || []).forEach((a) => {
        const s = score(a, q);
        if (s >= 0 && (best < 0 || s < best)) best = s;
      });
      if (best < 0) return;
      (byKind[item.kind] ||= []).push({ ...item, _s: best });
    });
    const order = ['state', 'district', 'bhs', 'museum', 'ant'];
    return order.flatMap((k) =>
      (byKind[k] || []).sort((a, b) => a._s - b._s || a.label.localeCompare(b.label)).slice(0, MAX_PER_GROUP)
    );
  }, [index, q]);

  const smart = useMemo(() => (q.length >= 3 && parse ? parse(text) : null), [q, text, parse]);

  // Smart row (if understood) → plain-text filter row → suggestions.
  const rows = q.length >= 2
    ? [...(smart?.understood ? [{ kind: 'smart', result: smart }] : []), { kind: 'filter' }, ...suggestions]
    : [];

  useEffect(() => setHi(0), [q]);

  useEffect(() => {
    const onDoc = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const choose = (row) => {
    if (!row) return;
    if (row.kind === 'filter') onFilter(text.trim());
    else if (row.kind === 'smart') onSmart(row.result, text.trim());
    else onPick(row);
    setOpen(false);
    setText('');
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setHi((h) => Math.min(rows.length - 1, h + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHi((h) => Math.max(0, h - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      choose(rows[hi]);
    } else if (e.key === 'Escape') {
      e.stopPropagation();
      setOpen(false);
    }
  };

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <div className={styles.box}>
        <Search size={15} className={styles.icon} aria-hidden="true" />
        <input
          type="text"
          className={styles.input}
          placeholder="Find a place or ask: “Buddhist caves in Maharashtra before 500 CE”"
          value={text}
          onChange={(e) => { setText(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          role="combobox"
          aria-expanded={open && rows.length > 0}
          aria-controls={listId}
          aria-activedescendant={open && rows[hi] ? `${listId}-${hi}` : undefined}
          aria-autocomplete="list"
          aria-label="Find on map"
        />
        {text && (
          <button type="button" className={styles.clear} onClick={() => setText('')} aria-label="Clear text">
            <X size={14} />
          </button>
        )}
      </div>

      {activeQuery && (
        <span className={styles.active}>
          <Filter size={12} aria-hidden="true" /> Matching “{activeQuery}”
          <button type="button" onClick={onClearFilter} aria-label="Clear text filter"><X size={12} /></button>
        </span>
      )}

      {open && rows.length > 0 && (
        <ul className={styles.list} id={listId} role="listbox">
          {rows.map((row, i) => {
            const isHi = i === hi;
            if (row.kind === 'smart') {
              return (
                <li
                  key="smart"
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={isHi}
                  className={`${styles.row} ${styles.smartRow} ${isHi ? styles.hi : ''}`}
                  onMouseMove={() => { if (hi !== i) setHi(i); }}
                  onMouseDown={(e) => { e.preventDefault(); choose(row); }}
                >
                  <Sparkles size={14} aria-hidden="true" className={styles.rowIcon} />
                  <span className={styles.rowText}>
                    <span className={styles.smartLabel}>Smart search — show:</span>
                    <span className={styles.chips}>
                      {row.result.chips.map((c) => <span key={c} className={styles.chip}>{c}</span>)}
                    </span>
                    {row.result.ignored.length > 0 && (
                      <small>Didn’t understand: {row.result.ignored.join(', ')}</small>
                    )}
                  </span>
                  <kbd>Enter</kbd>
                </li>
              );
            }
            if (row.kind === 'filter') {
              return (
                <li
                  key="filter"
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={isHi}
                  className={`${styles.row} ${styles.filterRow} ${isHi ? styles.hi : ''}`}
                  onMouseMove={() => { if (hi !== i) setHi(i); }}
                  onMouseDown={(e) => { e.preventDefault(); choose(row); }}
                >
                  <Filter size={14} aria-hidden="true" />
                  <span>Show everything matching “<strong>{text.trim()}</strong>”</span>
                  {!smart?.understood && <kbd>Enter</kbd>}
                </li>
              );
            }
            const Icon = ICON[row.kind];
            return (
              <li
                key={`${row.kind}:${row.id}`}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={isHi}
                className={`${styles.row} ${isHi ? styles.hi : ''}`}
                onMouseMove={() => { if (hi !== i) setHi(i); }}
                onMouseDown={(e) => { e.preventDefault(); choose(row); }}
              >
                <Icon size={14} aria-hidden="true" className={styles.rowIcon} />
                <span className={styles.rowText}>
                  <span className={styles.rowLabel}>{row.label}</span>
                  {row.sub && <small>{row.sub}</small>}
                </span>
                <span className={styles.kind}>{KIND_LABEL[row.kind]}</span>
              </li>
            );
          })}
          {suggestions.length === 0 && (
            <li className={styles.none}>No exact place or record — press Enter to filter by text.</li>
          )}
        </ul>
      )}
    </div>
  );
}
