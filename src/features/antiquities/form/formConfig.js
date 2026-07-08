import {
  CATEGORY_OPTIONS,
  CIRCLE_OPTIONS,
  MATERIAL,
  CONDITION,
  PERIOD,
  CULTURAL_AFFILIATION,
  ACQUISITION_SOURCE,
} from '../schema';

const toOpts = (arr) => arr.map((v) => ({ value: v, label: v }));

/**
 * Antiquity form config.
 *
 * Each section has:
 *   { id, title, description?, fields: Field[] }
 *
 * Each field has at minimum:
 *   { name, type, label, required?, helperText?, placeholder?, fullWidth?, options? }
 *
 * The `name` becomes the key in form state. This config is the ONLY thing
 * you edit to add/remove/reorder form fields. FormField.jsx dispatches on
 * `type`; add a new type by adding a case there.
 */
export const antiquityFormConfig = {
  sections: [
    {
      id: 'identification',
      title: 'Identification',
      description: 'Core identifiers and classification',
      fields: [
        {
          name: 'name',
          type: 'text',
          label: 'Name / Title',
          required: true,
          placeholder: 'e.g. Chola Bronze Nataraja',
          fullWidth: true,
          maxLength: 200,
        },
        {
          name: 'accessionNo',
          type: 'text',
          label: 'Accession Number',
          required: true,
          placeholder: 'e.g. NMMA/2024/DEL/A-4521',
          helperText: 'Format: NMMA/YYYY/<CIRCLE>/<CODE>',
        },
        {
          name: 'category',
          type: 'select',
          label: 'Category',
          required: true,
          options: CATEGORY_OPTIONS,
        },
        {
          name: 'subCategory',
          type: 'text',
          label: 'Sub-category',
          placeholder: 'Optional — more specific type',
        },
      ],
    },

    {
      id: 'physical',
      title: 'Physical Description',
      description: 'Material, condition, and measurements',
      fields: [
        {
          name: 'material',
          type: 'select',
          label: 'Primary Material',
          required: true,
          options: toOpts(MATERIAL),
        },
        {
          name: 'condition',
          type: 'select',
          label: 'Condition',
          required: true,
          options: toOpts(CONDITION),
        },
        {
          name: 'height',
          type: 'number',
          label: 'Height (cm)',
          min: 0,
          step: 0.1,
          placeholder: '0.0',
        },
        {
          name: 'width',
          type: 'number',
          label: 'Width (cm)',
          min: 0,
          step: 0.1,
          placeholder: '0.0',
        },
        {
          name: 'depth',
          type: 'number',
          label: 'Depth (cm)',
          min: 0,
          step: 0.1,
          placeholder: '0.0',
        },
        {
          name: 'weight',
          type: 'number',
          label: 'Weight (g)',
          min: 0,
          step: 0.01,
          placeholder: '0.0',
        },
      ],
    },

    {
      id: 'historical',
      title: 'Historical Context',
      description: 'Period, cultural context, and provenance',
      fields: [
        {
          name: 'period',
          type: 'select',
          label: 'Period / Dynasty',
          required: true,
          options: toOpts(PERIOD),
        },
        {
          name: 'culturalAffiliation',
          type: 'select',
          label: 'Cultural Affiliation',
          required: true,
          options: toOpts(CULTURAL_AFFILIATION),
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
    },

    {
      id: 'custody',
      title: 'Custody & Acquisition',
      description: 'Circle, museum, and how the object was acquired',
      fields: [
        {
          name: 'circle',
          type: 'select',
          label: 'ASI Circle',
          required: true,
          options: CIRCLE_OPTIONS,
        },
        {
          name: 'museumName',
          type: 'text',
          label: 'Current Museum',
          placeholder: 'e.g. National Museum, New Delhi',
        },
        {
          name: 'currentLocation',
          type: 'text',
          label: 'Current Location within Museum',
          placeholder: 'Gallery / section',
          fullWidth: true,
        },
        {
          name: 'sourceOfAcquisition',
          type: 'select',
          label: 'Source of Acquisition',
          options: toOpts(ACQUISITION_SOURCE),
        },
        {
          name: 'acquisitionDate',
          type: 'date',
          label: 'Acquisition Date',
        },
      ],
    },

    {
      id: 'documentation',
      title: 'Documentation Notes',
      description: 'Identification marks, general remarks',
      fields: [
        {
          name: 'identificationMarks',
          type: 'textarea',
          label: 'Identification Marks',
          rows: 3,
          fullWidth: true,
          placeholder: 'Inscriptions, signatures, distinguishing features',
        },
        {
          name: 'remarks',
          type: 'textarea',
          label: 'General Remarks',
          rows: 4,
          fullWidth: true,
          placeholder: 'Any additional notes, conservation observations, references',
        },
      ],
    },
  ],
};

/**
 * Default empty values for the form. Number/date fields default to '' so
 * they render as truly empty inputs (React controlled-input semantics).
 */
export function getInitialFormValues() {
  const values = {};
  antiquityFormConfig.sections.forEach((s) => {
    s.fields.forEach((f) => {
      values[f.name] = '';
    });
  });
  return values;
}

/**
 * Flat list of all field configs — handy for validation loops.
 */
export function getAllFields() {
  return antiquityFormConfig.sections.flatMap((s) => s.fields);
}
