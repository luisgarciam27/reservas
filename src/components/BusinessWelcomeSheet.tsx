import React, { useState } from 'react';
import {
  ArrowRight,
  Bell,
  CalendarPlus,
  CheckCircle2,
  Download,
  History,
  MapPin,
  Phone,
  Sparkles,
  UserCheck,
  X,
} from 'lucide-react';
import type { RubroConfig } from '../config/rubros';
import { isValidPeruPhone, normalizePeruPhone } from '../hooks/useAuthSession';

interface BusinessWelcomeSheetProps {
  open: boolean;
  rubro: RubroConfig;
  onClose: () => void;
  onRegisterAndContinue: (params: {
    telefono: string;
    nombre: string;
    ciudad: string;
  }) => void;
  onBookAsGuest: () => void;
  onOpenLogin: () => void;
  onOpenOwnerLogin: () => void;
  onOpenInstallModal: () => void;
}

const CIUDADES_SUGERIDAS = [
  'Lima',
  'Arequipa',
  'Trujillo',
  'Cusco',
  'Chiclayo',
  'Piura',
  'Bogotá',
  'Santiago',
];

export const BusinessWelcomeSheet: React.FC<BusinessWelcomeSheetProps> = ({
  open,
  rubro,
  onClose,
  onRegisterAndContinue,
  onBookAsGuest,
  onOpenLogin,
  onOpenOwnerLogin,
  onOpenInstallModal,
}) => {
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [telefono, setTelefono] = useState('');
  const [nombre, setNombre] = useState('');
  const [ciudad, setCiudad] = useState(rubro.ciudad || 'Lima');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const cleanPhone = normalizePeruPhone(telefono);
    if (!isValidPeruPhone(cleanPhone)) {
      setErrorMsg('Ingresa un celular válido de 9 dígitos que empiece con 9.');
      return;
    }
    if (nombre.trim().length < 2) {
      setErrorMsg('Ingresa tu nombre completo.');
      return;
    }
    if (ciudad.trim().length < 2) {
      setErrorMsg('Ingresa tu ciudad.');
      return;
    }

    onRegisterAndContinue({
      telefono: cleanPhone,
      nombre: nombre.trim(),
      ciudad: ciudad.trim(),
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="business-welcome-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/65 backdrop-blur-xs sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-5 pb-safe shadow-2xl sm:rounded-3xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-slate-300 sm:hidden" />

        {/* Cabecera del negocio */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl"
              style={{ backgroundColor: rubro.colores.superficieDestacada }}
            >
              {rubro.logoEmoji}
            </span>
            <div className="min-w-0">
              <p
                className="text-xs font-bold truncate"
                style={{ color: rubro.colores.primario }}
              >
                {rubro.rubroLabel}
              </p>
              <h2
                id="business-welcome-title"
                className="text-base font-bold text-slate-900 truncate sm:text-lg"
              >
                {rubro.nombre}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Explorar negocio"
            className="tap-feedback flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {!showRegisterForm ? (
          <div className="mt-5 space-y-4">
            {/* Tarjeta inductora al registro (Recomendado) */}
            <div
              className="rounded-2xl border p-4"
              style={{
                backgroundColor: rubro.colores.fondoSuave,
                borderColor: rubro.colores.bordeSuave,
              }}
            >
              <div className="flex items-center gap-1.5 text-xs font-bold" style={{ color: rubro.colores.primario }}>
                <Sparkles className="h-4 w-4 shrink-0" />
                <span>Recomendado · Tu cuenta en 10 segundos</span>
              </div>

              <h3 className="mt-1.5 text-lg font-extrabold text-slate-900 leading-snug">
                Regístrate solo con tu teléfono y reserva en 1 toque
              </h3>

              <ul className="mt-3 space-y-2 text-xs text-slate-700">
                <li className="flex items-start gap-2">
                  <History
                    className="mt-0.5 h-4 w-4 shrink-0"
                    style={{ color: rubro.colores.primario }}
                  />
                  <span>
                    <strong>Historial siempre guardado:</strong> revisa todas tus citas y próximos controles desde tu celular.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Bell
                    className="mt-0.5 h-4 w-4 shrink-0"
                    style={{ color: rubro.colores.primario }}
                  />
                  <span>
                    <strong>Recordatorios y promos VIP:</strong> recibe avisos por WhatsApp y descuentos exclusivos antes que nadie.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2
                    className="mt-0.5 h-4 w-4 shrink-0"
                    style={{ color: rubro.colores.primario }}
                  />
                  <span>
                    <strong>Sin contraseñas:</strong> tus próximas reservas se llenan solas con tu número.
                  </span>
                </li>
              </ul>

              <button
                type="button"
                onClick={() => setShowRegisterForm(true)}
                style={{ backgroundColor: rubro.colores.primario }}
                className="tap-feedback mt-4 flex min-h-[50px] w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold text-white shadow-sm"
              >
                <UserCheck className="h-4 w-4" />
                <span>Registrarme gratis y sacar cita</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            {/* Camino alternativo directo sin registro */}
            <button
              type="button"
              onClick={onBookAsGuest}
              className="tap-feedback flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-800 hover:bg-slate-50"
            >
              <CalendarPlus className="h-4 w-4 text-slate-600" />
              <span>Pedir cita sin registrarme</span>
            </button>

            {/* Enlaces secundarios discretos */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs">
              <button
                type="button"
                onClick={onOpenLogin}
                className="min-h-[38px] font-bold text-slate-700 hover:underline"
              >
                Ya tengo cuenta
              </button>
              <button
                type="button"
                onClick={onOpenInstallModal}
                className="inline-flex min-h-[38px] items-center gap-1 font-bold text-indigo-700 hover:underline"
              >
                <Download className="h-3.5 w-3.5" />
                Descargar App
              </button>
              <button
                type="button"
                onClick={onOpenOwnerLogin}
                className="min-h-[38px] font-semibold text-slate-500 hover:text-slate-800"
              >
                Soy Dueño
              </button>
            </div>
          </div>
        ) : (
          /* Formulario rápido de registro (Teléfono, Nombre, Ciudad) */
          <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-slate-900">
                Crea tu perfil de cliente
              </p>
              <button
                type="button"
                onClick={() => setShowRegisterForm(false)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                ← Volver
              </button>
            </div>

            <div>
              <label
                htmlFor="welcome-phone"
                className="block text-xs font-bold text-slate-700"
              >
                Celular con WhatsApp
              </label>
              <div className="mt-1 flex items-stretch gap-2">
                <span className="flex min-h-[48px] items-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700 tabular-nums">
                  +51
                </span>
                <div className="relative flex-1">
                  <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="welcome-phone"
                    type="tel"
                    inputMode="numeric"
                    maxLength={9}
                    required
                    placeholder="964000000"
                    value={telefono}
                    onChange={(e) =>
                      setTelefono(normalizePeruPhone(e.target.value))
                    }
                    className="min-h-[48px] w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 text-base font-medium text-slate-900 tabular-nums focus:border-slate-900 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <label
                htmlFor="welcome-name"
                className="block text-xs font-bold text-slate-700"
              >
                Nombre completo
              </label>
              <input
                id="welcome-name"
                type="text"
                required
                placeholder="Ej. Andrea Lozano"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="mt-1 min-h-[48px] w-full rounded-xl border border-slate-300 bg-white px-3.5 text-base text-slate-900 focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="welcome-city"
                className="block text-xs font-bold text-slate-700"
              >
                Ciudad
              </label>
              <div className="relative mt-1">
                <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="welcome-city"
                  type="text"
                  required
                  list="welcome-ciudades-peru"
                  placeholder="Ej. Lima, Arequipa, Bogotá..."
                  value={ciudad}
                  onChange={(e) => setCiudad(e.target.value)}
                  className="min-h-[48px] w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3.5 text-base text-slate-900 focus:border-slate-900 focus:outline-none"
                />
                <datalist id="welcome-ciudades-peru">
                  {CIUDADES_SUGERIDAS.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>
            </div>

            {errorMsg && (
              <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-800">
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              style={{ backgroundColor: rubro.colores.primario }}
              className="tap-feedback flex min-h-[50px] w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold text-white shadow-sm"
            >
              <span>Crear perfil y elegir mi horario</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={onBookAsGuest}
              className="tap-feedback flex min-h-[44px] w-full items-center justify-center text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              Mejor pedir cita sin registrarme
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
