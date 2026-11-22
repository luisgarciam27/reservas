import React, { useEffect, useMemo, useState } from 'react';
import {
  Banknote,
  Calendar,
  CalendarCheck2,
  Kanban,
  Menu,
  Users,
  WifiOff,
  X,
} from 'lucide-react';
import type { RubroConfig, ServicioItem } from '../../config/rubros';
import { useOnlineStatus } from '../../hooks/usePWA';
import type {
  AppointmentRecord,
  BlockedSlot,
  ClientTag,
  EstadoCitaAdmin,
  MetodoPago,
  PagoEstado,
  UserSession,
} from '../../types/app';
import { OwnerAgendaView } from './OwnerAgendaView';
import { OwnerClientesView } from './OwnerClientesView';
import { OwnerCobrosView } from './OwnerCobrosView';
import { OwnerHoyView } from './OwnerHoyView';
import { OwnerKanbanView } from './OwnerKanbanView';
import { OwnerMasView } from './OwnerMasView';
import { OwnerMonthlyChart } from './OwnerMonthlyChart';
import {
  ADMIN_STATUS_META,
  buildInitialCitasForRubro,
  generateDemoSampleCitas,
} from './ownerSeedData';
import {
  playAttentionChime,
  playNewBookingChime,
  playSuccessChime,
} from '../../lib/soundAlerts';

type OwnerTabKey = 'hoy' | 'kanban' | 'agenda' | 'clientes' | 'cobros' | 'mas';

interface OwnerDashboardProps {
  rubro: RubroConfig;
  session: UserSession;
  externalBookings: AppointmentRecord[];
  onUpdateRubroSettings: (params: {
    servicios: ServicioItem[];
    diasLabel: string;
  }) => void;
  onViewAsClient: () => void;
  onLogout: () => void;
}

export const OwnerDashboard: React.FC<OwnerDashboardProps> = ({
  rubro,
  session,
  externalBookings,
  onUpdateRubroSettings,
  onViewAsClient,
  onLogout,
}) => {
  const isOnline = useOnlineStatus();
  const [activeTab, setActiveTab] = useState<OwnerTabKey>('hoy');

  const storageCitasKey = `maria_owner_citas_${rubro.id}`;
  const storageBlockedKey = `maria_owner_blocked_${rubro.id}`;
  const storageTagsKey = `maria_owner_tags_${rubro.id}`;
  const storageTplKey = `maria_owner_tpl_${rubro.id}`;

  const [citas, setCitas] = useState<AppointmentRecord[]>(() => {
    try {
      const raw = localStorage.getItem(storageCitasKey);
      if (raw) {
        const parsed = JSON.parse(raw) as AppointmentRecord[];
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Ignorar
    }
    return buildInitialCitasForRubro(rubro);
  });

  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>(() => {
    try {
      const raw = localStorage.getItem(storageBlockedKey);
      if (raw) return JSON.parse(raw) as BlockedSlot[];
    } catch {
      // Ignorar
    }
    return [];
  });

  const [clientTags, setClientTags] = useState<Record<string, ClientTag[]>>(
    () => {
      try {
        const raw = localStorage.getItem(storageTagsKey);
        if (raw) return JSON.parse(raw) as Record<string, ClientTag[]>;
      } catch {
        // Ignorar
      }
      return {};
    }
  );

  const [reminderTemplate, setReminderTemplate] = useState<string>(() => {
    try {
      const raw = localStorage.getItem(storageTplKey);
      if (raw) return raw;
    } catch {
      // Ignorar
    }
    return `Hola [cliente], te recordamos tu cita de [servicio] el [fecha] en ${rubro.nombre}. Responde 1 para confirmar o 2 para reprogramar.`;
  });

  const [editingCitaId, setEditingCitaId] = useState<string | null>(null);
  const [offlineWarning, setOfflineWarning] = useState<boolean>(false);

  // Recargar estado al cambiar de rubro
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageCitasKey);
      if (raw) {
        const parsed = JSON.parse(raw) as AppointmentRecord[];
        setCitas(
          Array.isArray(parsed) && parsed.length > 0
            ? parsed
            : buildInitialCitasForRubro(rubro)
        );
      } else {
        setCitas(buildInitialCitasForRubro(rubro));
      }
    } catch {
      setCitas(buildInitialCitasForRubro(rubro));
    }
  }, [rubro, storageCitasKey]);

  // Fusionar reservas nuevas hechas por clientes desde BookingTab
  useEffect(() => {
    const matchingExternal = externalBookings.filter(
      (b) => b.negocioId === rubro.negocio_id
    );
    if (matchingExternal.length === 0) return;

    setCitas((prev) => {
      let changed = false;
      const next = [...prev];
      for (const ext of matchingExternal) {
        if (!next.some((c) => c.id === ext.id)) {
          next.unshift(ext);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [externalBookings, rubro.negocio_id]);

  // Persistencia local
  useEffect(() => {
    try {
      localStorage.setItem(storageCitasKey, JSON.stringify(citas));
    } catch {
      // Ignorar
    }
  }, [citas, storageCitasKey]);

  useEffect(() => {
    try {
      localStorage.setItem(storageBlockedKey, JSON.stringify(blockedSlots));
    } catch {
      // Ignorar
    }
  }, [blockedSlots, storageBlockedKey]);

  useEffect(() => {
    try {
      localStorage.setItem(storageTagsKey, JSON.stringify(clientTags));
    } catch {
      // Ignorar
    }
  }, [clientTags, storageTagsKey]);

  useEffect(() => {
    try {
      localStorage.setItem(storageTplKey, reminderTemplate);
    } catch {
      // Ignorar
    }
  }, [reminderTemplate, storageTplKey]);

  const checkOnlineGuard = () => {
    if (!isOnline) {
      setOfflineWarning(true);
      setTimeout(() => setOfflineWarning(false), 3500);
    }
  };

  const handleChangeEstado = (id: string, estado: EstadoCitaAdmin) => {
    checkOnlineGuard();
    if (estado === 'confirmada' || estado === 'atendido') {
      playSuccessChime();
    } else if (estado === 'reprogramar' || estado === 'cancelada') {
      playAttentionChime();
    }
    setCitas((prev) =>
      prev.map((c) => (c.id === id ? { ...c, estado } : c))
    );
  };

  const handleUpdatePago = (
    id: string,
    pagoEstado: PagoEstado,
    montoPagado: number,
    metodoPago?: MetodoPago
  ) => {
    checkOnlineGuard();
    if (pagoEstado === 'pagado') {
      playSuccessChime();
    }
    setCitas((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, pagoEstado, montoPagado, metodoPago } : c
      )
    );
  };

  const handleCreateCita = (created: AppointmentRecord) => {
    checkOnlineGuard();
    setCitas((prev) => [created, ...prev]);
    playNewBookingChime();
  };

  const handleToggleBlockSlot = (
    fecha: string,
    hora: string,
    motivo = 'Bloqueado'
  ) => {
    setBlockedSlots((prev) => {
      const exists = prev.some((b) => b.fecha === fecha && b.hora === hora);
      if (exists) {
        return prev.filter((b) => !(b.fecha === fecha && b.hora === hora));
      }
      return [...prev, { id: `blk-${fecha}-${hora}`, fecha, hora, motivo }];
    });
  };

  const handleToggleClientTag = (telefono: string, tag: ClientTag) => {
    setClientTags((prev) => {
      const current = prev[telefono] || [];
      const exists = current.includes(tag);
      return {
        ...prev,
        [telefono]: exists
          ? current.filter((t) => t !== tag)
          : [...current, tag],
      };
    });
  };

  const handleLoadSampleData = () => {
    const sample = generateDemoSampleCitas(rubro);
    setCitas((prev) => {
      const nonSample = prev.filter((c) => !c.esEjemplo);
      return [...nonSample, ...sample];
    });
  };

  const handleClearSampleData = () => {
    setCitas((prev) => prev.filter((c) => !c.esEjemplo));
  };

  const editingCita = useMemo(
    () => citas.find((c) => c.id === editingCitaId) ?? null,
    [citas, editingCitaId]
  );

  const OWNER_TABS: {
    id: OwnerTabKey;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: 'hoy', label: 'Hoy', icon: CalendarCheck2 },
    { id: 'kanban', label: 'Kanban', icon: Kanban },
    { id: 'agenda', label: 'Agenda', icon: Calendar },
    { id: 'clientes', label: 'Clientes', icon: Users },
    { id: 'cobros', label: 'Cobros', icon: Banknote },
    { id: 'mas', label: 'Más', icon: Menu },
  ];

  const allHours = useMemo(() => {
    const arr: string[] = [];
    for (
      let h = rubro.horario.horaInicio;
      h <= rubro.horario.horaFin;
      h += 1
    ) {
      arr.push(`${String(h).padStart(2, '0')}:00`);
    }
    return arr;
  }, [rubro.horario.horaInicio, rubro.horario.horaFin]);

  return (
    <div className="space-y-4">
      {/* Cabecera compacta de contexto Dueño */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-2xs">
        <div className="min-w-0">
          <p
            className="text-xs font-bold"
            style={{ color: rubro.colores.primario }}
          >
            Panel Dueño / CRM · +51 {session.telefono}
          </p>
          <p className="truncate text-sm font-bold text-slate-900">
            {rubro.nombre}
          </p>
        </div>
        <button
          type="button"
          onClick={onViewAsClient}
          className="tap-feedback min-h-[40px] rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-800 hover:bg-slate-100"
        >
          Ver Landing cliente
        </button>
      </div>

      {/* Aviso offline para el dueño */}
      {(!isOnline || offlineWarning) && (
        <div className="flex items-center gap-2 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-900">
          <WifiOff className="h-4 w-4 shrink-0" />
          <span>Sin conexión, no se puede guardar en la nube</span>
        </div>
      )}

      {/* Navegación Desktop 6 pestañas del Dueño */}
      <nav
        aria-label="Navegación del panel de dueño"
        className="hidden grid-cols-6 gap-2 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-2xs md:grid"
      >
        {OWNER_TABS.map((tab) => {
          const active = activeTab === tab.id;
          const IconComp = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={
                active
                  ? {
                      backgroundColor: rubro.colores.superficieDestacada,
                      color: rubro.colores.primario,
                    }
                  : undefined
              }
              className={`tap-feedback flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-2 text-xs font-bold transition-colors ${
                active ? '' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <IconComp className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Vista activa del dueño */}
      <div>
        {activeTab === 'hoy' && (
          <div className="space-y-5">
            <OwnerHoyView
              rubro={rubro}
              citas={citas}
              onChangeEstado={handleChangeEstado}
              onOpenCitaSheet={(c) => setEditingCitaId(c.id)}
            />
            <OwnerMonthlyChart
              rubro={rubro}
              citas={citas}
              onLoadSampleData={handleLoadSampleData}
            />
          </div>
        )}
        {activeTab === 'kanban' && (
          <OwnerKanbanView
            rubro={rubro}
            citas={citas}
            onChangeEstado={handleChangeEstado}
            onOpenCitaSheet={(c) => setEditingCitaId(c.id)}
          />
        )}
        {activeTab === 'agenda' && (
          <OwnerAgendaView
            rubro={rubro}
            citas={citas}
            blockedSlots={blockedSlots}
            onCreateCita={handleCreateCita}
            onOpenCitaSheet={(c) => setEditingCitaId(c.id)}
            onToggleBlockSlot={handleToggleBlockSlot}
          />
        )}
        {activeTab === 'clientes' && (
          <OwnerClientesView
            rubro={rubro}
            citas={citas}
            clientTags={clientTags}
            onToggleClientTag={handleToggleClientTag}
            onLoadSampleData={handleLoadSampleData}
          />
        )}
        {activeTab === 'cobros' && (
          <OwnerCobrosView
            rubro={rubro}
            citas={citas}
            onUpdatePago={handleUpdatePago}
          />
        )}
        {activeTab === 'mas' && (
          <OwnerMasView
            rubro={rubro}
            citas={citas}
            reminderTemplate={reminderTemplate}
            onUpdateReminderTemplate={setReminderTemplate}
            onUpdateRubroSettings={onUpdateRubroSettings}
            onLoadSampleData={handleLoadSampleData}
            onClearSampleData={handleClearSampleData}
            onViewAsClient={onViewAsClient}
            onLogout={onLogout}
          />
        )}
      </div>

      {/* Bottom Bar móvil fijo 6 secciones del Dueño */}
      <nav
        aria-label="Navegación móvil de dueño"
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur-md pb-safe md:hidden"
      >
        <div className="grid h-[62px] grid-cols-6 items-center">
          {OWNER_TABS.map((tab) => {
            const active = activeTab === tab.id;
            const IconComp = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                aria-current={active ? 'page' : undefined}
                style={{
                  color: active ? rubro.colores.primario : '#64748B',
                }}
                className="tap-feedback flex h-full min-h-[48px] flex-col items-center justify-center gap-0.5 px-1"
              >
                <IconComp className="h-5 w-5" />
                <span className="text-[10px] font-bold whitespace-nowrap">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Bottom Sheet de edición de cita (desde Hoy o Agenda) */}
      {editingCita && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 backdrop-blur-xs sm:items-center sm:p-4"
          onClick={() => setEditingCitaId(null)}
        >
          <div
            className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-6 pb-safe shadow-2xl sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-slate-300 sm:hidden" />
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingCita.cliente}
                </h3>
                <p className="text-xs text-slate-500">
                  +51 {editingCita.telefono} · {editingCita.servicio} (S/{' '}
                  {editingCita.precio})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingCitaId(null)}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3.5">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700">
                    Fecha
                  </label>
                  <input
                    type="date"
                    value={editingCita.fecha}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCitas((prev) =>
                        prev.map((c) =>
                          c.id === editingCita.id ? { ...c, fecha: val } : c
                        )
                      );
                    }}
                    className="mt-1 min-h-[46px] w-full rounded-xl border border-slate-300 px-3 text-sm text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700">
                    Hora
                  </label>
                  <select
                    value={editingCita.hora}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCitas((prev) =>
                        prev.map((c) =>
                          c.id === editingCita.id ? { ...c, hora: val } : c
                        )
                      );
                    }}
                    className="mt-1 min-h-[46px] w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 tabular-nums"
                  >
                    {allHours.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">
                  Estado de la cita
                </label>
                <div className="mt-1.5 grid grid-cols-2 gap-2">
                  {(Object.keys(ADMIN_STATUS_META) as EstadoCitaAdmin[]).map(
                    (stKey) => {
                      const meta = ADMIN_STATUS_META[stKey];
                      const active = editingCita.estado === stKey;
                      return (
                        <button
                          key={stKey}
                          type="button"
                          onClick={() =>
                            handleChangeEstado(editingCita.id, stKey)
                          }
                          style={
                            active
                              ? {
                                  backgroundColor: meta.bg,
                                  color: meta.text,
                                  borderColor: meta.text,
                                }
                              : undefined
                          }
                          className={`min-h-[42px] rounded-xl border px-3 text-xs font-bold ${
                            active
                              ? ''
                              : 'border-slate-200 bg-white text-slate-700'
                          }`}
                        >
                          {meta.label}
                        </button>
                      );
                    }
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">
                  Notas internas
                </label>
                <textarea
                  rows={2}
                  value={editingCita.notas || ''}
                  placeholder="Agregar nota o detalle del servicio..."
                  onChange={(e) => {
                    const val = e.target.value;
                    setCitas((prev) =>
                      prev.map((c) =>
                        c.id === editingCita.id ? { ...c, notas: val } : c
                      )
                    );
                  }}
                  className="mt-1 w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-900"
                />
              </div>

              <button
                type="button"
                onClick={() => setEditingCitaId(null)}
                style={{ backgroundColor: rubro.colores.primario }}
                className="tap-feedback min-h-[48px] w-full rounded-xl text-sm font-bold text-white"
              >
                Listo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
