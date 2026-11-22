import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  MapPin,
  RefreshCw,
  ShoppingBag,
  UserCheck,
} from 'lucide-react';
import { PWAInstallBanner } from '../components/PWABanners';
import { PWAInstallModal } from '../components/PWAInstallModal';
import { WhatsAppSvgIcon } from '../components/RubroIcons';
import { RUBROS_SAAS } from '../config/rubros';
import {
  applyBusinessPWAMetadata,
  resetDefaultPWAMetadata,
} from '../lib/pwaManifest';
import {
  fetchNegocioBundleBySlug,
  fetchSaaSHorasOcupadas,
  type FullBusinessBundle,
  isSafeLogoUrl,
  reservarCitaSaaS,
} from '../lib/saasService';
import { OfflineBookingError, SlotTakenError } from '../lib/supabase';
import type { ProfesionalSaaS, ServicioSaaS } from '../types/saas';

interface PublicBookingPageProps {
  slug: string;
  onBackToSaaSLanding: () => void;
}

function getLimaTodayStr(): string {
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

function addDaysToYmd(ymd: string, days: number): string {
  const [y, m, d] = ymd.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

function isSundayYmd(ymd: string): boolean {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay() === 0;
}

const ALL_HOURS = [
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
  '19:00',
];

export const PublicBookingPage: React.FC<PublicBookingPageProps> = ({
  slug,
  onBackToSaaSLanding,
}) => {
  const [bundle, setBundle] = useState<FullBusinessBundle | null>(null);
  const [loadingBusiness, setLoadingBusiness] = useState(true);
  const [installOpen, setInstallOpen] = useState(false);

  // Tab principal si el negocio activó módulo de Catálogo
  const [activeTab, setActiveTab] = useState<'reservar' | 'catalogo'>(
    'reservar'
  );

  // Flujo: 1 Servicio → 2 Profesional (opcional) → 3 Día y Hora → 4 Datos → Confirmación
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedService, setSelectedService] = useState<ServicioSaaS | null>(
    null
  );
  const [selectedProf, setSelectedProf] = useState<ProfesionalSaaS | null>(
    null
  );
  const todayYmd = useMemo(() => getLimaTodayStr(), []);
  const [fecha, setFecha] = useState<string>(() => {
    const tomorrow = addDaysToYmd(todayYmd, 1);
    return isSundayYmd(tomorrow) ? addDaysToYmd(tomorrow, 1) : tomorrow;
  });
  const [hora, setHora] = useState<string>('');
  const [busyHours, setBusyHours] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Datos del cliente + campos extra según rubro
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [ciudad, setCiudad] = useState('Lima');
  const [extraValues, setExtraValues] = useState<Record<string, string>>({});

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoadingBusiness(true);
    fetchNegocioBundleBySlug(slug)
      .then((res) => {
        if (!mounted) return;
        setBundle(res);
        if (res) {
          applyBusinessPWAMetadata({
            name: `${res.negocio.nombre} — Reservas`,
            shortName: res.negocio.nombre.slice(0, 14),
            description: `Reserva tu cita online en ${res.negocio.nombre} con horarios en vivo`,
            themeColor: res.negocio.color,
            startUrl: `/n/${res.negocio.slug}`,
            slug: res.negocio.slug,
          });
        }
      })
      .finally(() => {
        if (mounted) setLoadingBusiness(false);
      });
    return () => {
      mounted = false;
      resetDefaultPWAMetadata();
    };
  }, [slug]);

  const loadAvailability = useCallback(async () => {
    if (!bundle) return;
    setLoadingSlots(true);
    setErrorMsg(null);
    try {
      const res = await fetchSaaSHorasOcupadas(bundle.negocio.id, fecha);
      setBusyHours(res.horas);
      setHora((prev) => (res.horas.includes(prev) ? '' : prev));
    } catch {
      setErrorMsg('No se pudo verificar la disponibilidad en tiempo real.');
    } finally {
      setLoadingSlots(false);
    }
  }, [bundle, fecha]);

  useEffect(() => {
    if (step === 3 && bundle) {
      loadAvailability();
    }
  }, [step, fecha, bundle, loadAvailability]);

  const quickDates = useMemo(() => {
    const out: { label: string; ymd: string }[] = [];
    for (let i = 0; i < 6 && out.length < 3; i += 1) {
      const ymd = addDaysToYmd(todayYmd, i);
      if (!isSundayYmd(ymd)) {
        out.push({
          label: i === 0 ? 'Hoy' : i === 1 ? 'Mañana' : ymd.slice(5),
          ymd,
        });
      }
    }
    return out;
  }, [todayYmd]);

  if (loadingBusiness) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-slate-50 p-6 text-sm font-semibold text-slate-600">
        Cargando app de reservas...
      </div>
    );
  }

  if (!bundle) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <div className="max-w-sm rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
          <p className="text-3xl">🔍</p>
          <h1 className="mt-3 text-lg font-extrabold text-slate-900">
            No encontramos /{slug}
          </h1>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
            Verifica que el enlace sea correcto o crea tu propio negocio en MarIA
            Citas en menos de 2 minutos.
          </p>
          <button
            type="button"
            onClick={onBackToSaaSLanding}
            className="mt-5 min-h-[46px] w-full rounded-xl bg-indigo-600 text-xs font-bold text-white"
          >
            Ir a MarIA Citas
          </button>
        </div>
      </div>
    );
  }

  const { negocio, modulos, servicios, profesionales, productos } = bundle;
  const preset = RUBROS_SAAS[negocio.rubro] || RUBROS_SAAS.otro;
  const hasProfesionales =
    negocio.plan === 'full' && profesionales.length > 0;
  const logoIsImg = isSafeLogoUrl(negocio.logo);

  const handleSelectService = (svc: ServicioSaaS) => {
    setSelectedService(svc);
    setErrorMsg(null);
    setStep(hasProfesionales ? 2 : 3);
  };

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !fecha || !hora) return;
    if (nombre.trim().length < 2) {
      setErrorMsg('Ingresa tu nombre completo.');
      return;
    }
    if (!/^9\d{8}$/.test(telefono)) {
      setErrorMsg('Ingresa un celular válido de 9 dígitos que empiece con 9.');
      return;
    }

    for (const campo of preset.camposExtra) {
      if (campo.required && !(extraValues[campo.name] || '').trim()) {
        setErrorMsg(`Por favor completa: ${campo.label}`);
        return;
      }
    }

    setSubmitting(true);
    setErrorMsg(null);
    try {
      await reservarCitaSaaS({
        negocioId: negocio.id,
        rubro: negocio.rubro,
        cliente: nombre.trim(),
        telefono,
        ciudad: ciudad.trim(),
        servicio: selectedService.nombre,
        precio: Number(selectedService.precio) || 0,
        fecha,
        hora,
        profesional: selectedProf?.nombre,
        extra: extraValues,
      });
      setConfirmed(true);
    } catch (err) {
      if (err instanceof SlotTakenError) {
        setErrorMsg(err.message);
        await loadAvailability();
      } else if (err instanceof OfflineBookingError) {
        setErrorMsg('Necesitas conexión a internet para confirmar la hora.');
      } else {
        setErrorMsg(
          err instanceof Error
            ? err.message
            : 'No pudimos registrar la cita.'
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const whatsappConfirmUrl = `https://wa.me/${negocio.whatsapp}?text=${encodeURIComponent(
    `Hola ${negocio.nombre} 👋 Acabo de reservar:\n• Servicio: ${
      selectedService?.nombre || ''
    } (S/ ${selectedService?.precio || 0})${
      selectedProf ? `\n• Profesional: ${selectedProf.nombre}` : ''
    }\n• Fecha y hora: ${fecha} a las ${hora}\n• Nombre: ${nombre}\n• Celular: +51 ${telefono}${
      extraValues.nombreMascota
        ? `\n• Mascota: ${extraValues.nombreMascota} (${extraValues.tipoMascota || 'Perro'})`
        : ''
    }`
  )}`;

  return (
    <div className="min-h-[100dvh] flex flex-col bg-slate-50 text-slate-900">
      {/* Header personalizado con nombre, logo y color del negocio */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md pt-safe">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between gap-2 px-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl text-lg text-white"
              style={{ backgroundColor: negocio.color }}
            >
              {logoIsImg ? (
                <img
                  src={negocio.logo}
                  alt={negocio.nombre}
                  className="h-full w-full object-cover"
                />
              ) : (
                negocio.logo
              )}
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-sm font-extrabold text-slate-900 sm:text-base">
                {negocio.nombre}
              </h1>
              <p className="truncate text-[11px] font-medium text-slate-500">
                {negocio.horario}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setInstallOpen(true)}
            style={{
              backgroundColor: `${negocio.color}14`,
              color: negocio.color,
            }}
            className="tap-feedback inline-flex min-h-[38px] shrink-0 items-center gap-1.5 rounded-xl px-3 text-xs font-bold"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Instalar App</span>
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-5 pb-20 space-y-4">
        {/* Tarjeta info negocio */}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-slate-400" />
            {negocio.direccion || 'Reserva online'}
          </span>
          <span className="font-bold" style={{ color: negocio.color }}>
            {preset.rubroLabel}
          </span>
        </div>

        {/* Selector Reservar vs Catálogo (solo si catálogo está activo) */}
        {modulos.catalogo && productos.length > 0 && (
          <div className="grid grid-cols-2 rounded-2xl border border-slate-200 bg-white p-1">
            <button
              type="button"
              onClick={() => setActiveTab('reservar')}
              style={
                activeTab === 'reservar'
                  ? { backgroundColor: negocio.color, color: '#FFFFFF' }
                  : undefined
              }
              className="min-h-[44px] rounded-xl text-xs font-bold"
            >
              Sacar cita
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('catalogo')}
              style={
                activeTab === 'catalogo'
                  ? { backgroundColor: negocio.color, color: '#FFFFFF' }
                  : undefined
              }
              className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl text-xs font-bold"
            >
              <ShoppingBag className="h-4 w-4" />
              Productos ({productos.length})
            </button>
          </div>
        )}

        {/* VISTA CATÁLOGO DE PRODUCTOS POR WHATSAPP */}
        {activeTab === 'catalogo' && modulos.catalogo ? (
          <section className="space-y-3">
            <h2 className="text-lg font-extrabold text-slate-900">
              Catálogo de productos
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {productos.map((pr) => (
                <div
                  key={pr.id}
                  className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-bold text-slate-900">
                        {pr.nombre}
                      </h3>
                      <span
                        className="shrink-0 text-sm font-extrabold tabular-nums"
                        style={{ color: negocio.color }}
                      >
                        S/ {pr.precio}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {pr.descripcion}
                    </p>
                  </div>
                  <a
                    href={`https://wa.me/${negocio.whatsapp}?text=${encodeURIComponent(
                      `Hola ${negocio.nombre}, quiero pedir: ${pr.nombre} (S/ ${pr.precio}).`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl bg-[#25D366] text-xs font-bold text-white"
                  >
                    <WhatsAppSvgIcon className="h-4 w-4" />
                    Pedir por WhatsApp
                  </a>
                </div>
              ))}
            </div>
          </section>
        ) : confirmed && selectedService ? (
          /* PANTALLA CONFIRMACIÓN NATIVA EN LA APP + CALENDARIO + WHATSAPP OPCIONAL */
          <section className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-xs sm:p-8">
            <div
              className="mx-auto flex h-16 w-16 items-center justify-center rounded-full"
              style={{
                backgroundColor: `${negocio.color}18`,
                color: negocio.color,
              }}
            >
              <CheckCircle2 className="h-9 w-9" />
            </div>
            <h2 className="mt-4 text-2xl font-extrabold text-slate-900">
              ¡Cita confirmada en la App!
            </h2>
            <p className="mt-1.5 text-xs text-slate-600 sm:text-sm">
              Tu turno ya quedó separado en <strong>{negocio.nombre}</strong>.
              Guárdalo en tu calendario o instala la App para no olvidarlo.
            </p>

            <div className="mx-auto mt-5 max-w-md rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Servicio</span>
                <span className="font-bold text-slate-900">
                  {selectedService.nombre} (S/ {selectedService.precio})
                </span>
              </div>
              {selectedProf && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Profesional</span>
                  <span className="font-bold text-slate-900">
                    {selectedProf.nombre}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">Día y hora</span>
                <span className="font-bold text-slate-900 tabular-nums">
                  {fecha} · {hora}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{preset.sujetoSingularCap}</span>
                <span className="font-bold text-slate-900">
                  {extraValues.nombreMascota || nombre}
                </span>
              </div>
            </div>

            <div className="mx-auto mt-6 flex max-w-md flex-col gap-2.5">
              <button
                type="button"
                onClick={() => {
                  const dtStart = `${fecha.replace(/-/g, '')}T${hora.replace(':', '')}00`;
                  const endHourNum = Number.parseInt(hora.split(':')[0], 10) + 1;
                  const dtEnd = `${fecha.replace(/-/g, '')}T${String(endHourNum).padStart(2, '0')}0000`;
                  const ics = [
                    'BEGIN:VCALENDAR',
                    'VERSION:2.0',
                    'BEGIN:VEVENT',
                    `DTSTART;TZID=America/Lima:${dtStart}`,
                    `DTEND;TZID=America/Lima:${dtEnd}`,
                    `SUMMARY:${selectedService.nombre} - ${negocio.nombre}`,
                    `LOCATION:${negocio.direccion || negocio.nombre}`,
                    `DESCRIPTION:Reserva registrada en ${negocio.nombre}`,
                    'END:VEVENT',
                    'END:VCALENDAR',
                  ].join('\r\n');
                  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `cita-${negocio.slug}-${fecha}.ics`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }}
                style={{ backgroundColor: negocio.color }}
                className="tap-feedback flex min-h-[50px] items-center justify-center gap-2 rounded-xl text-sm font-bold text-white shadow-xs"
              >
                <Calendar className="h-4 w-4" />
                Agregar a mi Calendario
              </button>

              <button
                type="button"
                onClick={() => setInstallOpen(true)}
                className="tap-feedback flex min-h-[46px] items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 text-xs font-bold text-indigo-800"
              >
                <Download className="h-4 w-4" />
                Instalar App de {negocio.nombre}
              </button>

              <a
                href={whatsappConfirmUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="tap-feedback flex min-h-[46px] items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 text-xs font-bold text-emerald-800"
              >
                <WhatsAppSvgIcon className="h-4 w-4 text-[#25D366]" />
                Enviar copia por WhatsApp (opcional)
              </a>

              <button
                type="button"
                onClick={() => {
                  setConfirmed(false);
                  setStep(1);
                  setHora('');
                }}
                className="min-h-[44px] rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Reservar otra cita
              </button>
            </div>
          </section>
        ) : (
          /* FLUJO PASO A PASO */
          <div className="space-y-4">
            {/* Indicador visual del flujo */}
            <div className="grid grid-cols-4 gap-1.5 rounded-2xl border border-slate-200 bg-white p-2 text-[11px] font-bold">
              {[
                { n: 1, t: '1. Servicio' },
                { n: 2, t: '2. Especialista' },
                { n: 3, t: '3. Día y Hora' },
                { n: 4, t: '4. Confirmar' },
              ].map((st) => (
                <div
                  key={st.n}
                  style={
                    step === st.n
                      ? { backgroundColor: negocio.color, color: '#FFFFFF' }
                      : undefined
                  }
                  className={`flex min-h-[36px] items-center justify-center rounded-xl px-1 text-center ${
                    step === st.n ? '' : 'text-slate-400'
                  }`}
                >
                  {st.t}
                </div>
              ))}
            </div>

            {/* PASO 1: SERVICIOS */}
            {step === 1 && (
              <section className="space-y-3">
                <h2 className="text-lg font-extrabold text-slate-900">
                  Elige tu servicio
                </h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {servicios.map((svc) => (
                    <button
                      key={svc.id}
                      type="button"
                      onClick={() => handleSelectService(svc)}
                      className="tap-feedback flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-2xs hover:border-slate-300"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">
                            {svc.nombre}
                          </h3>
                          <p className="mt-1 text-xs text-slate-500">
                            {svc.descripcion || 'Atención programada'}
                          </p>
                        </div>
                        <span
                          className="shrink-0 text-sm font-extrabold tabular-nums"
                          style={{ color: negocio.color }}
                        >
                          S/ {svc.precio}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs">
                        <span className="inline-flex items-center gap-1 text-slate-500">
                          <Clock className="h-3.5 w-3.5" />
                          {svc.duracion}
                        </span>
                        <span
                          className="font-bold"
                          style={{ color: negocio.color }}
                        >
                          Elegir →
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* PASO 2: PROFESIONAL (OPCIONAL) */}
            {step === 2 && selectedService && (
              <section className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-extrabold text-slate-900">
                    Elige profesional (opcional)
                  </h2>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-slate-600"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Cambiar
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProf(null);
                      setStep(3);
                    }}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left hover:border-slate-300"
                  >
                    <p className="text-sm font-bold text-slate-900">
                      Cualquier profesional disponible
                    </p>
                    <p className="text-xs text-slate-500">
                      Te asignamos el primer turno libre
                    </p>
                  </button>

                  {profesionales.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setSelectedProf(p);
                        setStep(3);
                      }}
                      className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left hover:border-slate-300"
                    >
                      <UserCheck
                        className="h-5 w-5 shrink-0"
                        style={{ color: negocio.color }}
                      />
                      <div>
                        <p className="text-sm font-bold text-slate-900">
                          {p.nombre}
                        </p>
                        <p className="text-xs text-slate-500">
                          {p.especialidad}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* PASO 3: DÍA Y HORA CON VALIDACIÓN CONTRA DOBLE RESERVA */}
            {step === 3 && selectedService && (
              <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <p className="text-xs text-slate-500">Servicio elegido</p>
                    <p className="text-sm font-bold text-slate-900">
                      {selectedService.nombre} · S/ {selectedService.precio}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(hasProfesionales ? 2 : 1)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-slate-600"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Atrás
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700">
                    Elige el día
                  </label>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {quickDates.map((qd) => (
                      <button
                        key={qd.ymd}
                        type="button"
                        onClick={() => {
                          setFecha(qd.ymd);
                          setHora('');
                        }}
                        style={
                          fecha === qd.ymd
                            ? {
                                backgroundColor: negocio.color,
                                color: '#FFFFFF',
                                borderColor: negocio.color,
                              }
                            : undefined
                        }
                        className="min-h-[42px] rounded-xl border border-slate-200 text-xs font-bold"
                      >
                        {qd.label}
                      </button>
                    ))}
                  </div>
                  <div className="relative mt-2.5">
                    <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="date"
                      min={todayYmd}
                      value={fecha}
                      onChange={(e) => {
                        setFecha(e.target.value);
                        setHora('');
                      }}
                      className="min-h-[46px] w-full rounded-xl border border-slate-300 pl-9 pr-3 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-700">
                      Horarios disponibles
                    </p>
                    <button
                      type="button"
                      onClick={loadAvailability}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500"
                    >
                      <RefreshCw className="h-3 w-3" /> Actualizar
                    </button>
                  </div>

                  {loadingSlots ? (
                    <p className="py-6 text-center text-xs text-slate-400">
                      Verificando horarios libres...
                    </p>
                  ) : (
                    <div className="mt-2.5 grid grid-cols-3 gap-2 sm:grid-cols-5">
                      {ALL_HOURS.map((slot) => {
                        const occupied = busyHours.includes(slot);
                        const active = hora === slot;
                        return (
                          <button
                            key={slot}
                            type="button"
                            disabled={occupied}
                            onClick={() => setHora(slot)}
                            style={
                              active
                                ? {
                                    backgroundColor: negocio.color,
                                    borderColor: negocio.color,
                                    color: '#FFFFFF',
                                  }
                                : undefined
                            }
                            className={`min-h-[46px] rounded-xl border text-xs font-bold tabular-nums ${
                              occupied
                                ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 line-through'
                                : 'border-slate-200 bg-white text-slate-900 hover:border-slate-400'
                            }`}
                          >
                            {slot}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  disabled={!hora}
                  onClick={() => setStep(4)}
                  style={hora ? { backgroundColor: negocio.color } : undefined}
                  className="min-h-[50px] w-full rounded-xl bg-slate-900 text-sm font-bold text-white disabled:bg-slate-200 disabled:text-slate-400"
                >
                  Continuar con tus datos
                </button>
              </section>
            )}

            {/* PASO 4: DATOS DINÁMICOS SEGÚN RUBRO + CONFIRMAR */}
            {step === 4 && selectedService && (
              <form
                onSubmit={handleConfirmBooking}
                className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      {selectedService.nombre}
                    </p>
                    <p className="text-xs text-slate-500 tabular-nums">
                      {fecha} · {hora} · S/ {selectedService.precio}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="text-xs font-bold text-slate-600"
                  >
                    Cambiar hora
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700">
                    Tu nombre completo
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Valeria Chávez"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="mt-1 min-h-[46px] w-full rounded-xl border border-slate-300 px-3 text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700">
                      Celular WhatsApp (9 dígitos)
                    </label>
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={9}
                      required
                      placeholder="964112233"
                      value={telefono}
                      onChange={(e) =>
                        setTelefono(
                          e.target.value.replace(/\D/g, '').slice(0, 9)
                        )
                      }
                      className="mt-1 min-h-[46px] w-full rounded-xl border border-slate-300 px-3 text-sm tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700">
                      Ciudad / Distrito
                    </label>
                    <input
                      type="text"
                      value={ciudad}
                      onChange={(e) => setCiudad(e.target.value)}
                      className="mt-1 min-h-[46px] w-full rounded-xl border border-slate-300 px-3 text-sm"
                    />
                  </div>
                </div>

                {/* Campos dinámicos leídos desde config/rubros.ts */}
                {preset.camposExtra.map((campo) => (
                  <div key={campo.name}>
                    <label className="block text-xs font-bold text-slate-700">
                      {campo.label}
                    </label>
                    {campo.type === 'select' && campo.options ? (
                      <div className="mt-1.5 grid grid-cols-3 gap-2">
                        {campo.options.map((opt) => {
                          const currentVal =
                            extraValues[campo.name] || campo.options?.[0] || '';
                          const active = currentVal === opt;
                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() =>
                                setExtraValues((prev) => ({
                                  ...prev,
                                  [campo.name]: opt,
                                }))
                              }
                              style={
                                active
                                  ? {
                                      backgroundColor: negocio.color,
                                      borderColor: negocio.color,
                                      color: '#FFFFFF',
                                    }
                                  : undefined
                              }
                              className="min-h-[44px] rounded-xl border border-slate-200 text-xs font-bold"
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <input
                        type="text"
                        required={campo.required}
                        placeholder={campo.placeholder}
                        value={extraValues[campo.name] || ''}
                        onChange={(e) =>
                          setExtraValues((prev) => ({
                            ...prev,
                            [campo.name]: e.target.value,
                          }))
                        }
                        className="mt-1 min-h-[46px] w-full rounded-xl border border-slate-300 px-3 text-sm"
                      />
                    )}
                  </div>
                ))}

                {errorMsg && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-bold text-rose-800">
                    {errorMsg}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  style={{ backgroundColor: negocio.color }}
                  className="tap-feedback flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl text-sm font-bold text-white shadow-sm disabled:opacity-60"
                >
                  <CheckCircle2 className="h-5 w-5" />
                  {submitting
                    ? 'Confirmando horario...'
                    : 'Confirmar cita ahora'}
                </button>
              </form>
            )}
          </div>
        )}

        <PWAInstallBanner accentColor={negocio.color} />

        <footer className="pt-4 text-center text-xs text-slate-400">
          App de reservas impulsada por{' '}
          <button
            type="button"
            onClick={onBackToSaaSLanding}
            className="font-bold text-slate-600 underline underline-offset-2"
          >
            MarIA Citas
          </button>{' '}
          · Desarrollado con pasión, Perú 🇵🇪.
        </footer>
      </main>

      <PWAInstallModal
        open={installOpen}
        onClose={() => setInstallOpen(false)}
        accentColor={negocio.color}
      />
    </div>
  );
};
