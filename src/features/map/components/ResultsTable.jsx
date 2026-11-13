import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight } from 'lucide-react';

import StatusBadge from '@features/antiquities/components/StatusBadge';
import { formatKm, formatYearRange } from '../utils/geo';
import styles from './ResultsTable.module.css';

/**
 * ResultsTable — the same filtered result as the map, as rows. Clicking a
 * row selects it on the map; selecting on the map jumps to the row.
 * (SoW: "display query result as map and table in the same window".)
 */

const PAGE = 50;

export default function ResultsTable({ bhs, ant, lookup, selectedKey, onSelect, publicMode }) {
  const [tab, setTab] = useState('bhs');
  const [sort, setSort] = useState({ key: 'date', dir: 'asc' });
  const [page, setPage] = useState(0);
  const rowRefs = useRef({});
  const scrollRef = useRef(null);

  const rows = tab === 'bhs' ? bhs : ant;
  const sorted = useMemo(() => {
    const val = sort.key === 'title' ? (r) => r.title.toLowerCase() : (r) => r.date_start ?? Infinity;
    const out = [...rows].sort((a, b) => (val(a) < val(b) ? -1 : val(a) > val(b) ? 1 : 0));
    return sort.dir === 'asc' ? out : out.reverse();
  }, [rows, sort]);

  const pages = Math.max(1, Math.ceil(sorted.length / PAGE));
  const safePage = Math.min(page, pages - 1);
  const visible = sorted.slice(safePage * PAGE, safePage * PAGE + PAGE);

  useEffect(() => setPage(0), [tab, rows.length, sort]);

  // Map selection → switch tab, page and scroll to the row
  useEffect(() => {
    if (!selectedKey) return;
    const [kind, idStr] = selectedKey.split(':');
    if (kind !== 'bhs' && kind !== 'ant') return;
    if (kind !== tab) setTab(kind);
    const list = kind === 'bhs' ? bhs : ant;
    const val = sort.key === 'title' ? (r) => r.title.toLowerCase() : (r) => r.date_start ?? Infinity;
    const ordered = [...list].sort((a, b) => (val(a) < val(b) ? -1 : val(a) > val(b) ? 1 : 0));
    if (sort.dir === 'desc') ordered.reverse();
    const idx = ordered.findIndex((r) => r.id === Number(idStr));
    if (idx >= 0) setPage(Math.floor(idx / PAGE));
    // Scroll only inside the table box. scrollIntoView would also scroll the
    // whole page, yanking the user away from the map they just clicked.
    const t = setTimeout(() => {
      const row = rowRefs.current[selectedKey];
      const box = scrollRef.current;
      if (!row || !box) return;
      const head = box.querySelector('thead')?.offsetHeight || 0;
      const top = row.offsetTop - head;
      const bottom = row.offsetTop + row.offsetHeight;
      if (top < box.scrollTop) box.scrollTo({ top, behavior: 'smooth' });
      else if (bottom > box.scrollTop + box.clientHeight) box.scrollTo({ top: bottom - box.clientHeight, behavior: 'smooth' });
    }, 60);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedKey]);

  const SortHead = ({ k, children }) => (
    <th scope="col">
      <button
        type="button"
        className={styles.sortBtn}
        onClick={() => setSort((s) => ({ key: k, dir: s.key === k && s.dir === 'asc' ? 'desc' : 'asc' }))}
      >
        {children}
        {sort.key === k && (sort.dir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
      </button>
    </th>
  );

  return (
    <section className={styles.wrap} aria-label="Results table">
      <div className={styles.tabs} role="tablist">
        <button type="button" role="tab" aria-selected={tab === 'bhs'} className={tab === 'bhs' ? styles.tabOn : styles.tab} onClick={() => setTab('bhs')}>
          Built heritage <span>{bhs.length}</span>
        </button>
        <button type="button" role="tab" aria-selected={tab === 'ant'} className={tab === 'ant' ? styles.tabOn : styles.tab} onClick={() => setTab('ant')}>
          Antiquities <span>{ant.length}</span>
        </button>
        {pages > 1 && (
          <div className={styles.pager}>
            <span>{safePage * PAGE + 1}–{Math.min(sorted.length, (safePage + 1) * PAGE)} of {sorted.length}</span>
            <button type="button" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={safePage === 0} aria-label="Previous page"><ChevronLeft size={14} /></button>
            <button type="button" onClick={() => setPage((p) => Math.min(pages - 1, p + 1))} disabled={safePage >= pages - 1} aria-label="Next page"><ChevronRight size={14} /></button>
          </div>
        )}
      </div>

      <div className={styles.scroll} ref={scrollRef}>
        <table className={styles.table}>
          <thead>
            {tab === 'bhs' ? (
              <tr>
                <th scope="col">Code</th>
                <SortHead k="title">Title</SortHead>
                <th scope="col">Category</th>
                <th scope="col">Dynasty / period</th>
                <SortHead k="date">Date</SortHead>
                <th scope="col">State</th>
                <th scope="col">Protection</th>
                {!publicMode && <th scope="col">Status</th>}
              </tr>
            ) : (
              <tr>
                <th scope="col">Key no.</th>
                <SortHead k="title">Title</SortHead>
                <th scope="col">Category</th>
                <th scope="col">Material</th>
                <SortHead k="date">Date</SortHead>
                <th scope="col">Found</th>
                <th scope="col">Held at</th>
                {!publicMode && <th scope="col">Status</th>}
              </tr>
            )}
          </thead>
          <tbody>
            {visible.map((r) => {
              const key = `${tab}:${r.id}`;
              const sel = key === selectedKey;
              return (
                <tr
                  key={key}
                  ref={(el) => { rowRefs.current[key] = el; }}
                  className={sel ? styles.selected : undefined}
                  onClick={() => onSelect({ kind: tab, id: r.id, fly: true })}
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter') onSelect({ kind: tab, id: r.id, fly: true }); }}
                  aria-selected={sel}
                >
                  <td><span className={styles.swatch} style={{ background: r._color }} /><code>{tab === 'bhs' ? r.bh_code : r.key_no}</code></td>
                  <td className={styles.titleCell}>{r.title}</td>
                  <td>{lookup.category[r.category_id]}</td>
                  {tab === 'bhs' ? (
                    <>
                      <td>{lookup.dynasty[r.dynasty_id] || lookup.period[r.period_id]}</td>
                      <td className={styles.num}>{formatYearRange(r.date_start, r.date_end)}</td>
                      <td>{r.state}</td>
                      <td>{lookup.protection[r.protection_level]}</td>
                    </>
                  ) : (
                    <>
                      <td>{lookup.material[r.material_id]}</td>
                      <td className={styles.num}>{formatYearRange(r.date_start, r.date_end)}</td>
                      <td>{r._coords ? r.state : <span className={styles.muted}>Unknown</span>}</td>
                      <td>
                        {lookup.museum[r.museum_id]?.name.split(',')[0]}
                        {r._movedKm > 5 && <span className={styles.muted}> · {formatKm(r._movedKm)}</span>}
                      </td>
                    </>
                  )}
                  {!publicMode && <td><StatusBadge status={r.status} /></td>}
                </tr>
              );
            })}
            {visible.length === 0 && (
              <tr>
                <td colSpan={8} className={styles.empty}>No records match. Widen the time window or clear filters.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
