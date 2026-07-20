import {
  CIRCLE_OPTIONS,
  MATERIAL,
  CONDITION,
  PERIOD,
  CATEGORY_OPTIONS,
  CULTURAL_AFFILIATION,
  ACQUISITION_SOURCE,
} from '../schema';

const toOpts = (arr) => arr.map((v) => ({ value: v, label: v }));

/**
 * Antiquity form config.
 *
 * Field names match the backend Record shape from POST /records verbatim so
 * form state can be serialised straight into the multipart body — no mapping
 * layer between the form and the wire.
 *
 * Extended fields (category, cultural_affiliation, weight, museum, source, etc.)
 * are NOT in the backend schema for POC. They're gated behind
 * SHOW_EXTENDED_FIELDS below so the config isn't lost — flip the flag to true
 * once the backend expands.
 */

/**
 * Master toggle for extended fields. Keep FALSE for POC.
 *   false → backend-compliant field set only
 *   true  → all fields visible; the extended ones will NOT be sent on the
 *           wire until antiquitiesApi.createAntiquity knows how to serialise
 *           them (currently, only backend-supported keys are appended)
 */
export const SHOW_EXTENDED_FIELDS = false;

// --------- Backend-compliant sections (always visible) ---------

const identificationSection = {
  id: 'identification',
  title: 'Identification',
  description: 'Title and secondary references. Key number is auto-generated on save.',
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Title',
      required: true,
      placeholder: 'e.g. Chola Bronze Nataraja',
      fullWidth: true,
      maxLength: 200,
    },
    {
      name: 'accession_number',
      type: 'text',
      label: 'Accession Number',
      placeholder: 'Optional secondary reference',
      helperText: 'Museum accession reference. Optional; not required to be unique.',
    },
  ],
};

const physicalSection = {
  id: 'physical',
  title: 'Physical Description',
  description: 'Material, condition, and measurements',
  fields: [
    {
      name: 'material',
      type: 'select',
      label: 'Primary Material',
      options: toOpts(MATERIAL),
      placeholder: 'Select material',
    },
    {
      name: 'condition',
      type: 'select',
      label: 'Condition',
      options: toOpts(CONDITION),
      placeholder: 'Select condition',
    },
    {
      name: 'dimensions',
      type: 'text',
      label: 'Dimensions',
      placeholder: 'e.g. 12 × 8 × 3 cm',
      helperText: 'Height × width × depth, with unit.',
      fullWidth: true,
    },
  ],
};

const historicalSection = {
  id: 'historical',
  title: 'Historical Context',
  description: 'Period and provenance',
  fields: [
    {
      name: 'period',
      type: 'select',
      label: 'Period / Dynasty',
      options: toOpts(PERIOD),
      placeholder: 'Select period',
    },
    {
      name: 'provenance',
      type: 'textarea',
      label: 'Provenance',
      rows: 3,
      fullWidth: true,
      placeholder: 'Origin / find-spot / previous ownership history',
    },
  ],
};

const custodySection = {
  id: 'custody',
  title: 'Custody',
  description: 'ASI Circle responsible for the record',
  fields: [
    {
      name: 'circle',
      type: 'select',
      label: 'ASI Circle',
      required: true,
      options: CIRCLE_OPTIONS,
      placeholder: 'Select circle',
    },
  ],
};

// --------- Extended (gated) sections — not in POC backend ---------

const extendedIdentification = {
  id: 'extended-identification',
  title: 'Category (extended)',
  description: 'Not sent to backend in POC.',
  fields: [
    {
      name: 'category',
      type: 'select',
      label: 'Category',
      options: CATEGORY_OPTIONS,
    },
    { name: 'subCategory', type: 'text', label: 'Sub-category' },
  ],
};

const extendedPhysical = {
  id: 'extended-physical',
  title: 'Weight (extended)',
  description: 'Not sent to backend in POC.',
  fields: [
    {
      name: 'weight',
      type: 'number',
      label: 'Weight (g)',
      min: 0,
      step: 0.01,
      placeholder: '0.0',
    },
  ],
};

const extendedHistorical = {
  id: 'extended-historical',
  title: 'Cultural Affiliation (extended)',
  description: 'Not sent to backend in POC.',
  fields: [
    {
      name: 'culturalAffiliation',
      type: 'select',
      label: 'Cultural Affiliation',
      options: toOpts(CULTURAL_AFFILIATION),
    },
  ],
};

const extendedCustody = {
  id: 'extended-custody',
  title: 'Museum & Acquisition (extended)',
  description: 'Not sent to backend in POC.',
  fields: [
    { name: 'museumName', type: 'text', label: 'Current Museum' },
    { name: 'currentLocation', type: 'text', label: 'Location within Museum', fullWidth: true },
    {
      name: 'sourceOfAcquisition',
      type: 'select',
      label: 'Source of Acquisition',
      options: toOpts(ACQUISITION_SOURCE),
    },
    { name: 'acquisitionDate', type: 'date', label: 'Acquisition Date' },
  ],
};

const extendedDocumentation = {
  id: 'extended-documentation',
  title: 'Documentation Notes (extended)',
  description: 'Not sent to backend in POC.',
  fields: [
    {
      name: 'identificationMarks',
      type: 'textarea',
      label: 'Identification Marks',
      rows: 3,
      fullWidth: true,
    },
    {
      name: 'remarks',
      type: 'textarea',
      label: 'General Remarks',
      rows: 4,
      fullWidth: true,
    },
  ],
};

// --------- Assembled config ---------

const baseSections = [
  identificationSection,
  physicalSection,
  historicalSection,
  custodySection,
];

const extendedSections = SHOW_EXTENDED_FIELDS
  ? [
      extendedIdentification,
      extendedPhysical,
      extendedHistorical,
      extendedCustody,
      extendedDocumentation,
    ]
  : [];

export const antiquityFormConfig = {
  sections: [...baseSections, ...extendedSections],
};

/**
 * Field names the backend actually accepts on POST /records for ANTIQUITY,
 * in canonical wire order. `image` is appended separately (last) by the
 * mutation — it's the file, not a form-state key. Multipart field ORDER
 * matters: the upload middleware reads `type` before `image` to choose the
 * destination subfolder.
 */
export const BACKEND_FIELDS = [
  'type',            // discriminator, prepended by the mutation
  'title',
  'circle',
  'key_no',
  'accession_number',
  'material',
  'dimensions',
  'provenance',
  'period',
  'condition',
  // then 'image' is appended LAST by the mutation
];

/**
 * Default empty values for the form. Includes every possible field (both
 * base and extended) so React's controlled-input semantics stay intact even
 * if a field is temporarily hidden by the flag.
 */
export function getInitialFormValues() {
  const values = {};
  [
    identificationSection,
    physicalSection,
    historicalSection,
    custodySection,
    extendedIdentification,
    extendedPhysical,
    extendedHistorical,
    extendedCustody,
    extendedDocumentation,
  ].forEach((s) => {
    s.fields.forEach((f) => {
      values[f.name] = '';
    });
  });
  return values;
}

/**
 * Flat list of currently visible field configs — used by validation so we
 * don't flag required errors on fields that are gated off.
 */
export function getAllFields() {
  return antiquityFormConfig.sections.flatMap((s) => s.fields);
}
