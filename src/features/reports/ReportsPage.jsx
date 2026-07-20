import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Download, RotateCw, AlertCircle, FileBarChart } from 'lucide-react';

import Button from '@components/Button';
import Card from '@components/Card';
import EmptyState from '@components/EmptyState';
import { useToast } from '@components/Toast';
import SimpleBarChart from '@features/dashboard/components/SimpleBarChart';

import { useAuth } from '@hooks/useAuth';
import { useGetAntiquityReportQuery } from './reportsApi';
import {
  DIMENSIONS_BY_ROLE,
  DIMENSION_META,
  DEFAULT_PRESET,
  presetToRange,
} from './schema';
import { exportReportAsCsv } from './utils/exportReportCsv';

import ReportFilters from './components/ReportFilters';
import ReportKPIs from './components/ReportKPIs';
import ReportTable from './components/ReportTable';

import styles from './ReportsPage.module.css';

/**
 * ReportsPage — Antiquities reports (Chunk A).
 *
 * State model:
 *   { dimension, preset, from, to }
 *
 * Dimension tabs across the top let the user pivot quickly.
 * The date range picker (in ReportFilters) drives the API's from/to params.
 * Below: KPI cards → chart (top-5) → matrix table with export.
 *
 * Dashboards deep-link into this page with ?dimension=X — the URL param
 * seeds initial state on mount but isn't re-synced back after that (keeps
 * the address bar clean while the user explores).
 */
export default function ReportsPage() {
  const { role } = useAuth();
  const toast = useToast();
  const [searchParams] = useSearchParams();

  const availableDimensions = DIMENSIONS_BY_ROLE[role] || [];
  const defaultDimension = availableDimensions[0];

  // Seed from URL params once
  const initial = useMemo(
    () => ({
      dimension: searchParams.get('dimension') || defaultDimension,
      preset: searchParams.get('preset') || DEFAULT_PRESET,
      from: searchParams.get('from') || '',
      to: searchParams.get('to') || '',
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  const [state, setState] = useState(initial);

  // Derive the effective from/to for the API
  const effectiveRange = useMemo(() => {
    if (state.preset === 'custom')
      return { from: state.from || null, to: state.to || null };
    return presetToRange(state.preset);
  }, [state.preset, state.from, state.to]);

  const queryArgs = useMemo(
    () => ({
      dimension: state.dimension,
      ...(effectiveRange.from ? { from: effectiveRange.from } : {}),
      ...(effectiveRange.to ? { to: effectiveRange.to } : {}),
    }),
    [state.dimension, effectiveRange.from, effectiveRange.to]
  );

  const { data, isLoading, isFetching, isError, refetch } =
    useGetAntiquityReportQuery(queryArgs);

  // Guard — no dimensions available for this role
  if (!availableDimensions.length) {
    return (
      <div className={styles.wrapper}>
        <Card>
          <Card.Body>
            <EmptyState
              icon={<FileBarChart size={28} />}
              title="No reports available"
              description="Reports for your role haven't been set up yet. Talk to your administrator."
            />
          </Card.Body>
        </Card>
      </div>
    );
  }

  const handleTabChange = (dim) =>
    setState((s) => ({ ...s, dimension: dim }));

  const handleReset = () =>
    setState({
      dimension: defaultDimension,
      preset: DEFAULT_PRESET,
      from: '',
      to: '',
    });

  const handleExport = () => {
    if (!data?.rows?.length) {
      toast.warning('Nothing to export in the current view.');
      return;
    }
    exportReportAsCsv(data);
    toast.success(
      `Exported ${data.rows.length} row${data.rows.length === 1 ? '' : 's'} as CSV.`
    );
  };

  // Chart data — top 5 groups by total, plus rest bundled if there are more
  const chartData = useMemo(() => {
    if (!data?.rows?.length) return [];
    const top = data.rows.slice(0, 5).map((r) => ({
      label: r.label,
      value: r.total,
    }));
    const rest = data.rows.slice(5).reduce((s, r) => s + r.total, 0);
    if (rest > 0) top.push({ label: `Other (${data.rows.length - 5})`, value: rest });
    return top;
  }, [data]);

  const activeMeta = DIMENSION_META[state.dimension];

  return (
    <div className={styles.wrapper}>
      {/* -------- Header -------- */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Antiquities Reports</h1>
          <p className={styles.subtitle}>
            Aggregate breakdowns by circle, museum, state, and workflow status.
            Filter by date range, then export or drill down.
          </p>
        </div>
        <div className={styles.headerActions}>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Download size={12} />}
            onClick={handleExport}
            disabled={isLoading || !data?.rows?.length}
          >
            Export CSV
          </Button>
        </div>
      </div>

      {/* -------- Dimension tabs -------- */}
      <div className={styles.tabs} role="tablist" aria-label="Report dimension">
        {availableDimensions.map((dim) => {
          const meta = DIMENSION_META[dim];
          const active = state.dimension === dim;
          return (
            <button
              key={dim}
              type="button"
              role="tab"
              aria-selected={active}
              className={`${styles.tab} ${active ? styles.tabActive : ''}`}
              onClick={() => handleTabChange(dim)}
            >
              {meta.label}
            </button>
          );
        })}
      </div>

      {/* -------- Filters -------- */}
      <ReportFilters
        dimensions={availableDimensions}
        value={state}
        onChange={setState}
        onReset={handleReset}
        isLoading={isLoading}
      />

      {/* -------- Error state -------- */}
      {isError && (
        <Card>
          <Card.Body>
            <EmptyState
              icon={<AlertCircle size={28} />}
              title="Could not load report"
              description="Please try again in a moment."
              action={
                <Button
                  variant="secondary"
                  leftIcon={<RotateCw size={14} />}
                  onClick={refetch}
                >
                  Retry
                </Button>
              }
            />
          </Card.Body>
        </Card>
      )}

      {!isError && (
        <>
          {/* -------- KPIs -------- */}
          <ReportKPIs totals={data?.totals} isLoading={isLoading} />

          {/* -------- Chart (top 5 in this dimension) -------- */}
          {(isLoading || chartData.length > 0) && (
            <SimpleBarChart
              title={`Top ${chartData.length || 5} · ${activeMeta.label}`}
              subtitle={activeMeta.description}
              data={chartData}
              isLoading={isLoading}
            />
          )}

          {/* -------- Table -------- */}
          <ReportTable
            rows={data?.rows || []}
            totals={data?.totals}
            dimension={state.dimension}
            isLoading={isLoading}
            isFetching={isFetching && !isLoading}
          />
        </>
      )}
    </div>
  );
}
