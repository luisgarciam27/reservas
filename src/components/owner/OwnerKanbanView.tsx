import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Filter,
  MoreHorizontal,
  Phone,
  Play,
  RotateCcw,
  Search,
  Sparkles,
  User,
  Volume2,
  VolumeX,
  XCircle,
} from 'lucide-react';
import type { RubroConfig } from '../../config/rubros';
import type { AppointmentRecord, EstadoCitaAdmin, PagoEstado } from '../../types/app';
import {
  isSoundAlertEnabled,
  playAttentionChime,
  playNewBookingChime,
  playSuccessChime,
  setSoundAlertEnabled,
} from '../../lib/soundAlerts';
import { WhatsAppSvgIcon } from '../RubroIcons';
import { ADMIN_STATUS_META, getLimaDateOffsetStr } from './ownerSeedData';

interface OwnerKanbanViewProps {
  rubro: RubroConfig;
  citas: AppointmentRecord[];
  onChangeEstado: (id: string, estado: EstadoCitaAdmin) => void;
  onOpenCitaSheet: (cita: AppointmentRecord) => void;
  onOpenNewCitaModal?: () => void;
}

type DateFilterOption = 'todas' | 'hoy' | 'manana' | 'semana' | 'mes';

interface KanbanColumnConfig {
  id: string;
  title: string;
  estados: EstadoCitaAdmin[];
  colorBorder: string;
  colorBg: string;
  badgeBg: string;
  badgeText: string;
  icon: string;
  emptyText: string;
}

const KANBAN_COLUMNS: KanbanColumnConfig[] = [
  {
    id: 'col_pendientes',
    title: 'Por Confirmar / Pago',
    estados: ['pendiente'],
    colorBorder: '#FDE68A',
    colorBg: '#FEFDF8',
    badgeBg: '#FEF3C7',
    badgeText: '#92400E',
    icon: '🟡',
    emptyText: 'Sin citas pendientes de confirmación.',
  },
  {
    id: 'col_confirmadas',
    title: 'Confirmadas',
    estados: ['confirmada'],
    colorBorder: '#BAE6FD',
    colorBg: '#F8FAFC',
    badgeBg: '#E0F2FE',
    badgeText: '#0369A1',
    icon: '🔵',
    emptyText: 'No hay citas confirmadas pendientes de turno.',
  },
  {
    id: 'col_atendidas',
    title: 'Atendidas / Cobradas',
    estados: ['atendido'],
    colorBorder: '#BBF7D0',
    colorBg: '#F8FCF9',
    badgeBg: '#DCFCE7',
    badgeText: '#15803D',
    icon: '🟢',
    emptyText: 'Aún no hay citas marcadas como atendidas.',
  },
  {
    id: 'col_reprogramar',
    title: 'Reprogramar / Canceladas',
    estados: ['reprogramar', 'no_asistio', 'cancelada'],
    colorBorder: '#FECDD3',
    colorBg: '#FFF8F8',
    badgeBg: '#FFE4E6',
    badgeText: '#BE123C',
    icon: '🔴',
    emptyText: 'Sin citas para reprogramar o canceladas.',
  },
];

export const OwnerKanbanView: React.FC<OwnerKanbanViewProps> = ({
  rubro,
  citas,
  onChangeEstado,
  onOpenCitaSheet,
  onOpenNewCitaModal,
}) => {
  const [dateFilter, setDateFilter] = useState<DateFilterOption>('todas');
  const [searchQuery, setSearchQuery] = useState('');
  const [soundActive, setSoundActive] = useState<boolean>(() =>
    isSoundAlertEnabled()
  );
  const [soundFeedback, setSoundFeedback] = useState<string | null>(null);

  const todayYmd = useMemo(() => getLimaDateOffsetStr(0), []);
  const tomorrowYmd = useMemo(() => getLimaDateOffsetStr(1), []);
  const weekCutoffYmd = useMemo(() => getLimaDateOffsetStr(7), []);

  const handleToggleSound = () => {
    const next = !soundActive;
    setSoundActive(next);
    setSoundAlertEnabled(next);
    if (next) {
      playNewBookingChime();
      setSoundFeedback('🔊 Sonido activado');
    } else {
      setSoundFeedback('🔇 Sonido silenciado');
    }
    setTimeout(() => setSoundFeedback(null), 2500);
  };

  const handleTestSound = () => {
    playNewBookingChime();
    setSoundFeedback('🔔 ¡Timbre de cita reproducido!');
    setTimeout(() => setSoundFeedback(null), 2500);
  };

  // Filtrado de citas
  const filteredCitas = useMemo(() => {
    return citas.filter((c) => {
      // Filtro de fecha
      if (dateFilter === 'hoy' && c.fecha !== todayYmd) return false;
      if (dateFilter === 'manana' && c.fecha !== tomorrowYmd) return false;
      if (dateFilter === 'semana') {
        if (c.fecha < todayYmd || c.fecha > weekCutoffYmd) return false;
      }
      if (dateFilter === 'mes') {
        const currentMonth = todayYmd.slice(0, 7);
        if (!c.fecha.startsWith(currentMonth)) return false;
      }

      // Filtro de búsqueda
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesClient = c.cliente.toLowerCase().includes(q);
        const matchesPhone = c.telefono.includes(q);
        const matchesService = c.servicio.toLowerCase().includes(q);
        const matchesExtra = c.extra?.toLowerCase().includes(q);
        if (!matchesClient && !matchesPhone && !matchesService && !matchesExtra) {
          return false;
        }
      }

      return true;
    });
  }, [citas, dateFilter, searchQuery, todayYmd, tomorrowYmd, weekCutoffYmd]);

  const handleStatusChangeWithSound = (
    id: string,
    nextEstado: EstadoCitaAdmin
  ) => {
    if (nextEstado === 'confirmada' || nextEstado === 'atendido') {
      playSuccessChime();
    } else if (nextEstado === 'reprogramar' || nextEstado === 'cancelada') {
      playAttentionChime();
    }
    onChangeEstado(id, nextEstado);
  };

  const getWhatsAppHref = (c: AppointmentRecord) => {
    const clean = c.telefono.replace(/\D/g, '');
    let msg = `Hola ${c.cliente}, te escribimos de *${rubro.nombre}*. `;
    if (c.estado === 'pendiente') {
      msg += `Tenemos registrada tu cita para *${c.servicio}* el día ${c.fecha} a las ${c.hora}. Por favor indícanos si confirmas tu asistencia.`;
    } else if (c.estado === 'reprogramar') {
      msg += `Vimos tu solicitud para reprogramar tu turno de *${c.servicio}* (${c.fecha} ${c.hora}). ¿Qué nuevo día u horario te acomodaría mejor?`;
    } else if (c.estado === 'confirmada') {
      msg += `Te recordamos que tu cita para *${c.servicio}* está confirmada para el ${c.fecha} a las ${c.hora}. ¡Te esperamos con gusto!`;
    } else {
      msg += `Muchas gracias por atenderte con nosotros en *${rubro.nombre}* (${c.servicio}). Esperamos verte pronto.`;
    }
    return `https://wa.me/51${clean}?text=${encodeURIComponent(msg)}`;
  };

  return (
    <div className="space-y-4">
      {/* Barra superior del Tablero Kanban */}
      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-2xs sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🗂️</span>
              <h2 className="text-lg font-black text-slate-900">
                Tablero Kanban de Citas y Recepción
              </h2>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              Controla visualmente el flujo de cada paciente o cliente desde la reserva hasta el cobro final.
            </p>
          </div>

          {/* Controles de Alerta Sonora y Filtros */}
          <div className="flex flex-wrap items-center gap-2">
            {soundFeedback && (
              <span className="animate-pulse rounded-xl bg-indigo-50 border border-indigo-200 px-2.5 py-1 text-xs font-bold text-indigo-700">
                {soundFeedback}
              </span>
            )}

            {/* Botón Probar Sonido */}
            <button
              type="button"
              onClick={handleTestSound}
              className="tap-feedback inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-700 hover:bg-slate-100"
              title="Reproducir timbre de prueba de nueva cita"
            >
              <Volume2 className="h-3.5 w-3.5 text-indigo-600" />
              <span>Probar sonido</span>
            </button>

            {/* Toggle Alerta Sonora */}
            <button
              type="button"
              onClick={handleToggleSound}
              className={`tap-feedback inline-flex min-h-[38px] items-center gap-1.5 rounded-xl px-3 text-xs font-bold border transition-colors ${
                soundActive
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  : 'border-slate-200 bg-slate-100 text-slate-500'
              }`}
            >
              {soundActive ? (
                <>
                  <Volume2 className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Sonido: Activado</span>
                </>
              ) : (
                <>
                  <VolumeX className="h-3.5 w-3.5" />
                  <span>Sonido: Silenciado</span>
                </>
              )}
            </button>

            {onOpenNewCitaModal && (
              <button
                type="button"
                onClick={onOpenNewCitaModal}
                style={{ backgroundColor: rubro.colores.primario }}
                className="tap-feedback inline-flex min-h-[38px] items-center gap-1.5 rounded-xl px-3.5 text-xs font-bold text-white shadow-2xs"
              >
                <span>+ Nueva Cita</span>
              </button>
            )}
          </div>
        </div>

        {/* Filtros de Fecha y Búsqueda */}
        <div className="mt-4 flex flex-col gap-3 pt-3 border-t border-slate-100 sm:flex-row sm:items-center sm:justify-between">
          {/* Opciones de Fecha */}
          <div className="flex flex-wrap items-center gap-1 rounded-xl bg-slate-100 p-1 text-xs font-bold text-slate-700">
            <button
              type="button"
              onClick={() => setDateFilter('todas')}
              className={`tap-feedback rounded-lg px-2.5 py-1.5 transition-colors ${
                dateFilter === 'todas'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todas ({citas.length})
            </button>
            <button
              type="button"
              onClick={() => setDateFilter('hoy')}
              className={`tap-feedback rounded-lg px-2.5 py-1.5 transition-colors ${
                dateFilter === 'hoy'
                  ? 'bg-white text-indigo-700 font-extrabold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ⏱️ Hoy
            </button>
            <button
              type="button"
              onClick={() => setDateFilter('manana')}
              className={`tap-feedback rounded-lg px-2.5 py-1.5 transition-colors ${
                dateFilter === 'manana'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Mañana
            </button>
            <button
              type="button"
              onClick={() => setDateFilter('semana')}
              className={`tap-feedback rounded-lg px-2.5 py-1.5 transition-colors ${
                dateFilter === 'semana'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Próx. 7 días
            </button>
            <button
              type="button"
              onClick={() => setDateFilter('mes')}
              className={`tap-feedback rounded-lg px-2.5 py-1.5 transition-colors ${
                dateFilter === 'mes'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Este mes
            </button>
          </div>

          {/* Búsqueda rápida */}
          <div className="relative flex-1 max-w-xs min-w-[200px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar cliente, tel o servicio..."
              className="min-h-[38px] w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 text-xs placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Columnas Kanban */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4 items-start">
        {KANBAN_COLUMNS.map((col) => {
          const colCitas = filteredCitas
            .filter((c) => col.estados.includes(c.estado))
            .sort((a, b) => {
              if (a.fecha !== b.fecha) return a.fecha.localeCompare(b.fecha);
              return a.hora.localeCompare(b.hora);
            });

          const totalSoles = colCitas.reduce(
            (acc, curr) => acc + (Number(curr.precio) || 0),
            0
          );

          return (
            <div
              key={col.id}
              className="flex flex-col rounded-3xl border bg-slate-50/70 p-3.5 shadow-2xs min-h-[500px]"
              style={{ borderColor: col.colorBorder }}
            >
              {/* Header de Columna */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 px-1">
                <div className="flex items-center gap-2">
                  <span className="text-base">{col.icon}</span>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                    {col.title}
                  </h3>
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className="rounded-full px-2 py-0.5 text-xs font-black tabular-nums"
                    style={{ backgroundColor: col.badgeBg, color: col.badgeText }}
                  >
                    {colCitas.length}
                  </span>
                  {totalSoles > 0 && (
                    <span className="text-[11px] font-bold text-slate-500 tabular-nums">
                      S/{totalSoles}
                    </span>
                  )}
                </div>
              </div>

              {/* Lista de Tarjetas de la Columna */}
              <div className="mt-3 flex-1 space-y-3">
                {colCitas.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 p-6 text-center text-xs text-slate-400">
                    <p>{col.emptyText}</p>
                  </div>
                ) : (
                  colCitas.map((cita) => {
                    const isToday = cita.fecha === todayYmd;
                    const isPast = cita.fecha < todayYmd;
                    const isTomorrow = cita.fecha === tomorrowYmd;

                    return (
                      <div
                        key={cita.id}
                        className="group relative flex flex-col rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs hover:shadow-sm transition-all"
                      >
                        {/* Fecha y Hora + Pago Badge */}
                        <div className="flex items-center justify-between gap-1.5 text-xs">
                          <span
                            className={`inline-flex items-center gap-1 font-bold rounded-lg px-2 py-0.5 tabular-nums text-[11px] ${
                              isToday
                                ? 'bg-indigo-100 text-indigo-900 font-extrabold'
                                : isTomorrow
                                  ? 'bg-blue-50 text-blue-800'
                                  : isPast
                                    ? 'bg-slate-100 text-slate-600'
                                    : 'bg-emerald-50 text-emerald-800'
                            }`}
                          >
                            <Clock className="h-3 w-3" />
                            {isToday ? `Hoy ${cita.hora}` : `${cita.fecha} · ${cita.hora}`}
                          </span>

                          {/* Badge de Pago */}
                          {cita.pagoEstado === 'pagado' ? (
                            <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800 flex items-center gap-0.5">
                              <Check className="h-2.5 w-2.5" /> Pagado
                            </span>
                          ) : cita.pagoEstado === 'adelanto' ? (
                            <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                              Adelanto S/{cita.montoPagado}
                            </span>
                          ) : (
                            <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                              Por pagar
                            </span>
                          )}
                        </div>

                        {/* Nombre del Cliente y Servicio */}
                        <div className="mt-2.5">
                          <h4 className="font-extrabold text-slate-900 text-xs">
                            {cita.cliente}
                          </h4>
                          <div className="flex items-center justify-between mt-0.5 text-xs">
                            <span className="text-slate-600 truncate font-medium">
                              {cita.servicio}
                            </span>
                            <span className="font-black text-slate-900 tabular-nums shrink-0 ml-2">
                              S/ {cita.precio}
                            </span>
                          </div>
                          {cita.extra && (
                            <p className="mt-1 text-[11px] text-indigo-700 bg-indigo-50/70 rounded-md px-2 py-0.5 truncate">
                              🐾 {cita.extra}
                            </p>
                          )}
                        </div>

                        {/* Transiciones y Acciones Rápidas */}
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-1 pt-2.5 border-t border-slate-100">
                          {/* Botón WhatsApp */}
                          <a
                            href={getWhatsAppHref(cita)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="tap-feedback inline-flex min-h-[30px] items-center gap-1 rounded-lg bg-[#25D366] px-2 text-[11px] font-bold text-white hover:bg-emerald-600"
                            title="Contactar al cliente por WhatsApp"
                          >
                            <WhatsAppSvgIcon className="h-3 w-3" />
                            <span>WhatsApp</span>
                          </a>

                          {/* Botones de flujo según estado actual */}
                          <div className="flex items-center gap-1">
                            {cita.estado === 'pendiente' && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleStatusChangeWithSound(
                                    cita.id,
                                    'confirmada'
                                  )
                                }
                                className="tap-feedback inline-flex min-h-[30px] items-center gap-1 rounded-lg bg-emerald-600 px-2.5 text-[11px] font-bold text-white hover:bg-emerald-700"
                                title="Confirmar esta cita"
                              >
                                <Check className="h-3 w-3" />
                                <span>Confirmar</span>
                              </button>
                            )}

                            {cita.estado === 'confirmada' && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleStatusChangeWithSound(
                                    cita.id,
                                    'atendido'
                                  )
                                }
                                className="tap-feedback inline-flex min-h-[30px] items-center gap-1 rounded-lg bg-sky-600 px-2.5 text-[11px] font-bold text-white hover:bg-sky-700"
                                title="Marcar como atendida y cobrada"
                              >
                                <CheckCircle2 className="h-3 w-3" />
                                <span>Atendido</span>
                              </button>
                            )}

                            {cita.estado !== 'reprogramar' &&
                              cita.estado !== 'cancelada' && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleStatusChangeWithSound(
                                      cita.id,
                                      'reprogramar'
                                    )
                                  }
                                  className="tap-feedback inline-flex min-h-[30px] items-center rounded-lg border border-rose-200 bg-rose-50 px-2 text-[11px] font-bold text-rose-700 hover:bg-rose-100"
                                  title="Marcar para reprogramar turno"
                                >
                                  <RotateCcw className="h-3 w-3" />
                                </button>
                              )}

                            <button
                              type="button"
                              onClick={() => onOpenCitaSheet(cita)}
                              className="tap-feedback inline-flex min-h-[30px] items-center rounded-lg border border-slate-200 bg-slate-50 px-2 text-[11px] font-bold text-slate-700 hover:bg-slate-100"
                              title="Ver ficha completa y editar"
                            >
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
