import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Mitarbeiter, Schichtvorlagen, Schichtzuweisung } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';

export function useDashboardData() {
  const [mitarbeiter, setMitarbeiter] = useState<Mitarbeiter[]>([]);
  const [schichtvorlagen, setSchichtvorlagen] = useState<Schichtvorlagen[]>([]);
  const [schichtzuweisung, setSchichtzuweisung] = useState<Schichtzuweisung[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAll = useCallback(async () => {
    setError(null);
    try {
      const [mitarbeiterData, schichtvorlagenData, schichtzuweisungData] = await Promise.all([
        LivingAppsService.getMitarbeiter(),
        LivingAppsService.getSchichtvorlagen(),
        LivingAppsService.getSchichtzuweisung(),
      ]);
      setMitarbeiter(mitarbeiterData);
      setSchichtvorlagen(schichtvorlagenData);
      setSchichtzuweisung(schichtzuweisungData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Fehler beim Laden der Daten'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const mitarbeiterMap = useMemo(() => {
    const m = new Map<string, Mitarbeiter>();
    mitarbeiter.forEach(r => m.set(r.record_id, r));
    return m;
  }, [mitarbeiter]);

  const schichtvorlagenMap = useMemo(() => {
    const m = new Map<string, Schichtvorlagen>();
    schichtvorlagen.forEach(r => m.set(r.record_id, r));
    return m;
  }, [schichtvorlagen]);

  return { mitarbeiter, setMitarbeiter, schichtvorlagen, setSchichtvorlagen, schichtzuweisung, setSchichtzuweisung, loading, error, fetchAll, mitarbeiterMap, schichtvorlagenMap };
}