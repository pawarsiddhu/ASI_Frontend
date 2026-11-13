/**
 * Smart search — plain English → map filters. RULE-BASED, no AI.
 *
 *   "buddhist sites in maharashtra before 500 CE"
 *     → affiliation Buddhist · sites only · state Maharashtra · to 500
 *
 * It only recognises words from our own vocabulary (periods, dynasties,
 * affiliations, categories, states, places in the register) plus a few
 * time and distance patterns. The RESULTS always come from the database;
 * this only builds the filter. Words it doesn't understand are reported
 * back as "ignored" so the user can see exactly what happened.
 *
 * If an AI model is approved later, it can replace parseQuery() and return
 * the same shape — nothing else changes.
 */

// ---------- vocabulary ----------

const AFFILIATIONS = [
  ['C01', ['buddhist', 'buddhism', 'buddha']],
  ['C02', ['jain', 'jaina', 'jainism']],
  ['C03', ['hindu', 'brahmanical', 'shaiva', 'vaishnava', 'shiva', 'vishnu']],
  ['C04', ['islamic', 'muslim', 'islam']],
  ['C05', ['european', 'christian', 'church']],
  ['C07', ['protohistoric', 'prehistoric']],
];

const PERIODS = [
  ['P01', ['harappan', 'indus valley', 'indus', 'harappa']],
  ['P02', ['iron age', 'megalithic']],
  ['P03', ['early historic']],
  ['P04', ['classical']],
  ['P05', ['early medieval']],
  ['P06', ['late medieval']],
  ['P07', ['mughal era', 'mughal period']],
  ['P08', ['colonial', 'british era', 'british period']],
];
const PERIOD_GROUPS = [[['P05', 'P06'], ['medieval']], [['P01', 'P02', 'P03', 'P04'], ['ancient']]];

const DYNASTIES = [
  ['D02', ['mauryan', 'maurya', 'ashokan', 'ashoka']],
  ['D03', ['shunga', 'sunga']],
  ['D04', ['satavahana']],
  ['D05', ['kushan', 'kushana']],
  ['D06', ['gupta']],
  ['D07', ['vakataka']],
  ['D08', ['chalukya', 'chalukyan', 'badami chalukya']],
  ['D09', ['pallava']],
  ['D10', ['rashtrakuta']],
  ['D11', ['pala']],
  ['D12', ['chola']],
  ['D13', ['chandela']],
  ['D14', ['solanki', 'chaulukya']],
  ['D15', ['eastern ganga', 'ganga dynasty']],
  ['D16', ['delhi sultanate', 'sultanate']],
  ['D17', ['bengal sultanate']],
  ['D18', ['vijayanagara', 'vijayanagar']],
  ['D19', ['ahom']],
  ['D20', ['mughal', 'mughals']],
  ['D21', ['rajput', 'kachwaha']],
  ['D22', ['malla']],
  ['D23', ['british']],
];

/** [categoryId, words, type] — type narrows the layers shown. */
const CATEGORIES = [
  ['B01', ['temple', 'temples', 'shrine', 'shrines'], 'bhs'],
  ['B02', ['stupa', 'stupas', 'monastery', 'monasteries', 'vihara', 'viharas'], 'bhs'],
  ['B03', ['cave', 'caves', 'rock cut', 'rock-cut'], 'bhs'],
  ['B04', ['fort', 'forts', 'fortress', 'fortresses'], 'bhs'],
  ['B05', ['palace', 'palaces'], 'bhs'],
  ['B06', ['stepwell', 'stepwells', 'baoli', 'vav', 'tank', 'tanks'], 'bhs'],
  ['B07', ['mosque', 'mosques', 'masjid'], 'bhs'],
  ['B08', ['tomb', 'tombs', 'mausoleum', 'maqbara'], 'bhs'],
  ['B09', ['edict', 'edicts', 'rock inscription'], 'bhs'],
  ['B10', ['excavated site', 'excavated sites', 'mound', 'mounds', 'excavation'], 'bhs'],
  ['B12', ['observatory'], 'bhs'],
  ['A01', ['sculpture', 'sculptures', 'statue', 'statues', 'idol', 'idols'], 'ant'],
  ['A02', ['coin', 'coins'], 'ant'],
  ['A03', ['inscription', 'inscriptions', 'copper plate', 'copper-plate'], 'ant'],
  ['A04', ['terracotta', 'terracottas', 'figurine', 'figurines'], 'ant'],
  ['A05', ['bronze', 'bronzes'], 'ant'],
  ['A06', ['pottery', 'pot', 'pots', 'sherd', 'sherds'], 'ant'],
  ['A07', ['seal', 'seals'], 'ant'],
  ['A08', ['bead', 'beads', 'ornament', 'ornaments', 'jewellery', 'jewelry'], 'ant'],
];

const TYPE_WORDS = [
  ['bhs', ['sites', 'site', 'monuments', 'monument', 'buildings', 'heritage sites', 'built heritage']],
  ['ant', ['objects', 'object', 'antiquities', 'antiquity', 'artefacts', 'artefact', 'artifacts', 'artifact', 'finds']],
];

const PROTECTION = [
  ['UNPROTECTED', ['unprotected', 'not protected']],
  ['CENTRAL', ['centrally protected', 'asi protected']],
  ['STATE', ['state protected']],
];

/** Case-sensitive abbreviations (so "up" in normal English isn't a state). */
const STATE_ABBR = { UP: 'Uttar Pradesh', MP: 'Madhya Pradesh', TN: 'Tamil Nadu', WB: 'West Bengal' };
const STATE_ALIASES = { bengal: 'West Bengal', orissa: 'Odisha' };

const STOPWORDS = new Set(
  ('show me all the find list any every what which where are is there a an of in on at from to and or with ' +
    'everything anything that were was be built made dating dated period periods era age dynasty dynasties century centuries ' +
    'please give display see get i want looking for search about around some kind type types near within km ' +
    'than older newer earlier later before after between since by ce bce ad bc').split(' ')
);

// ---------- helpers ----------

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Find the first whole-phrase match of any word; returns [index, length] or null. */
function findPhrase(text, words) {
  let best = null;
  words
    .slice()
    .sort((a, b) => b.length - a.length)
    .forEach((w) => {
      if (best) return;
      const m = new RegExp(`(^|[^a-z])(${esc(w)})(?=$|[^a-z])`, 'i').exec(text);
      if (m) best = [m.index + m[1].length, m[2].length];
    });
  return best;
}

function toYear(n, era) {
  const v = Number(n);
  return era && /^b/i.test(era) ? -v : v;
}

function centuryRange(n, era) {
  const c = Number(n);
  if (era && /^b/i.test(era)) return [-(c * 100), -((c - 1) * 100 + 1)];
  return [(c - 1) * 100 + 1, c * 100];
}

const fmtYear = (y) => (y < 0 ? `${-y} BCE` : `${y} CE`);

// ---------- main ----------

/**
 * @param {string} input
 * @param {{ masters: object, places: Array<{name: string, coords: [number, number]}> }} ctx
 * @returns {{
 *   understood: boolean,
 *   filters: object,           // patch for map filter state
 *   layers: { showBhs: boolean, showAnt: boolean },
 *   near: null | { name: string, coords: [number, number], radiusKm: number },
 *   nearMe: null | { radiusKm: number },
 *   chips: string[],           // human-readable "what I understood"
 *   ignored: string[],         // words it couldn't use
 * }}
 */
export function parseQuery(input, { masters, places = [] }) {
  const original = input.trim();
  let text = ` ${original.toLowerCase()} `;
  const consumed = []; // [start, end) ranges in `text`
  const take = (i, len) => consumed.push([i, i + len]);

  const filters = {};
  const chips = [];
  let type = null;
  let near = null;
  let nearMe = null;

  const nameOf = (list, id) => list?.find((x) => x.id === id)?.name || id;

  // --- distance: "within 25 km of X" / "near X" / "near me" ---
  const radiusRe = /within\s+(\d+)\s*(?:km|kms|kilometres|kilometers)\s+(?:of|from)\s+(.+?)(?=\s+(?:in|from|before|after|between|during|older|newer|with)\s|\s*$)/i;
  const nearRe = /\b(?:near|around|close to)\s+(.+?)(?=\s+(?:in|from|before|after|between|during|older|newer|with)\s|\s*$)/i;
  let m = radiusRe.exec(text);
  let radiusKm = 50;
  let placeText = null;
  if (m) {
    radiusKm = Number(m[1]);
    placeText = m[2].trim();
    take(m.index, m[0].length);
  } else if ((m = nearRe.exec(text))) {
    placeText = m[1].trim();
    take(m.index, m[0].length);
  }
  if (placeText) {
    if (/^me\b|^my location|^here$/.test(placeText)) {
      nearMe = { radiusKm };
      chips.push(`Within ${radiusKm} km of you`);
    } else {
      const q = placeText.toLowerCase();
      const hit =
        places.find((p) => p.name.toLowerCase() === q) ||
        places.find((p) => p.name.toLowerCase().split(/[ ,]+/).includes(q)) ||
        places.find((p) => p.name.toLowerCase().includes(q));
      if (hit) {
        near = { name: hit.name, coords: hit.coords, radiusKm };
        chips.push(`Within ${radiusKm} km of ${hit.name}`);
      } else {
        chips.push(`Couldn’t find a place called “${placeText}”`);
      }
    }
  }

  // --- time ---
  const ERA = '(bce|bc|ce|ad)?';
  const between = new RegExp(`\\b(?:between|from)\\s+(\\d{1,4})\\s*${ERA}\\s+(?:and|to|-|until)\\s+(\\d{1,4})\\s*${ERA}`, 'i').exec(text);
  const century = new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)\\s+century\\s*${ERA}`, 'i').exec(text);
  const before = new RegExp(`\\b(?:before|older than|earlier than|pre|until|up to)\\s+(\\d{1,4})\\s*${ERA}`, 'i').exec(text);
  const after = new RegExp(`\\b(?:after|later than|newer than|since|post)\\s+(\\d{1,4})\\s*${ERA}`, 'i').exec(text);
  if (between) {
    // "from 300 BCE to 300 CE": an era on the second number alone applies to both only if the first has none and both are BCE-style
    const e1 = between[2] || (between[4] && /^b/i.test(between[4]) ? between[4] : null);
    filters.from = toYear(between[1], e1);
    filters.to = toYear(between[3], between[4]);
    if (filters.from > filters.to) [filters.from, filters.to] = [filters.to, filters.from];
    chips.push(`${fmtYear(filters.from)} – ${fmtYear(filters.to)}`);
    take(between.index, between[0].length);
  } else if (century) {
    const [a, b] = centuryRange(century[1], century[2]);
    filters.from = a;
    filters.to = b;
    chips.push(`${century[1]}${century[0].match(/st|nd|rd|th/i)[0]} century ${century[2] && /^b/i.test(century[2]) ? 'BCE' : 'CE'}`);
    take(century.index, century[0].length);
  } else {
    if (before) {
      filters.to = toYear(before[1], before[2]);
      chips.push(`Before ${fmtYear(filters.to)}`);
      take(before.index, before[0].length);
    }
    if (after) {
      filters.from = toYear(after[1], after[2]);
      chips.push(`After ${fmtYear(filters.from)}`);
      take(after.index, after[0].length);
    }
  }

  // Remaining matching runs on text with consumed parts blanked out
  const blank = () => {
    let t = text;
    consumed.forEach(([a, b]) => { t = t.slice(0, a) + ' '.repeat(b - a) + t.slice(b); });
    return t;
  };

  // --- protection (before affiliation so "state protected" isn't a state) ---
  for (const [id, words] of PROTECTION) {
    const hit = findPhrase(blank(), words);
    if (hit) {
      filters.protection = [id];
      chips.push(nameOf(masters?.protection_levels, id));
      take(...hit);
      type = type || 'bhs';
      break;
    }
  }

  // --- multi-word bengal sultanate etc. before single words ---
  let dynastyHit = null;
  for (const [id, words] of DYNASTIES) {
    const hit = findPhrase(blank(), words);
    if (hit && (!dynastyHit || hit[1] > dynastyHit.len)) dynastyHit = { id, hit, len: hit[1] };
  }

  // --- periods (multi-word first) ---
  const periodIds = [];
  for (const [id, words] of PERIODS) {
    const hit = findPhrase(blank(), words);
    if (hit) { periodIds.push(id); take(...hit); }
  }
  for (const [ids, words] of PERIOD_GROUPS) {
    const hit = findPhrase(blank(), words);
    if (hit) { periodIds.push(...ids); take(...hit); }
  }
  if (periodIds.length) {
    filters.periods = [...new Set(periodIds)];
    chips.push(filters.periods.map((id) => nameOf(masters?.periods, id)).join(' / '));
  }

  if (dynastyHit) {
    // re-check: the period scan may have consumed it (e.g. "mughal era")
    const still = findPhrase(blank(), DYNASTIES.find(([id]) => id === dynastyHit.id)[1]);
    if (still) {
      filters.dynasty = dynastyHit.id;
      chips.push(`${nameOf(masters?.dynasties, dynastyHit.id)} dynasty`);
      take(...still);
    }
  }

  // --- affiliation ---
  const affIds = [];
  for (const [id, words] of AFFILIATIONS) {
    const hit = findPhrase(blank(), words);
    if (hit) { affIds.push(id); take(...hit); }
  }
  if (affIds.length) {
    filters.affiliations = affIds;
    chips.push(affIds.map((id) => nameOf(masters?.cultural_affiliations, id)).join(' / '));
  }

  // --- category ---
  for (const [id, words, t] of CATEGORIES) {
    const hit = findPhrase(blank(), words);
    if (hit) {
      filters.category = id;
      type = t;
      chips.push(nameOf(masters?.categories, id));
      take(...hit);
      break;
    }
  }

  // --- explicit type words ---
  for (const [t, words] of TYPE_WORDS) {
    const hit = findPhrase(blank(), words);
    if (hit) {
      if (!type) type = t;
      take(...hit);
    }
  }

  // --- states ---
  const stateNames = (masters?.states || []).map((s) => s.name);
  for (const name of stateNames) {
    const hit = findPhrase(blank(), [name.toLowerCase()]);
    if (hit) { filters.state = name; take(...hit); break; }
  }
  if (!filters.state) {
    for (const [alias, name] of Object.entries(STATE_ALIASES)) {
      const hit = findPhrase(blank(), [alias]);
      if (hit) { filters.state = name; take(...hit); break; }
    }
  }
  if (!filters.state) {
    for (const [abbr, name] of Object.entries(STATE_ABBR)) {
      const re = new RegExp(`(^|\\s)${abbr}(?=$|\\s|[,.])`);
      const mm = re.exec(` ${original} `);
      if (mm) {
        filters.state = name;
        const hit = findPhrase(blank(), [abbr.toLowerCase()]);
        if (hit) take(...hit);
        break;
      }
    }
  }
  if (filters.state) chips.push(filters.state);

  if (type === 'bhs') chips.push('Sites only');
  if (type === 'ant') chips.push('Objects only');

  // --- what's left ---
  const ignored = blank()
    .split(/[^a-z0-9-]+/)
    .filter((w) => w && !STOPWORDS.has(w) && !/^\d+$/.test(w));

  const understood = chips.length > 0 && !(chips.length === 1 && chips[0].startsWith('Couldn’t'));

  return {
    understood,
    filters,
    layers: { showBhs: type !== 'ant', showAnt: type !== 'bhs' },
    near,
    nearMe,
    chips,
    ignored,
  };
}
