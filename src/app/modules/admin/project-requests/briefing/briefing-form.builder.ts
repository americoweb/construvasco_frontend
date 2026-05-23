import { FormBuilder, FormGroup } from '@angular/forms';
import { BriefingFieldDef, ProjectTypeKey } from './briefing-form.types';
import { getAllBriefingFieldKeys, getVisibleSections } from './briefing-form.schema';

export function createBriefingDataGroup(
  fb: FormBuilder,
  projectType: ProjectTypeKey,
  initial?: Record<string, unknown> | null
): FormGroup {
  const group = fb.group({});
  const keys = getAllBriefingFieldKeys(projectType);
  const data = initial ?? {};
  for (const key of keys) {
    group.addControl(key, fb.control(data[key] ?? null));
  }
  return group;
}

export function syncBriefingControls(
  parent: FormGroup,
  fb: FormBuilder,
  projectType: ProjectTypeKey,
  briefingKey = 'briefing_data'
): void {
  const keys = getAllBriefingFieldKeys(projectType);
  let briefing = parent.get(briefingKey) as FormGroup | null;
  if (!briefing) {
    briefing = fb.group({});
    parent.addControl(briefingKey, briefing);
  }

  const current = briefing.getRawValue() as Record<string, unknown>;
  const keySet = new Set(keys);

  Object.keys(briefing.controls).forEach((k) => {
    if (!keySet.has(k)) {
      briefing!.removeControl(k);
    }
  });

  keys.forEach((k) => {
    if (!briefing!.contains(k)) {
      briefing!.addControl(k, fb.control(current[k] ?? null));
    }
  });
}

export function pruneBriefingPayload(
  raw: Record<string, unknown>,
  projectType: ProjectTypeKey
): Record<string, unknown> {
  const allowed = new Set(getAllBriefingFieldKeys(projectType));
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (!allowed.has(k)) continue;
    if (v === null || v === undefined || v === '') continue;
    out[k] = v;
  }
  return out;
}

export function defaultValueForField(field: BriefingFieldDef): unknown {
  if (field.type === 'boolean') return false;
  return null;
}

export function getVisibleSectionsFor(projectType: ProjectTypeKey) {
  return getVisibleSections(projectType);
}
