import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Download } from 'lucide-react';

import Button from '@components/Button';
import Card from '@components/Card';
import Pagination from '@components/Pagination';
import Badge from '@components/Badge';
import { useToast } from '@components/Toast';

import FilterBar from './components/FilterBar';
import AntiquitiesTable from './components/AntiquitiesTable';
import { exportItemsAsCsv } from './utils/exportCsv';

import { useListAntiquitiesQuery } from './antiquitiesApi';
import { useAuth } from '@hooks/useAuth';
import { useDebounce } from '@hooks/useDebounce';
import { ROLES } from '@utils/constants';

import styles from './AntiquitiesListPage.module.css';

/**
 * Page title varies by role for clarity in the browser tab / breadcrumbs.
 */
const TITLE_BY_ROLE = {
  [ROLES.OPERATOR]: 'My Antiquities',
  [ROLES.SUPERVISOR]: 'All Antiquities',
  [ROLES.ADMIN]: 'All Antiquities',
  [ROLES.SUPERADMIN]: 'All Antiquities',
  [ROLES.RD]: 'All Antiquities',
};

const DEFAULT_FILTERS = {
  search: '',
  status: '',
  circle: '',
};

/**
 * Sortable column keys map to fields on the RecordSummary shape:
 *   title       → item.title
 *   status      → item.status
 *   created_at  → item.created_at
 */
const SORT_ACCESSORS = {
  title: (r) => (r.title || '').toLowerCase(),
  status: (r) => r.status || '',
  created_at: (r) => r.created_at || '',
};

export default function AntiquitiesListPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { role, can } = useAuth();

  // URL params can pre-seed filter state (e.g. dashboard deep-links like
  // /records/antiquities?status=PENDING_ADMIN). Read once on mount; after that
  // filter state lives locally and doesn't sync back (keeps the URL clean
  // during ad-hoc filtering).
  const [searchParams] = useSearchParams();
  const initialFilters = useMemo(
    () => ({
      search: searchParams.get('search') || '',
      status: searchParams.get('status') || '',
      circle: searchParams.get('circle') || '',
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const [filters, setFilters] = useState(initialFilters);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const debouncedSearch = useDebounce(filters.search, 300);

  // Server-side params: ONLY the three the backend accepts on GET /records.
  // The `type: 'ANTIQUITY'` discriminator is added by antiquitiesApi.
  const queryParams = useMemo(() => {
    const params = {};
    if (filters.status) params.status = filters.status;
    if (filters.circle) params.circle = filters.circle;
    return params;
  }, [filters.status, filters.circle]);

  const {
    data: allItems,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useListAntiquitiesQuery(queryParams);

  // Client-side search + sort + paginate. useMemo so we don't rework this on
  // every render — only when the raw list, filters, or sort changes.
  const searched = useMemo(() => {
    const items = allItems || [];
    if (!debouncedSearch) return items;
    const q = debouncedSearch.trim().toLowerCase();
    return items.filter((r) => {
      const t = (r.title || '').toLowerCase();
      const id = String(r.id);
      return t.includes(q) || id.includes(q);
    });
  }, [allItems, debouncedSearch]);

  const sorted = useMemo(() => {
    const accessor = SORT_ACCESSORS[sortBy] || SORT_ACCESSORS.created_at;
    // Copy first — Array.sort mutates, and RTK Query results are frozen.
    const copy = [...searched];
    copy.sort((a, b) => {
      const av = accessor(a);
      const bv = accessor(b);
      if (av < bv) return sortOrder === 'asc' ? -1 : 1;
      if (av > bv) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    return copy;
  }, [searched, sortBy, sortOrder]);

  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  // Clamp page in case a filter change shrinks the result set below the
  // current page number.
  const safePage = Math.min(page, totalPages);
  const visibleItems = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, safePage, pageSize]);

  // Handlers ---------------------------------------------------------------

  const patchFilters = (patch) => {
    setFilters((prev) => ({ ...prev, ...patch }));
    setPage(1);
  };

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setPage(1);
  };

  const handleSort = (key) => {
    if (sortBy === key) {
      setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(key);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const handleRowClick = (item) => {
    navigate(`/records/antiquities/${item.id}`);
  };

  const handleCreate = () => {
    navigate('/records/antiquities/new');
  };

  const handleExport = () => {
    if (!sorted.length) {
      toast.warning('Nothing to export.');
      return;
    }
    // Export the entire filtered+sorted set, not just the current page —
    // users almost always want "download what I'm looking at as a filter",
    // not "download this page of 25".
    exportItemsAsCsv(sorted, { scope: 'antiquities' });
    toast.success(
      `Exported ${sorted.length} record${sorted.length === 1 ? '' : 's'} as CSV.`
    );
  };

  // Operator sees only their own records (server-enforced), so the Circle
  // filter is meaningless for them.
  const canFilterByCircle = role !== ROLES.OPERATOR;

  const filtersActive = Boolean(
    filters.search || filters.status || filters.circle
  );

  return (
    <div className={styles.wrapper}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>{TITLE_BY_ROLE[role] || 'Antiquities'}</h1>
          <p className={styles.subtitle}>
            {!isLoading ? (
              <>
                <strong>{total.toLocaleString('en-IN')}</strong>{' '}
                {total === 1 ? 'record' : 'records'}
                {filtersActive ? (
                  <Badge size="sm" variant="primary">
                    filtered
                  </Badge>
                ) : null}
              </>
            ) : (
              'Movable objects — sculpture, coin, manuscript, pottery, and more'
            )}
          </p>
        </div>

        <div className={styles.headerActions}>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Download size={12} />}
            onClick={handleExport}
            disabled={!sorted.length}
          >
            Export CSV
          </Button>
          {can('record.create') && (
            <Button
              size="sm"
              leftIcon={<Plus size={12} />}
              onClick={handleCreate}
            >
              New Record
            </Button>
          )}
        </div>
      </div>

      <Card>
        <FilterBar
          filters={filters}
          onChange={patchFilters}
          onReset={resetFilters}
          canFilterByCircle={canFilterByCircle}
        />

        {isError ? (
          <div className={styles.errorBox}>
            <p>Could not load records. Please try again.</p>
            <Button onClick={refetch} size="sm">
              Retry
            </Button>
          </div>
        ) : (
          <AntiquitiesTable
            items={visibleItems}
            isLoading={isLoading}
            isFetching={isFetching}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
            onRowClick={handleRowClick}
          />
        )}

        <Pagination
          page={safePage}
          totalPages={totalPages}
          pageSize={pageSize}
          total={total}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
        />
      </Card>
    </div>
  );
}
