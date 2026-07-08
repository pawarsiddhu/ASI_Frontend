import { http, HttpResponse, delay } from 'msw';
import { findByEmail, findById } from './data/users';
import { getDashboardData } from './data/dashboard';
import { antiquities, findAntiquityById } from './data/antiquities';
import { ROLES } from '@utils/constants';

/**
 * Fake JWT format: `header.payload.signature`
 *   - header: static "fake-jwt"
 *   - payload: base64url({ sub, role, exp })
 *   - signature: static "sig"
 * Not secure — just structurally similar so the frontend code paths
 * (parsing, expiry checks) match production.
 */
function makeToken(user) {
  const payload = {
    sub: user.id,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24h
    iat: Math.floor(Date.now() / 1000),
  };
  const encoded = btoa(JSON.stringify(payload))
    .replace(/=+$/, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  return `fake-jwt.${encoded}.sig`;
}

function decodeToken(token) {
  try {
    const [, payload] = token.split('.');
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(normalized));
  } catch {
    return null;
  }
}

function getBearerToken(request) {
  const auth = request.headers.get('Authorization') || '';
  if (!auth.startsWith('Bearer ')) return null;
  return auth.slice(7);
}

export const handlers = [
  // ---------- POST /api/auth/login ----------
  http.post('/api/auth/login', async ({ request }) => {
    await delay(400); // realistic latency for the loading state
    const body = await request.json().catch(() => ({}));
    const { email, password } = body;

    const user = findByEmail(email);
    if (!user || password !== 'password') {
      return HttpResponse.json(
        { message: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    return HttpResponse.json({
      token: makeToken(user),
      user,
    });
  }),

  // ---------- GET /api/auth/me ----------
  // Called on app boot with the persisted token to hydrate the current user.
  http.get('/api/auth/me', async ({ request }) => {
    await delay(200);
    const token = getBearerToken(request);
    if (!token) {
      return HttpResponse.json({ message: 'Missing token.' }, { status: 401 });
    }
    const payload = decodeToken(token);
    if (!payload || (payload.exp && payload.exp * 1000 < Date.now())) {
      return HttpResponse.json(
        { message: 'Token expired or invalid.' },
        { status: 401 }
      );
    }
    const user = findById(payload.sub);
    if (!user) {
      return HttpResponse.json({ message: 'User not found.' }, { status: 401 });
    }
    return HttpResponse.json({ user });
  }),

  // ---------- POST /api/auth/logout ----------
  // Server-side logout is a no-op in mock land; the frontend clears its state.
  http.post('/api/auth/logout', async () => {
    await delay(120);
    return HttpResponse.json({ ok: true });
  }),

  // ---------- GET /api/dashboard ----------
  // Returns role-specific stats + activity feed + optional chart data.
  // Role is derived from the JWT — the frontend doesn't send it.
  http.get('/api/dashboard', async ({ request }) => {
    await delay(600); // slow enough to see the loading skeletons
    const token = getBearerToken(request);
    if (!token) {
      return HttpResponse.json({ message: 'Missing token.' }, { status: 401 });
    }
    const payload = decodeToken(token);
    if (!payload) {
      return HttpResponse.json({ message: 'Invalid token.' }, { status: 401 });
    }
    return HttpResponse.json(getDashboardData(payload.role));
  }),

  // ---------- GET /api/antiquities ----------
  // Paginated, filterable, sortable, searchable list.
  // Query params:
  //   page (1-based), pageSize
  //   search, status, circle, category
  //   sortBy (updatedAt|recordedAt|name|status), sortOrder (asc|desc)
  //
  // Scope by role (derived from JWT):
  //   operator  → only records they recorded
  //   supervisor / rd → records in their circle
  //   admin / superadmin → all records
  http.get('/api/antiquities', async ({ request }) => {
    await delay(500);
    const token = getBearerToken(request);
    if (!token) {
      return HttpResponse.json({ message: 'Missing token.' }, { status: 401 });
    }
    const payload = decodeToken(token);
    if (!payload) {
      return HttpResponse.json({ message: 'Invalid token.' }, { status: 401 });
    }
    const user = findById(payload.sub);

    // ---- 1. Scope by role ----
    let scoped = antiquities;
    if (payload.role === ROLES.OPERATOR) {
      scoped = scoped.filter((a) => a.recordedBy.id === user.id);
    } else if (
      payload.role === ROLES.SUPERVISOR ||
      payload.role === ROLES.RD
    ) {
      scoped = scoped.filter((a) => a.circle.id === user.circleId);
    }
    // admin + superadmin → no additional scope filter

    // ---- 2. Filters ----
    const url = new URL(request.url);
    const search = (url.searchParams.get('search') || '').trim().toLowerCase();
    const status = url.searchParams.get('status') || '';
    const circle = url.searchParams.get('circle') || '';
    const category = url.searchParams.get('category') || '';

    let filtered = scoped;
    if (search) {
      filtered = filtered.filter(
        (a) =>
          a.name.toLowerCase().includes(search) ||
          a.accessionNo.toLowerCase().includes(search) ||
          a.id.toLowerCase().includes(search)
      );
    }
    if (status) filtered = filtered.filter((a) => a.status === status);
    if (circle) filtered = filtered.filter((a) => a.circle.id === circle);
    if (category) filtered = filtered.filter((a) => a.category === category);

    // ---- 3. Sort ----
    const sortBy = url.searchParams.get('sortBy') || 'updatedAt';
    const sortOrder = url.searchParams.get('sortOrder') || 'desc';
    filtered = [...filtered].sort((a, b) => {
      const av = getSortValue(a, sortBy);
      const bv = getSortValue(b, sortBy);
      if (av < bv) return sortOrder === 'asc' ? -1 : 1;
      if (av > bv) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    // ---- 4. Paginate ----
    const total = filtered.length;
    const page = Math.max(1, parseInt(url.searchParams.get('page'), 10) || 1);
    const pageSize = Math.max(
      1,
      parseInt(url.searchParams.get('pageSize'), 10) || 25
    );
    const start = (page - 1) * pageSize;
    const items = filtered.slice(start, start + pageSize);

    return HttpResponse.json({
      items,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    });
  }),

  // ---------- GET /api/antiquities/:id ----------
  http.get('/api/antiquities/:id', async ({ request, params }) => {
    await delay(300);
    const token = getBearerToken(request);
    if (!token) {
      return HttpResponse.json({ message: 'Missing token.' }, { status: 401 });
    }
    const item = findAntiquityById(params.id);
    if (!item) {
      return HttpResponse.json(
        { message: 'Antiquity not found.' },
        { status: 404 }
      );
    }
    return HttpResponse.json(item);
  }),

  // ---------- POST /api/antiquities ----------
  // Creates a new draft record. Backend fills in id, recordedBy (from JWT),
  // recordedAt, updatedAt, and initial status = draft.
  http.post('/api/antiquities', async ({ request }) => {
    await delay(500);
    const token = getBearerToken(request);
    if (!token) {
      return HttpResponse.json({ message: 'Missing token.' }, { status: 401 });
    }
    const payload = decodeToken(token);
    if (!payload) {
      return HttpResponse.json({ message: 'Invalid token.' }, { status: 401 });
    }
    const user = findById(payload.sub);
    if (!user) {
      return HttpResponse.json({ message: 'User not found.' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));

    // Minimal server-side validation — mirrors the client rules.
    if (!body.name?.trim()) {
      return HttpResponse.json(
        { message: 'Name is required.' },
        { status: 400 }
      );
    }

    // Find the matching circle object so downstream list queries work
    // (they filter by circle.id).
    const circles = antiquities.map((a) => a.circle);
    const circleObj = circles.find((c) => c.id === body.circle) || {
      id: body.circle,
      name: body.circle,
    };

    // Build the record shape the list expects.
    const nowIso = new Date().toISOString();
    const newRecord = {
      id: `R-2026-${String(1200 + antiquities.length).padStart(4, '0')}`,
      accessionNo: body.accessionNo || '',
      name: body.name,
      category: body.category,
      subCategory: body.subCategory || '',
      material: body.material,
      condition: body.condition,
      dimensions: {
        h: body.height || 0,
        w: body.width || 0,
        d: body.depth || 0,
        unit: 'cm',
      },
      weight: { value: body.weight || 0, unit: 'g' },
      period: body.period,
      culturalAffiliation: body.culturalAffiliation,
      provenance: body.provenance || '',
      circle: circleObj,
      museumName: body.museumName || '',
      currentLocation: body.currentLocation || '',
      sourceOfAcquisition: body.sourceOfAcquisition || '',
      acquisitionDate: body.acquisitionDate || null,
      identificationMarks: body.identificationMarks || '',
      remarks: body.remarks || '',
      recordedBy: { id: user.id, name: user.name },
      recordedAt: nowIso,
      updatedAt: nowIso,
      status: 'draft',
      images: [],
    };

    // Push to the in-memory store — new record appears in the list right away.
    antiquities.unshift(newRecord);

    return HttpResponse.json(newRecord, { status: 201 });
  }),
];

// ---- Helpers ----
function getSortValue(record, key) {
  if (key === 'name' || key === 'status') return record[key];
  // Dates as timestamps for comparison
  return new Date(record[key] || 0).getTime();
}
