import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Download, Printer } from 'lucide-react';

import Button from '@components/Button';
import Card from '@components/Card';
import Pagination from '@components/Pagination';
import Badge from '@components/Badge';
import { useToast } from '@components/Toast';

import FilterBar from './components/FilterBar';
import AntiquitiesTable from './components/AntiquitiesTable';

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
  [ROLES.SUPERVISOR]: 'Antiquities · Team',
  [ROLES.ADMIN]: 'All Antiquities',
  [ROLES.SUPERADMIN]: 'All Antiquities',
  [ROLES.RD]: 'Circle Antiquities',
};

const DEFAULT_FILTERS = {
  search: '',
  status: '',
  circle: '',
  category: '',
};

export default function AntiquitiesListPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { role, can } = useAuth();

  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Debounce the search so we don't refetch on every keystroke.
  // Other filters aren't debounced because dropdown changes are discrete.
  const debouncedSearch = useDebounce(filters.search, 300);

  // Whenever the effective query changes, reset to page 1.
  // useMemo builds the query object so we don't send undefined params.
  const queryParams = useMemo(() => {
    const params = {
      page,
      pageSize,
      sortBy,
      sortOrder,
    };
    if (debouncedSearch) params.search = debouncedSearch;
    if (filters.status) params.status = filters.status;
    if (filters.circle) params.circle = filters.circle;
    if (filters.category) params.category = filters.category;
    return params;
  }, [
    page,
    pageSize,
    sortBy,
    sortOrder,
    debouncedSearch,
    filters.status,
    filters.circle,
    filters.category,
  ]);

  const { data, isLoading, isFetching, isError, refetch } =
    useListAntiquitiesQuery(queryParams);

  // Handlers ---------------------------------------------------------------

  const patchFilters = (patch) => {
    setFilters((prev) => ({ ...prev, ...patch }));
    setPage(1); // reset to page 1 whenever any filter changes
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
    // Detail page is Phase 3 of Day 2 — for now the toast confirms routing works.
    toast.info(`Detail view for ${item.accessionNo} — coming in Day 2 Phase 3`);
    // navigate(`/records/antiquities/${item.id}`);
  };

  const handleCreate = () => {
    navigate('/records/antiquities/new');
  };

  const handleExport = () => {
    toast.info('Export — coming in Day 4');
  };

  const handlePrint = () => {
    toast.info('Print view — coming in Day 4');
  };

  // The Circle filter is redundant for users who only see their own circle.
  const canFilterByCircle =
    role === ROLES.ADMIN || role === ROLES.SUPERADMIN;

  return (
    <div className={styles.wrapper}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>{TITLE_BY_ROLE[role] || 'Antiquities'}</h1>
          <p className={styles.subtitle}>
            {data?.total !== undefined && !isLoading ? (
              <>
                <strong>{data.total.toLocaleString('en-IN')}</strong>{' '}
                {data.total === 1 ? 'record' : 'records'}
                {filters.search || filters.status || filters.circle || filters.category ? (
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
            leftIcon={<Printer size={12} />}
            onClick={handlePrint}
          >
            Print
          </Button>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Download size={12} />}
            onClick={handleExport}
          >
            Export
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
            items={data?.items || []}
            isLoading={isLoading}
            isFetching={isFetching}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
            onRowClick={handleRowClick}
          />
        )}

        <Pagination
          page={data?.page || 1}
          totalPages={data?.totalPages || 1}
          pageSize={pageSize}
          total={data?.total || 0}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </Card>
    </div>
  );
}
