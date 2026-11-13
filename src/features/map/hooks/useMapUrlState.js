import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { boxRing } from '../utils/geo';

/**
 * Map state ↔ URL. Every filter, the time window, the spatial selection,
 * the selected record and the camera live in the query string, so a
 * researcher can bookmark or cite an exact view ("see this map").
 *
 * The URL is read once on mount and then written (debounced, replace-mode,
 * so the back button isn't flooded) whenever state changes.
 */

export const TIME_MIN = -3300;
export const TIME_MAX = 1950;

export const DEFAULT_MAP_STATE = {
  theme: 'period',
  showBhs: true,
  showAnt: true,
  antMode: 'found', // 'found' | 'held'
  dispersal: false,
  cluster: false,
  heat: false,
  from: TIME_MIN,
  to: TIME_MAX,
  periods: [],
  affiliations: [],
  protection: [],
  statuses: [],
  category: '',
  dynasty: '',
  state: '',
  circle: '',
  q: '',
  shape: null,
  sel: null, // 'bhs:9001' | 'ant:7012'
  view: null, // { center: [lng, lat], zoom }
  pub: false,
};

const list = (v) => (v ? v.split(',').filter(Boolean) : []);
const num = (v, d) => (v == null || v === '' || Number.isNaN(Number(v)) ? d : Number(v));
const bool = (v, d) => (v == null ? d : v === '1');

function parse(sp) {
  const s = { ...DEFAULT_MAP_STATE };
  s.theme = sp.get('theme') || s.theme;
  s.showBhs = bool(sp.get('bhs'), s.showBhs);
  s.showAnt = bool(sp.get('ant'), s.showAnt);
  s.antMode = sp.get('amode') === 'held' ? 'held' : 'found';
  s.dispersal = bool(sp.get('disp'), s.dispersal);
  s.cluster = bool(sp.get('clu'), s.cluster);
  s.heat = bool(sp.get('heat'), s.heat);
  s.from = num(sp.get('from'), TIME_MIN);
  s.to = num(sp.get('to'), TIME_MAX);
  s.periods = list(sp.get('per'));
  s.affiliations = list(sp.get('aff'));
  s.protection = list(sp.get('prot'));
  s.statuses = list(sp.get('st'));
  s.category = sp.get('cat') || '';
  s.dynasty = sp.get('dyn') || '';
  s.state = sp.get('state') || '';
  s.circle = sp.get('circle') || '';
  s.q = sp.get('q') || '';
  s.sel = sp.get('sel') || null;
  s.pub = bool(sp.get('pub'), false);

  const shape = sp.get('shape');
  if (shape) {
    const [kind, rest] = shape.split(':');
    const n = (rest || '').split(',').map(Number);
    if (kind === 'r' && n.length === 3 && n.every(Number.isFinite)) {
      s.shape = { kind: 'radius', center: [n[0], n[1]], radiusKm: n[2] };
    } else if (kind === 'b' && n.length === 4 && n.every(Number.isFinite)) {
      s.shape = { kind: 'box', bounds: n, ring: boxRing([n[0], n[1]], [n[2], n[3]]) };
    }
  }
  const view = sp.get('v');
  if (view) {
    const n = view.split(',').map(Number);
    if (n.length === 3 && n.every(Number.isFinite)) s.view = { center: [n[0], n[1]], zoom: n[2] };
  }
  return s;
}

function serialize(s) {
  const out = {};
  const d = DEFAULT_MAP_STATE;
  if (s.theme !== d.theme) out.theme = s.theme;
  if (s.showBhs !== d.showBhs) out.bhs = s.showBhs ? '1' : '0';
  if (s.showAnt !== d.showAnt) out.ant = s.showAnt ? '1' : '0';
  if (s.antMode !== d.antMode) out.amode = s.antMode;
  if (s.dispersal) out.disp = '1';
  if (s.cluster) out.clu = '1';
  if (s.heat) out.heat = '1';
  if (s.from !== TIME_MIN) out.from = String(s.from);
  if (s.to !== TIME_MAX) out.to = String(s.to);
  if (s.periods.length) out.per = s.periods.join(',');
  if (s.affiliations.length) out.aff = s.affiliations.join(',');
  if (s.protection.length) out.prot = s.protection.join(',');
  if (s.statuses.length) out.st = s.statuses.join(',');
  if (s.category) out.cat = s.category;
  if (s.dynasty) out.dyn = s.dynasty;
  if (s.state) out.state = s.state;
  if (s.circle) out.circle = s.circle;
  if (s.q) out.q = s.q;
  if (s.sel) out.sel = s.sel;
  if (s.pub) out.pub = '1';
  if (s.shape?.kind === 'radius') {
    const [lng, lat] = s.shape.center;
    out.shape = `r:${lng.toFixed(4)},${lat.toFixed(4)},${s.shape.radiusKm.toFixed(1)}`;
  } else if (s.shape?.kind === 'box') {
    out.shape = `b:${s.shape.bounds.map((v) => v.toFixed(4)).join(',')}`;
  }
  if (s.view) {
    out.v = `${s.view.center[0].toFixed(3)},${s.view.center[1].toFixed(3)},${s.view.zoom.toFixed(2)}`;
  }
  return out;
}

export function useMapUrlState() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [state, setState] = useState(() => parse(searchParams));
  const initialView = useRef(state.view);

  const update = useCallback((patch) => {
    setState((prev) => ({ ...prev, ...(typeof patch === 'function' ? patch(prev) : patch) }));
  }, []);

  const reset = useCallback(() => {
    setState((prev) => ({ ...DEFAULT_MAP_STATE, view: prev.view }));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setSearchParams(serialize(state), { replace: true }), 300);
    return () => clearTimeout(t);
  }, [state, setSearchParams]);

  return { state, update, reset, initialView: initialView.current };
}
