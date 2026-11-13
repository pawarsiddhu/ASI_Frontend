import { useEffect, useMemo, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import styles from './PublicSearchPage.module.css';

import SearchTabs from './components/SearchTabs';
import SearchFilters from './components/SearchFilters';
import ResultsGrid from './components/ResultsGrid';
import ResultDetailModal from './components/ResultDetailModal';

import {
  useListPublicAntiquitiesQuery,
  useListPublicBhsQuery,
} from './publicSearchApi';
import {
  filterRecords,
  sortByUpdatedDesc,
  uniqueStates,
} from './utils';
import { useDebounce } from '@hooks/useDebounce';

const TYPES = { ANTIQUITY: 'antiquity', BHS: 'bhs' };
const DEFAULT_TYPE = TYPES.BHS;

/**
 * PublicSearchPage — the public search entry.
 *
 * URL is the source of truth for user-visible state:
 *   ?type=bhs|antiquity   which register we're browsing
 *   ?q=<text>             free-text search
 *   ?state=<state>        state filter (BHS only)
 *
 * Both registers are prefetched only when needed. Filter, sort, and pagination
 * are all client-side (matches the project's server-doesn't-do-that pattern for
 * public data). Text search is debounced 400ms per project convention.
 */
export default function PublicSearchPage() {
  const [params, setParams] = useSearchParams();

  const type = TYPES[params.get('type')?.toUpperCase()] || DEFAULT_TYPE;
  const q = params.get('q') || '';
  const state = params.get('state') || '';

  // Local q mirror for immediate feedback while debouncing writes to the URL
  const [qLocal, setQLocal] = useState(q);
  const qDebounced = useDebounce(qLocal, 400);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);

  // Keep local q in sync when URL changes externally (e.g. tab switch resets)
  useEffect(() => setQLocal(q), [q]);

  // Push debounced q into the URL (without duplicating history entries)
  useEffect(() => {
    if (qDebounced === q) return;
    const next = new URLSearchParams(params);
    if (qDebounced) next.set('q', qDebounced);
    else next.delete('q');
    setParams(next, { replace: true });
    setPage(1);
  }, [qDebounced]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset page whenever the underlying dataset or filter changes
  useEffect(() => {
    setPage(1);
  }, [type, state]);

  // Fetch — only the active register is queried; the inactive one is skipped
  const bhsQuery = useListPublicBhsQuery(undefined, { skip: type !== TYPES.BHS });
  const antQuery = useListPublicAntiquitiesQuery(undefined, {
    skip: type !== TYPES.ANTIQUITY,
  });
  const active = type === TYPES.BHS ? bhsQuery : antQuery;
  const records = active.data || [];

  const filtered = useMemo(
    () => sortByUpdatedDesc(filterRecords(records, { q: qDebounced, state })),
    [records, qDebounced, state]
  );

  const states = useMemo(() => uniqueStates(records), [records]);
  const hasActiveFilter = Boolean(qDebounced || state);

  // --- URL param setters -------------------------------------------------

  const setType = useCallback(
    (nextType) => {
      const next = new URLSearchParams(params);
      next.set('type', nextType);
      // Clearing q/state on tab switch avoids "state=Odisha applied to Antiquity"
      next.delete('state');
      next.delete('q');
      setParams(next);
    },
    [params, setParams]
  );

  const setStateParam = useCallback(
    (nextState) => {
      const next = new URLSearchParams(params);
      if (nextState) next.set('state', nextState);
      else next.delete('state');
      setParams(next, { replace: true });
    },
    [params, setParams]
  );

  const clearAll = useCallback(() => {
    setQLocal('');
    const next = new URLSearchParams(params);
    next.delete('q');
    next.delete('state');
    setParams(next, { replace: true });
  }, [params, setParams]);

  const isBhs = type === TYPES.BHS;
  const heading = isBhs ? 'Built Heritage & Sites' : 'National Antiquities';
  const lead = isBhs
    ? 'A public reference of documented monuments — temples, forts, stepwells, and civic architecture — verified and published to the national register.'
    : 'A public reference of catalogued antiquities — sculpture, coins, manuscripts, and ritual objects — verified and published to the national register.';

  return (
    <div className={styles.page}>
      <section className={styles.head}>
        <div className={styles.headInner}>
          <div className={styles.eyebrow}>
            <span className={styles.eyebrowHair} aria-hidden="true" />
            <span>Public archive</span>
          </div>
          <h1 className={styles.title}>{heading}</h1>
          <p className={styles.lead}>{lead}</p>

          <div className={styles.tabsRow}>
            <SearchTabs
              value={type}
              onChange={setType}
              counts={{
                bhs: bhsQuery.data?.length,
                antiquity: antQuery.data?.length,
              }}
            />
          </div>
        </div>
      </section>

      <section className={styles.body}>
        <div className={styles.bodyInner}>
          <div className={styles.filtersRow}>
            <SearchFilters
              q={qLocal}
              onQChange={setQLocal}
              state={state}
              onStateChange={setStateParam}
              states={states}
              showStateFilter={isBhs}
            />
          </div>

          <div className={styles.metaRow}>
            <div className={styles.count}>
              {active.isLoading
                ? 'Loading…'
                : `${filtered.length} record${filtered.length === 1 ? '' : 's'}`}
              {hasActiveFilter && (
                <button
                  type="button"
                  className={styles.clearLink}
                  onClick={clearAll}
                >
                  Clear filters
                </button>
              )}
            </div>
            <div className={styles.sortNote}>Latest first</div>
          </div>

          <ResultsGrid
            records={filtered}
            isLoading={active.isLoading}
            isError={active.isError}
            onRetry={() => active.refetch()}
            onSelect={setSelected}
            page={page}
            onPageChange={setPage}
            hasActiveFilter={hasActiveFilter}
          />
        </div>
      </section>

      {selected && (
        <ResultDetailModal record={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
