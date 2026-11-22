import React, { useEffect, useMemo, useState } from 'react';
import {
  Calculator,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  Edit3,
  HeartHandshake,
  ListOrdered,
  MessageSquare,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import type {
  CitaEjemplo,
  EstadoCita,
  RubroConfig,
} from '../config/rubros';
import type { BookedSummary } from './BookingTab';
import { WhatsAppSvgIcon } from './RubroIcons';

interface OwnerTabProps {
  rubro: RubroConfig;
  lastBooking: BookedSummary | null;
  onUpdateCitas?: (citas: CitaEjemplo[]) => void;
}

const ESTADO_STYLES: Record<
  EstadoCita,
  { label: string; bg: string; text: string; border: string }
> = {
  pendiente: {
    label: 'Pendiente',
    bg: '#FEF3C7',
    text: '#92400E',
    border: '#FDE68A',
  },
  confirmada: {
    label: 'Confirmada',
    bg: '#DCFCE7',
    text: '#166534',
    border: '#BBF7D0',
  },
  reprogramar: {
    label: 'Reprogramar',
    bg: '#FFE4E6',
    text: '#9F1239',
    border: '#FECDD3',
  },
  en_atencion: {
    label: 'En atención',
    bg: '#E0F2FE',
    text: '#075985',
    border: '#BAE6FD',
  },
  atendido: {
    label: 'Atendido',
    bg: '#F1F5F9',
    text: '#334155',
    border: '#CBD5E1',
  },
};

export const OwnerTab: React.FC<OwnerTabProps> = ({
  rubro,
  lastBooking,
  onUpdateCitas,
}) => {
  const [citas, setCitas] = useState<CitaEjemplo[]>(rubro.citasEjemplo);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'agenda' | 'calendario'>('agenda');

  // Estado para editar cita
  const [editingCita, setEditingCita] = useState<CitaEjemplo | null>(null);
  const [editHora, setEditHora] = useState<string>('');
  const [editCliente, setEditCliente] = useState<string>('');
  const [editTelefono, setEditTelefono] = useState<string>('');
  const [editEstado, setEditEstado] = useState<EstadoCita>('confirmada');

  // Inputs editables para "Ahorro estimado"
  const [citasSemana, setCitasSemana] = useState<string>(
    String(rubro.roiDefaults.citasSemana)
  );
  const [porcentajeNoShow, setPorcentajeNoShow] = useState<string>(
    String(rubro.roiDefaults.porcentajeNoShow)
  );
  const [precioPromedio, setPrecioPromedio] = useState<string>(
    String(rubro.roiDefaults.precioPromedio)
  );

  useEffect(() => {
    const base = rubro.citasEjemplo.map((c) => ({ ...c }));
    if (lastBooking) {
      const extra: CitaEjemplo = {
        id: 'session-booking',
        hora: lastBooking.hora,
        cliente: lastBooking.cliente,
        telefono: lastBooking.telefono,
        servicio: lastBooking.servicio,
        precio: lastBooking.precio,
        estado: 'confirmada',
        motivo: lastBooking.motivo,
        pagado: false,
        mascota: lastBooking.nombreMascota,
        especieMascota: lastBooking.tipoMascota,
        notaMascota: 'Reserva registrada desde la demo web.',
      };
      const updated = [extra, ...base];
      setCitas(updated);
      onUpdateCitas?.(updated);
    } else {
      setCitas(base);
      onUpdateCitas?.(base);
    }
    setPayingId(null);
    setCitasSemana(String(rubro.roiDefaults.citasSemana));
    setPorcentajeNoShow(String(rubro.roiDefaults.porcentajeNoShow));
    setPrecioPromedio(String(rubro.roiDefaults.precioPromedio));
  }, [rubro, lastBooking]);

  const stats = useMemo(() => {
    const totalHoy = citas.length;
    const confirmadas = citas.filter(
      (c) =>
        c.estado === 'confirmada' ||
        c.estado === 'en_atencion' ||
        c.estado === 'atendido'
    ).length;
    const reprogramar = citas.filter((c) => c.estado === 'reprogramar').length;
    const recaudado = citas
      .filter((c) => c.pagado)
      .reduce((acc, c) => acc + c.precio, 0);

    return { totalHoy, confirmadas, reprogramar, recaudado };
  }, [citas]);

  const roi = useMemo(() => {
    const sem = Math.max(0, Number.parseFloat(citasSemana) || 0);
    const pct = Math.min(
      100,
      Math.max(0, Number.parseFloat(porcentajeNoShow) || 0)
    );
    const precio = Math.max(0, Number.parseFloat(precioPromedio) || 0);

    const citasMes = sem * 4;
    const noShowsMes = citasMes * (pct / 100);
    const citasRecuperadas = noShowsMes * 0.5;
    const ahorroMensual = Math.round(citasRecuperadas * precio);
    const ahorroAnual = ahorroMensual * 12;

    return {
      citasRecuperadas: Math.round(citasRecuperadas * 10) / 10,
      ahorroMensual,
      ahorroAnual,
    };
  }, [citasSemana, porcentajeNoShow, precioPromedio]);

  const handleCycleConsultorioEstado = (id: string) => {
    const order: EstadoCita[] = [
      'pendiente',
      'confirmada',
      'en_atencion',
      'atendido',
      'reprogramar',
    ];
    const updated = citas.map((c) => {
      if (c.id !== id) return c;
      const idx = order.indexOf(c.estado);
      const nextEstado = order[(idx + 1) % order.length];
      return { ...c, estado: nextEstado };
    });
    setCitas(updated);
    onUpdateCitas?.(updated);
  };

  const handleRegisterPayment = (
    id: string,
    metodo: 'Yape' | 'Efectivo' | 'Tarjeta'
  ) => {
    const updated = citas.map((c) =>
      c.id === id
        ? {
            ...c,
            pagado: true,
            metodoPago: metodo,
            estado:
              rubro.id === 'consultorio' && c.estado !== 'atendido'
                ? ('atendido' as EstadoCita)
                : c.estado,
          }
        : c
    );
    setCitas(updated);
    onUpdateCitas?.(updated);
    setPayingId(null);
  };

  const handleDeleteCita = (id: string) => {
    if (window.confirm('¿Estás seguro de cancelar y eliminar esta cita?')) {
      const updated = citas.filter((c) => c.id !== id);
      setCitas(updated);
      onUpdateCitas?.(updated);
    }
  };

  const handleOpenEdit = (c: CitaEjemplo) => {
    setEditingCita(c);
    setEditHora(c.hora);
    setEditCliente(c.cliente);
    setEditTelefono(c.telefono);
    setEditEstado(c.estado);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCita) return;

    const updated = citas.map((c) =>
      c.id === editingCita.id
        ? {
            ...c,
            hora: editHora,
            cliente: editCliente.trim(),
            telefono: editTelefono.trim(),
            estado: editEstado,
          }
        : c
    );
    setCitas(updated);
    onUpdateCitas?.(updated);
    setEditingCita(null);
  };

  const handleSendWhatsAppUpdate = (c: CitaEjemplo) => {
    const cleanPhone = c.telefono.replace(/\D/g, '');
    const msg = `Hola ${c.cliente}, te escribimos de ${rubro.nombre} para informarte los detalles de tu cita de ${c.servicio} programada a las ${c.hora}. Estado actual: ${ESTADO_STYLES[c.estado].label}. ¡Te esperamos!`;
    window.open(`https://wa.me/51${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-1">
        <div>
          <h2
            className={`text-xl font-bold text-slate-900 ${
              rubro.tipografia.esEditorialSerif
                ? 'font-display-serif text-2xl'
                : ''
            }`}
          >
            Vista del dueño · Panel de Agenda
          </h2>
          <p className="mt-0.5 text-xs text-slate-600">
            Control de citas, estados, pagos y notificaciones directas por WhatsApp.
          </p>
        </div>

        {/* Selector de modo vista (Agenda vs Calendario) */}
        <div className="flex rounded-xl bg-slate-200/70 p-1">
          <button
            type="button"
            onClick={() => setViewMode('agenda')}
            className={`tap-feedback inline-flex min-h-[40px] items-center gap-1.5 rounded-lg px-3 text-xs font-semibold ${
              viewMode === 'agenda'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ListOrdered className="h-3.5 w-3.5" />
            Agenda del día
          </button>
          <button
            type="button"
            onClick={() => setViewMode('calendario')}
            className={`tap-feedback inline-flex min-h-[40px] items-center gap-1.5 rounded-lg px-3 text-xs font-semibold ${
              viewMode === 'calendario'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="h-3.5 w-3.5" />
            Modo Calendario
          </button>
        </div>
      </div>

      {/* Contadores principales */}
      <div
        className={`grid gap-2.5 ${
          rubro.id === 'consultorio'
            ? 'grid-cols-2 sm:grid-cols-4'
            : 'grid-cols-3'
        }`}
      >
        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <p className="text-xs font-medium text-slate-500">Citas hoy</p>
          <p className="mt-1 text-2xl font-bold text-slate-900 tabular-nums">
            {stats.totalHoy}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <p className="text-xs font-medium text-slate-500">Confirmadas</p>
          <p className="mt-1 text-2xl font-bold text-emerald-700 tabular-nums">
            {stats.confirmadas}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <p className="text-xs font-medium text-slate-500">Por reprogramar</p>
          <p className="mt-1 text-2xl font-bold text-rose-700 tabular-nums">
            {stats.reprogramar}
          </p>
        </div>

        {rubro.id === 'consultorio' && (
          <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
            <p className="text-xs font-medium text-slate-500">Cobrado hoy</p>
            <p
              className="mt-1 text-2xl font-bold tabular-nums"
              style={{ color: rubro.colores.primario }}
            >
              S/ {stats.recaudado}
            </p>
          </div>
        )}
      </div>

      {/* MODO AGENDA */}
      {viewMode === 'agenda' && (
        <section aria-label="Agenda del día" className="space-y-3">
          {citas.map((cita) => {
            const st = ESTADO_STYLES[cita.estado];
            const isPaying = payingId === cita.id;

            return (
              <article
                key={cita.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-xs text-slate-500 tabular-nums">
                      <span className="inline-flex items-center gap-1 font-bold text-slate-900">
                        <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                        {cita.hora}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>S/ {cita.precio}</span>
                      {cita.pagado && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-semibold text-emerald-700">
                            Pagado ({cita.metodoPago})
                          </span>
                        </>
                      )}
                    </div>

                    <h3 className="mt-1 text-base font-bold text-slate-900">
                      {cita.cliente}
                    </h3>
                    <p className="text-sm text-slate-600">{cita.servicio}</p>

                    {rubro.id === 'consultorio' && cita.motivo && (
                      <p className="mt-1 text-xs text-slate-500">
                        Motivo: {cita.motivo}
                      </p>
                    )}
                  </div>

                  {/* Estado y botones rápidos de edición / WhatsApp */}
                  <div className="flex flex-col items-end gap-2">
                    <span
                      style={{
                        backgroundColor: st.bg,
                        color: st.text,
                        borderColor: st.border,
                      }}
                      className="rounded-lg border px-2.5 py-1 text-xs font-bold whitespace-nowrap"
                    >
                      {st.label}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleSendWhatsAppUpdate(cita)}
                        aria-label="Enviar WhatsApp al cliente"
                        className="tap-feedback flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        title="Enviar WhatsApp al cliente"
                      >
                        <WhatsAppSvgIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(cita)}
                        aria-label="Editar cita"
                        className="tap-feedback flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200"
                        title="Editar o reprogramar cita"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCita(cita.id)}
                        aria-label="Eliminar cita"
                        className="tap-feedback flex h-9 w-9 items-center justify-center rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100"
                        title="Cancelar cita"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Ficha de mascota para Veterinaria */}
                {rubro.id === 'veterinaria' && cita.mascota && (
                  <div
                    className="mt-3 rounded-xl border p-3 text-xs"
                    style={{
                      backgroundColor: rubro.colores.fondoSuave,
                      borderColor: rubro.colores.bordeSuave,
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 font-bold text-slate-900">
                        <HeartHandshake
                          className="h-3.5 w-3.5"
                          style={{ color: rubro.colores.primario }}
                          aria-hidden="true"
                        />
                        Ficha mascota: {cita.mascota}
                      </span>
                      <span className="font-medium text-slate-700">
                        {cita.especieMascota}
                      </span>
                    </div>
                    {cita.notaMascota && (
                      <p className="mt-1 text-slate-600">{cita.notaMascota}</p>
                    )}
                  </div>
                )}

                {/* Acciones específicas de Consultorio */}
                {rubro.id === 'consultorio' && (
                  <div className="mt-3 border-t border-slate-100 pt-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleCycleConsultorioEstado(cita.id)}
                        className="tap-feedback inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-800 hover:bg-slate-100"
                      >
                        <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                        Cambiar estado
                      </button>

                      {!cita.pagado ? (
                        <button
                          type="button"
                          onClick={() =>
                            setPayingId(isPaying ? null : cita.id)
                          }
                          style={{
                            backgroundColor: rubro.colores.superficieDestacada,
                            color: rubro.colores.primario,
                          }}
                          className="tap-feedback inline-flex min-h-[40px] items-center gap-1.5 rounded-xl px-3 text-xs font-bold"
                        >
                          <CreditCard className="h-3.5 w-3.5" aria-hidden="true" />
                          Registrar pago (S/ {cita.precio})
                        </button>
                      ) : (
                        <span className="inline-flex min-h-[40px] items-center gap-1.5 px-2 text-xs font-semibold text-emerald-700">
                          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                          Consulta pagada
                        </span>
                      )}
                    </div>

                    {isPaying && !cita.pagado && (
                      <div className="mt-2.5 grid grid-cols-3 gap-2">
                        {(['Yape', 'Efectivo', 'Tarjeta'] as const).map(
                          (metodo) => (
                            <button
                              key={metodo}
                              type="button"
                              onClick={() =>
                                handleRegisterPayment(cita.id, metodo)
                              }
                              style={{ backgroundColor: rubro.colores.primario }}
                              className="tap-feedback min-h-[40px] rounded-xl px-2 text-xs font-bold text-white"
                            >
                              {metodo}
                            </button>
                          )
                        )}
                      </div>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </section>
      )}

      {/* MODO CALENDARIO */}
      {viewMode === 'calendario' && (
        <section aria-label="Modo Calendario" className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-950">
              Calendario Semanal
            </h3>
            <span className="text-xs font-medium text-slate-500">
              {citas.length} citas programadas
            </span>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-6">
            {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'].map(
              (dia, idx) => {
                const dayCitas = citas.filter((_, i) => i % 6 === idx);
                return (
                  <div
                    key={dia}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-3 flex flex-col gap-2 min-h-[180px]"
                  >
                    <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                      <span className="text-xs font-bold text-slate-800">
                        {dia}
                      </span>
                      <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                        {dayCitas.length}
                      </span>
                    </div>

                    <div className="flex-1 space-y-2">
                      {dayCitas.length === 0 ? (
                        <p className="text-[11px] text-slate-400 italic text-center py-6">
                          Sin citas
                        </p>
                      ) : (
                        dayCitas.map((dc) => (
                          <div
                            key={dc.id}
                            className="rounded-xl border border-slate-200 bg-white p-2.5 text-xs shadow-2xs"
                          >
                            <p className="font-bold text-slate-900 tabular-nums">
                              {dc.hora}
                            </p>
                            <p className="truncate font-medium text-slate-700">
                              {dc.cliente}
                            </p>
                            <p className="text-[10px] text-slate-500 truncate">
                              {dc.servicio}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </section>
      )}

      {/* Modal para Editar / Reprogramar cita */}
      {editingCita && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
        >
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900">
              Editar / Reprogramar Cita
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Modifica los datos y presiona guardar. Puedes notificar al cliente directamente por WhatsApp.
            </p>

            <form onSubmit={handleSaveEdit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Cliente
                </label>
                <input
                  type="text"
                  value={editCliente}
                  onChange={(e) => setEditCliente(e.target.value)}
                  className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-300 px-3 text-sm text-slate-900"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Hora
                  </label>
                  <input
                    type="text"
                    value={editHora}
                    onChange={(e) => setEditHora(e.target.value)}
                    className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-300 px-3 text-sm text-slate-900 tabular-nums"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Celular WhatsApp
                  </label>
                  <input
                    type="text"
                    value={editTelefono}
                    onChange={(e) => setEditTelefono(e.target.value)}
                    className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-300 px-3 text-sm text-slate-900 tabular-nums"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Estado de cita
                </label>
                <select
                  value={editEstado}
                  onChange={(e) => setEditEstado(e.target.value as EstadoCita)}
                  className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-300 px-3 text-sm text-slate-900 bg-white"
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="confirmada">Confirmada</option>
                  <option value="reprogramar">Reprogramar</option>
                  <option value="en_atencion">En atención</option>
                  <option value="atendido">Atendido</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingCita(null)}
                  className="tap-feedback min-h-[48px] flex-1 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: rubro.colores.primario }}
                  className="tap-feedback min-h-[48px] flex-1 rounded-xl text-sm font-bold text-white"
                >
                  Guardar cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cuadro de Ahorro estimado */}
      <section
        aria-labelledby="roi-title"
        className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs"
      >
        <div className="flex items-start gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
            style={{
              backgroundColor: rubro.colores.superficieDestacada,
              color: rubro.colores.primario,
            }}
          >
            <Calculator className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h3 id="roi-title" className="text-base font-bold text-slate-900">
              Ahorro estimado con recordatorios
            </h3>
            <p className="mt-0.5 text-xs text-slate-600">
              Ajusta tus números para ver cuánto recuperarías al mes si las
              inasistencias bajan a la mitad.
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label
              htmlFor="roi-citas-semana"
              className="block text-xs font-semibold text-slate-700"
            >
              Citas por semana
            </label>
            <input
              id="roi-citas-semana"
              type="number"
              inputMode="decimal"
              min={0}
              value={citasSemana}
              onChange={(e) => setCitasSemana(e.target.value)}
              className="mt-1 min-h-[48px] w-full rounded-xl border border-slate-300 bg-white px-3 text-base font-semibold text-slate-900 tabular-nums"
            />
          </div>

          <div>
            <label
              htmlFor="roi-no-show"
              className="block text-xs font-semibold text-slate-700"
            >
              % de no asistencia
            </label>
            <input
              id="roi-no-show"
              type="number"
              inputMode="decimal"
              min={0}
              max={100}
              value={porcentajeNoShow}
              onChange={(e) => setPorcentajeNoShow(e.target.value)}
              className="mt-1 min-h-[48px] w-full rounded-xl border border-slate-300 bg-white px-3 text-base font-semibold text-slate-900 tabular-nums"
            />
          </div>

          <div>
            <label
              htmlFor="roi-precio"
              className="block text-xs font-semibold text-slate-700"
            >
              Precio promedio (S/)
            </label>
            <input
              id="roi-precio"
              type="number"
              inputMode="decimal"
              min={0}
              value={precioPromedio}
              onChange={(e) => setPrecioPromedio(e.target.value)}
              className="mt-1 min-h-[48px] w-full rounded-xl border border-slate-300 bg-white px-3 text-base font-semibold text-slate-900 tabular-nums"
            />
          </div>
        </div>

        <div
          className="mt-4 rounded-2xl border p-4"
          style={{
            backgroundColor: rubro.colores.fondoSuave,
            borderColor: rubro.colores.bordeSuave,
          }}
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-600">
                Ingresos recuperados al mes
              </p>
              <p
                className="mt-0.5 text-3xl font-bold tabular-nums"
                style={{ color: rubro.colores.primario }}
              >
                S/ {roi.ahorroMensual.toLocaleString('es-PE')}
              </p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-xs text-slate-600 tabular-nums">
                ~{roi.citasRecuperadas} citas salvadas / mes
              </p>
              <p className="text-sm font-bold text-slate-900 tabular-nums">
                S/ {roi.ahorroAnual.toLocaleString('es-PE')} al año
              </p>
            </div>
          </div>

          <p className="mt-3 border-t border-black/10 pt-2.5 text-[11px] leading-relaxed text-slate-600">
            * Esto es una estimación referencial calculada sobre 4 semanas/mes
            asumiendo que los recordatorios por WhatsApp reducen en un 50% las
            inasistencias.
          </p>
        </div>
      </section>
    </div>
  );
};
