// BHS schema.
//
// Workflow constants (STATUS, STATUS_LABEL, STATUS_BADGE_VARIANT, CIRCLE,
// CIRCLE_OPTIONS) are the SAME across antiquity + BHS — both types live on
// the unified /records endpoint. Rather than duplicate them and drift, we
// re-export from the antiquities schema. That's not a cross-feature leak;
// those enums are wire-contract with the backend, not antiquity-specific.
//
// BHS-specific enums (category, protection status, state, period) live here.
export {
  STATUS,
  STATUS_LABEL,
  STATUS_BADGE_VARIANT,
  CIRCLE,
  CIRCLE_OPTIONS,
} from '@features/antiquities/schema';

// ---------- BHS category ----------
export const BHS_CATEGORY = [
  'Temple',
  'Fort',
  'Mosque',
  'Church',
  'Tomb',
  'Palace',
  'Stepwell',
  'Cave',
  'Rock-cut architecture',
  'Monument',
  'Excavated site',
  'Other',
];

// ---------- Protection status ----------
export const PROTECTION_STATUS = [
  'Centrally Protected (ASI)',
  'State Protected',
  'World Heritage Site',
  'Notified',
  'Unprotected',
];

// ---------- Indian states/UTs (a slim subset for POC) ----------
// Backend accepts free text — this is a curated list for the dropdown; users
// can still type in "district" freely.
export const INDIAN_STATE = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Jammu & Kashmir',
  'Ladakh',
  'Chandigarh',
  'Puducherry',
];

// ---------- Period (shared vocabulary with antiquities) ----------
export const PERIOD = [
  'Indus Valley (2600-1900 BCE)',
  'Vedic (1500-500 BCE)',
  'Mauryan (322-185 BCE)',
  'Gupta (320-550 CE)',
  'Chalukya (543-753 CE)',
  'Pallava (275-897 CE)',
  'Rashtrakuta (753-982 CE)',
  'Chola (300 BCE-1279 CE)',
  'Hoysala (1026-1343 CE)',
  'Delhi Sultanate (1206-1526 CE)',
  'Vijayanagara (1336-1646 CE)',
  'Mughal (1526-1857 CE)',
  'Maratha (1674-1818 CE)',
  'Sikh (1799-1849 CE)',
  'Colonial (1757-1947 CE)',
];

export const CONDITION = ['Excellent', 'Good', 'Fair', 'Poor', 'Ruined'];
