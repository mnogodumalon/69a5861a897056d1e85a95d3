import type { EnrichedSchichtzuweisung } from '@/types/enriched';
import type { Mitarbeiter, Schichtvorlagen, Schichtzuweisung } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveDisplay(url: unknown, map: Map<string, any>, ...fields: string[]): string {
  if (!url) return '';
  const id = extractRecordId(url);
  if (!id) return '';
  const r = map.get(id);
  if (!r) return '';
  return fields.map(f => String(r.fields[f] ?? '')).join(' ').trim();
}

interface SchichtzuweisungMaps {
  schichtvorlagenMap: Map<string, Schichtvorlagen>;
  mitarbeiterMap: Map<string, Mitarbeiter>;
}

export function enrichSchichtzuweisung(
  schichtzuweisung: Schichtzuweisung[],
  maps: SchichtzuweisungMaps
): EnrichedSchichtzuweisung[] {
  return schichtzuweisung.map(r => ({
    ...r,
    schichtvorlageName: resolveDisplay(r.fields.schichtvorlage, maps.schichtvorlagenMap, 'schichtname'),
    mitarbeiterName: resolveDisplay(r.fields.mitarbeiter, maps.mitarbeiterMap, 'vorname', 'nachname'),
  }));
}
