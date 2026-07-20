import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Download } from 'lucide-react';

import Button from '@components/Button';
import Card from '@components/Card';
import Pagination from '@components/Pagination';
import Badge from '@components/Badge';
import { useToast } from '@components/Toast';

// FilterBar reads STATUS_OPTIONS / CIRCLE_OPTIONS from antiquities schema —
// those enums are identical for BHS (both live on unified /records), so the
// same component works verbatim. No BHS-specific fork needed.
import FilterBar from '@features/antiquities/components/FilterBar';

import BHSTable from './components/BHSTable';
import { useListBHSQuery } from './bhsApi';
import { useAuth } from '@hooks/useAuth';
import { useDebounce } from '@hooks/useDebounce';
import { ROLES } from '@utils/constants';

import styles from './BHSListPage.module.css';

const TITLE_BY_ROLE = {
  [ROLES.OPERATOR]: 'My Built Heritage',
  [ROLES.SUPERVISOR]: 'All Built Heritage',
  [ROLES.ADMIN]: 'All Built Heritage',
  [ROLES.SUPERADMIN]: 'All Built Heritage',
  [ROLES.RD]: 'All Built Heritage',
};

const DEFAULT_FILTERS = { search: '', status: '', circle: '' };

const SORT_ACCESSORS = {
  title: (r) => (r.title || '').toLowerCase(),
  status: (r) => r.status || '',
  created_at: (r) => r.created_at || '',
};

export default function BHSListPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { role, can } = useAuth();

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
  } = useListBHSQuery(queryParams);

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
  const safePage = Math.min(page, totalPages);
  const visibleItems = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, safePage, pageSize]);

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
  const handleRowClick = (item) => navigate(`/records/bhs/${item.id}`);
  const handleCreate = () => navigate('/records/bhs/new');

  const handleExport = () => {
    if (!sorted.length) {
      toast.warning('Nothing to export.');
      return;
    }
    // Simple CSV export inline — same shape as antiquities' exportCsv util
    // but without a util file dependency.
    const headers = ['id', 'title', 'circle', 'status', 'created_at'];
    const rows = sorted.map((r) =>
      headers.map((h) => JSON.stringify(r[h] ?? '')).join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bhs-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(
      `Exported ${sorted.length} record${sorted.length === 1 ? '' : 's'} as CSV.`
    );
  };

  const canFilterByCircle = role !== ROLES.OPERATOR;
  const filtersActive = Boolean(
    filters.search || filters.status || filters.circle
  );

  return (
    <div className={styles.wrapper}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>
            {TITLE_BY_ROLE[role] || 'Built Heritage'}
          </h1>
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
              'Immovable heritage — temples, forts, stepwells, caves, and more'
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
            <Button size="sm" leftIcon={<Plus size={12} />} onClick={handleCreate}>
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
          <BHSTable
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
