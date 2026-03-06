import { useState, useMemo, useCallback } from 'react';
import { useDashboardData } from '@/hooks/useDashboardData';
import { enrichSchichtzuweisung } from '@/lib/enrich';
import type { Schichtzuweisung } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { LivingAppsService, extractRecordId, createRecordUrl } from '@/services/livingAppsService';
import { formatDate } from '@/lib/formatters';
import { AI_PHOTO_SCAN } from '@/config/ai-features';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, ChevronLeft, ChevronRight, Plus, Trash2, Users, Clock, CalendarDays, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SchichtzuweisungDialog } from '@/components/dialogs/SchichtzuweisungDialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay, parseISO, isToday } from 'date-fns';
import { de } from 'date-fns/locale';
import { StatCard } from '@/components/StatCard';

// Pastel color palette for shift templates — cycles by index
const SHIFT_COLORS = [
  { bg: 'bg-indigo-100 dark:bg-indigo-900/40', text: 'text-indigo-800 dark:text-indigo-200', border: 'border-indigo-200 dark:border-indigo-700', dot: 'bg-indigo-500' },
  { bg: 'bg-emerald-100 dark:bg-emerald-900/40', text: 'text-emerald-800 dark:text-emerald-200', border: 'border-emerald-200 dark:border-emerald-700', dot: 'bg-emerald-500' },
  { bg: 'bg-amber-100 dark:bg-amber-900/40', text: 'text-amber-800 dark:text-amber-200', border: 'border-amber-200 dark:border-amber-700', dot: 'bg-amber-500' },
  { bg: 'bg-rose-100 dark:bg-rose-900/40', text: 'text-rose-800 dark:text-rose-200', border: 'border-rose-200 dark:border-rose-700', dot: 'bg-rose-500' },
  { bg: 'bg-violet-100 dark:bg-violet-900/40', text: 'text-violet-800 dark:text-violet-200', border: 'border-violet-200 dark:border-violet-700', dot: 'bg-violet-500' },
  { bg: 'bg-sky-100 dark:bg-sky-900/40', text: 'text-sky-800 dark:text-sky-200', border: 'border-sky-200 dark:border-sky-700', dot: 'bg-sky-500' },
];

export default function DashboardOverview() {
  const {
    mitarbeiter, schichtvorlagen, schichtzuweisung,
    mitarbeiterMap, schichtvorlagenMap,
    loading, error, fetchAll,
  } = useDashboardData();

  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<Schichtzuweisung | null>(null);
  const [prefillDate, setPrefillDate] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const enrichedAssignments = enrichSchichtzuweisung(schichtzuweisung, { schichtvorlagenMap, mitarbeiterMap });

  // Build a color map for shift templates
  const schichtColorMap = useMemo(() => {
    const map = new Map<string, typeof SHIFT_COLORS[0]>();
    schichtvorlagen.forEach((sv, idx) => {
      map.set(sv.record_id, SHIFT_COLORS[idx % SHIFT_COLORS.length]);
    });
    return map;
  }, [schichtvorlagen]);

  // Days of the current week (Mon–Sun)
  const weekDays = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i)),
    [currentWeekStart]
  );

  // Assignments grouped by date string
  const assignmentsByDate = useMemo(() => {
    const map = new Map<string, typeof enrichedAssignments>();
    enrichedAssignments.forEach(a => {
      const d = a.fields.datum?.slice(0, 10) ?? '';
      if (!d) return;
      const arr = map.get(d) ?? [];
      arr.push(a);
      map.set(d, arr);
    });
    return map;
  }, [enrichedAssignments]);

  // Stats
  const thisWeekCount = useMemo(() => {
    let count = 0;
    weekDays.forEach(day => {
      const key = format(day, 'yyyy-MM-dd');
      count += assignmentsByDate.get(key)?.length ?? 0;
    });
    return count;
  }, [weekDays, assignmentsByDate]);

  const uniqueEmployeesThisWeek = useMemo(() => {
    const ids = new Set<string>();
    weekDays.forEach(day => {
      const key = format(day, 'yyyy-MM-dd');
      assignmentsByDate.get(key)?.forEach(a => {
        const id = extractRecordId(a.fields.mitarbeiter);
        if (id) ids.add(id);
      });
    });
    return ids.size;
  }, [weekDays, assignmentsByDate]);

  const goToThisWeek = useCallback(() => {
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
  }, []);

  const isThisWeek = isSameDay(currentWeekStart, startOfWeek(new Date(), { weekStartsOn: 1 }));

  const openCreate = useCallback((date?: string) => {
    setEditRecord(null);
    setPrefillDate(date ?? null);
    setDialogOpen(true);
  }, []);

  const openEdit = useCallback((record: Schichtzuweisung) => {
    setEditRecord(record);
    setPrefillDate(null);
    setDialogOpen(true);
  }, []);

  const handleSubmit = useCallback(async (fields: Schichtzuweisung['fields']) => {
    if (editRecord) {
      await LivingAppsService.updateSchichtzuweisungEntry(editRecord.record_id, fields);
    } else {
      await LivingAppsService.createSchichtzuweisungEntry(fields);
    }
    fetchAll();
  }, [editRecord, fetchAll]);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    await LivingAppsService.deleteSchichtzuweisungEntry(deleteTarget);
    setDeleteTarget(null);
    fetchAll();
  }, [deleteTarget, fetchAll]);

  // Compute defaultValues for edit dialog — applookup fields need full URLs
  const editDefaultValues = useMemo(() => {
    if (!editRecord) return undefined;
    return editRecord.fields;
  }, [editRecord]);

  // Compute defaultValues for create with prefill date
  const createDefaultValues = useMemo(() => {
    if (editRecord || !prefillDate) return undefined;
    return { datum: prefillDate };
  }, [editRecord, prefillDate]);

  if (loading) return <DashboardSkeleton />;
  if (error) return <DashboardError error={error} onRetry={fetchAll} />;

  const weekLabel = `${format(currentWeekStart, 'd. MMM', { locale: de })} – ${format(addDays(currentWeekStart, 6), 'd. MMM yyyy', { locale: de })}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Schichtplan</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {mitarbeiter.length} Mitarbeiter · {schichtvorlagen.length} Schichtvorlagen
          </p>
        </div>
        <Button onClick={() => openCreate()} className="gap-2 shrink-0">
          <Plus size={16} /> Zuweisung erstellen
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title="Schichten diese Woche"
          value={String(thisWeekCount)}
          description="Zuweisungen"
          icon={<CalendarDays size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Aktive Mitarbeiter"
          value={String(uniqueEmployeesThisWeek)}
          description="Diese Woche eingeplant"
          icon={<Users size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Mitarbeiter gesamt"
          value={String(mitarbeiter.length)}
          description="Im System"
          icon={<Users size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Schichtvorlagen"
          value={String(schichtvorlagen.length)}
          description="Verfügbare Vorlagen"
          icon={<Clock size={18} className="text-muted-foreground" />}
        />
      </div>

      {/* Weekly planner */}
      <div className="rounded-2xl border bg-card overflow-hidden">
        {/* Week navigation */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentWeekStart(w => subWeeks(w, 1))}>
              <ChevronLeft size={16} />
            </Button>
            <span className="text-sm font-semibold min-w-[200px] text-center">{weekLabel}</span>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentWeekStart(w => addWeeks(w, 1))}>
              <ChevronRight size={16} />
            </Button>
          </div>
          {!isThisWeek && (
            <Button variant="ghost" size="sm" onClick={goToThisWeek} className="text-xs">
              Heute
            </Button>
          )}
        </div>

        {/* Legend for shift templates */}
        {schichtvorlagen.length > 0 && (
          <div className="flex flex-wrap gap-2 px-4 py-2 border-b bg-background/50">
            {schichtvorlagen.map((sv) => {
              const color = schichtColorMap.get(sv.record_id) ?? SHIFT_COLORS[0];
              return (
                <span key={sv.record_id} className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${color.bg} ${color.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${color.dot}`} />
                  {sv.fields.schichtname ?? '—'}
                  {sv.fields.startzeit && sv.fields.endzeit && (
                    <span className="opacity-70">{sv.fields.startzeit}–{sv.fields.endzeit}</span>
                  )}
                </span>
              );
            })}
          </div>
        )}

        {/* Day columns */}
        <div className="grid grid-cols-7 divide-x min-h-[420px]">
          {weekDays.map((day) => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const dayAssignments = assignmentsByDate.get(dateKey) ?? [];
            const today = isToday(day);

            return (
              <div key={dateKey} className={`flex flex-col min-h-[420px] ${today ? 'bg-primary/5' : ''}`}>
                {/* Day header */}
                <div
                  className={`px-2 py-2 text-center border-b cursor-pointer hover:bg-muted/50 transition-colors group`}
                  onClick={() => openCreate(dateKey)}
                  title="Schicht hinzufügen"
                >
                  <p className={`text-[10px] font-medium uppercase tracking-wider ${today ? 'text-primary' : 'text-muted-foreground'}`}>
                    {format(day, 'EEE', { locale: de })}
                  </p>
                  <p className={`text-base font-bold mt-0.5 ${today ? 'text-primary' : 'text-foreground'}`}>
                    {format(day, 'd')}
                  </p>
                  {dayAssignments.length > 0 && (
                    <span className={`text-[10px] font-medium ${today ? 'text-primary' : 'text-muted-foreground'}`}>
                      {dayAssignments.length} Schicht{dayAssignments.length !== 1 ? 'en' : ''}
                    </span>
                  )}
                </div>

                {/* Assignments */}
                <div className="flex-1 p-1.5 space-y-1 overflow-y-auto">
                  {dayAssignments.map(assignment => {
                    const svId = extractRecordId(assignment.fields.schichtvorlage);
                    const sv = svId ? schichtvorlagenMap.get(svId) : undefined;
                    const color = svId ? (schichtColorMap.get(svId) ?? SHIFT_COLORS[0]) : SHIFT_COLORS[0];

                    return (
                      <div
                        key={assignment.record_id}
                        className={`rounded-lg border p-1.5 cursor-pointer hover:shadow-sm transition-all group ${color.bg} ${color.border}`}
                        onClick={() => openEdit(assignment)}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <div className="min-w-0 flex-1">
                            <p className={`text-[11px] font-semibold truncate leading-tight ${color.text}`}>
                              {assignment.mitarbeiterName || '—'}
                            </p>
                            <p className={`text-[10px] truncate leading-tight opacity-80 ${color.text}`}>
                              {assignment.schichtvorlageName || '—'}
                            </p>
                            {sv?.fields.startzeit && sv?.fields.endzeit && (
                              <p className={`text-[10px] opacity-60 ${color.text}`}>
                                {sv.fields.startzeit}–{sv.fields.endzeit}
                              </p>
                            )}
                          </div>
                          <button
                            className={`opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-black/10 shrink-0`}
                            onClick={e => { e.stopPropagation(); setDeleteTarget(assignment.record_id); }}
                            title="Löschen"
                          >
                            <Trash2 size={11} className={color.text} />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {/* Add button for empty days */}
                  <button
                    className="w-full flex items-center justify-center gap-1 py-1 rounded-lg text-[10px] text-muted-foreground opacity-0 hover:opacity-100 focus:opacity-100 hover:bg-muted/60 transition-all border border-dashed border-transparent hover:border-border"
                    onClick={() => openCreate(dateKey)}
                  >
                    <Plus size={10} /> Schicht
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Employee overview */}
      {mitarbeiter.length > 0 && (
        <div className="rounded-2xl border bg-card">
          <div className="px-4 py-3 border-b">
            <h2 className="text-sm font-semibold">Mitarbeiter</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Übersicht Schichteinsatz diese Woche</p>
          </div>
          <div className="divide-y">
            {mitarbeiter.map(emp => {
              const weekShifts = weekDays.map(day => {
                const key = format(day, 'yyyy-MM-dd');
                return assignmentsByDate.get(key)?.filter(a => {
                  const mid = extractRecordId(a.fields.mitarbeiter);
                  return mid === emp.record_id;
                }) ?? [];
              });
              const totalShifts = weekShifts.reduce((sum, s) => sum + s.length, 0);

              return (
                <div key={emp.record_id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/30 transition-colors">
                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-semibold text-primary">
                      {(emp.fields.vorname?.[0] ?? '?').toUpperCase()}{(emp.fields.nachname?.[0] ?? '').toUpperCase()}
                    </span>
                  </div>

                  {/* Name & position */}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {emp.fields.vorname} {emp.fields.nachname}
                    </p>
                    {emp.fields.position && (
                      <p className="text-xs text-muted-foreground truncate">{emp.fields.position}</p>
                    )}
                  </div>

                  {/* Weekly mini grid */}
                  <div className="hidden sm:flex gap-1">
                    {weekDays.map((day, idx) => {
                      const dayShifts = weekShifts[idx];
                      const today = isToday(day);
                      if (dayShifts.length === 0) {
                        return (
                          <div
                            key={idx}
                            className={`w-7 h-7 rounded-md flex items-center justify-center cursor-pointer hover:bg-muted transition-colors ${today ? 'ring-1 ring-primary' : ''}`}
                            title={format(day, 'd. MMM', { locale: de })}
                            onClick={() => openCreate(format(day, 'yyyy-MM-dd'))}
                          >
                            <span className="text-[10px] text-muted-foreground">{format(day, 'd')}</span>
                          </div>
                        );
                      }
                      const svId = extractRecordId(dayShifts[0].fields.schichtvorlage);
                      const color = svId ? (schichtColorMap.get(svId) ?? SHIFT_COLORS[0]) : SHIFT_COLORS[0];
                      return (
                        <div
                          key={idx}
                          className={`w-7 h-7 rounded-md flex items-center justify-center ${color.bg} ${today ? 'ring-1 ring-primary' : ''} cursor-pointer`}
                          title={`${format(day, 'd. MMM', { locale: de })}: ${dayShifts.map(s => s.schichtvorlageName).join(', ')}`}
                          onClick={() => openEdit(dayShifts[0])}
                        >
                          <span className={`text-[10px] font-bold ${color.text}`}>{dayShifts.length}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Count badge */}
                  <Badge variant={totalShifts > 0 ? 'default' : 'secondary'} className="shrink-0 text-xs">
                    {totalShifts}×
                  </Badge>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Dialogs */}
      <SchichtzuweisungDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditRecord(null); setPrefillDate(null); }}
        onSubmit={handleSubmit}
        defaultValues={editRecord ? editDefaultValues : createDefaultValues}
        schichtvorlagenList={schichtvorlagen}
        mitarbeiterList={mitarbeiter}
        enablePhotoScan={AI_PHOTO_SCAN['Schichtzuweisung']}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Schicht löschen"
        description="Soll diese Schichtzuweisung wirklich gelöscht werden?"
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-36" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
      </div>
      <Skeleton className="h-[460px] rounded-2xl" />
    </div>
  );
}

function DashboardError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center">
        <AlertCircle size={22} className="text-destructive" />
      </div>
      <div className="text-center">
        <h3 className="font-semibold text-foreground mb-1">Fehler beim Laden</h3>
        <p className="text-sm text-muted-foreground max-w-xs">{error.message}</p>
      </div>
      <Button variant="outline" size="sm" onClick={onRetry}>Erneut versuchen</Button>
    </div>
  );
}
