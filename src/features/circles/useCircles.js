import { useMemo } from 'react';
import { useGetCirclesQuery } from './circlesApi';
import {
  toCircleOptions,
  getCircleLabel,
  getCircleState,
  FALLBACK_CIRCLE_IDS,
} from './circleMetadata';

/**
 * useCircles — the canonical way to read the list of ASI circles inside
 * React components. Backed by GET /circles.
 *
 * Returns a stable shape regardless of loading state so consumers can
 * always spread `options` into a <Select> without null-checks:
 *
 *   const { options, isLoading } = useCircles();
 *   <Select options={options} disabled={isLoading} />
 *
 * Soft fallback: if the fetch errors (backend down, ledger unrelated but
 * gateway flaky, etc.), we return the small FALLBACK_CIRCLE_IDS list and
 * flip `isFallback: true`. Forms stay usable during a demo. A console
 * warning fires once so the outage doesn't stay silent.
 *
 * @param {object} [opts]
 * @param {boolean} [opts.skip=false] - don't fire the fetch (rarely needed;
 *   fetch is deduped by RTK Query so calling from many components is fine)
 */
export function useCircles({ skip = false } = {}) {
  const { data, isLoading, isFetching, isError, error, refetch } =
    useGetCirclesQuery(undefined, { skip });

  // Warn once per error so the console isn't spammed on background refetches.
  // Guarded so it fires only when we actually flip into fallback.
  if (isError && !warnedForError) {
    warnedForError = true;
    // eslint-disable-next-line no-console
    console.warn(
      '[useCircles] GET /circles failed — using fallback list.',
      error
    );
  }

  const ids = useMemo(() => {
    if (Array.isArray(data) && data.length > 0) return data;
    if (isError) return FALLBACK_CIRCLE_IDS;
    return []; // still loading — return empty so <Select> renders "no options" briefly
  }, [data, isError]);

  const options = useMemo(() => toCircleOptions(ids), [ids]);

  const circles = useMemo(
    () =>
      ids.map((id) => ({
        id,
        name: getCircleLabel(id),
        state: getCircleState(id),
      })),
    [ids]
  );

  return {
    /** raw ASI circle codes, sorted server order preserved */
    ids,
    /** enriched circle objects: {id, name, state} */
    circles,
    /** <Select>-ready options, alphabetised by label */
    options,
    /** true only until the first response (fetch or error) resolves */
    isLoading: isLoading && ids.length === 0,
    /** true whenever a request is in flight (initial or background) */
    isFetching,
    /** true if the request errored AND we're serving the hardcoded fallback */
    isFallback: isError,
    /** allow consumers to force a retry (rare, but useful for a manual UI) */
    refetch,
  };
}

// Module-level flag so we log the fallback warning once per session, not
// once per component that consumes the hook.
let warnedForError = false;
