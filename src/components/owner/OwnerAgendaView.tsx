import React, { useMemo, useState } from 'react';
import { Calendar, Clock, Lock, Plus, Unlock, X } from 'lucide-react';
import type { RubroConfig } from '../../config/rubros';
import { normalizePeruPhone } from '../../hooks/useAuthSession';
import type { AppointmentRecord, BlockedSlot } from '../../types/app';
import { ADMIN_STATUS_META, getLimaDateOffsetStr } from './ownerSeedData';

interface OwnerAgendaViewProps {
  rubro: RubroConfig;
  citas: AppointmentRecord[];
  blockedSlots: BlockedSlot[];
  onCreateCita: (cita: AppointmentRecord) => void;
  onOpenCitaSheet: (cita: AppointmentRecord) => void;
  onToggleBlockSlot: (fecha: string, hora: string, motivo?: string) => void;
}

export const OwnerAgendaView: React.FC<OwnerAgendaViewProps> = ({
  rubro,
  citas,
  blockedSlots,
  onCreateCita,
  onOpenCitaSheet,
  onToggleBlockSlot,
}) => {
  const [viewType, setViewType] = useState<'dia' | 'semana'>('dia');
  const [selectedDate, setSelectedDate] = useState<string>(() =>
    getLimaDateOffsetStr(0)
  );
  const [showNewCitaSheet, setShowNewCitaSheet] = useState<boolean>(false);
  const [blockTargetHour, setBlockTargetHour] = useState<string | null>(null);
  const [blockReason, setBlockReason] = useState<string>('Almuerzo');

  // Form nueva cita presencial/llamada
  const [newCliente, setNewCliente] = useState('');
  const [newTelefono, setNewTelefono] = useState('');
  const [newServicio, setNewServicio] = useState(
    rubro.servicios[0]?.nombre || ''
  );
  const [newFecha, setNewFecha] = useState(() => getLimaDateOffsetStr(0));
  const [newHora, setNewHora] = useState('09:00');
  const [newNotas, setNewNotas] = useState('');

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

  const weekDates = useMemo(() => {
    return [0, 1, 2, 3, 4, 5].map((offset) => {
      const ymd = getLimaDateOffsetStr(offset);
      const dt = new Date(`${ymd}T12:00:00Z`);
      const label = new Intl.DateTimeFormat('es-PE', {
        weekday: 'short',
        day: 'numeric',
        timeZone: 'UTC',
      }).format(dt);
      return { ymd, label };
    });
  }, []);

  const existingClients = useMemo(() => {
    const map = new Map<string, { nombre: string; telefono: string }>();
    for (const c of citas) {
      if (!map.has(c.telefono)) {
        map.set(c.telefono, { nombre: c.cliente, telefono: c.telefono });
      }
    }
    return Array.from(map.values());
  }, [citas]);

  const citasForDay = useMemo(
    () =>
      citas.filter((c) => c.fecha === selectedDate && c.estado !== 'cancelada'),
    [citas, selectedDate]
  );

  const openNewModalAtHour = (hora: string) => {
    setNewFecha(selectedDate);
    setNewHora(hora);
    setShowNewCitaSheet(true);
  };

  const handleSubmitNewCita = (e: React.FormEvent) => {
    e.preventDefault();
    const svc =
      rubro.servicios.find((s) => s.nombre === newServicio) ||
      rubro.servicios[0];
    const cleanPhone = normalizePeruPhone(newTelefono) || '964000000';

    const created: AppointmentRecord = {
      id: `manual-${Date.now()}`,
      negocioId: rubro.negocio_id,
      fecha: newFecha,
      hora: newHora,
      cliente: newCliente.trim() || 'Cliente Presencial',
      telefono: cleanPhone,
      ciudad: rubro.ciudad || 'Perú',
      servicio: svc.nombre,
      precio: svc.precio,
      estado: 'confirmada',
      pagoEstado: 'sin_pago',
      montoPagado: 0,
      notas: newNotas.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    onCreateCita(created);
    setShowNewCitaSheet(false);
    setNewCliente('');
    setNewTelefono('');
    setNewNotas('');
  };

  return (
    <div className="space-y-4 pb-16">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-1">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Agenda</h2>
          <p className="text-xs text-slate-500">
            Toca una cita para editar, mover hora o cobrar · Toca un hueco libre para agendar o bloquear.
          </p>
        </div>

        {/* Vista Día / Semana */}
        <div className="grid grid-cols-2 rounded-xl bg-slate-200/70 p-1">
          <button
            type="button"
            onClick={() => setViewType('dia')}
            className={`tap-feedback min-h-[44px] rounded-lg px-4 text-xs font-bold ${
              viewType === 'dia'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600'
            }`}
          >
            Vista Día
          </button>
          <button
            type="button"
            onClick={() => setViewType('semana')}
            className={`tap-feedback min-h-[44px] rounded-lg px-4 text-xs font-bold ${
              viewType === 'semana'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600'
            }`}
          >
            Vista Semana
          </button>
        </div>
      </div>

      {/* Selector rápido de día */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {weekDates.map((wd) => {
          const active = selectedDate === wd.ymd;
          return (
            <button
              key={wd.ymd}
              type="button"
              onClick={() => setSelectedDate(wd.ymd)}
              style={
                active
                  ? {
                      backgroundColor: rubro.colores.primario,
                      color: '#FFFFFF',
                      borderColor: rubro.colores.primario,
                    }
                  : undefined
              }
              className={`tap-feedback min-h-[44px] shrink-0 rounded-xl border px-3.5 text-xs font-bold capitalize ${
                active
                  ? ''
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              {wd.label}
            </button>
          );
        })}
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          aria-label="Seleccionar fecha"
          className="min-h-[44px] shrink-0 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800"
        />
      </div>

      {/* VISTA DÍA (lista por horas con huecos libres y bloqueos) */}
      {viewType === 'dia' ? (
        <div className="space-y-2.5">
          {allHours.map((hora) => {
            const slotCitas = citasForDay.filter((c) => c.hora === hora);
            const blocked = blockedSlots.find(
              (b) => b.fecha === selectedDate && b.hora === hora
            );

            if (blocked) {
              return (
                <div
                  key={hora}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-slate-300 bg-slate-100 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-slate-600 tabular-nums">
                      {hora}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700">
                      <Lock className="h-3.5 w-3.5" />
                      Bloqueado · {blocked.motivo}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onToggleBlockSlot(selectedDate, hora)}
                    className="tap-feedback inline-flex min-h-[44px] items-center gap-1 rounded-xl border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-800"
                  >
                    <Unlock className="h-3.5 w-3.5" />
                    Desbloquear
                  </button>
                </div>
              );
            }

            if (slotCitas.length === 0) {
              return (
                <div
                  key={hora}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-dashed border-slate-300 bg-white/70 px-4 py-2.5"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-slate-400 tabular-nums">
                      {hora}
                    </span>
                    <span className="text-xs font-medium text-slate-500">
                      Hueco libre
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openNewModalAtHour(hora)}
                      className="tap-feedback min-h-[44px] rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-800 hover:bg-slate-50"
                    >
                      + Agendar
                    </button>
                    <button
                      type="button"
                      onClick={() => setBlockTargetHour(hora)}
                      aria-label={`Bloquear ${hora}`}
                      className="tap-feedback flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                    >
                      <Lock className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div key={hora} className="space-y-2">
                {slotCitas.map((cita) => {
                  const st = ADMIN_STATUS_META[cita.estado];
                  return (
                    <button
                      key={cita.id}
                      type="button"
                      onClick={() => onOpenCitaSheet(cita)}
                      className="tap-feedback flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-2xs hover:border-slate-300"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className="flex h-12 w-14 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold tabular-nums"
                          style={{
                            backgroundColor: rubro.colores.superficieDestacada,
                            color: rubro.colores.primario,
                          }}
                        >
                          {cita.hora}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-slate-900">
                            {cita.cliente}
                          </p>
                          <p className="truncate text-xs text-slate-600">
                            {cita.servicio} · S/ {cita.precio}
                          </p>
                        </div>
                      </div>
                      <span
                        style={{
                          backgroundColor: st.bg,
                          color: st.text,
                          borderColor: st.border,
                        }}
                        className="shrink-0 rounded-lg border px-2.5 py-1 text-xs font-bold whitespace-nowrap"
                      >
                        {st.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      ) : (
        /* VISTA SEMANA (desplazable horizontalmente) */
        <div className="flex gap-3 overflow-x-auto pb-3">
          {weekDates.map((wd) => {
            const dayItems = citas
              .filter((c) => c.fecha === wd.ymd && c.estado !== 'cancelada')
              .sort((a, b) => a.hora.localeCompare(b.hora));
            return (
              <div
                key={wd.ymd}
                className="w-[240px] shrink-0 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <span className="text-sm font-bold capitalize text-slate-900">
                    {wd.label}
                  </span>
                  <span className="text-xs font-semibold text-slate-500 tabular-nums">
                    {dayItems.length} citas
                  </span>
                </div>

                <div className="mt-3 space-y-2">
                  {dayItems.length === 0 ? (
                    <p className="py-6 text-center text-xs text-slate-400">
                      Día disponible
                    </p>
                  ) : (
                    dayItems.map((dc) => {
                      const st = ADMIN_STATUS_META[dc.estado];
                      return (
                        <button
                          key={dc.id}
                          type="button"
                          onClick={() => onOpenCitaSheet(dc)}
                          className="tap-feedback w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-left"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-extrabold text-slate-900 tabular-nums">
                              {dc.hora}
                            </span>
                            <span
                              style={{ color: st.text }}
                              className="text-[10px] font-bold"
                            >
                              {st.label}
                            </span>
                          </div>
                          <p className="mt-1 truncate text-xs font-bold text-slate-800">
                            {dc.cliente}
                          </p>
                          <p className="truncate text-[11px] text-slate-500">
                            {dc.servicio}
                          </p>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Botón flotante "+ Nueva cita" */}
      <button
        type="button"
        onClick={() => {
          setNewFecha(selectedDate);
          setShowNewCitaSheet(true);
        }}
        style={{ backgroundColor: rubro.colores.primario }}
        className="tap-feedback fixed bottom-20 left-4 z-30 inline-flex min-h-[52px] items-center gap-2 rounded-2xl px-5 text-sm font-bold text-white shadow-xl md:bottom-6 md:left-auto md:right-24"
      >
        <Plus className="h-5 w-5" />
        Nueva cita
      </button>

      {/* Bottom Sheet: Bloquear Horario */}
      {blockTargetHour && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 backdrop-blur-xs sm:items-center sm:p-4"
          onClick={() => setBlockTargetHour(null)}
        >
          <div
            className="w-full max-w-md rounded-t-3xl bg-white p-6 pb-safe shadow-2xl sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-slate-300 sm:hidden" />
            <h3 className="text-lg font-bold text-slate-900">
              Bloquear horario ({blockTargetHour})
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Evita reservas en esta hora el {selectedDate}.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {['Almuerzo', 'Feriado', 'Capacitación', 'Mantenimiento'].map(
                (m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setBlockReason(m)}
                    className={`min-h-[40px] rounded-xl border px-3 text-xs font-bold ${
                      blockReason === m
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 bg-slate-50 text-slate-700'
                    }`}
                  >
                    {m}
                  </button>
                )
              )}
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setBlockTargetHour(null)}
                className="min-h-[48px] rounded-xl border border-slate-200 text-sm font-semibold text-slate-700"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onToggleBlockSlot(selectedDate, blockTargetHour, blockReason);
                  setBlockTargetHour(null);
                }}
                style={{ backgroundColor: rubro.colores.primario }}
                className="min-h-[48px] rounded-xl text-sm font-bold text-white"
              >
                Bloquear hora
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Sheet: "+ Nueva cita" (presencial o llamada) */}
      {showNewCitaSheet && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 backdrop-blur-xs sm:items-center sm:p-4"
          onClick={() => setShowNewCitaSheet(false)}
        >
          <div
            className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-6 pb-safe shadow-2xl sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-slate-300 sm:hidden" />
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">
                Registrar cita presencial / llamada
              </h3>
              <button
                type="button"
                onClick={() => setShowNewCitaSheet(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitNewCita} className="mt-4 space-y-3.5">
              {existingClients.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-slate-600">
                    Elegir cliente frecuente (opcional)
                  </label>
                  <select
                    defaultValue=""
                    onChange={(e) => {
                      const picked = existingClients.find(
                        (c) => c.telefono === e.target.value
                      );
                      if (picked) {
                        setNewCliente(picked.nombre);
                        setNewTelefono(picked.telefono);
                      }
                    }}
                    className="mt-1 min-h-[46px] w-full rounded-xl border border-slate-300 bg-slate-50 px-3 text-sm text-slate-900"
                  >
                    <option value="">-- Nuevo cliente --</option>
                    {existingClients.map((ec) => (
                      <option key={ec.telefono} value={ec.telefono}>
                        {ec.nombre} (+51 {ec.telefono})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700">
                  Nombre del cliente
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Carlos Mendoza"
                  value={newCliente}
                  onChange={(e) => setNewCliente(e.target.value)}
                  className="mt-1 min-h-[48px] w-full rounded-xl border border-slate-300 px-3 text-base text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">
                  Teléfono (9 dígitos)
                </label>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={9}
                  required
                  placeholder="964000000"
                  value={newTelefono}
                  onChange={(e) =>
                    setNewTelefono(normalizePeruPhone(e.target.value))
                  }
                  className="mt-1 min-h-[48px] w-full rounded-xl border border-slate-300 px-3 text-base text-slate-900 tabular-nums"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">
                  Servicio
                </label>
                <select
                  value={newServicio}
                  onChange={(e) => setNewServicio(e.target.value)}
                  className="mt-1 min-h-[48px] w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900"
                >
                  {rubro.servicios.map((s) => (
                    <option key={s.id} value={s.nombre}>
                      {s.nombre} (S/ {s.precio})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700">
                    Fecha
                  </label>
                  <div className="relative mt-1">
                    <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="date"
                      value={newFecha}
                      onChange={(e) => setNewFecha(e.target.value)}
                      className="min-h-[48px] w-full rounded-xl border border-slate-300 pl-9 pr-2 text-sm text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700">
                    Hora
                  </label>
                  <div className="relative mt-1">
                    <Clock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <select
                      value={newHora}
                      onChange={(e) => setNewHora(e.target.value)}
                      className="min-h-[48px] w-full rounded-xl border border-slate-300 bg-white pl-9 pr-2 text-sm text-slate-900 tabular-nums"
                    >
                      {allHours.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">
                  Notas (opcional)
                </label>
                <input
                  type="text"
                  placeholder="Observaciones o motivo"
                  value={newNotas}
                  onChange={(e) => setNewNotas(e.target.value)}
                  className="mt-1 min-h-[48px] w-full rounded-xl border border-slate-300 px-3 text-sm text-slate-900"
                />
              </div>

              <button
                type="submit"
                style={{ backgroundColor: rubro.colores.primario }}
                className="tap-feedback min-h-[50px] w-full rounded-xl text-sm font-bold text-white shadow-sm"
              >
                Guardar cita en agenda
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
