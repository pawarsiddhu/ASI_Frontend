/**
 * Map Explorer — DUMMY research dataset.
 *
 * Shape follows the proposed data model (master tables + enriched BHS and
 * antiquity records). Treat this file as the data spec for the backend:
 * real data should arrive in exactly these shapes.
 *
 * Honesty notes:
 *   - Named monuments use APPROXIMATE public coordinates and rough dates.
 *     Good enough to demo, NOT authoritative. Do not reuse as reference data.
 *   - Their `circle` is forced onto the 6 POC circles, so it is often not
 *     the real ASI circle.
 *   - Minor sites and every antiquity are invented (`is_dummy: true`).
 *   - Generation is seeded, so every reload produces identical data.
 *
 * Years: negative = BCE, positive = CE. A record is "active" in a year if
 * date_start <= year <= date_end.
 */

import { SITE_SUMMARIES } from './mapSummaries.js';

// ---------------------------------------------------------------------------
// Seeded RNG (mulberry32) — deterministic output across reloads
// ---------------------------------------------------------------------------
function mulberry32(seed) {
  let a = seed;
  return function rand() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20261110);
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const between = (min, max) => min + rand() * (max - min);
const intBetween = (min, max) => Math.floor(between(min, max + 1));
const round = (n, d = 4) => Number(n.toFixed(d));

// ===========================================================================
// MASTER TABLES
// ===========================================================================

/** Broad eras. The time slider and period colouring run off these. */
export const PERIODS = [
  { id: 'P01', name: 'Protohistoric (Harappan)', name_hi: 'आद्य-ऐतिहासिक (हड़प्पा)', start_year: -3300, end_year: -1300 },
  { id: 'P02', name: 'Iron Age & Megalithic', name_hi: 'लौह युग एवं महापाषाण', start_year: -1300, end_year: -322 },
  { id: 'P03', name: 'Early Historic', name_hi: 'प्रारंभिक ऐतिहासिक', start_year: -322, end_year: 320 },
  { id: 'P04', name: 'Classical', name_hi: 'शास्त्रीय', start_year: 320, end_year: 650 },
  { id: 'P05', name: 'Early Medieval', name_hi: 'प्रारंभिक मध्यकालीन', start_year: 650, end_year: 1200 },
  { id: 'P06', name: 'Late Medieval', name_hi: 'उत्तर मध्यकालीन', start_year: 1200, end_year: 1526 },
  { id: 'P07', name: 'Mughal & Regional States', name_hi: 'मुग़ल एवं क्षेत्रीय राज्य', start_year: 1526, end_year: 1757 },
  { id: 'P08', name: 'Colonial', name_hi: 'औपनिवेशिक', start_year: 1757, end_year: 1947 },
];

export const DYNASTIES = [
  { id: 'D01', name: 'Harappan', period_id: 'P01', start_year: -2600, end_year: -1900 },
  { id: 'D02', name: 'Mauryan', period_id: 'P03', start_year: -322, end_year: -185 },
  { id: 'D03', name: 'Shunga', period_id: 'P03', start_year: -185, end_year: -73 },
  { id: 'D04', name: 'Satavahana', period_id: 'P03', start_year: -100, end_year: 220 },
  { id: 'D05', name: 'Kushan', period_id: 'P03', start_year: 30, end_year: 320 },
  { id: 'D06', name: 'Gupta', period_id: 'P04', start_year: 320, end_year: 550 },
  { id: 'D07', name: 'Vakataka', period_id: 'P04', start_year: 250, end_year: 500 },
  { id: 'D08', name: 'Chalukya (Badami)', period_id: 'P04', start_year: 543, end_year: 753 },
  { id: 'D09', name: 'Pallava', period_id: 'P05', start_year: 575, end_year: 897 },
  { id: 'D10', name: 'Rashtrakuta', period_id: 'P05', start_year: 753, end_year: 982 },
  { id: 'D11', name: 'Pala', period_id: 'P05', start_year: 750, end_year: 1174 },
  { id: 'D12', name: 'Chola', period_id: 'P05', start_year: 848, end_year: 1279 },
  { id: 'D13', name: 'Chandela', period_id: 'P05', start_year: 831, end_year: 1315 },
  { id: 'D14', name: 'Chaulukya (Solanki)', period_id: 'P05', start_year: 940, end_year: 1244 },
  { id: 'D15', name: 'Eastern Ganga', period_id: 'P06', start_year: 1078, end_year: 1434 },
  { id: 'D16', name: 'Delhi Sultanate', period_id: 'P06', start_year: 1206, end_year: 1526 },
  { id: 'D17', name: 'Bengal Sultanate', period_id: 'P06', start_year: 1352, end_year: 1576 },
  { id: 'D18', name: 'Vijayanagara', period_id: 'P06', start_year: 1336, end_year: 1646 },
  { id: 'D19', name: 'Ahom', period_id: 'P07', start_year: 1228, end_year: 1826 },
  { id: 'D20', name: 'Mughal', period_id: 'P07', start_year: 1526, end_year: 1857 },
  { id: 'D21', name: 'Rajput (Kachwaha)', period_id: 'P07', start_year: 1500, end_year: 1800 },
  { id: 'D22', name: 'Malla (Bishnupur)', period_id: 'P07', start_year: 1550, end_year: 1800 },
  { id: 'D23', name: 'British Crown / EIC', period_id: 'P08', start_year: 1757, end_year: 1947 },
];

export const CULTURAL_AFFILIATIONS = [
  { id: 'C01', name: 'Buddhist' },
  { id: 'C02', name: 'Jain' },
  { id: 'C03', name: 'Brahmanical' },
  { id: 'C04', name: 'Islamic' },
  { id: 'C05', name: 'Colonial / European' },
  { id: 'C06', name: 'Secular / Civic' },
  { id: 'C07', name: 'Protohistoric' },
];

export const CATEGORIES = [
  // BHS
  { id: 'B01', name: 'Temple', applies_to: 'BHS' },
  { id: 'B02', name: 'Stupa / Monastery', applies_to: 'BHS' },
  { id: 'B03', name: 'Rock-cut cave', applies_to: 'BHS' },
  { id: 'B04', name: 'Fort', applies_to: 'BHS' },
  { id: 'B05', name: 'Palace', applies_to: 'BHS' },
  { id: 'B06', name: 'Stepwell / Tank', applies_to: 'BHS' },
  { id: 'B07', name: 'Mosque', applies_to: 'BHS' },
  { id: 'B08', name: 'Tomb', applies_to: 'BHS' },
  { id: 'B09', name: 'Inscription / Edict', applies_to: 'BHS' },
  { id: 'B10', name: 'Excavated site', applies_to: 'BHS' },
  { id: 'B11', name: 'Colonial building', applies_to: 'BHS' },
  { id: 'B12', name: 'Observatory / Civic', applies_to: 'BHS' },
  // Antiquities
  { id: 'A01', name: 'Sculpture', applies_to: 'ANTIQUITY' },
  { id: 'A02', name: 'Coin', applies_to: 'ANTIQUITY' },
  { id: 'A03', name: 'Inscription', applies_to: 'ANTIQUITY' },
  { id: 'A04', name: 'Terracotta', applies_to: 'ANTIQUITY' },
  { id: 'A05', name: 'Bronze', applies_to: 'ANTIQUITY' },
  { id: 'A06', name: 'Pottery', applies_to: 'ANTIQUITY' },
  { id: 'A07', name: 'Seal', applies_to: 'ANTIQUITY' },
  { id: 'A08', name: 'Bead / Ornament', applies_to: 'ANTIQUITY' },
];

export const MATERIALS = [
  { id: 'M01', name: 'Sandstone' },
  { id: 'M02', name: 'Basalt' },
  { id: 'M03', name: 'Granite' },
  { id: 'M04', name: 'Schist' },
  { id: 'M05', name: 'Bronze' },
  { id: 'M06', name: 'Copper' },
  { id: 'M07', name: 'Silver' },
  { id: 'M08', name: 'Gold' },
  { id: 'M09', name: 'Terracotta' },
  { id: 'M10', name: 'Steatite' },
  { id: 'M11', name: 'Carnelian' },
];

/** State codes follow LGD (Local Government Directory). Districts are names
 *  only here — real data must carry LGD district + tehsil codes too. */
export const STATES = [
  { lgd: 7, name: 'Delhi' },
  { lgd: 27, name: 'Maharashtra' },
  { lgd: 33, name: 'Tamil Nadu' },
  { lgd: 19, name: 'West Bengal' },
  { lgd: 8, name: 'Rajasthan' },
  { lgd: 18, name: 'Assam' },
  { lgd: 23, name: 'Madhya Pradesh' },
  { lgd: 29, name: 'Karnataka' },
  { lgd: 21, name: 'Odisha' },
  { lgd: 9, name: 'Uttar Pradesh' },
  { lgd: 10, name: 'Bihar' },
  { lgd: 24, name: 'Gujarat' },
];
const LGD = Object.fromEntries(STATES.map((s) => [s.name, s.lgd]));

export const MUSEUMS = [
  { id: 'MU01', name: 'National Museum, New Delhi', circle: 'DELHI', latitude: 28.6119, longitude: 77.2193 },
  { id: 'MU02', name: 'Indian Museum, Kolkata', circle: 'KOLKATA', latitude: 22.5579, longitude: 88.3511 },
  { id: 'MU03', name: 'CSMVS, Mumbai', circle: 'MUMBAI', latitude: 18.9269, longitude: 72.8326 },
  { id: 'MU04', name: 'Government Museum, Chennai', circle: 'CHENNAI', latitude: 13.0697, longitude: 80.2558 },
  { id: 'MU05', name: 'Albert Hall Museum, Jaipur', circle: 'JAIPUR', latitude: 26.9116, longitude: 75.8195 },
  { id: 'MU06', name: 'Assam State Museum, Guwahati', circle: 'GUWAHATI', latitude: 26.1858, longitude: 91.7469 },
  { id: 'MU07', name: 'Archaeological Museum, Sarnath', circle: 'DELHI', latitude: 25.3770, longitude: 83.0236 },
  { id: 'MU08', name: 'Government Museum, Mathura', circle: 'DELHI', latitude: 27.4924, longitude: 77.6737 },
  { id: 'MU09', name: 'Patna Museum', circle: 'KOLKATA', latitude: 25.6131, longitude: 85.1324 },
  { id: 'MU10', name: 'Archaeological Museum, Sanchi', circle: 'JAIPUR', latitude: 23.4790, longitude: 77.7420 },
];

export const PROTECTION_LEVELS = [
  { id: 'CENTRAL', name: 'Centrally protected' },
  { id: 'STATE', name: 'State protected' },
  { id: 'UNPROTECTED', name: 'Unprotected' },
];

export const LOCATION_PRECISIONS = [
  { id: 'SURVEYED', name: 'Surveyed GPS' },
  { id: 'APPROX', name: 'Approximate' },
  { id: 'VILLAGE', name: 'Village-level' },
];

export const DISCOVERY_TYPES = [
  { id: 'EXCAVATION', name: 'Excavation' },
  { id: 'SURFACE', name: 'Surface find' },
  { id: 'CHANCE', name: 'Chance find' },
  { id: 'SEIZED', name: 'Seized (anti-trafficking)' },
  { id: 'DONATED', name: 'Donated' },
  { id: 'PURCHASED', name: 'Purchased' },
];

export const SOURCES = [
  { id: 'S01', title: 'Indian Archaeology — A Review (annual)', author: 'ASI', year: 1960, type: 'published' },
  { id: 'S02', title: 'District Gazetteer survey notes', author: 'State Archaeology Dept', year: 1978, type: 'unpublished' },
  { id: 'S03', title: 'NMMA field documentation', author: 'NMMA', year: 2019, type: 'survey' },
];

// ===========================================================================
// PHOTOS
// ===========================================================================
// Files live in public/monuments/ (sourced from Wikimedia Commons; credits
// are kept by the team). Paths are root-relative because Vite serves
// public/ at the URL root. Missing files fall back to a gradient in the UI.

/** Named monument → [photo slug, number of extra photos (-2, -3 …)],
 *  or { files: [...] } to pick exact files. */
const SITE_PHOTOS = {
  'Qutub Minar complex': ['qutub-minar', 0],
  "Humayun's Tomb": ['humayuns-tomb', 1],
  'Red Fort': ['red-fort', 0],
  'Ashokan Rock Edict, Srinivaspuri': ['ashokan-edict-srinivaspuri', 0],
  'Taj Mahal': ['taj-mahal', 2],
  // -2 carries a video "4K ULTRAHD" watermark — hidden until replaced
  'Fatehpur Sikri': ['fatehpur-sikri', 0],
  'Dhamek Stupa, Sarnath': ['dhamek-stupa-sarnath', 1],
  'Elephanta Caves': ['elephanta-caves', 1],
  'Kanheri Caves': ['kanheri-caves', 1],
  // ajanta-caves.jpg and -2 actually show Ellora's Kailasa temple — only -3 is Ajanta
  'Ajanta Caves': { files: ['ajanta-caves-3'] },
  'Ellora Caves': ['ellora-caves', 1],
  'Karla Chaitya': ['karla-chaitya', 1],
  'Daulatabad Fort': ['daulatabad-fort', 0],
  'Bibi Ka Maqbara': ['bibi-ka-maqbara', 1],
  'Gateway of India': ['gateway-of-india', 1],
  // -2 appears to be Modhera Sun Temple (watermarked "Sun Temple") — hidden
  'Rani ki Vav': ['rani-ki-vav', 0],
  Dholavira: ['dholavira', 1],
  'Shore Temple, Mahabalipuram': ['shore-temple-mahabalipuram', 1],
  'Kailasanathar Temple, Kanchipuram': ['kailasanathar-kanchipuram', 1],
  'Brihadisvara Temple, Thanjavur': ['brihadisvara-thanjavur', 1],
  'Gangaikonda Cholapuram': ['gangaikonda-cholapuram', 0],
  'Gingee Fort': ['gingee-fort', 0],
  'Virupaksha Temple, Hampi': ['virupaksha-hampi', 1],
  'Pattadakal group': ['pattadakal', 1],
  'Konark Sun Temple': ['konark-sun-temple', 1],
  'Rasmancha, Bishnupur': ['rasmancha-bishnupur', 1],
  'Adina Mosque, Pandua': ['adina-mosque-pandua', 0],
  'Victoria Memorial': ['victoria-memorial', 1],
  'Nalanda Mahavihara': ['nalanda-mahavihara', 1],
  Vikramashila: ['vikramashila', 1],
  'Amber Fort': ['amber-fort', 0],
  'Jantar Mantar, Jaipur': ['jantar-mantar-jaipur', 1],
  'Chittorgarh Fort': ['chittorgarh-fort', 1],
  // Photo doesn't match the Bairat ruins as far as we can tell — hidden until checked
  'Bairat Buddhist monastery': { files: [] },
  Kalibangan: ['kalibangan', 1],
  'Great Stupa, Sanchi': ['sanchi-stupa', 1],
  'Kandariya Mahadeva, Khajuraho': ['kandariya-mahadeva-khajuraho', 1],
  'Kamakhya Temple': ['kamakhya-temple', 1],
  'Rang Ghar, Sivasagar': ['rang-ghar-sivasagar', 1],
  'Madan Kamdev ruins': ['madan-kamdev', 0],
};

function sitePhotos(title) {
  const entry = SITE_PHOTOS[title];
  if (!entry) return [];
  if (entry.files) return entry.files.map((f) => `/monuments/${f}.jpg`);
  const [slug, extras] = entry;
  const out = [`/monuments/${slug}.jpg`];
  for (let i = 2; i <= extras + 1; i += 1) out.push(`/monuments/${slug}-${i}.jpg`);
  return out;
}

/** Antiquities: one REPRESENTATIVE image per category (not the actual object). */
const CATEGORY_PHOTO = {
  A01: 'sculpture', A02: 'coin', A03: 'inscription', A04: 'terracotta',
  A05: 'bronze', A06: 'pottery', A07: 'seal', A08: 'bead',
};

// ===========================================================================
// BHS RECORDS
// ===========================================================================

const STATUSES_WEIGHTED = [
  'PUBLISHED', 'PUBLISHED', 'PUBLISHED', 'PUBLISHED', 'PUBLISHED',
  'PENDING_ADMIN', 'PENDING_SUPERVISOR', 'PENDING_SUPERADMIN', 'DRAFT', 'RETURNED',
];

/**
 * Named monuments. Tuple:
 * [title, lat, lng, state, district, circle, categoryId, affiliationId,
 *  dynastyId|null, start, end, certainty, style, protection, worldHeritage]
 */
const NAMED_SITES = [
  ['Qutub Minar complex', 28.5245, 77.1855, 'Delhi', 'South Delhi', 'DELHI', 'B07', 'C04', 'D16', 1199, 1220, 'approx', 'Indo-Islamic', 'CENTRAL', true],
  ["Humayun's Tomb", 28.5933, 77.2507, 'Delhi', 'South East Delhi', 'DELHI', 'B08', 'C04', 'D20', 1565, 1572, 'exact', 'Mughal', 'CENTRAL', true],
  ['Red Fort', 28.6562, 77.2410, 'Delhi', 'Central Delhi', 'DELHI', 'B04', 'C04', 'D20', 1639, 1648, 'exact', 'Mughal', 'CENTRAL', true],
  ['Ashokan Rock Edict, Srinivaspuri', 28.5603, 77.2604, 'Delhi', 'South East Delhi', 'DELHI', 'B09', 'C01', 'D02', -260, -230, 'century', null, 'CENTRAL', false],
  ['Taj Mahal', 27.1751, 78.0421, 'Uttar Pradesh', 'Agra', 'DELHI', 'B08', 'C04', 'D20', 1632, 1653, 'exact', 'Mughal', 'CENTRAL', true],
  ['Fatehpur Sikri', 27.0945, 77.6679, 'Uttar Pradesh', 'Agra', 'DELHI', 'B05', 'C04', 'D20', 1571, 1585, 'exact', 'Mughal', 'CENTRAL', true],
  ['Dhamek Stupa, Sarnath', 25.3800, 83.0245, 'Uttar Pradesh', 'Varanasi', 'DELHI', 'B02', 'C01', 'D06', 400, 500, 'century', null, 'CENTRAL', false],
  ['Elephanta Caves', 18.9633, 72.9315, 'Maharashtra', 'Raigad', 'MUMBAI', 'B03', 'C03', null, 500, 600, 'century', null, 'CENTRAL', true],
  ['Kanheri Caves', 19.2058, 72.9068, 'Maharashtra', 'Mumbai Suburban', 'MUMBAI', 'B03', 'C01', 'D04', -100, 900, 'century', null, 'CENTRAL', false],
  ['Ajanta Caves', 20.5519, 75.7033, 'Maharashtra', 'Chhatrapati Sambhajinagar', 'MUMBAI', 'B03', 'C01', 'D07', -200, 480, 'century', null, 'CENTRAL', true],
  ['Ellora Caves', 20.0268, 75.1771, 'Maharashtra', 'Chhatrapati Sambhajinagar', 'MUMBAI', 'B03', 'C03', 'D10', 600, 1000, 'century', null, 'CENTRAL', true],
  ['Karla Chaitya', 18.7835, 73.4713, 'Maharashtra', 'Pune', 'MUMBAI', 'B03', 'C01', 'D04', -100, 100, 'century', null, 'CENTRAL', false],
  ['Daulatabad Fort', 19.9430, 75.2130, 'Maharashtra', 'Chhatrapati Sambhajinagar', 'MUMBAI', 'B04', 'C06', null, 1187, 1600, 'approx', null, 'CENTRAL', false],
  ['Bibi Ka Maqbara', 19.9017, 75.3203, 'Maharashtra', 'Chhatrapati Sambhajinagar', 'MUMBAI', 'B08', 'C04', 'D20', 1660, 1661, 'approx', 'Mughal', 'CENTRAL', false],
  ['Gateway of India', 18.9220, 72.8347, 'Maharashtra', 'Mumbai City', 'MUMBAI', 'B11', 'C05', 'D23', 1913, 1924, 'exact', 'Indo-Saracenic', 'STATE', false],
  ['Rani ki Vav', 23.8589, 72.1015, 'Gujarat', 'Patan', 'MUMBAI', 'B06', 'C03', 'D14', 1063, 1083, 'approx', 'Maru-Gurjara', 'CENTRAL', true],
  ['Dholavira', 23.8873, 70.2134, 'Gujarat', 'Kachchh', 'MUMBAI', 'B10', 'C07', 'D01', -2650, -1900, 'century', null, 'CENTRAL', true],
  ['Shore Temple, Mahabalipuram', 12.6166, 80.1992, 'Tamil Nadu', 'Chengalpattu', 'CHENNAI', 'B01', 'C03', 'D09', 700, 728, 'approx', 'Dravida', 'CENTRAL', true],
  ['Kailasanathar Temple, Kanchipuram', 12.8432, 79.6880, 'Tamil Nadu', 'Kanchipuram', 'CHENNAI', 'B01', 'C03', 'D09', 685, 705, 'approx', 'Dravida', 'CENTRAL', false],
  ['Brihadisvara Temple, Thanjavur', 10.7828, 79.1318, 'Tamil Nadu', 'Thanjavur', 'CHENNAI', 'B01', 'C03', 'D12', 1003, 1010, 'exact', 'Dravida', 'CENTRAL', true],
  ['Gangaikonda Cholapuram', 11.2061, 79.4490, 'Tamil Nadu', 'Ariyalur', 'CHENNAI', 'B01', 'C03', 'D12', 1025, 1035, 'approx', 'Dravida', 'CENTRAL', true],
  ['Gingee Fort', 12.2531, 79.4171, 'Tamil Nadu', 'Viluppuram', 'CHENNAI', 'B04', 'C06', 'D18', 1300, 1700, 'century', null, 'CENTRAL', false],
  ['Virupaksha Temple, Hampi', 15.3350, 76.4600, 'Karnataka', 'Vijayanagara', 'CHENNAI', 'B01', 'C03', 'D18', 1336, 1565, 'century', 'Vijayanagara', 'CENTRAL', true],
  ['Pattadakal group', 15.9485, 75.8160, 'Karnataka', 'Bagalkot', 'CHENNAI', 'B01', 'C03', 'D08', 650, 750, 'century', 'Vesara', 'CENTRAL', true],
  ['Konark Sun Temple', 19.8876, 86.0945, 'Odisha', 'Puri', 'KOLKATA', 'B01', 'C03', 'D15', 1244, 1255, 'approx', 'Kalinga', 'CENTRAL', true],
  ['Rasmancha, Bishnupur', 23.0750, 87.3200, 'West Bengal', 'Bankura', 'KOLKATA', 'B01', 'C03', 'D22', 1600, 1600, 'approx', 'Bengal brick', 'CENTRAL', false],
  ['Adina Mosque, Pandua', 25.1460, 88.1500, 'West Bengal', 'Malda', 'KOLKATA', 'B07', 'C04', 'D17', 1373, 1375, 'approx', 'Bengal Sultanate', 'CENTRAL', false],
  ['Victoria Memorial', 22.5448, 88.3426, 'West Bengal', 'Kolkata', 'KOLKATA', 'B11', 'C05', 'D23', 1906, 1921, 'exact', 'Indo-Saracenic', 'STATE', false],
  ['Nalanda Mahavihara', 25.1357, 85.4430, 'Bihar', 'Nalanda', 'KOLKATA', 'B02', 'C01', 'D06', 427, 1200, 'century', null, 'CENTRAL', true],
  ['Vikramashila', 25.3247, 87.2858, 'Bihar', 'Bhagalpur', 'KOLKATA', 'B10', 'C01', 'D11', 780, 1200, 'century', null, 'CENTRAL', false],
  ['Amber Fort', 26.9855, 75.8513, 'Rajasthan', 'Jaipur', 'JAIPUR', 'B04', 'C06', 'D21', 1592, 1727, 'approx', 'Rajput', 'STATE', true],
  ['Jantar Mantar, Jaipur', 26.9248, 75.8246, 'Rajasthan', 'Jaipur', 'JAIPUR', 'B12', 'C06', 'D21', 1728, 1734, 'exact', null, 'STATE', true],
  ['Chittorgarh Fort', 24.8887, 74.6269, 'Rajasthan', 'Chittorgarh', 'JAIPUR', 'B04', 'C06', null, 700, 1568, 'century', 'Rajput', 'CENTRAL', true],
  ['Bairat Buddhist monastery', 27.4480, 76.1830, 'Rajasthan', 'Kotputli-Behror', 'JAIPUR', 'B02', 'C01', 'D02', -250, -200, 'century', null, 'CENTRAL', false],
  ['Kalibangan', 29.4740, 74.1300, 'Rajasthan', 'Hanumangarh', 'JAIPUR', 'B10', 'C07', 'D01', -2600, -1900, 'century', null, 'CENTRAL', false],
  ['Great Stupa, Sanchi', 23.4793, 77.7398, 'Madhya Pradesh', 'Raisen', 'JAIPUR', 'B02', 'C01', 'D02', -250, 100, 'century', null, 'CENTRAL', true],
  ['Kandariya Mahadeva, Khajuraho', 24.8318, 79.9199, 'Madhya Pradesh', 'Chhatarpur', 'JAIPUR', 'B01', 'C03', 'D13', 1025, 1050, 'approx', 'Nagara', 'CENTRAL', true],
  ['Kamakhya Temple', 26.1664, 91.7055, 'Assam', 'Kamrup Metropolitan', 'GUWAHATI', 'B01', 'C03', 'D19', 1565, 1565, 'approx', 'Nilachal', 'STATE', false],
  ['Rang Ghar, Sivasagar', 26.9790, 94.6240, 'Assam', 'Sivasagar', 'GUWAHATI', 'B05', 'C06', 'D19', 1746, 1746, 'approx', 'Ahom', 'CENTRAL', false],
  ['Madan Kamdev ruins', 26.3165, 91.7230, 'Assam', 'Kamrup', 'GUWAHATI', 'B01', 'C03', 'D11', 900, 1200, 'century', null, 'STATE', false],
];

/** Anchor towns for invented minor sites, per POC circle. */
const ANCHORS = {
  DELHI: [['Mathura', 27.49, 77.67, 'Uttar Pradesh'], ['Meerut', 28.98, 77.70, 'Uttar Pradesh'], ['Kaushambi', 25.34, 81.39, 'Uttar Pradesh']],
  MUMBAI: [['Junnar', 19.20, 73.88, 'Maharashtra'], ['Nashik', 19.99, 73.79, 'Maharashtra'], ['Ter', 18.32, 76.15, 'Maharashtra'], ['Vadnagar', 23.78, 72.64, 'Gujarat']],
  CHENNAI: [['Kaveripattinam', 11.15, 79.85, 'Tamil Nadu'], ['Madurai', 9.93, 78.12, 'Tamil Nadu'], ['Aihole', 16.02, 75.88, 'Karnataka']],
  KOLKATA: [['Chandraketugarh', 22.69, 88.69, 'West Bengal'], ['Tamluk', 22.30, 87.92, 'West Bengal'], ['Ratnagiri', 20.64, 86.33, 'Odisha'], ['Vaishali', 25.99, 85.13, 'Bihar']],
  JAIPUR: [['Nagari', 24.95, 74.61, 'Rajasthan'], ['Ujjain', 23.18, 75.78, 'Madhya Pradesh'], ['Abhaneri', 27.01, 76.61, 'Rajasthan']],
  GUWAHATI: [['Tezpur', 26.63, 92.80, 'Assam'], ['Goalpara', 26.17, 90.62, 'Assam'], ['Dimapur fringe', 25.93, 93.40, 'Assam']],
};

/** Templates for invented sites: [category, affiliation, dynasty pool, name pattern] */
const MINOR_TEMPLATES = [
  ['B01', 'C03', ['D06', 'D08', 'D11', 'D12', 'D13'], 'Ruined Shiva temple near'],
  ['B01', 'C02', ['D06', 'D14', 'D13'], 'Jain shrine remains near'],
  ['B02', 'C01', ['D02', 'D04', 'D05', 'D11'], 'Brick stupa mound near'],
  ['B06', 'C06', ['D14', 'D21', 'D20'], 'Stepwell near'],
  ['B10', 'C07', ['D01'], 'Harappan-phase mound near'],
  ['B10', 'C01', ['D03', 'D05'], 'Early historic habitation mound near'],
  ['B08', 'C04', ['D16', 'D20'], 'Unnamed tomb near'],
  ['B09', 'C03', ['D06', 'D10'], 'Rock inscription near'],
  ['B04', 'C06', ['D16', 'D19', 'D21'], 'Fortification remains near'],
];

const dynastyById = Object.fromEntries(DYNASTIES.map((d) => [d.id, d]));

function periodTextFor(dynastyId, start, end) {
  // Mimics the messy free text real records carry today — kept alongside
  // the structured fields so nothing is lost during migration.
  const fmt = (y) => (y < 0 ? `${-y} BCE` : `${y} CE`);
  const d = dynastyId ? dynastyById[dynastyId] : null;
  const variants = d
    ? [`${d.name} period`, `c. ${fmt(start)}`, `${d.name}, ${fmt(start)}–${fmt(end)}`, `${d.name} era`]
    : [`c. ${fmt(start)}`, `${fmt(start)} – ${fmt(end)}`];
  return pick(variants);
}

function periodIdForYear(year) {
  const p = PERIODS.find((x) => year >= x.start_year && year < x.end_year);
  return (p || PERIODS[PERIODS.length - 1]).id;
}

let bhsSeq = 1;
const bhsRecords = [];

NAMED_SITES.forEach((s) => {
  const [title, lat, lng, state, district, circle, cat, aff, dyn, start, end, certainty, style, protection, whs] = s;
  const id = 9000 + bhsSeq;
  bhsRecords.push({
    id,
    bh_code: `BH-DEMO-${String(bhsSeq).padStart(4, '0')}`,
    title,
    circle,
    // Famous monuments are always published so the public map isn't missing
    // the Taj; workflow variety comes from the invented sites + antiquities.
    status: 'PUBLISHED',
    state,
    state_lgd: LGD[state] ?? null,
    district,
    category_id: cat,
    cultural_affiliation_id: aff,
    architectural_style: style,
    period_id: dyn ? dynastyById[dyn].period_id : periodIdForYear(start),
    dynasty_id: dyn,
    date_start: start,
    date_end: end,
    date_certainty: certainty,
    period_text: periodTextFor(dyn, start, end),
    protection_level: protection,
    is_world_heritage: whs,
    location_precision: 'SURVEYED',
    coordinate_source: 'Public survey (approximate, demo)',
    display_precision: 'exact',
    source_ids: ['S01'],
    images: sitePhotos(title),
    image_is_representative: false,
    is_dummy: false,
    latitude: lat,
    longitude: lng,
  });
  bhsSeq += 1;
});

Object.entries(ANCHORS).forEach(([circle, towns]) => {
  for (let i = 0; i < 4; i += 1) {
    const [town, tLat, tLng, state] = pick(towns);
    const [cat, aff, dynPool, pattern] = pick(MINOR_TEMPLATES);
    const dynId = pick(dynPool);
    const d = dynastyById[dynId];
    const start = intBetween(d.start_year, Math.max(d.start_year, d.end_year - 40));
    const end = Math.min(d.end_year, start + intBetween(20, 200));
    const precision = pick(['APPROX', 'VILLAGE', 'VILLAGE', 'SURVEYED']);
    const protection = pick(['UNPROTECTED', 'UNPROTECTED', 'STATE']);
    const id = 9000 + bhsSeq;
    bhsRecords.push({
      id,
      bh_code: `BH-DEMO-${String(bhsSeq).padStart(4, '0')}`,
      title: `${pattern} ${town}`,
      circle,
      status: pick(STATUSES_WEIGHTED),
      state,
      state_lgd: LGD[state] ?? null,
      district: town,
      category_id: cat,
      cultural_affiliation_id: aff,
      architectural_style: null,
      period_id: d.period_id,
      dynasty_id: dynId,
      date_start: start,
      date_end: end,
      date_certainty: pick(['approx', 'century', 'century']),
      period_text: periodTextFor(dynId, start, end),
      protection_level: protection,
      is_world_heritage: false,
      location_precision: precision,
      coordinate_source: precision === 'SURVEYED' ? 'Handheld GPS, field visit' : 'Georeferenced from survey sketch',
      // Unprotected sites are the looting risk — generalise them publicly.
      display_precision: protection === 'UNPROTECTED' ? 'approximate' : 'exact',
      source_ids: [pick(['S02', 'S03'])],
      images: [],
      image_is_representative: false,
      is_dummy: true,
      latitude: round(tLat + between(-0.25, 0.25)),
      longitude: round(tLng + between(-0.25, 0.25)),
    });
    bhsSeq += 1;
  }
});

// ===========================================================================
// ANTIQUITY RECORDS
// ===========================================================================

/** [categoryId, materials[], title builders by affiliation] */
const ANT_TEMPLATES = {
  A01: { materials: ['M01', 'M02', 'M03', 'M04'], titles: { C01: ['Seated Buddha', 'Bodhisattva torso', 'Buddha head', 'Stupa railing pillar'], C02: ['Tirthankara in meditation', 'Jain ayagapata'], C03: ['Vishnu stele', 'Shiva-Parvati panel', 'Ganesha', 'Durga Mahishasuramardini', 'Surya'], C04: ['Carved jali fragment', 'Mihrab panel'], C06: ['Yakshi torso', 'Hero stone'] } },
  A02: { materials: ['M07', 'M06', 'M08'], titles: { C01: ['Punch-marked silver coin', 'Cast copper coin'], C03: ['Gupta gold dinara', 'Copper coin with Lakshmi'], C04: ['Sultanate silver tanka', 'Mughal silver rupee'], C06: ['Punch-marked silver coin', 'Kushan copper coin'] } },
  A03: { materials: ['M06', 'M01', 'M02'], titles: { C01: ['Donative inscription on railing', 'Copper-plate grant'], C03: ['Copper-plate land grant', 'Temple dedication slab'], C04: ['Persian building inscription'], C06: ['Memorial inscription'] } },
  A04: { materials: ['M09'], titles: { C01: ['Terracotta votive plaque'], C03: ['Terracotta female figurine', 'Terracotta temple panel'], C06: ['Terracotta toy cart', 'Terracotta animal figurine'], C07: ['Terracotta mother goddess'] } },
  A05: { materials: ['M05'], titles: { C01: ['Bronze standing Buddha'], C02: ['Bronze Tirthankara'], C03: ['Bronze Nataraja', 'Bronze Vishnu', 'Bronze Parvati'] } },
  A06: { materials: ['M09'], titles: { C01: ['Northern Black Polished Ware sherd'], C06: ['Red ware storage jar', 'Rouletted ware dish'], C07: ['Painted grey ware sherd', 'Black-on-red painted jar'] } },
  A07: { materials: ['M10', 'M09'], titles: { C07: ['Steatite seal with unicorn', 'Steatite seal with humped bull'], C06: ['Clay sealing with legend'] } },
  A08: { materials: ['M11', 'M08', 'M09'], titles: { C07: ['Etched carnelian bead'], C06: ['Gold ear ornament', 'Bead necklace'], C01: ['Reliquary bead'] } },
};

/** Which categories make sense for each affiliation. */
const AFF_CATEGORIES = {
  C01: ['A01', 'A01', 'A02', 'A03', 'A04', 'A05', 'A06', 'A08'],
  C02: ['A01', 'A01', 'A05'],
  C03: ['A01', 'A01', 'A01', 'A02', 'A03', 'A04', 'A05', 'A05'],
  C04: ['A01', 'A02', 'A02', 'A03'],
  C05: ['A02'],
  C06: ['A01', 'A02', 'A04', 'A06', 'A07', 'A08'],
  C07: ['A04', 'A06', 'A07', 'A07', 'A08'],
};

const ICONOGRAPHY = ['Dhyana mudra', 'Abhaya mudra', 'Tribhanga posture', 'Lotus pedestal', 'Attendant figures', null, null];
const SCRIPTS = [['Brahmi', 'Prakrit'], ['Brahmi', 'Sanskrit'], ['Grantha', 'Tamil'], ['Nagari', 'Sanskrit'], ['Kharosthi', 'Gandhari'], ['Naskh', 'Persian']];

function nearestMuseum(lat, lng) {
  let best = MUSEUMS[0];
  let bestD = Infinity;
  MUSEUMS.forEach((m) => {
    const d = (m.latitude - lat) ** 2 + (m.longitude - lng) ** 2;
    if (d < bestD) { bestD = d; best = m; }
  });
  return best;
}

const antiquityRecords = [];
const allTowns = Object.entries(ANCHORS).flatMap(([circle, towns]) => towns.map((t) => ({ circle, t })));

for (let i = 1; i <= 150; i += 1) {
  const roll = rand();
  let findLat = null;
  let findLng = null;
  let findText = null;
  let findPrecision = null;
  let bhsId = null;
  let circle;
  let state;
  let site = null;

  if (roll < 0.42) {
    // Found at / near a known BHS — linked
    site = pick(bhsRecords);
    bhsId = site.id;
    circle = site.circle;
    state = site.state;
    findLat = round(site.latitude + between(-0.02, 0.02));
    findLng = round(site.longitude + between(-0.02, 0.02));
    findText = `Within the precinct of ${site.title}`;
    findPrecision = pick(['SURVEYED', 'APPROX']);
  } else if (roll < 0.82) {
    // Loose find in a region, no linked site
    const { circle: c, t } = pick(allTowns);
    circle = c;
    state = t[3];
    findLat = round(t[1] + between(-0.4, 0.4));
    findLng = round(t[2] + between(-0.4, 0.4));
    findText = `Field near ${t[0]}`;
    findPrecision = pick(['APPROX', 'VILLAGE', 'VILLAGE']);
  } else {
    // Findspot unknown — common for old museum stock and seizures
    const { circle: c, t } = pick(allTowns);
    circle = c;
    state = t[3];
    findText = pick(['Unknown — old collection', 'Unknown — seized consignment', 'Provenance not recorded']);
  }

  const aff = site ? site.cultural_affiliation_id : pick(['C01', 'C01', 'C03', 'C03', 'C03', 'C04', 'C06', 'C07', 'C02']);
  const catId = pick(AFF_CATEGORIES[aff] || AFF_CATEGORIES.C06);
  const tpl = ANT_TEMPLATES[catId];
  const titlePool = tpl.titles[aff] || Object.values(tpl.titles)[0];
  const title = pick(titlePool);

  // Date: inherit the site's window when linked, otherwise a plausible dynasty
  let dynId;
  if (site?.dynasty_id) dynId = site.dynasty_id;
  else if (aff === 'C07') dynId = 'D01';
  else if (aff === 'C04') dynId = pick(['D16', 'D17', 'D20']);
  else if (aff === 'C05') dynId = 'D23';
  else dynId = pick(['D02', 'D03', 'D04', 'D05', 'D06', 'D08', 'D10', 'D11', 'D12', 'D13']);
  const d = dynastyById[dynId];
  const start = intBetween(d.start_year, Math.max(d.start_year, d.end_year - 30));
  const end = Math.min(d.end_year, start + intBetween(10, 120));

  // Where it is held now: usually the nearest museum, sometimes far away
  // (that long-distance movement is what dispersal lines make visible).
  const refLat = findLat ?? ANCHORS[circle][0][1];
  const refLng = findLng ?? ANCHORS[circle][0][2];
  const museum = rand() < 0.7 ? nearestMuseum(refLat, refLng) : pick(MUSEUMS);

  const discovery = findLat == null
    ? pick(['SEIZED', 'DONATED', 'PURCHASED'])
    : site ? pick(['EXCAVATION', 'EXCAVATION', 'SURFACE']) : pick(['SURFACE', 'CHANCE', 'CHANCE', 'EXCAVATION']);

  const isInscribed = catId === 'A03' || (catId === 'A02' && rand() < 0.5);
  const script = isInscribed ? pick(SCRIPTS) : null;
  const h = catId === 'A02' ? round(between(1.2, 2.4), 1) : round(between(6, 120), 1);

  antiquityRecords.push({
    id: 7000 + i,
    key_no: `KN-DEMO-${String(i).padStart(4, '0')}`,
    title,
    circle,
    state,
    state_lgd: LGD[state] ?? null,
    status: pick(STATUSES_WEIGHTED),
    category_id: catId,
    material_id: pick(tpl.materials),
    cultural_affiliation_id: aff,
    period_id: d.period_id,
    dynasty_id: dynId,
    date_start: start,
    date_end: end,
    date_certainty: pick(['approx', 'century', 'century', 'stylistic']),
    period_text: periodTextFor(dynId, start, end),
    find_location_text: findText,
    find_precision: findPrecision,
    find_year: findLat != null ? intBetween(1880, 2024) : null,
    discovery_type: discovery,
    museum_id: museum.id,
    bhs_id: bhsId,
    height_cm: h,
    width_cm: catId === 'A02' ? h : round(h * between(0.4, 0.9), 1),
    depth_cm: catId === 'A02' ? 0.2 : round(h * between(0.15, 0.4), 1),
    weight_g: catId === 'A02' ? round(between(2, 12), 1) : null,
    subject_iconography: catId === 'A01' || catId === 'A05' ? pick(ICONOGRAPHY) : null,
    inscription_script: script ? script[0] : null,
    inscription_language: script ? script[1] : null,
    // Restricted fields: staff + approved scholars only
    accession_number: `ACC/${museum.id}/${intBetween(1000, 9999)}`,
    display_precision: findPrecision === 'SURVEYED' ? 'approximate' : 'exact',
    images: [`/monuments/antiquities/${CATEGORY_PHOTO[catId]}.jpg`],
    image_is_representative: true,
    is_dummy: true,
    find_latitude: findLat,
    find_longitude: findLng,
  });
}

// ===========================================================================
// DRAFT SUMMARIES — named monuments hand-written (mapSummaries.js); every
// other record gets a sentence generated from its fields. All are drafts.
// ===========================================================================

const nameOf = (list, id) => list.find((x) => x.id === id)?.name;
const yr = (y) => (y < 0 ? `${-y} BCE` : `${y} CE`);
const range = (a, b) => (a === b ? `c. ${yr(a)}` : `c. ${yr(a)}–${yr(b)}`);
const withArticle = (w) => `${/^[aeiou]/i.test(w) ? 'an' : 'a'} ${w}`;
const cap = (t) => t[0].toUpperCase() + t.slice(1);

bhsRecords.forEach((r) => {
  r.summary_status = 'draft';
  if (SITE_SUMMARIES[r.title]) {
    r.summary = SITE_SUMMARIES[r.title];
    return;
  }
  const cat = nameOf(CATEGORIES, r.category_id).toLowerCase();
  const aff = nameOf(CULTURAL_AFFILIATIONS, r.cultural_affiliation_id);
  const dyn = dynastyById[r.dynasty_id]?.name;
  const prot = {
    CENTRAL: 'It is centrally protected.',
    STATE: 'It is protected by the state.',
    UNPROTECTED: 'It is not currently protected.',
  }[r.protection_level];
  const adj = { C05: 'colonial-era', C06: 'secular', C07: 'protohistoric' }[r.cultural_affiliation_id] || aff;
  r.summary = `${cap(withArticle(`${adj} ${cat}`))} near ${r.district}, ${r.state}, attributed to the ${dyn} period (${range(r.date_start, r.date_end)}). ${prot}`;
});

antiquityRecords.forEach((r) => {
  r.summary_status = 'draft';
  const cat = nameOf(CATEGORIES, r.category_id).toLowerCase();
  const mat = nameOf(MATERIALS, r.material_id).toLowerCase();
  const dyn = dynastyById[r.dynasty_id]?.name;
  const museum = nameOf(MUSEUMS, r.museum_id);
  const site = r.bhs_id && bhsRecords.find((b) => b.id === r.bhs_id);
  const discovery = nameOf(DISCOVERY_TYPES, r.discovery_type)?.toLowerCase();
  let found;
  if (site) found = `It was recovered at ${site.title}${r.find_year ? ` in ${r.find_year}` : ''} (${discovery}).`;
  else if (r.find_latitude != null) found = `It was ${withArticle(discovery)}${r.find_year ? ` in ${r.find_year}` : ''}, in a ${r.find_location_text[0].toLowerCase()}${r.find_location_text.slice(1)}.`;
  else found = `Where it was found is not recorded; it entered the collection as ${withArticle(discovery.replace(/ \(.*\)/, ''))} object.`;
  const what = mat === cat ? cat : `${mat} ${cat}`;
  r.summary = `${cap(withArticle(what))} from the ${dyn} period (${range(r.date_start, r.date_end)}). ${found} It is now held at ${museum}.`;
});

// ===========================================================================
// Exports
// ===========================================================================

export const MASTERS = {
  periods: PERIODS,
  dynasties: DYNASTIES,
  cultural_affiliations: CULTURAL_AFFILIATIONS,
  categories: CATEGORIES,
  materials: MATERIALS,
  states: STATES,
  museums: MUSEUMS,
  protection_levels: PROTECTION_LEVELS,
  location_precisions: LOCATION_PRECISIONS,
  discovery_types: DISCOVERY_TYPES,
  sources: SOURCES,
};

/** GeoJSON — what GET /map/features?layer=bhs returns. */
export function bhsFeatureCollection() {
  return {
    type: 'FeatureCollection',
    features: bhsRecords.map(({ latitude, longitude, ...props }) => ({
      type: 'Feature',
      id: props.id,
      geometry: { type: 'Point', coordinates: [longitude, latitude] },
      properties: props,
    })),
  };
}

/** GeoJSON — what GET /map/features?layer=antiquities returns.
 *  geometry is the FINDSPOT; null when the findspot is unknown. The holding
 *  museum's position comes from masters.museums via museum_id. */
export function antiquityFeatureCollection() {
  return {
    type: 'FeatureCollection',
    features: antiquityRecords.map(({ find_latitude, find_longitude, ...props }) => ({
      type: 'Feature',
      id: props.id,
      geometry: find_latitude == null ? null : { type: 'Point', coordinates: [find_longitude, find_latitude] },
      properties: props,
    })),
  };
}

// ===========================================================================
// PUBLIC (unauthenticated) responses
// ===========================================================================
// This is the contract the REAL backend must enforce SERVER-SIDE. Blurring
// in the browser is not protection: anyone can read the network tab.
//
//   1. Only PUBLISHED records leave the server.
//   2. display_precision 'approximate' → coordinates snapped to a ~5.5 km
//      grid cell centre; 'hidden' → record omitted.
//   3. Restricted fields are never sent (see PUBLIC_HIDDEN_FIELDS).

/** Fields the SoW hides from visitors, plus internal survey metadata. */
export const PUBLIC_HIDDEN_FIELDS = [
  'accession_number',
  'location_precision',
  'coordinate_source',
  'find_precision',
  'display_precision',
  'source_of_acquisition',
  'identification_marks',
  'condition',
  'remarks',
  'recorded_by',
  'date_of_recording',
];

const PUBLIC_GRID = 0.05;
const snap = (v) => Number(((Math.floor(v / PUBLIC_GRID) + 0.5) * PUBLIC_GRID).toFixed(4));

function publicFeature(f) {
  const p = f.properties;
  if (p.status !== 'PUBLISHED' || p.display_precision === 'hidden') return null;
  let geometry = f.geometry;
  if (geometry && p.display_precision === 'approximate') {
    const [lng, lat] = geometry.coordinates;
    geometry = { type: 'Point', coordinates: [snap(lng), snap(lat)] };
  }
  const properties = { ...p, location_generalised: p.display_precision === 'approximate' };
  PUBLIC_HIDDEN_FIELDS.forEach((k) => delete properties[k]);
  return { ...f, geometry, properties };
}

export function publicFeatureCollection(layer) {
  const fc = layer === 'bhs' ? bhsFeatureCollection() : antiquityFeatureCollection();
  return { type: 'FeatureCollection', features: fc.features.map(publicFeature).filter(Boolean) };
}
