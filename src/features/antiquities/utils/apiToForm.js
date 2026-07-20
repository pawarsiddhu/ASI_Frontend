/**
 * apiToForm — convert an API antiquity record to flat form values.
 *
 * API records nest: dimensions.{h,w,d}, weight.{value,unit}, circle.{id,name}.
 * The form is flat: { height, width, depth, weight, circle }.
 * This mapping lives in one place so Create + Edit stay consistent.
 */
export function apiRecordToFormValues(record) {
  if (!record) return {};
  return {
    name: record.name || '',
    accessionNo: record.accessionNo || '',
    category: record.category || '',
    subCategory: record.subCategory || '',
    material: record.material || '',
    condition: record.condition || '',
    height: record.dimensions?.h ?? '',
    width: record.dimensions?.w ?? '',
    depth: record.dimensions?.d ?? '',
    weight: record.weight?.value ?? '',
    period: record.period || '',
    culturalAffiliation: record.culturalAffiliation || '',
    provenance: record.provenance || '',
    circle: record.circle?.id || '',
    museumName: record.museumName || '',
    currentLocation: record.currentLocation || '',
    sourceOfAcquisition: record.sourceOfAcquisition || '',
    acquisitionDate: record.acquisitionDate
      ? String(record.acquisitionDate).slice(0, 10)
      : '',
    identificationMarks: record.identificationMarks || '',
    remarks: record.remarks || '',
  };
}
