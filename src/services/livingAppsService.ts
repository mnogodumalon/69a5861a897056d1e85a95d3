// AUTOMATICALLY GENERATED SERVICE
import { APP_IDS, LOOKUP_OPTIONS, FIELD_TYPES } from '@/types/app';
import type { Mitarbeiter, Schichtvorlagen, Schichtzuweisung } from '@/types/app';

// Base Configuration
const API_BASE_URL = 'https://my.living-apps.de/rest';

// --- HELPER FUNCTIONS ---
export function extractRecordId(url: unknown): string | null {
  if (!url) return null;
  if (typeof url !== 'string') return null;
  const match = url.match(/([a-f0-9]{24})$/i);
  return match ? match[1] : null;
}

export function createRecordUrl(appId: string, recordId: string): string {
  return `https://my.living-apps.de/rest/apps/${appId}/records/${recordId}`;
}

async function callApi(method: string, endpoint: string, data?: any) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',  // Nutze Session Cookies für Auth
    body: data ? JSON.stringify(data) : undefined
  });
  if (!response.ok) throw new Error(await response.text());
  // DELETE returns often empty body or simple status
  if (method === 'DELETE') return true;
  return response.json();
}

/** Upload a file to LivingApps. Returns the file URL for use in record fields. */
export async function uploadFile(file: File | Blob, filename?: string): Promise<string> {
  const formData = new FormData();
  formData.append('file', file, filename ?? (file instanceof File ? file.name : 'upload'));
  const res = await fetch(`${API_BASE_URL}/files`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });
  if (!res.ok) throw new Error(`File upload failed: ${res.status}`);
  const data = await res.json();
  return data.url;
}

function enrichLookupFields<T extends { fields: Record<string, unknown> }>(
  records: T[], entityKey: string
): T[] {
  const opts = LOOKUP_OPTIONS[entityKey];
  if (!opts) return records;
  return records.map(r => {
    const fields = { ...r.fields };
    for (const [fieldKey, options] of Object.entries(opts)) {
      const val = fields[fieldKey];
      if (typeof val === 'string') {
        const m = options.find(o => o.key === val);
        fields[fieldKey] = m ?? { key: val, label: val };
      } else if (Array.isArray(val)) {
        fields[fieldKey] = val.map(v => {
          if (typeof v === 'string') {
            const m = options.find(o => o.key === v);
            return m ?? { key: v, label: v };
          }
          return v;
        });
      }
    }
    return { ...r, fields } as T;
  });
}

/** Normalize fields for API writes: strip lookup objects to keys, fix date formats. */
export function cleanFieldsForApi(
  fields: Record<string, unknown>,
  entityKey: string
): Record<string, unknown> {
  const clean: Record<string, unknown> = { ...fields };
  for (const [k, v] of Object.entries(clean)) {
    if (v && typeof v === 'object' && !Array.isArray(v) && 'key' in v) clean[k] = (v as any).key;
    if (Array.isArray(v)) clean[k] = v.map((item: any) => item && typeof item === 'object' && 'key' in item ? item.key : item);
  }
  const types = FIELD_TYPES[entityKey];
  if (types) {
    for (const [k, ft] of Object.entries(types)) {
      const val = clean[k];
      if (typeof val !== 'string' || !val) continue;
      if (ft === 'date/datetimeminute') clean[k] = val.slice(0, 16);
      else if (ft === 'date/date') clean[k] = val.slice(0, 10);
    }
  }
  return clean;
}

export class LivingAppsService {
  // --- MITARBEITER ---
  static async getMitarbeiter(): Promise<Mitarbeiter[]> {
    const data = await callApi('GET', `/apps/${APP_IDS.MITARBEITER}/records`);
    const records = Object.entries(data).map(([id, rec]: [string, any]) => ({
      record_id: id, ...rec
    })) as Mitarbeiter[];
    return enrichLookupFields(records, 'mitarbeiter');
  }
  static async getMitarbeiterEntry(id: string): Promise<Mitarbeiter | undefined> {
    const data = await callApi('GET', `/apps/${APP_IDS.MITARBEITER}/records/${id}`);
    const record = { record_id: data.id, ...data } as Mitarbeiter;
    return enrichLookupFields([record], 'mitarbeiter')[0];
  }
  static async createMitarbeiterEntry(fields: Mitarbeiter['fields']) {
    return callApi('POST', `/apps/${APP_IDS.MITARBEITER}/records`, { fields });
  }
  static async updateMitarbeiterEntry(id: string, fields: Partial<Mitarbeiter['fields']>) {
    return callApi('PATCH', `/apps/${APP_IDS.MITARBEITER}/records/${id}`, { fields });
  }
  static async deleteMitarbeiterEntry(id: string) {
    return callApi('DELETE', `/apps/${APP_IDS.MITARBEITER}/records/${id}`);
  }

  // --- SCHICHTVORLAGEN ---
  static async getSchichtvorlagen(): Promise<Schichtvorlagen[]> {
    const data = await callApi('GET', `/apps/${APP_IDS.SCHICHTVORLAGEN}/records`);
    const records = Object.entries(data).map(([id, rec]: [string, any]) => ({
      record_id: id, ...rec
    })) as Schichtvorlagen[];
    return enrichLookupFields(records, 'schichtvorlagen');
  }
  static async getSchichtvorlagenEntry(id: string): Promise<Schichtvorlagen | undefined> {
    const data = await callApi('GET', `/apps/${APP_IDS.SCHICHTVORLAGEN}/records/${id}`);
    const record = { record_id: data.id, ...data } as Schichtvorlagen;
    return enrichLookupFields([record], 'schichtvorlagen')[0];
  }
  static async createSchichtvorlagenEntry(fields: Schichtvorlagen['fields']) {
    return callApi('POST', `/apps/${APP_IDS.SCHICHTVORLAGEN}/records`, { fields });
  }
  static async updateSchichtvorlagenEntry(id: string, fields: Partial<Schichtvorlagen['fields']>) {
    return callApi('PATCH', `/apps/${APP_IDS.SCHICHTVORLAGEN}/records/${id}`, { fields });
  }
  static async deleteSchichtvorlagenEntry(id: string) {
    return callApi('DELETE', `/apps/${APP_IDS.SCHICHTVORLAGEN}/records/${id}`);
  }

  // --- SCHICHTZUWEISUNG ---
  static async getSchichtzuweisung(): Promise<Schichtzuweisung[]> {
    const data = await callApi('GET', `/apps/${APP_IDS.SCHICHTZUWEISUNG}/records`);
    const records = Object.entries(data).map(([id, rec]: [string, any]) => ({
      record_id: id, ...rec
    })) as Schichtzuweisung[];
    return enrichLookupFields(records, 'schichtzuweisung');
  }
  static async getSchichtzuweisungEntry(id: string): Promise<Schichtzuweisung | undefined> {
    const data = await callApi('GET', `/apps/${APP_IDS.SCHICHTZUWEISUNG}/records/${id}`);
    const record = { record_id: data.id, ...data } as Schichtzuweisung;
    return enrichLookupFields([record], 'schichtzuweisung')[0];
  }
  static async createSchichtzuweisungEntry(fields: Schichtzuweisung['fields']) {
    return callApi('POST', `/apps/${APP_IDS.SCHICHTZUWEISUNG}/records`, { fields });
  }
  static async updateSchichtzuweisungEntry(id: string, fields: Partial<Schichtzuweisung['fields']>) {
    return callApi('PATCH', `/apps/${APP_IDS.SCHICHTZUWEISUNG}/records/${id}`, { fields });
  }
  static async deleteSchichtzuweisungEntry(id: string) {
    return callApi('DELETE', `/apps/${APP_IDS.SCHICHTZUWEISUNG}/records/${id}`);
  }

}