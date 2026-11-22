import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CalendarClock,
  Check,
  CheckCircle2,
  Phone,
  RotateCcw,
  UserX,
  XCircle,
} from 'lucide-react';
import type { RubroConfig } from '../../config/rubros';
import type { AppointmentRecord, EstadoCitaAdmin } from '../../types/app';
import { WhatsAppSvgIcon } from '../RubroIcons';
import { ADMIN_STATUS_META, getLimaDateOffsetStr } from './ownerSeedData';

interface OwnerHoyViewProps {
  rubro: RubroConfig;
  citas: AppointmentRecord[];
  onChangeEstado: (id: string, estado: EstadoCitaAdmin) => void;
  onOpenCitaSheet: (cita: AppointmentRecord) => void;
}

export const OwnerHoyView: React.FC<OwnerHoyViewProps> = ({
  rubro,
  citas,
  onChangeEstado,
  onOpenCitaSheet,
}) => {
  const todayYmd = useMemo(() => getLimaDateOffsetStr(0), []);
  const [confirmAction, setConfirmAction] = useState<{
    cita: AppointmentRecord;
    targetEstado: 'atendido' | 'cancelada';
  } | null>(null);

  // Touch swipe state per card
  const [swipeStartX, setSwipeStartX] = useState<number | null>(null);

  const citasHoy = useMemo(
    () =>
      citas
        .filter((c) => c.fecha === todayYmd)
        .sort((a, b) => a.hora.localeCompare(b.hora)),
    [citas, todayYmd]
  );

  const counters = useMemo(() => {
    return {
      total: citasHoy.length,
      confirmadas: citasHoy.filter((c) => c.estado === 'confirmada').length,
      pendientes: citasHoy.filter((c) => c.estado === 'pendiente').length,
      reprogramar: citasHoy.filter((c) => c.estado === 'reprogramar').length,
    };
  }, [citasHoy]);

  const reprogramarList = useMemo(
    () => citas.filter((c) => c.estado === 'reprogramar'),
    [citas]
  );

  const buildWhatsAppHref = (c: AppointmentRecord) => {
    const cleanPhone = c.telefono.replace(/\D/g, '');
    let message = `Hola ${c.cliente}, te escribimos de ${rubro.nombre}. `;
    if (c.estado === 'reprogramar') {
      message += `Vimos que deseas reprogramar tu cita de ${c.servicio} (${c.hora}). ¿Qué nuevo horario te acomoda mejor?`;
    } else if (c.estado === 'pendiente') {
      message += `Te recordamos confirmar tu cita de ${c.servicio} programada para hoy a las ${c.hora}.`;
    } else if (c.estado === 'confirmada') {
      message += `Tu cita de ${c.servicio} hoy a las ${c.hora} está confirmada. ¡Te esperamos!`;
    } else {
      message += `Gracias por atenderte en ${rubro.nombre} (${c.servicio}).`;
    }
    return `https://wa.me/51${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Resumen de Hoy</h2>
          <p className="text-xs text-slate-500">
            Los recordatorios se envían automáticamente por WhatsApp
          </p>
        </div>
        <span className="text-xs font-semibold text-slate-600 tabular-nums">
          {todayYmd}
        </span>
      </div>

      {/* 4 Contadores arriba */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <p className="text-xs font-medium text-slate-500">Citas hoy</p>
          <p className="mt-1 text-2xl font-bold text-slate-900 tabular-nums">
            {counters.total}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <p className="text-xs font-medium text-slate-500">Confirmadas</p>
          <p className="mt-1 text-2xl font-bold text-emerald-700 tabular-nums">
            {counters.confirmadas}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <p className="text-xs font-medium text-slate-500">Pendientes</p>
          <p className="mt-1 text-2xl font-bold text-amber-700 tabular-nums">
            {counters.pendientes}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <p className="text-xs font-medium text-slate-500">Por reprogramar</p>
          <p className="mt-1 text-2xl font-bold text-rose-700 tabular-nums">
            {counters.reprogramar}
          </p>
        </div>
      </div>

      {/* Alerta destacada para citas en "reprogramar" (cliente respondió "2" por WhatsApp) */}
      {reprogramarList.length > 0 && (
        <section
          aria-label="Alertas de reprogramación"
          className="rounded-3xl border border-rose-300 bg-rose-50 p-4 space-y-3"
        >
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-700" />
            <div>
              <h3 className="text-sm font-bold text-rose-950">
                {reprogramarList.length}{' '}
                {reprogramarList.length === 1
                  ? 'cliente respondió "2" por WhatsApp para reprogramar'
                  : 'clientes respondieron "2" por WhatsApp para reprogramar'}
              </h3>
              <p className="mt-0.5 text-xs text-rose-800">
                Escríbeles por WhatsApp para acordar una nueva hora y muévelos en la agenda.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {reprogramarList.map((rc) => (
              <div
                key={rc.id}
                className="flex flex-col gap-2 rounded-2xl border border-rose-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">
                    {rc.cliente} ·{' '}
                    <span className="tabular-nums">{rc.hora}</span>
                  </p>
                  <p className="text-xs text-slate-600 truncate">
                    {rc.servicio} ({rc.fecha})
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <a
                    href={buildWhatsAppHref(rc)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tap-feedback inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-[#25D366] px-3.5 text-xs font-bold text-white"
                  >
                    <WhatsAppSvgIcon className="h-4 w-4" />
                    WhatsApp
                  </a>
                  <button
                    type="button"
                    onClick={() => onOpenCitaSheet(rc)}
                    className="tap-feedback min-h-[44px] rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-800 hover:bg-slate-100"
                  >
                    Cambiar hora
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Lista de tarjetas de citas de hoy ordenadas por hora */}
      {citasHoy.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center">
          <p className="text-sm font-bold text-slate-800">
            No hay citas registradas para hoy
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Agrega una cita en la pestaña Agenda o carga datos de ejemplo en Más.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {citasHoy.map((cita) => {
            const st = ADMIN_STATUS_META[cita.estado];
            const isTerminal =
              cita.estado === 'atendido' ||
              cita.estado === 'no_asistio' ||
              cita.estado === 'cancelada';

            return (
              <article
                key={cita.id}
                onTouchStart={(e) => setSwipeStartX(e.touches[0].clientX)}
                onTouchEnd={(e) => {
                  if (swipeStartX === null) return;
                  const delta = e.changedTouches[0].clientX - swipeStartX;
                  setSwipeStartX(null);
                  if (delta > 90) {
                    setConfirmAction({ cita, targetEstado: 'atendido' });
                  } else if (delta < -90) {
                    setConfirmAction({ cita, targetEstado: 'cancelada' });
                  }
                }}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs"
              >
                <button
                  type="button"
                  onClick={() => onOpenCitaSheet(cita)}
                  className="flex w-full items-start justify-between gap-3 text-left"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className="flex h-14 w-16 shrink-0 flex-col items-center justify-center rounded-2xl tabular-nums"
                      style={{
                        backgroundColor: rubro.colores.superficieDestacada,
                        color: rubro.colores.primario,
                      }}
                    >
                      <span className="text-base font-extrabold leading-none">
                        {cita.hora}
                      </span>
                      <span className="mt-1 text-[10px] font-bold">
                        S/ {cita.precio}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <h3 className="truncate text-base font-bold text-slate-900">
                        {cita.cliente}
                      </h3>
                      <p className="truncate text-sm text-slate-700">
                        {cita.servicio}
                      </p>
                      {cita.extra && (
                        <p className="mt-0.5 text-xs font-medium text-slate-500">
                          {cita.extra}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Estado SIEMPRE con color + texto explícito */}
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

                {isTerminal && (
                  <p className="mt-2 text-[11px] text-slate-500">
                    Recordatorios automáticos detenidos para esta cita.
                  </p>
                )}

                {/* Acciones de un toque >= 48px */}
                <div className="mt-3.5 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3 sm:flex sm:flex-wrap">
                  <a
                    href={buildWhatsAppHref(cita)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tap-feedback inline-flex min-h-[48px] items-center justify-center gap-1.5 rounded-xl bg-[#25D366] px-3.5 text-xs font-bold text-white"
                  >
                    <WhatsAppSvgIcon className="h-4 w-4" />
                    WhatsApp
                  </a>

                  <a
                    href={`tel:+51${cita.telefono.replace(/\D/g, '')}`}
                    className="tap-feedback inline-flex min-h-[48px] items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-xs font-bold text-slate-800 hover:bg-slate-100"
                  >
                    <Phone className="h-4 w-4" />
                    Llamar
                  </a>

                  {cita.estado !== 'confirmada' && (
                    <button
                      type="button"
                      onClick={() => onChangeEstado(cita.id, 'confirmada')}
                      className="tap-feedback inline-flex min-h-[48px] items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-xs font-bold text-emerald-800"
                    >
                      <Check className="h-4 w-4" />
                      Confirmar
                    </button>
                  )}

                  {cita.estado !== 'atendido' && (
                    <button
                      type="button"
                      onClick={() =>
                        setConfirmAction({ cita, targetEstado: 'atendido' })
                      }
                      className="tap-feedback inline-flex min-h-[48px] items-center justify-center gap-1.5 rounded-xl border border-sky-200 bg-sky-50 px-3 text-xs font-bold text-sky-900"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Atendido
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => onChangeEstado(cita.id, 'no_asistio')}
                    className="tap-feedback inline-flex min-h-[48px] items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700"
                  >
                    <UserX className="h-4 w-4" />
                    No asistió
                  </button>

                  <button
                    type="button"
                    onClick={() => onChangeEstado(cita.id, 'reprogramar')}
                    className="tap-feedback inline-flex min-h-[48px] items-center justify-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 text-xs font-semibold text-amber-900"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Reprogramar
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setConfirmAction({ cita, targetEstado: 'cancelada' })
                    }
                    className="tap-feedback inline-flex min-h-[48px] items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 text-xs font-semibold text-rose-800"
                  >
                    <XCircle className="h-4 w-4" />
                    Cancelar
                  </button>
                </div>

                <p className="mt-2 hidden text-[10px] text-slate-400 sm:block">
                  Toca la tarjeta para editar hora, notas o cobro.
                </p>
                <p className="mt-2 text-[10px] text-slate-400 sm:hidden">
                  Desliza derecha para Atendido · izquierda para Cancelar.
                </p>
              </article>
            );
          })}
        </div>
      )}

      {/* Hoja inferior de confirmación (Atendido / Cancelada) */}
      {confirmAction && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 backdrop-blur-xs sm:items-center sm:p-4"
          onClick={() => setConfirmAction(null)}
        >
          <div
            className="w-full max-w-md rounded-t-3xl bg-white p-6 pb-safe shadow-2xl sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-slate-300 sm:hidden" />
            <h3 className="text-lg font-bold text-slate-900">
              {confirmAction.targetEstado === 'atendido'
                ? '¿Marcar cita como Atendida?'
                : '¿Cancelar esta cita?'}
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">
              Cliente: <strong>{confirmAction.cita.cliente}</strong> (
              {confirmAction.cita.hora} · {confirmAction.cita.servicio}). El sistema automático detendrá los recordatorios futuros por WhatsApp para este turno.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmAction(null)}
                className="tap-feedback min-h-[48px] rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={() => {
                  onChangeEstado(
                    confirmAction.cita.id,
                    confirmAction.targetEstado
                  );
                  setConfirmAction(null);
                }}
                className={`tap-feedback min-h-[48px] rounded-xl text-sm font-bold text-white ${
                  confirmAction.targetEstado === 'atendido'
                    ? 'bg-emerald-700'
                    : 'bg-rose-700'
                }`}
              >
                {confirmAction.targetEstado === 'atendido'
                  ? 'Sí, marcar atendido'
                  : 'Sí, cancelar cita'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
