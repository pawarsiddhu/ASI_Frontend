import {
  CIRCLE_OPTIONS,
  BHS_CATEGORY,
  PROTECTION_STATUS,
  INDIAN_STATE,
  PERIOD,
  CONDITION,
} from '../schema';

const toOpts = (arr) => arr.map((v) => ({ value: v, label: v }));

/**
 * BHS form config.
 *
 * Field names match the backend Record shape from POST /records verbatim so
 * form state can be serialised straight into the multipart body — no mapping
 * layer between the form and the wire.
 *
 * `bh_code` is auto-generated at submission time (see BHSCreatePage), so it
 * is NOT in the form. `latitude` and `longitude` are required by backend for
 * BHS records (per swagger); everything else is optional.
 *
 * The `_map` pseudo-field renders an interactive Leaflet picker inline with
 * lat/lng. It has no `name` on the wire — the multipart builder in bhsApi.js
 * appends only whitelisted backend keys, so the pseudo-field can never leak
 * out. The picker also fills `state` and `district` from reverse-geocoding
 * (see @utils/reverseGeocode) — those two inputs are therefore locked
 * (readOnly: true). If geocoding can't identify the location (e.g. sea, or
 * a region outside our INDIAN_STATE list) the fields stay blank; the record
 * still saves.
 */

const identificationSection = {
  id: 'identification',
  title: 'Identification',
  description: 'Name of the site. A unique BH code is assigned automatically on save.',
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Site Name',
      required: true,
      placeholder: 'e.g. Rock-cut cave shrine',
      fullWidth: true,
      maxLength: 200,
    },
  ],
};

const locationSection = {
  id: 'location',
  title: 'Location',
  description:
    'Drop a pin on the map or type coordinates directly — state and district are filled automatically from the pin.',
  fields: [
    {
      name: 'latitude',
      type: 'number',
      label: 'Latitude',
      required: true,
      placeholder: 'e.g. 19.076',
      step: 'any',
      helperText: 'Decimal degrees (WGS84).',
    },
    {
      name: 'longitude',
      type: 'number',
      label: 'Longitude',
      required: true,
      placeholder: 'e.g. 72.8777',
      step: 'any',
      helperText: 'Decimal degrees (WGS84).',
    },
    {
      name: '_map',
      type: 'map',
      label: 'Pin location on map',
      helperText: 'Click the map to drop a pin, then drag it to fine-tune.',
      latField: 'latitude',
      lngField: 'longitude',
      stateField: 'state',
      districtField: 'district',
      fullWidth: true,
    },
    {
      name: 'state',
      type: 'select',
      label: 'State / UT',
      options: toOpts(INDIAN_STATE),
      placeholder: 'Filled automatically from map pin',
      helperText: 'Auto-filled from the map pin — not editable.',
      readOnly: true,
    },
    {
      name: 'district',
      type: 'text',
      label: 'District',
      placeholder: 'Filled automatically from map pin',
      helperText: 'Auto-filled from the map pin — not editable.',
      readOnly: true,
    },
  ],
};

const classificationSection = {
  id: 'classification',
  title: 'Classification',
  description: 'Type of monument and protection status',
  fields: [
    {
      name: 'category',
      type: 'select',
      label: 'Category',
      options: toOpts(BHS_CATEGORY),
      placeholder: 'Select category',
    },
    {
      name: 'protection_status',
      type: 'select',
      label: 'Protection Status',
      options: toOpts(PROTECTION_STATUS),
      placeholder: 'Select status',
    },
  ],
};

const historicalSection = {
  id: 'historical',
  title: 'Historical & Physical',
  description: 'Period and current condition',
  fields: [
    {
      name: 'period',
      type: 'select',
      label: 'Period / Dynasty',
      options: toOpts(PERIOD),
      placeholder: 'Select period',
    },
    {
      name: 'condition',
      type: 'select',
      label: 'Condition',
      options: toOpts(CONDITION),
      placeholder: 'Select condition',
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

export const bhsFormConfig = {
  sections: [
    identificationSection,
    locationSection,
    classificationSection,
    historicalSection,
    custodySection,
  ],
};

/**
 * Default empty form values. Every backend-bound field must be present for
 * controlled inputs. Pseudo-fields (type: 'map') are skipped — they neither
 * hold state of their own nor need to be in `values`.
 */
export function getInitialBHSFormValues() {
  const values = {};
  bhsFormConfig.sections.forEach((s) => {
    s.fields.forEach((f) => {
      if (f.type === 'map') return;
      values[f.name] = '';
    });
  });
  return values;
}

/** Flat list of all field configs — used by validation. */
export function getAllBHSFields() {
  return bhsFormConfig.sections.flatMap((s) => s.fields);
}