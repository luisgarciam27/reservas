import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Download,
  MapPin,
  MessageCircle,
  RefreshCw,
  UserCheck,
  WifiOff,
} from 'lucide-react';
import { motion } from 'motion/react';
import type { RubroConfig, ServicioItem } from '../config/rubros';
import { useOnlineStatus } from '../hooks/usePWA';
import {
  crearCita,
  fetchHorasOcupadas,
  OfflineBookingError,
  SlotTakenError,
} from '../lib/supabase';
import type { UserSession } from '../types/app';

export interface BookedSummary {
  cliente: string;
  telefono: string;
  ciudad?: string;
  servicio: string;
  precio: number;
  fecha: string;
  hora: string;
  motivo?: string;
  nombreMascota?: string;
  tipoMascota?: string;
}

interface BookingTabProps {
  rubro: RubroConfig;
  session: UserSession;
  initialService?: ServicioItem | null;
  onBackToLanding: () => void;
  onBookingCreated: (summary: BookedSummary) => void;
  onRegisterClient: (params: {
    telefono: string;
    nombre: string;
    ciudad: string;
  }) => void;
  onOpenInstallModal: () => void;
  onOpenAuthSheet: (mode?: 'register' | 'login' | 'owner') => void;
  onGoToProfile: () => void;
}

function getLimaTodayStr(): string {
  // Obtiene YYYY-MM-DD en zona horaria America/Lima
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Lima',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const y = parts.find((p) => p.type === 'year')?.value ?? '2026';
  const m = parts.find((p) => p.type === 'month')?.value ?? '01';
  const d = parts.find((p) => p.type === 'day')?.value ?? '01';
  return `${y}-${m}-${d}`;
}

function getLimaCurrentHour(): number {
  const hourStr = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'America/Lima',
    hour: '2-digit',
    hour12: false,
  }).format(new Date());
  return Number.parseInt(hourStr, 10);
}

function addDaysToYmd(ymd: string, days: number): string {
  const [y, m, d] = ymd.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

function isSundayYmd(ymd: string): boolean {
  const [y, m, d] = ymd.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCDay() === 0;
}

function getDefaultOpenDate(todayYmd: string): string {
  const tomorrow = addDaysToYmd(todayYmd, 1);
  return isSundayYmd(tomorrow) ? addDaysToYmd(tomorrow, 1) : tomorrow;
}

function formatReadableDate(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  return new Intl.DateTimeFormat('es-PE', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(dt);
}

export const BookingTab: React.FC<BookingTabProps> = ({
  rubro,
  session,
  initialService = null,
  onBackToLanding,
  onBookingCreated,
  onRegisterClient,
  onOpenInstallModal,
  onOpenAuthSheet,
  onGoToProfile,
}) => {
  const isOnline = useOnlineStatus();
  const todayYmd = useMemo(() => getLimaTodayStr(), []);

  const [step, setStep] = useState<1 | 2 | 3>(() =>
    initialService ? 2 : 1
  );
  const [selectedService, setSelectedService] = useState<ServicioItem | null>(
    () => initialService
  );
  const [fecha, setFecha] = useState<string>(() =>
    getDefaultOpenDate(todayYmd)
  );
  const [hora, setHora] = useState<string>('');

  // Disponibilidad desde Supabase RPC
  const [horasOcupadas, setHorasOcupadas] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [isOfflineSlotsError, setIsOfflineSlotsError] =
    useState<boolean>(false);
  const [isPreviewMode, setIsPreviewMode] = useState<boolean>(false);

  // Datos del formulario (auto-completados si el usuario ya está registrado)
  const [nombre, setNombre] = useState<string>(() =>
    session.role === 'client' ? session.nombre : ''
  );
  const [celular, setCelular] = useState<string>(() =>
    session.role === 'client' ? session.telefono : ''
  );
  const [ciudad, setCiudad] = useState<string>(() =>
    session.ciudad || 'Lima'
  );
  const [guardarComoRegistrado, setGuardarComoRegistrado] = useState<boolean>(
    () => session.role === 'guest'
  );
  const [motivo, setMotivo] = useState<string>('');
  const [nombreMascota, setNombreMascota] = useState<string>('');
  const [tipoMascota, setTipoMascota] = useState<string>('Perro');
  const [aceptaWhatsapp, setAceptaWhatsapp] = useState<boolean>(
    () => session.role === 'client'
  );

  // Envío
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isOfflineSubmitError, setIsOfflineSubmitError] =
    useState<boolean>(false);
  const [confirmedBooking, setConfirmedBooking] =
    useState<BookedSummary | null>(null);

  // Sincronizar si el usuario inicia sesión mientras está en el flujo
  useEffect(() => {
    if (session.role === 'client') {
      if (session.nombre) setNombre(session.nombre);
      if (session.telefono) setCelular(session.telefono);
      if (session.ciudad) setCiudad(session.ciudad);
      setAceptaWhatsapp(true);
    }
  }, [session.role, session.nombre, session.telefono, session.ciudad]);

  // Al cambiar de rubro o servicio preseleccionado, sincronizar el flujo limpiamente
  useEffect(() => {
    setStep(initialService ? 2 : 1);
    setSelectedService(initialService);
    setHora('');
    setSubmitError(null);
    setConfirmedBooking(null);
    setMotivo('');
    setNombreMascota('');
    setTipoMascota('Perro');
  }, [rubro.id, initialService]);

  // Generar franja de turnos cada hora (9:00 a 19:00)
  const allHourSlots = useMemo(() => {
    const slots: string[] = [];
    for (
      let h = rubro.horario.horaInicio;
      h <= rubro.horario.horaFin;
      h += 1
    ) {
      slots.push(`${String(h).padStart(2, '0')}:00`);
    }
    return slots;
  }, [rubro.horario.horaInicio, rubro.horario.horaFin]);

  const sundaySelected = useMemo(() => isSundayYmd(fecha), [fecha]);

  const loadAvailability = useCallback(async () => {
    if (!fecha || isSundayYmd(fecha)) {
      setHorasOcupadas([]);
      setSlotsError(null);
      setIsOfflineSlotsError(false);
      return;
    }

    setLoadingSlots(true);
    setSlotsError(null);
    setIsOfflineSlotsError(false);

    try {
      const result = await fetchHorasOcupadas(rubro.negocio_id, fecha);
      setHorasOcupadas(result.horas);
      setIsPreviewMode(result.isPreviewMode);
      // Si la hora elegida quedó ocupada, limpiarla
      setHora((prev) => (result.horas.includes(prev) ? '' : prev));
    } catch (err) {
      if (err instanceof OfflineBookingError || !navigator.onLine) {
        setIsOfflineSlotsError(true);
        setSlotsError('Necesitas internet para reservar');
      } else {
        setSlotsError(
          err instanceof Error
            ? err.message
            : 'No pudimos cargar los horarios disponibles.'
        );
      }
    } finally {
      setLoadingSlots(false);
    }
  }, [fecha, rubro.negocio_id]);

  useEffect(() => {
    if (step === 2 || step === 3) {
      loadAvailability();
    }
  }, [step, fecha, loadAvailability]);

  // Botones rápidos de fecha (omitiendo domingos)
  const quickDates = useMemo(() => {
    const candidates: { label: string; ymd: string }[] = [];
    let offset = 0;
    while (candidates.length < 3 && offset < 7) {
      const ymd = addDaysToYmd(todayYmd, offset);
      if (!isSundayYmd(ymd)) {
        const label =
          offset === 0
            ? 'Hoy'
            : offset === 1
              ? 'Mañana'
              : formatReadableDate(ymd);
        candidates.push({ label, ymd });
      }
      offset += 1;
    }
    return candidates;
  }, [todayYmd]);

  const isHourDisabled = (slot: string): boolean => {
    if (horasOcupadas.includes(slot)) return true;
    if (fecha === todayYmd) {
      const slotHour = Number.parseInt(slot.split(':')[0], 10);
      if (slotHour <= getLimaCurrentHour()) return true;
    }
    return false;
  };

  const handleSelectService = (svc: ServicioItem) => {
    setSelectedService(svc);
    setSubmitError(null);
    setStep(2);
  };

  const handleCelularChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 9);
    setCelular(digitsOnly);
  };

  const isCelularValid = /^9\d{8}$/.test(celular);

  const validateStep3 = (): string | null => {
    if (nombre.trim().length < 2) {
      return 'Ingresa tu nombre completo para registrar la cita.';
    }
    if (!isCelularValid) {
      return 'Ingresa un número celular válido de 9 dígitos que empiece con 9.';
    }
    if (rubro.id === 'veterinaria' && nombreMascota.trim().length < 1) {
      return 'Ingresa el nombre de tu mascota.';
    }
    if (!aceptaWhatsapp) {
      return 'Marca la casilla de consentimiento para recibir tu recordatorio por WhatsApp.';
    }
    return null;
  };

  const handleSubmitBooking = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedService || !fecha || !hora) return;

    const validationMsg = validateStep3();
    if (validationMsg) {
      setSubmitError(validationMsg);
      setIsOfflineSubmitError(false);
      return;
    }

    if (!isOnline) {
      setSubmitError('Necesitas internet para reservar');
      setIsOfflineSubmitError(true);
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    setIsOfflineSubmitError(false);

    try {
      const res = await crearCita({
        cliente: nombre.trim(),
        telefono: celular.trim(),
        servicio: selectedService.nombre,
        fecha,
        hora,
        negocio_id: rubro.negocio_id,
      });

      setIsPreviewMode(res.isPreviewMode);

      const summary: BookedSummary = {
        cliente: nombre.trim(),
        telefono: celular.trim(),
        ciudad: ciudad.trim() || 'Lima',
        servicio: selectedService.nombre,
        precio: selectedService.precio,
        fecha,
        hora,
        motivo: rubro.id === 'consultorio' ? motivo.trim() || undefined : undefined,
        nombreMascota:
          rubro.id === 'veterinaria' ? nombreMascota.trim() : undefined,
        tipoMascota: rubro.id === 'veterinaria' ? tipoMascota : undefined,
      };

      // Si el invitado marcó guardar perfil o si ya es cliente, actualizar registro con teléfono, nombre y ciudad
      if (session.role === 'guest' && guardarComoRegistrado) {
        onRegisterClient({
          telefono: celular.trim(),
          nombre: nombre.trim(),
          ciudad: ciudad.trim() || 'Lima',
        });
      }

      setConfirmedBooking(summary);
      onBookingCreated(summary);
    } catch (err) {
      if (err instanceof OfflineBookingError || !navigator.onLine) {
        setIsOfflineSubmitError(true);
        setSubmitError('Necesitas internet para reservar');
      } else if (err instanceof SlotTakenError) {
        setSubmitError(err.message);
        await loadAvailability();
      } else {
        setSubmitError(
          err instanceof Error
            ? err.message
            : 'No se pudo completar la reserva. Inténtalo nuevamente.'
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetFlow = () => {
    setConfirmedBooking(null);
    setSelectedService(null);
    setHora('');
    if (session.role !== 'client') {
      setNombre('');
      setCelular('');
    }
    setMotivo('');
    setNombreMascota('');
    setAceptaWhatsapp(session.role === 'client');
    setSubmitError(null);
    setStep(1);
  };

  // Pantalla de confirmación exitosa
  if (confirmedBooking) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8">
        <div className="mx-auto flex max-w-md flex-col items-center text-center">
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 320, damping: 22 }}
            className="flex h-16 w-16 items-center justify-center rounded-full"
            style={{
              backgroundColor: rubro.colores.superficieDestacada,
              color: rubro.colores.primario,
            }}
          >
            <CheckCircle2 className="h-9 w-9" aria-hidden="true" />
          </motion.div>

          <h2
            className={`mt-4 text-2xl font-bold text-slate-900 ${
              rubro.tipografia.esEditorialSerif ? 'font-display-serif text-3xl' : ''
            }`}
          >
            ¡Cita reservada con éxito!
          </h2>
          <p className="mt-1.5 text-sm text-slate-600">
            Enviaremos un recordatorio automático al{' '}
            <span className="font-semibold text-slate-900 tabular-nums">
              {confirmedBooking.telefono}
            </span>{' '}
            antes de tu cita.
          </p>

          <div className="mt-5 w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left text-sm">
            <div className="flex justify-between gap-3 py-1.5 border-b border-slate-200/70">
              <span className="text-slate-500">Cliente</span>
              <span className="font-semibold text-slate-900 text-right">
                {confirmedBooking.cliente}
              </span>
            </div>
            {confirmedBooking.nombreMascota && (
              <div className="flex justify-between gap-3 py-1.5 border-b border-slate-200/70">
                <span className="text-slate-500">Mascota</span>
                <span className="font-semibold text-slate-900 text-right">
                  {confirmedBooking.nombreMascota} ({confirmedBooking.tipoMascota})
                </span>
              </div>
            )}
            <div className="flex justify-between gap-3 py-1.5 border-b border-slate-200/70">
              <span className="text-slate-500">Servicio</span>
              <span className="font-semibold text-slate-900 text-right">
                {confirmedBooking.servicio}
              </span>
            </div>
            <div className="flex justify-between gap-3 py-1.5 border-b border-slate-200/70">
              <span className="text-slate-500">Fecha y hora</span>
              <span className="font-semibold text-slate-900 tabular-nums text-right">
                {formatReadableDate(confirmedBooking.fecha)} ·{' '}
                {confirmedBooking.hora}
              </span>
            </div>
            <div className="flex justify-between gap-3 pt-1.5">
              <span className="text-slate-500">Tarifa</span>
              <span className="font-bold text-slate-900 tabular-nums">
                S/ {confirmedBooking.precio}
              </span>
            </div>
          </div>

          <div className="mt-6 flex w-full flex-col gap-2.5">
            <button
              type="button"
              onClick={onGoToProfile}
              style={{ backgroundColor: rubro.colores.primario }}
              className="tap-feedback flex min-h-[50px] w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold text-white shadow-xs"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              Ver Mi Perfil y Recordatorios
            </button>
            <button
              type="button"
              onClick={onOpenInstallModal}
              className="tap-feedback flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 text-sm font-semibold text-indigo-800 hover:bg-indigo-100"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              Descargar App al móvil
            </button>
            <button
              type="button"
              onClick={handleResetFlow}
              className="tap-feedback flex min-h-[48px] w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Hacer otra reserva
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 px-1">
        <button
          type="button"
          onClick={onBackToLanding}
          className="tap-feedback inline-flex min-h-[44px] items-center gap-1.5 rounded-xl px-2 text-xs font-semibold text-slate-700 hover:bg-white"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Volver al inicio
        </button>
        <span className="text-xs font-medium text-slate-500">
          {session.role === 'client'
            ? `Perfil: ${session.nombre}`
            : 'Reserva sin cuenta o con perfil'}
        </span>
      </div>

      {/* Acceso previo rápido: Invitado vs Registrarse con Teléfono, Nombre, Ciudad */}
      {session.role === 'guest' ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900">
                ¿Cómo prefieres sacar tu cita?
              </p>
              <p className="mt-0.5 text-[11px] text-slate-600">
                Puedes reservar directo sin crear usuario, o registrarte con tu teléfono, nombre y ciudad para guardar tu historial.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => onOpenAuthSheet('register')}
                className="tap-feedback min-h-[40px] rounded-xl border border-slate-300 bg-slate-50 px-3 text-xs font-bold text-slate-800 hover:bg-slate-100 whitespace-nowrap"
              >
                Registrarme antes
              </button>
              <button
                type="button"
                onClick={onOpenInstallModal}
                className="tap-feedback inline-flex min-h-[40px] items-center gap-1 rounded-xl border border-indigo-200 bg-indigo-50 px-3 text-xs font-bold text-indigo-800 hover:bg-indigo-100 whitespace-nowrap"
              >
                <Download className="h-3.5 w-3.5" />
                App móvil
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-2 rounded-2xl border border-emerald-200 bg-emerald-50/70 px-4 py-2.5 text-xs text-emerald-900">
          <span className="inline-flex items-center gap-1.5 font-semibold">
            <UserCheck className="h-4 w-4 text-emerald-700" />
            Tus datos ({session.nombre} · {session.ciudad}) se completarán automáticamente.
          </span>
        </div>
      )}

      {/* Indicador de pasos */}
      <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs">
        <div className="grid grid-cols-3 gap-2">
          {[
            { num: 1, label: '1. Servicio' },
            { num: 2, label: '2. Horario' },
            { num: 3, label: '3. Tus datos' },
          ].map((item) => {
            const isCurrent = step === item.num;
            const isDone = step > item.num;
            const canClick =
              item.num === 1 ||
              (item.num === 2 && Boolean(selectedService)) ||
              (item.num === 3 && Boolean(selectedService && hora));
            return (
              <button
                key={item.num}
                type="button"
                disabled={!canClick}
                onClick={() => {
                  if (canClick) setStep(item.num as 1 | 2 | 3);
                }}
                style={
                  isCurrent
                    ? {
                        backgroundColor: rubro.colores.superficieDestacada,
                        color: rubro.colores.primario,
                        borderColor: rubro.colores.bordeSuave,
                      }
                    : undefined
                }
                className={`tap-feedback flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border px-2 text-xs font-semibold transition-colors ${
                  isCurrent
                    ? 'border'
                    : isDone
                      ? 'border-slate-200 bg-slate-50 text-slate-800'
                      : 'border-transparent bg-transparent text-slate-400'
                }`}
              >
                {isDone && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* PASO 1: Servicios en tarjetas */}
      {step === 1 && (
        <section aria-labelledby="step-services-title" className="space-y-3">
          <div className="px-1">
            <h2
              id="step-services-title"
              className={`text-xl font-bold text-slate-900 ${
                rubro.tipografia.esEditorialSerif
                  ? 'font-display-serif text-2xl'
                  : ''
              }`}
            >
              Elige un servicio
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {rubro.horario.diasLabel} · Precios en Soles (S/)
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {rubro.servicios.map((svc) => {
              const isSelected = selectedService?.id === svc.id;
              return (
                <button
                  key={svc.id}
                  type="button"
                  onClick={() => handleSelectService(svc)}
                  style={
                    isSelected
                      ? {
                          borderColor: rubro.colores.primario,
                          backgroundColor: rubro.colores.fondoSuave,
                        }
                      : undefined
                  }
                  className="tap-feedback flex min-h-[104px] w-full flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-xs hover:border-slate-300"
                >
                  <div className="flex w-full items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-bold text-slate-900">
                        {svc.nombre}
                      </h3>
                      <p className="mt-1 text-xs leading-relaxed text-slate-600">
                        {svc.descripcion}
                      </p>
                    </div>
                    <span
                      className="shrink-0 text-base font-bold tabular-nums"
                      style={{ color: rubro.colores.primario }}
                    >
                      S/ {svc.precio}
                    </span>
                  </div>

                  <div className="mt-3 flex w-full items-center justify-between border-t border-slate-100 pt-2.5 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                      {svc.duracion}
                    </span>
                    <span
                      className="font-semibold"
                      style={{ color: rubro.colores.primario }}
                    >
                      Elegir horario →
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* PASO 2: Fecha y Hora con llamada RPC horas_ocupadas */}
      {step === 2 && selectedService && (
        <section
          aria-labelledby="step-datetime-title"
          className="rounded-3xl border border-slate-200 bg-white p-4 shadow-xs sm:p-6"
        >
          {/* Resumen de servicio seleccionado */}
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3.5">
            <div className="min-w-0">
              <p className="text-xs text-slate-500">Servicio elegido</p>
              <p className="truncate text-sm font-bold text-slate-900">
                {selectedService.nombre} ·{' '}
                <span className="tabular-nums">S/ {selectedService.precio}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="tap-feedback inline-flex min-h-[44px] items-center gap-1 rounded-xl px-3 text-xs font-semibold text-slate-600 hover:bg-slate-100 whitespace-nowrap shrink-0"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              Cambiar
            </button>
          </div>

          <div className="mt-4 space-y-4">
            <div>
              <label
                htmlFor="booking-date"
                className="block text-sm font-bold text-slate-900"
              >
                Elige el día
              </label>

              {/* Atajos rápidos para el pulgar */}
              <div className="mt-2 grid grid-cols-3 gap-2">
                {quickDates.map((qd) => {
                  const active = fecha === qd.ymd;
                  return (
                    <button
                      key={qd.ymd}
                      type="button"
                      onClick={() => {
                        setFecha(qd.ymd);
                        setHora('');
                      }}
                      style={
                        active
                          ? {
                              backgroundColor: rubro.colores.primario,
                              color: '#FFFFFF',
                              borderColor: rubro.colores.primario,
                            }
                          : undefined
                      }
                      className={`tap-feedback min-h-[44px] rounded-xl border px-2 text-xs font-semibold ${
                        active
                          ? ''
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {qd.label}
                    </button>
                  );
                })}
              </div>

              <div className="relative mt-2.5">
                <Calendar
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  id="booking-date"
                  type="date"
                  min={todayYmd}
                  value={fecha}
                  onChange={(e) => {
                    setFecha(e.target.value);
                    setHora('');
                  }}
                  className="min-h-[48px] w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3.5 text-base font-medium text-slate-900 focus:border-slate-900 focus:outline-none"
                />
              </div>
            </div>

            {/* Horarios */}
            <div>
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-bold text-slate-900">
                  Elige una hora disponible
                </p>
                <span className="text-xs text-slate-500">9:00 a 19:00</span>
              </div>

              {sundaySelected ? (
                <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  Los domingos el negocio permanece cerrado. Atendemos de{' '}
                  <span className="font-semibold">lunes a sábado</span>. Por
                  favor elige otro día.
                </div>
              ) : isOfflineSlotsError || !isOnline ? (
                <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 p-4">
                  <div className="flex items-start gap-2.5 text-rose-900">
                    <WifiOff
                      className="mt-0.5 h-5 w-5 shrink-0"
                      aria-hidden="true"
                    />
                    <div>
                      <p className="text-sm font-bold">
                        Necesitas internet para reservar
                      </p>
                      <p className="mt-0.5 text-xs text-rose-800">
                        Conéctate a Wi-Fi o datos móviles para ver los turnos
                        disponibles en tiempo real.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={loadAvailability}
                    className="tap-feedback mt-3 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-rose-700 px-4 text-sm font-semibold text-white"
                  >
                    <RefreshCw className="h-4 w-4" aria-hidden="true" />
                    Reintentar
                  </button>
                </div>
              ) : slotsError ? (
                <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 p-4">
                  <p className="text-sm font-semibold text-rose-900">
                    {slotsError}
                  </p>
                  <button
                    type="button"
                    onClick={loadAvailability}
                    className="tap-feedback mt-3 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-rose-700 px-4 text-sm font-semibold text-white"
                  >
                    <RefreshCw className="h-4 w-4" aria-hidden="true" />
                    Reintentar
                  </button>
                </div>
              ) : loadingSlots ? (
                <div
                  aria-label="Cargando horarios disponibles"
                  className="mt-3 grid grid-cols-3 gap-2.5 sm:grid-cols-4"
                >
                  {allHourSlots.map((slot) => (
                    <div
                      key={slot}
                      className="skeleton-shimmer h-12 rounded-xl"
                    />
                  ))}
                </div>
              ) : (
                <>
                  <div className="mt-3 grid grid-cols-3 gap-2.5 sm:grid-cols-4">
                    {allHourSlots.map((slot) => {
                      const disabled = isHourDisabled(slot);
                      const active = hora === slot;
                      return (
                        <button
                          key={slot}
                          type="button"
                          disabled={disabled}
                          onClick={() => setHora(slot)}
                          style={
                            active
                              ? {
                                  backgroundColor: rubro.colores.primario,
                                  borderColor: rubro.colores.primario,
                                  color: '#FFFFFF',
                                }
                              : undefined
                          }
                          className={`tap-feedback flex min-h-[48px] flex-col items-center justify-center rounded-xl border px-2 text-sm font-semibold tabular-nums ${
                            disabled
                              ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 line-through'
                              : active
                                ? 'shadow-xs'
                                : 'border-slate-200 bg-white text-slate-900 hover:border-slate-400'
                          }`}
                        >
                          <span>{slot}</span>
                          {disabled && (
                            <span className="text-[10px] font-medium no-underline">
                              Ocupado
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {isPreviewMode && (
                    <p className="mt-3 text-[11px] text-slate-500">
                      Vista previa local activa. Configura{' '}
                      <code className="font-mono">SUPABASE_URL</code> y{' '}
                      <code className="font-mono">SUPABASE_ANON_KEY</code> para
                      consultar tu tabla <code className="font-mono">citas</code>{' '}
                      en vivo.
                    </p>
                  )}
                </>
              )}
            </div>

            <button
              type="button"
              disabled={!hora || sundaySelected || loadingSlots || !isOnline}
              onClick={() => {
                setSubmitError(null);
                setStep(3);
              }}
              style={{
                backgroundColor:
                  !hora || sundaySelected || loadingSlots || !isOnline
                    ? undefined
                    : rubro.colores.primario,
              }}
              className="tap-feedback flex min-h-[50px] w-full items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
            >
              Continuar con tus datos
            </button>
          </div>
        </section>
      )}

      {/* PASO 3: Formulario de datos + consentimiento WhatsApp */}
      {step === 3 && selectedService && (
        <form
          onSubmit={handleSubmitBooking}
          noValidate
          className="rounded-3xl border border-slate-200 bg-white p-4 shadow-xs sm:p-6"
        >
          {/* Resumen editable */}
          <div
            className="flex items-center justify-between gap-3 rounded-2xl border p-3.5"
            style={{
              backgroundColor: rubro.colores.fondoSuave,
              borderColor: rubro.colores.bordeSuave,
            }}
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-900">
                {selectedService.nombre}
              </p>
              <p className="mt-0.5 text-xs font-medium text-slate-700 tabular-nums">
                {formatReadableDate(fecha)} · {hora} · S/{' '}
                {selectedService.precio}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setStep(2)}
              className="tap-feedback min-h-[44px] shrink-0 rounded-xl bg-white px-3 text-xs font-semibold text-slate-800 shadow-2xs"
            >
              Cambiar hora
            </button>
          </div>

          <div className="mt-4 space-y-4">
            {/* Nombre */}
            <div>
              <label
                htmlFor="cliente-nombre"
                className="block text-sm font-semibold text-slate-900"
              >
                Tu nombre completo
              </label>
              <input
                id="cliente-nombre"
                type="text"
                autoComplete="name"
                required
                placeholder="Ej. María Fernanda Quispe"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="mt-1.5 min-h-[48px] w-full rounded-xl border border-slate-300 bg-white px-3.5 text-base text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
              />
            </div>

            {/* Celular Perú (9 dígitos, empieza en 9) */}
            <div>
              <label
                htmlFor="cliente-celular"
                className="block text-sm font-semibold text-slate-900"
              >
                Celular con WhatsApp
              </label>
              <div className="mt-1.5 flex items-stretch gap-2">
                <span className="flex min-h-[48px] items-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700 tabular-nums">
                  +51
                </span>
                <input
                  id="cliente-celular"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  maxLength={9}
                  required
                  placeholder="964000000"
                  value={celular}
                  onChange={handleCelularChange}
                  className="min-h-[48px] w-full rounded-xl border border-slate-300 bg-white px-3.5 text-base text-slate-900 tabular-nums placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
                />
              </div>
              <p className="mt-1 text-xs text-slate-500">
                9 dígitos, debe empezar con 9. Será tu clave para ver tus citas.
              </p>
            </div>

            {/* Ciudad */}
            <div>
              <label
                htmlFor="cliente-ciudad"
                className="block text-sm font-semibold text-slate-900"
              >
                Ciudad
              </label>
              <div className="relative mt-1.5">
                <MapPin
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  id="cliente-ciudad"
                  type="text"
                  placeholder="Ej. Lima, Arequipa, Bogotá..."
                  value={ciudad}
                  onChange={(e) => setCiudad(e.target.value)}
                  className="min-h-[48px] w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3.5 text-base text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
                />
              </div>
            </div>

            {/* Campos extra por rubro */}
            {rubro.id === 'consultorio' && (
              <div>
                <label
                  htmlFor="consultorio-motivo"
                  className="block text-sm font-semibold text-slate-900"
                >
                  Motivo de consulta{' '}
                  <span className="font-normal text-slate-500">(opcional)</span>
                </label>
                <input
                  id="consultorio-motivo"
                  type="text"
                  placeholder="Ej. Dolor en molar, control semestral"
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  className="mt-1.5 min-h-[48px] w-full rounded-xl border border-slate-300 bg-white px-3.5 text-base text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
                />
              </div>
            )}

            {rubro.id === 'veterinaria' && (
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="vet-mascota-nombre"
                    className="block text-sm font-semibold text-slate-900"
                  >
                    Nombre de tu mascota
                  </label>
                  <input
                    id="vet-mascota-nombre"
                    type="text"
                    required
                    placeholder="Ej. Toby, Luna, Rocky"
                    value={nombreMascota}
                    onChange={(e) => setNombreMascota(e.target.value)}
                    className="mt-1.5 min-h-[48px] w-full rounded-xl border border-slate-300 bg-white px-3.5 text-base text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <span className="block text-sm font-semibold text-slate-900">
                    Tipo de mascota
                  </span>
                  <div className="mt-1.5 grid grid-cols-3 gap-2">
                    {['Perro', 'Gato', 'Otro'].map((tipo) => {
                      const active = tipoMascota === tipo;
                      return (
                        <button
                          key={tipo}
                          type="button"
                          onClick={() => setTipoMascota(tipo)}
                          style={
                            active
                              ? {
                                  backgroundColor: rubro.colores.primario,
                                  borderColor: rubro.colores.primario,
                                  color: '#FFFFFF',
                                }
                              : undefined
                          }
                          className={`tap-feedback min-h-[48px] rounded-xl border text-sm font-semibold ${
                            active
                              ? ''
                              : 'border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100'
                          }`}
                        >
                          {tipo}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Opción de guardar perfil si es invitado */}
            {session.role === 'guest' && (
              <label className="flex min-h-[52px] cursor-pointer items-start gap-3 rounded-2xl border border-indigo-200 bg-indigo-50/60 p-3.5">
                <input
                  type="checkbox"
                  checked={guardarComoRegistrado}
                  onChange={(e) => setGuardarComoRegistrado(e.target.checked)}
                  className="mt-0.5 h-5 w-5 shrink-0 rounded-md border-slate-300 accent-indigo-600"
                />
                <span className="text-xs leading-relaxed text-slate-700">
                  <strong className="text-slate-900">
                    Crear mi perfil con mi teléfono, nombre y ciudad
                  </strong>{' '}
                  para consultar mi historial y recordatorios en la app. (Desmarca si prefieres reservar sin registro).
                </span>
              </label>
            )}

            {/* Consentimiento WhatsApp */}
            <label className="flex min-h-[52px] cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
              <input
                type="checkbox"
                checked={aceptaWhatsapp}
                onChange={(e) => setAceptaWhatsapp(e.target.checked)}
                className="mt-0.5 h-6 w-6 shrink-0 rounded-md border-slate-300 accent-slate-900"
              />
              <span className="text-xs leading-relaxed text-slate-700">
                Acepto recibir confirmación y recordatorios de mi cita por{' '}
                <span className="font-semibold text-slate-900">WhatsApp</span>.
              </span>
            </label>

            {/* Mensajes de error claros */}
            {submitError && (
              <div
                role="alert"
                className="rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-900"
              >
                <div className="flex items-start gap-2.5">
                  {isOfflineSubmitError ? (
                    <WifiOff
                      className="mt-0.5 h-5 w-5 shrink-0 text-rose-700"
                      aria-hidden="true"
                    />
                  ) : (
                    <AlertCircle
                      className="mt-0.5 h-5 w-5 shrink-0 text-rose-700"
                      aria-hidden="true"
                    />
                  )}
                  <div className="flex-1">
                    <p className="font-semibold">{submitError}</p>
                    {isOfflineSubmitError && (
                      <button
                        type="button"
                        onClick={() => handleSubmitBooking()}
                        className="tap-feedback mt-2.5 inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-rose-700 px-4 text-xs font-semibold text-white"
                      >
                        <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                        Reintentar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              style={{ backgroundColor: rubro.colores.primario }}
              className="tap-feedback flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl px-4 text-base font-bold text-white shadow-sm disabled:opacity-60"
            >
              {submitting ? 'Guardando reserva...' : 'Confirmar reserva'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
