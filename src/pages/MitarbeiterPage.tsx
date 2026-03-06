import { useState, useEffect } from 'react';
import { LivingAppsService } from '@/services/livingAppsService';
import type { Mitarbeiter } from '@/types/app';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, Plus, Search, Mail, Phone, IdCard, Briefcase, Users } from 'lucide-react';
import { MitarbeiterDialog } from '@/components/dialogs/MitarbeiterDialog';
import { MitarbeiterViewDialog } from '@/components/dialogs/MitarbeiterViewDialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { PageShell } from '@/components/PageShell';
import { AI_PHOTO_SCAN, AI_PHOTO_LOCATION } from '@/config/ai-features';

function getInitials(vorname?: string, nachname?: string) {
  const v = (vorname ?? '').trim();
  const n = (nachname ?? '').trim();
  if (!v && !n) return '?';
  return `${v.charAt(0)}${n.charAt(0)}`.toUpperCase();
}

function getAvatarColor(id: string) {
  const colors = [
    'bg-blue-500', 'bg-violet-500', 'bg-emerald-500',
    'bg-orange-500', 'bg-rose-500', 'bg-cyan-500', 'bg-amber-500', 'bg-pink-500',
  ];
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export default function MitarbeiterPage() {
  const [records, setRecords] = useState<Mitarbeiter[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Mitarbeiter | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Mitarbeiter | null>(null);
  const [viewingRecord, setViewingRecord] = useState<Mitarbeiter | null>(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      setRecords(await LivingAppsService.getMitarbeiter());
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(fields: Mitarbeiter['fields']) {
    await LivingAppsService.createMitarbeiterEntry(fields);
    await loadData();
    setDialogOpen(false);
  }

  async function handleUpdate(fields: Mitarbeiter['fields']) {
    if (!editingRecord) return;
    await LivingAppsService.updateMitarbeiterEntry(editingRecord.record_id, fields);
    await loadData();
    setEditingRecord(null);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await LivingAppsService.deleteMitarbeiterEntry(deleteTarget.record_id);
    setRecords(prev => prev.filter(r => r.record_id !== deleteTarget.record_id));
    setDeleteTarget(null);
  }

  const filtered = records.filter(r => {
    if (!search) return true;
    const s = search.toLowerCase();
    return Object.values(r.fields).some(v => {
      if (v == null) return false;
      if (Array.isArray(v)) return v.some(item => typeof item === 'object' && item !== null && 'label' in item ? String((item as any).label).toLowerCase().includes(s) : String(item).toLowerCase().includes(s));
      if (typeof v === 'object' && 'label' in (v as any)) return String((v as any).label).toLowerCase().includes(s);
      return String(v).toLowerCase().includes(s);
    });
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <PageShell
      title="Mitarbeiter"
      subtitle={`${records.length} ${records.length === 1 ? 'Mitarbeiter' : 'Mitarbeiter'} im System`}
      action={
        <Button onClick={() => setDialogOpen(true)} className="shrink-0">
          <Plus className="h-4 w-4 mr-2" /> Mitarbeiter hinzufügen
        </Button>
      }
    >
      {/* Suche */}
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Name, Position, E-Mail suchen..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Karten-Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium text-foreground">
              {search ? 'Keine Ergebnisse gefunden' : 'Noch keine Mitarbeiter'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {search ? `Keine Treffer für "${search}"` : 'Füge deinen ersten Mitarbeiter hinzu'}
            </p>
          </div>
          {!search && (
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Mitarbeiter hinzufügen
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(record => {
            const { vorname, nachname, mitarbeiternummer, position, email, telefon } = record.fields;
            const initials = getInitials(vorname, nachname);
            const avatarColor = getAvatarColor(record.record_id);
            const fullName = [vorname, nachname].filter(Boolean).join(' ') || '—';

            return (
              <div
                key={record.record_id}
                className="group relative flex flex-col bg-card border border-border rounded-2xl p-5 hover:shadow-md hover:border-primary/30 transition-all cursor-pointer"
                onClick={(e) => {
                  if ((e.target as HTMLElement).closest('button')) return;
                  setViewingRecord(record);
                }}
              >
                {/* Avatar + Aktionen */}
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl ${avatarColor} flex items-center justify-center text-white font-bold text-lg shrink-0`}>
                    {initials}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setEditingRecord(record)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget(record)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Name & Position */}
                <div className="mb-3">
                  <h3 className="font-semibold text-foreground leading-tight truncate">{fullName}</h3>
                  {position && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <Briefcase className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-sm text-muted-foreground truncate">{position}</span>
                    </div>
                  )}
                </div>

                {/* Trennlinie */}
                <div className="border-t border-border my-3" />

                {/* Kontakt-Infos */}
                <div className="space-y-2 flex-1">
                  {mitarbeiternummer && (
                    <div className="flex items-center gap-2">
                      <IdCard className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-xs text-muted-foreground truncate">{mitarbeiternummer}</span>
                    </div>
                  )}
                  {email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <a
                        href={`mailto:${email}`}
                        className="text-xs text-primary hover:underline truncate"
                        onClick={e => e.stopPropagation()}
                      >
                        {email}
                      </a>
                    </div>
                  )}
                  {telefon && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <a
                        href={`tel:${telefon}`}
                        className="text-xs text-muted-foreground hover:text-foreground truncate"
                        onClick={e => e.stopPropagation()}
                      >
                        {telefon}
                      </a>
                    </div>
                  )}
                  {!email && !telefon && !mitarbeiternummer && (
                    <p className="text-xs text-muted-foreground italic">Keine Kontaktdaten</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <MitarbeiterDialog
        open={dialogOpen || !!editingRecord}
        onClose={() => { setDialogOpen(false); setEditingRecord(null); }}
        onSubmit={editingRecord ? handleUpdate : handleCreate}
        defaultValues={editingRecord?.fields}
        enablePhotoScan={AI_PHOTO_SCAN['Mitarbeiter']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Mitarbeiter']}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Mitarbeiter löschen"
        description="Soll dieser Eintrag wirklich gelöscht werden? Diese Aktion kann nicht rückgängig gemacht werden."
      />

      <MitarbeiterViewDialog
        open={!!viewingRecord}
        onClose={() => setViewingRecord(null)}
        record={viewingRecord}
        onEdit={(r) => { setViewingRecord(null); setEditingRecord(r); }}
      />
    </PageShell>
  );
}
