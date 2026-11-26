import React, { useCallback, useEffect, useState } from 'react';
import {
  Bell,
  Calendar,
  CalendarPlus,
  CheckCheck,
  Clock,
  Download,
  LogOut,
  MapPin,
  MessageSquare,
  Phone,
  Search,
  User,
} from 'lucide-react';
import type { RubroConfig } from '../config/rubros';
import { normalizePeruPhone } from '../hooks/useAuthSession';
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase';
import type { AppointmentRecord, UserSession } from '../types/app';
import type { BookedSummary } from './BookingTab';

interface ClientProfileTabProps {
  rubro: RubroConfig;
  session: UserSession;
  lastBooking: BookedSummary | null;
  localBookings: AppointmentRecord[];
  isDemoMode?: boolean;
  onOpenAuthSheet?: (mode?: 'register' | 'login' | 'owner') => void;
  onOpenInstallModal: () => void;
  onStartBooking: () => void;
  onLogout: () => void;
}

interface CitaClienteRecord {
  id: string;
  cliente: string;
  telefono: string;
  servicio: string;
  inicio: string;
  estado?: string;
}

export const ClientProfileTab: React.FC<ClientProfileTabProps> = ({
  rubro,
  session,
  lastBooking,
  localBookings,
  isDemoMode = false,
  onOpenAuthSheet,
  onOpenInstallModal,
  onStartBooking,
  onLogout,
}) => {
  const [subTab, setSubTab] = useState<'historial' | 'recordatorios'>(
    'historial'
  );
  const [telefonoConsulta, setTelefonoConsulta] = useState<string>(
    session.telefono || ''
  );
  const [citasList, setCitasList] = useState<CitaClienteRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searched, setSearched] = useState<boolean>(false);

  // Simulación interactiva de respuesta 1/2 en "Recordatorios"
  const [simReply, setSimReply] = useState<'1' | '2' | null>(null);

  useEffect(() => {
    if (session.role === 'client' && session.telefono) {
      setTelefonoConsulta(session.telefono);
    }
  }, [session.role, session.telefono]);

  const consultarHistorial = useCallback(
    async (telToSearch: string) => {
      const cleanTel = normalizePeruPhone(telToSearch);
      if (cleanTel.length < 9) return;

      setLoading(true);
      setSearched(true);

      // Combinamos citas locales de este negocio + teléfono
      const matchingLocal: CitaClienteRecord[] = localBookings
        .filter(
          (b) =>
            b.negocioId === rubro.negocio_id &&
            normalizePeruPhone(b.telefono) === cleanTel
        )
        .map((b) => ({
          id: b.id,
          cliente: b.cliente,
          telefono: b.telefono,
          servicio: b.servicio,
          inicio: `${b.fecha}T${b.hora}:00-05:00`,
          estado: b.estado,
        }));

      try {
        if (!isSupabaseConfigured) {
          await new Promise((r) => setTimeout(r, 220));
          if (matchingLocal.length > 0) {
            setCitasList(matchingLocal);
          } else {
            // Mostrar ejemplo demo si el usuario coincide con uno de ejemplo o recién registrado
            const ejemplo = rubro.citasEjemplo.find(
              (c) => normalizePeruPhone(c.telefono) === cleanTel
            );
            if (ejemplo) {
              const today = new Date().toISOString().slice(0, 10);
              setCitasList([
                {
                  id: ejemplo.id,
                  cliente: ejemplo.cliente,
                  telefono: ejemplo.telefono,
                  servicio: ejemplo.servicio,
                  inicio: `${today}T${ejemplo.hora}:00-05:00`,
                  estado: ejemplo.estado,
                },
              ]);
            } else {
              setCitasList([]);
            }
          }
          setLoading(false);
          return;
        }

        const supabase = getSupabaseClient();
        const { data, error } = await supabase
          .from('citas')
          .select('*')
          .eq('negocio_id', rubro.negocio_id)
          .eq('telefono', cleanTel)
          .order('inicio', { ascending: false });

        if (error) {
          setCitasList(matchingLocal);
        } else {
          const dbRows = (data as CitaClienteRecord[]) || [];
          const merged = [...matchingLocal];
          for (const row of dbRows) {
            if (!merged.some((m) => m.inicio === row.inicio && m.servicio === row.servicio)) {
              merged.push(row);
            }
          }
          setCitasList(merged);
        }
      } catch {
        setCitasList(matchingLocal);
      } finally {
        setLoading(false);
      }
    },
    [localBookings, rubro.negocio_id, rubro.citasEjemplo]
  );

  useEffect(() => {
    if (isDemoMode) {
      const demoLocal: CitaClienteRecord[] = localBookings
        .filter((b) => b.negocioId === rubro.negocio_id)
        .map((b) => ({
          id: b.id,
          cliente: b.cliente,
          telefono: b.telefono,
          servicio: b.servicio,
          inicio: `${b.fecha}T${b.hora}:00-05:00`,
          estado: b.estado,
        }));
      setCitasList(demoLocal);
      setSearched(true);
      return;
    }

    if (session.role === 'client' && session.telefono.length === 9) {
      consultarHistorial(session.telefono);
    }
  }, [isDemoMode, localBookings, rubro.negocio_id, session.role, session.telefono, consultarHistorial]);

  const handleQuickLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (telefonoConsulta.length === 9) {
      consultarHistorial(telefonoConsulta);
    }
  };

  // Próxima cita o último booking para mostrar en Recordatorios
  const nextAppointment = citasList[0] ?? null;
  const reminderClientName =
    nextAppointment?.cliente ||
    lastBooking?.cliente ||
    (session.role === 'client' ? session.nombre : rubro.recordatorio.ejemploCliente);
  const reminderService =
    nextAppointment?.servicio ||
    lastBooking?.servicio ||
    rubro.recordatorio.ejemploServicio;
  const reminderDateText = nextAppointment
    ? new Intl.DateTimeFormat('es-PE', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Lima',
      }).format(new Date(nextAppointment.inicio))
    : lastBooking
      ? `${lastBooking.fecha} a las ${lastBooking.hora}`
      : rubro.recordatorio.ejemploFechaHora;

  const reminderMessage = `Hola ${reminderClientName} 👋 Te recordamos tu cita de ${reminderService} el ${reminderDateText} en ${rubro.nombre}. Responde 1 para confirmar o 2 para reprogramar.`;

  return (
    <div className="space-y-5">
      {/* Tarjeta de identidad / Mis Citas */}
      {isDemoMode ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3.5">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white"
                style={{ backgroundColor: rubro.colores.primario }}
              >
                <Calendar className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <p
                  className="text-xs font-bold"
                  style={{ color: rubro.colores.primario }}
                >
                  Demo interactiva · Sin registro
                </p>
                <h2 className="text-lg font-bold text-slate-900">
                  Tus citas y recordatorios
                </h2>
              </div>
            </div>

            <button
              type="button"
              onClick={onStartBooking}
              style={{ backgroundColor: rubro.colores.primario }}
              className="tap-feedback inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl px-4 text-xs font-bold text-white shadow-xs whitespace-nowrap"
            >
              <CalendarPlus className="h-4 w-4" />
              Nueva cita
            </button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-1.5 rounded-2xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setSubTab('historial')}
              className={`tap-feedback flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl text-xs font-bold transition-colors ${
                subTab === 'historial'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="h-4 w-4" />
              Mis citas ({citasList.length})
            </button>
            <button
              type="button"
              onClick={() => setSubTab('recordatorios')}
              className={`tap-feedback flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl text-xs font-bold transition-colors ${
                subTab === 'recordatorios'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Bell className="h-4 w-4" />
              Recordatorios
            </button>
          </div>
        </section>
      ) : session.role === 'client' ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3.5">
              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-xl font-bold text-white"
                style={{ backgroundColor: rubro.colores.primario }}
              >
                {session.nombre.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-emerald-700">
                  Cliente registrado · Acceso por teléfono
                </p>
                <h2 className="truncate text-xl font-bold text-slate-900">
                  {session.nombre}
                </h2>
                <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-500 tabular-nums">
                  <span className="inline-flex items-center gap-1">
                    <Phone className="h-3 w-3" /> +51 {session.telefono}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {session.ciudad}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onOpenInstallModal}
                className="tap-feedback inline-flex min-h-[42px] items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 text-xs font-bold text-indigo-800 hover:bg-indigo-100 whitespace-nowrap"
              >
                <Download className="h-3.5 w-3.5" />
                App móvil
              </button>
              <button
                type="button"
                onClick={onLogout}
                className="tap-feedback inline-flex min-h-[42px] items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 whitespace-nowrap"
              >
                <LogOut className="h-3.5 w-3.5" />
                Salir
              </button>
            </div>
          </div>

          {/* Sub-navegación de Perfil: Historial vs Recordatorios */}
          <div className="mt-5 grid grid-cols-2 gap-1.5 rounded-2xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setSubTab('historial')}
              className={`tap-feedback flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl text-xs font-bold transition-colors ${
                subTab === 'historial'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="h-4 w-4" />
              Mis citas ({citasList.length})
            </button>
            <button
              type="button"
              onClick={() => setSubTab('recordatorios')}
              className={`tap-feedback flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl text-xs font-bold transition-colors ${
                subTab === 'recordatorios'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Bell className="h-4 w-4" />
              Recordatorios
            </button>
          </div>
        </section>
      ) : (
        /* Vista cuando entra como Invitado (sin registrarse) */
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
          <div className="flex items-start gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
              <User className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-slate-900">
                Tu Perfil y Historial de Citas
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                Regístrate solo con tu <strong>teléfono, nombre y ciudad</strong> o inicia sesión con tu celular para ver tus citas pasadas y tus recordatorios automáticos de WhatsApp.
              </p>

              {onOpenAuthSheet && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenAuthSheet('register')}
                    style={{ backgroundColor: rubro.colores.primario }}
                    className="tap-feedback min-h-[46px] rounded-xl px-4 text-xs font-bold text-white shadow-xs"
                  >
                    Registrarme (Teléfono, Nombre, Ciudad)
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenAuthSheet('login')}
                    className="tap-feedback min-h-[46px] rounded-xl border border-slate-200 bg-slate-50 px-4 text-xs font-bold text-slate-800 hover:bg-slate-100"
                  >
                    Ya tengo perfil
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenAuthSheet('owner')}
                    className="tap-feedback min-h-[46px] rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Acceso Dueño / CRM
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Consulta rápida sin registrarse */}
          <form
            onSubmit={handleQuickLookup}
            className="mt-5 border-t border-slate-100 pt-4"
          >
            <label
              htmlFor="lookup-phone"
              className="block text-xs font-bold text-slate-700"
            >
              ¿Sacaste cita como invitado? Consúltala con tu celular:
            </label>
            <div className="mt-2 flex gap-2">
              <div className="relative flex-1">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500">
                  +51
                </span>
                <input
                  id="lookup-phone"
                  type="tel"
                  inputMode="numeric"
                  maxLength={9}
                  placeholder="964000000"
                  value={telefonoConsulta}
                  onChange={(e) =>
                    setTelefonoConsulta(normalizePeruPhone(e.target.value))
                  }
                  className="min-h-[48px] w-full rounded-xl border border-slate-300 bg-slate-50 pl-11 pr-3 text-base font-semibold text-slate-900 tabular-nums focus:bg-white focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={telefonoConsulta.length !== 9 || loading}
                style={{ backgroundColor: rubro.colores.primario }}
                className="tap-feedback inline-flex min-h-[48px] items-center gap-1.5 rounded-xl px-4 text-xs font-bold text-white disabled:opacity-50"
              >
                <Search className="h-4 w-4" />
                Buscar
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Contenido Sub-Tab: HISTORIAL DE CITAS */}
      {(subTab === 'historial' || (!isDemoMode && session.role === 'guest')) && (
        <section aria-label="Historial de citas" className="space-y-3">
          {loading ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-slate-500">
              <p className="text-xs font-semibold">Consultando tus citas...</p>
            </div>
          ) : searched && citasList.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center">
              <Calendar className="mx-auto mb-2 h-10 w-10 text-slate-300" />
              <p className="text-sm font-bold text-slate-800">
                Aún no tienes citas registradas en {rubro.nombre}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Reserva tu primer turno en menos de 1 minuto.
              </p>
              <button
                type="button"
                onClick={onStartBooking}
                style={{ backgroundColor: rubro.colores.primario }}
                className="tap-feedback mx-auto mt-4 inline-flex min-h-[46px] items-center gap-2 rounded-xl px-5 text-xs font-bold text-white"
              >
                <CalendarPlus className="h-4 w-4" />
                Sacar mi primera cita
              </button>
            </div>
          ) : (
            citasList.map((cita) => {
              const fechaObj = new Date(cita.inicio);
              const fechaFormatted = !Number.isNaN(fechaObj.getTime())
                ? new Intl.DateTimeFormat('es-PE', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZone: 'America/Lima',
                  }).format(fechaObj)
                : cita.inicio;

              const estado = cita.estado || 'pendiente';
              const estadoLabel =
                estado === 'confirmada'
                  ? 'Confirmada'
                  : estado === 'atendido'
                    ? 'Atendido'
                    : estado === 'reprogramar'
                      ? 'Por reprogramar'
                      : estado === 'cancelada'
                        ? 'Cancelada'
                        : 'Pendiente';

              const estadoStyle =
                estado === 'confirmada'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : estado === 'atendido'
                    ? 'bg-slate-100 text-slate-800 border-slate-200'
                    : estado === 'reprogramar' || estado === 'cancelada'
                      ? 'bg-rose-50 text-rose-800 border-rose-200'
                      : 'bg-amber-50 text-amber-800 border-amber-200';

              return (
                <article
                  key={cita.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium text-slate-500 flex items-center gap-1 tabular-nums">
                        <Clock className="h-3.5 w-3.5" />
                        {fechaFormatted}
                      </p>
                      <h3 className="mt-1 text-base font-bold text-slate-900">
                        {cita.servicio}
                      </h3>
                      <p className="text-xs text-slate-500">
                        Recordatorio WhatsApp al +51 {cita.telefono}
                      </p>
                    </div>

                    <span
                      className={`rounded-lg border px-2.5 py-1 text-xs font-bold whitespace-nowrap ${estadoStyle}`}
                    >
                      {estadoLabel}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                    <button
                      type="button"
                      onClick={() => setSubTab('recordatorios')}
                      className="text-xs font-semibold text-indigo-700 hover:underline"
                    >
                      Ver recordatorio programado
                    </button>
                    <a
                      href={`https://wa.me/${rubro.whatsapp}?text=${encodeURIComponent(
                        `Hola, soy ${cita.cliente} (+51 ${cita.telefono}). Consulto sobre mi cita de ${cita.servicio} (${fechaFormatted}).`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="tap-feedback inline-flex min-h-[38px] items-center gap-1.5 rounded-xl bg-[#25D366] px-3 text-xs font-bold text-white"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      WhatsApp
                    </a>
                  </div>
                </article>
              );
            })
          )}
        </section>
      )}

      {/* Contenido Sub-Tab: MIS RECORDATORIOS (Vista real + Simulación WhatsApp) */}
      {(subTab === 'recordatorios' || session.role === 'client') && (
        <section
          aria-label="Recordatorios por WhatsApp"
          className={subTab === 'recordatorios' ? 'block' : 'hidden'}
        >
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-[#EFEAE2] shadow-xs">
            <div className="flex items-center justify-between bg-[#075E54] px-4 py-3 text-white">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-base">
                  {rubro.logoEmoji}
                </div>
                <div>
                  <p className="text-sm font-bold">{rubro.nombre}</p>
                  <p className="text-[11px] text-emerald-100">
                    Recordatorios automáticos activos (24 h y 2 h antes)
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3 p-4">
              <div className="mx-auto w-fit rounded-lg bg-white/80 px-3 py-1 text-[11px] font-medium text-slate-600">
                Así recibirás tus recordatorios por WhatsApp
              </div>

              <div className="max-w-[88%] rounded-2xl rounded-tl-sm bg-white p-3.5 text-sm leading-relaxed text-slate-900 shadow-2xs">
                <p>{reminderMessage}</p>
                <p className="mt-1.5 text-right text-[10px] text-slate-400 tabular-nums">
                  09:00 a. m.
                </p>
              </div>

              {simReply && (
                <>
                  <div className="ml-auto max-w-[75%] rounded-2xl rounded-tr-sm bg-[#D9FDD3] px-3.5 py-2 text-sm text-slate-900 shadow-2xs">
                    <p className="font-semibold">{simReply}</p>
                    <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-slate-500">
                      <span>09:01 a. m.</span>
                      <CheckCheck className="h-3.5 w-3.5 text-[#53BDEB]" />
                    </div>
                  </div>
                  <div className="max-w-[88%] rounded-2xl rounded-tl-sm bg-white p-3.5 text-sm leading-relaxed text-slate-900 shadow-2xs">
                    <p>
                      {simReply === '1'
                        ? rubro.recordatorio.tonoConfirmacion
                        : rubro.recordatorio.tonoReprogramar}
                    </p>
                  </div>
                </>
              )}
            </div>

            <div className="border-t border-black/10 bg-[#F0F2F5] p-3">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSimReply('1')}
                  className="tap-feedback min-h-[44px] rounded-xl border border-emerald-200 bg-white text-xs font-bold text-emerald-800 hover:bg-emerald-50"
                >
                  Simular 1 · Confirmar
                </button>
                <button
                  type="button"
                  onClick={() => setSimReply('2')}
                  className="tap-feedback min-h-[44px] rounded-xl border border-amber-200 bg-white text-xs font-bold text-amber-800 hover:bg-amber-50"
                >
                  Simular 2 · Reprogramar
                </button>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
