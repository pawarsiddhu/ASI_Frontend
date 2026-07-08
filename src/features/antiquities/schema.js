/**
 * Antiquities schema — enums and label mappings.
 * Change a value here, it propagates everywhere (tables, filters, forms, mocks).
 *
 * NOTE: These strings are the workflow-status wire values. If we later switch
 * to numeric enums or a different naming convention, this file is the only
 * touchpoint that needs updating.
 */

// ---------- Workflow status ----------
export const STATUS = {
  DRAFT: 'draft',
  SUPERVISOR_REVIEW: 'supervisor_review',
  ADMIN_REVIEW: 'admin_review',
  PUBLISH_QUEUE: 'publish_queue',
  PUBLISHED: 'published',
  RETURNED: 'returned',
  REJECTED: 'rejected',
};

export const STATUS_LABEL = {
  [STATUS.DRAFT]: 'Draft',
  [STATUS.SUPERVISOR_REVIEW]: 'Under Supervisor Review',
  [STATUS.ADMIN_REVIEW]: 'Under Admin Review',
  [STATUS.PUBLISH_QUEUE]: 'In Publish Queue',
  [STATUS.PUBLISHED]: 'Published',
  [STATUS.RETURNED]: 'Returned for Correction',
  [STATUS.REJECTED]: 'Rejected',
};

// Maps status → Badge variant. Matches the Badge component's variant prop.
export const STATUS_BADGE_VARIANT = {
  [STATUS.DRAFT]: 'default',
  [STATUS.SUPERVISOR_REVIEW]: 'info',
  [STATUS.ADMIN_REVIEW]: 'accent',
  [STATUS.PUBLISH_QUEUE]: 'warning',
  [STATUS.PUBLISHED]: 'success',
  [STATUS.RETURNED]: 'warning',
  [STATUS.REJECTED]: 'danger',
};

// ---------- Categories & sub-categories ----------
export const CATEGORY = {
  SCULPTURE: 'sculpture',
  COIN: 'coin',
  MANUSCRIPT: 'manuscript',
  POTTERY: 'pottery',
  INSCRIPTION: 'inscription',
  METALWARE: 'metalware',
  WEAPONS: 'weapons',
  JEWELRY: 'jewelry',
  TEXTILE: 'textile',
  PAINTING: 'painting',
};

export const CATEGORY_LABEL = {
  [CATEGORY.SCULPTURE]: 'Sculpture',
  [CATEGORY.COIN]: 'Coin',
  [CATEGORY.MANUSCRIPT]: 'Manuscript',
  [CATEGORY.POTTERY]: 'Pottery',
  [CATEGORY.INSCRIPTION]: 'Inscription',
  [CATEGORY.METALWARE]: 'Metalware',
  [CATEGORY.WEAPONS]: 'Weapons',
  [CATEGORY.JEWELRY]: 'Jewelry',
  [CATEGORY.TEXTILE]: 'Textile',
  [CATEGORY.PAINTING]: 'Painting',
};

// ---------- Materials ----------
export const MATERIAL = [
  'Bronze',
  'Stone',
  'Gold',
  'Silver',
  'Copper',
  'Terracotta',
  'Wood',
  'Ivory',
  'Paper',
  'Cloth',
  'Iron',
  'Ceramic',
];

// ---------- Cultural affiliation ----------
export const CULTURAL_AFFILIATION = [
  'Hindu',
  'Buddhist',
  'Jain',
  'Islamic',
  'Christian',
  'Sikh',
  'Secular',
  'Indus Valley',
];

// ---------- Period / dynasty ----------
export const PERIOD = [
  'Indus Valley (2600-1900 BCE)',
  'Vedic (1500-500 BCE)',
  'Mauryan (322-185 BCE)',
  'Gupta (320-550 CE)',
  'Chola (300 BCE-1279 CE)',
  'Pallava (275-897 CE)',
  'Chalukya (543-753 CE)',
  'Rashtrakuta (753-982 CE)',
  'Hoysala (1026-1343 CE)',
  'Vijayanagara (1336-1646 CE)',
  'Delhi Sultanate (1206-1526 CE)',
  'Mughal (1526-1857 CE)',
  'Maratha (1674-1818 CE)',
  'Sikh (1799-1849 CE)',
  'Colonial (1757-1947 CE)',
];

// ---------- Condition ----------
export const CONDITION = ['Excellent', 'Good', 'Fair', 'Poor'];

// ---------- Source of acquisition ----------
export const ACQUISITION_SOURCE = [
  'Excavation',
  'Donation',
  'Purchase',
  'Confiscation',
  'Transfer',
  'Gift',
];

// ---------- ASI Circles ----------
// (Real list has 29 — we use a working subset for the mock)
export const CIRCLE = {
  DELHI: { id: 'CIR-DEL', name: 'Delhi Circle' },
  MUMBAI: { id: 'CIR-MUM', name: 'Mumbai Circle' },
  CHENNAI: { id: 'CIR-CHE', name: 'Chennai Circle' },
  KOLKATA: { id: 'CIR-KOL', name: 'Kolkata Circle' },
  BANGALORE: { id: 'CIR-BAN', name: 'Bangalore Circle' },
  HYDERABAD: { id: 'CIR-HYD', name: 'Hyderabad Circle' },
  BHOPAL: { id: 'CIR-BPL', name: 'Bhopal Circle' },
  JAIPUR: { id: 'CIR-JPR', name: 'Jaipur Circle' },
};

export const CIRCLES = Object.values(CIRCLE);

// ---------- Helpers: build <Select options={[...]}> arrays ----------

export const asOptions = (obj) =>
  Object.entries(obj).map(([, value]) => ({
    value,
    label: STATUS_LABEL[value] || CATEGORY_LABEL[value] || value,
  }));

export const STATUS_OPTIONS = Object.values(STATUS).map((value) => ({
  value,
  label: STATUS_LABEL[value],
}));

export const CATEGORY_OPTIONS = Object.values(CATEGORY).map((value) => ({
  value,
  label: CATEGORY_LABEL[value],
}));

export const CIRCLE_OPTIONS = CIRCLES.map((c) => ({
  value: c.id,
  label: c.name,
}));
