import React, { useState } from 'react';
import {
  Briefcase,
  Download,
  MapPin,
  Phone,
  ShieldCheck,
  User,
  UserCheck,
  X,
} from 'lucide-react';
import type { RubroConfig } from '../config/rubros';
import {
  isValidPeruPhone,
  normalizePeruPhone,
  OWNER_DEMO_PHONES,
} from '../hooks/useAuthSession';
import type { UserSession } from '../types/app';

interface AuthSheetProps {
  open: boolean;
  onClose: () => void;
  rubro?: RubroConfig | null;
  session: UserSession;
  initialMode?: 'register' | 'login' | 'owner';
  onRegisterClient: (params: {
    telefono: string;
    nombre: string;
    ciudad: string;
  }) => void;
  onLoginClient: (telefono: string) => { found: boolean };
  onLoginOwner: (params: { telefono: string; nombre?: string }) => void;
  onContinueAsGuest: () => void;
  onOpenInstallModal: () => void;
  onSuccessAction?: () => void;
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

export const AuthSheet: React.FC<AuthSheetProps> = ({
  open,
  onClose,
  rubro,
  session,
  initialMode = 'register',
  onRegisterClient,
  onLoginClient,
  onLoginOwner,
  onContinueAsGuest,
  onOpenInstallModal,
  onSuccessAction,
}) => {
  const [roleTab, setRoleTab] = useState<'client' | 'owner'>(
    initialMode === 'owner' ? 'owner' : 'client'
  );
  const [clientMode, setClientMode] = useState<'register' | 'login'>(
    initialMode === 'login' ? 'login' : 'register'
  );

  // Form fields (Cliente)
  const [telefono, setTelefono] = useState(session.telefono || '');
  const [nombre, setNombre] = useState(
    session.role === 'client' ? session.nombre : ''
  );
  const [ciudad, setCiudad] = useState(session.ciudad || 'Lima');

  // Form fields (Dueño)
  const [ownerPhone, setOwnerPhone] = useState('');
  const [ownerNombre, setOwnerNombre] = useState('Administrador');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!open) return null;

  const accent = rubro?.colores.primario || '#4F46E5';

  const handleClientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanPhone = normalizePeruPhone(telefono);
    if (!isValidPeruPhone(cleanPhone)) {
      setErrorMsg(
        'Ingresa un número celular válido de 9 dígitos que empiece con 9.'
      );
      return;
    }

    if (clientMode === 'login') {
      const res = onLoginClient(cleanPhone);
      if (!res.found) {
        setClientMode('register');
        setErrorMsg(
          'Aún no estás registrado con ese número. Completa tu nombre y ciudad para crear tu perfil al instante.'
        );
        return;
      }
      onClose();
      onSuccessAction?.();
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

    onRegisterClient({
      telefono: cleanPhone,
      nombre: nombre.trim(),
      ciudad: ciudad.trim(),
    });
    onClose();
    onSuccessAction?.();
  };

  const handleOwnerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const cleanPhone = normalizePeruPhone(ownerPhone);

    if (!isValidPeruPhone(cleanPhone)) {
      setErrorMsg(
        'Ingresa el teléfono de dueño válido (9 dígitos, empieza con 9).'
      );
      return;
    }

    onLoginOwner({
      telefono: cleanPhone,
      nombre: ownerNombre.trim() || 'Administrador',
    });
    onClose();
    onSuccessAction?.();
  };

  const handleDemoOwnerLogin = () => {
    const demoPhone = rubro?.whatsapp
      ? normalizePeruPhone(rubro.whatsapp)
      : OWNER_DEMO_PHONES[0];
    onLoginOwner({
      telefono: demoPhone,
      nombre: rubro ? `Dueño · ${rubro.nombre}` : 'Dueño Demo',
    });
    onClose();
    onSuccessAction?.();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-sheet-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 backdrop-blur-xs sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-5 pb-safe shadow-2xl sm:rounded-3xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-slate-300 sm:hidden" />

        <div className="flex items-start justify-between gap-3">
          <div>
            <h2
              id="auth-sheet-title"
              className="text-lg font-bold text-slate-900"
            >
              Acceso por Rol y Teléfono
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Tu número de celular es tu credencial. Sin contraseñas complejas.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar ventana"
            className="tap-feedback flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Selector de Rol: Cliente vs Dueño */}
        <div className="mt-4 grid grid-cols-2 gap-1.5 rounded-2xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => {
              setRoleTab('client');
              setErrorMsg(null);
            }}
            className={`tap-feedback flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl text-xs font-bold transition-colors ${
              roleTab === 'client'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="h-4 w-4" />
            <span>Soy Cliente</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setRoleTab('owner');
              setErrorMsg(null);
            }}
            className={`tap-feedback flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl text-xs font-bold transition-colors ${
              roleTab === 'owner'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Briefcase className="h-4 w-4" />
            <span>Soy Dueño / CRM</span>
          </button>
        </div>

        {roleTab === 'client' ? (
          <div className="mt-4 space-y-4">
            {/* Sub-switch: Registrarme (Teléfono, Nombre, Ciudad) vs Ya tengo perfil */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <button
                type="button"
                onClick={() => {
                  setClientMode('register');
                  setErrorMsg(null);
                }}
                className={`min-h-[38px] border-b-2 px-1 text-xs font-bold transition-colors ${
                  clientMode === 'register'
                    ? 'border-slate-900 text-slate-900'
                    : 'border-transparent text-slate-500'
                }`}
              >
                Registrarme (Nuevo perfil)
              </button>
              <button
                type="button"
                onClick={() => {
                  setClientMode('login');
                  setErrorMsg(null);
                }}
                className={`min-h-[38px] border-b-2 px-1 text-xs font-bold transition-colors ${
                  clientMode === 'login'
                    ? 'border-slate-900 text-slate-900'
                    : 'border-transparent text-slate-500'
                }`}
              >
                Ingresar con mi teléfono
              </button>
            </div>

            <form onSubmit={handleClientSubmit} className="space-y-3.5">
              <div>
                <label
                  htmlFor="auth-client-phone"
                  className="block text-xs font-bold text-slate-700"
                >
                  Número de celular (WhatsApp)
                </label>
                <div className="mt-1 flex items-stretch gap-2">
                  <span className="flex min-h-[48px] items-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700 tabular-nums">
                    +51
                  </span>
                  <div className="relative flex-1">
                    <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="auth-client-phone"
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

              {clientMode === 'register' && (
                <>
                  <div>
                    <label
                      htmlFor="auth-client-name"
                      className="block text-xs font-bold text-slate-700"
                    >
                      Nombre completo
                    </label>
                    <input
                      id="auth-client-name"
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
                      htmlFor="auth-client-city"
                      className="block text-xs font-bold text-slate-700"
                    >
                      Ciudad
                    </label>
                    <div className="relative mt-1">
                      <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        id="auth-client-city"
                        type="text"
                        required
                        list="ciudades-peru"
                        placeholder="Ej. Lima, Arequipa, Bogotá..."
                        value={ciudad}
                        onChange={(e) => setCiudad(e.target.value)}
                        className="min-h-[48px] w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3.5 text-base text-slate-900 focus:border-slate-900 focus:outline-none"
                      />
                      <datalist id="ciudades-peru">
                        {CIUDADES_SUGERIDAS.map((c) => (
                          <option key={c} value={c} />
                        ))}
                      </datalist>
                    </div>
                  </div>
                </>
              )}

              {errorMsg && (
                <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-800">
                  {errorMsg}
                </p>
              )}

              <button
                type="submit"
                style={{ backgroundColor: accent }}
                className="tap-feedback flex min-h-[50px] w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold text-white shadow-sm"
              >
                <UserCheck className="h-4 w-4" />
                {clientMode === 'register'
                  ? 'Crear mi perfil y continuar'
                  : 'Ingresar a Mi Perfil'}
              </button>
            </form>

            {/* Alternativas: Invitado o Descargar App */}
            <div className="space-y-2 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => {
                  onContinueAsGuest();
                  onClose();
                  onSuccessAction?.();
                }}
                className="tap-feedback flex min-h-[46px] w-full items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-4 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Continuar sin registrarme (Modo Invitado)
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenInstallModal();
                }}
                className="tap-feedback flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50/70 px-4 text-xs font-bold text-indigo-800 hover:bg-indigo-100"
              >
                <Download className="h-4 w-4" />
                Descargar App al móvil (PWA)
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-xs leading-relaxed text-slate-600">
              <p className="font-bold text-slate-900 flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-600" /> Credencial de Dueño / Administrador
              </p>
              <p className="mt-1">
                Ingresa con el teléfono administrativo de tu negocio para abrir el panel completo: <strong>Hoy, Agenda, Clientes (CRM), Cobros y Más</strong>.
              </p>
            </div>

            <form onSubmit={handleOwnerSubmit} className="space-y-3.5">
              <div>
                <label
                  htmlFor="auth-owner-phone"
                  className="block text-xs font-bold text-slate-700"
                >
                  Teléfono del negocio / dueño
                </label>
                <div className="mt-1 flex items-stretch gap-2">
                  <span className="flex min-h-[48px] items-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700 tabular-nums">
                    +51
                  </span>
                  <input
                    id="auth-owner-phone"
                    type="tel"
                    inputMode="numeric"
                    maxLength={9}
                    required
                    placeholder="964112233"
                    value={ownerPhone}
                    onChange={(e) =>
                      setOwnerPhone(normalizePeruPhone(e.target.value))
                    }
                    className="min-h-[48px] w-full rounded-xl border border-slate-300 bg-white px-3.5 text-base font-medium text-slate-900 tabular-nums focus:border-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="auth-owner-name"
                  className="block text-xs font-bold text-slate-700"
                >
                  Nombre del responsable
                </label>
                <input
                  id="auth-owner-name"
                  type="text"
                  placeholder="Ej. Dra. Sofía / Administrador"
                  value={ownerNombre}
                  onChange={(e) => setOwnerNombre(e.target.value)}
                  className="mt-1 min-h-[48px] w-full rounded-xl border border-slate-300 bg-white px-3.5 text-base text-slate-900 focus:border-slate-900 focus:outline-none"
                />
              </div>

              {errorMsg && (
                <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-800">
                  {errorMsg}
                </p>
              )}

              <button
                type="submit"
                style={{ backgroundColor: accent }}
                className="tap-feedback flex min-h-[50px] w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold text-white shadow-sm"
              >
                <Briefcase className="h-4 w-4" />
                Entrar al Panel Dueño / CRM
              </button>
            </form>

            <div className="border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={handleDemoOwnerLogin}
                className="tap-feedback flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-xs font-bold text-slate-800 hover:bg-slate-50"
              >
                Acceso rápido Demo Dueño (964112233)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
