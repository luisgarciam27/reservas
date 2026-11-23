import React, { useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Lock,
  Mail,
  Phone,
  User,
} from 'lucide-react';
import { MariaLogoMark } from '../components/RubroIcons';
import { signInOwner, signUpOwner } from '../lib/saasService';
import { isSupabaseConfigured } from '../lib/supabase';
import type { SaaSUser } from '../types/saas';

interface AuthPageProps {
  initialMode?: 'register' | 'login';
  onBack: () => void;
  onAuthenticated: (user: SaaSUser) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  initialMode = 'register',
  onBack,
  onAuthenticated,
}) => {
  const [mode, setMode] = useState<'register' | 'login'>(initialMode);
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailConfirmSent, setEmailConfirmSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === 'register') {
        const res = await signUpOwner({
          email,
          password,
          telefono,
          nombre,
        });
        if (res.needsEmailConfirmation) {
          setEmailConfirmSent(true);
        } else {
          onAuthenticated(res.user);
        }
      } else {
        const user = await signInOwner({ email, password });
        onAuthenticated(user);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo completar la autenticación.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-slate-50 px-4 py-5 pb-10 sm:justify-center sm:px-6">
      <div className="mx-auto w-full max-w-md">
        <button
          type="button"
          onClick={onBack}
          className="tap-feedback mb-4 inline-flex min-h-[44px] items-center gap-1.5 rounded-xl px-2.5 text-xs font-bold text-slate-600 hover:bg-white hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a MarIA Citas
        </button>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <div className="flex items-center gap-3">
            <MariaLogoMark className="h-10 w-10 shrink-0" />
            <div>
              <h1 className="text-lg sm:text-xl font-extrabold text-slate-900">
                {mode === 'register'
                  ? 'Crea tu cuenta en MarIA Citas'
                  : 'Ingresa a tu panel'}
              </h1>
              <p className="text-xs text-slate-500">
                {mode === 'register'
                  ? 'Luego configurarás tu negocio en 4 pasos rápidos.'
                  : 'Administra tus citas, servicios y enlace público.'}
              </p>
            </div>
          </div>

          {/* Tabs Crear cuenta / Iniciar sesión */}
          <div className="mt-5 grid grid-cols-2 rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError(null);
              }}
              className={`min-h-[44px] rounded-lg text-xs font-bold transition-colors ${
                mode === 'register'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600'
              }`}
            >
              Crear mi cuenta
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className={`min-h-[44px] rounded-lg text-xs font-bold transition-colors ${
                mode === 'login'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600'
              }`}
            >
              Iniciar sesión
            </button>
          </div>

          {!isSupabaseConfigured && (
            <div className="mt-4 rounded-2xl border border-indigo-200 bg-indigo-50/70 px-3.5 py-2.5 text-xs leading-relaxed text-indigo-900">
              <strong>Modo vista previa local:</strong> Puedes crear tu cuenta,
              completar el onboarding y probar tu link <code>/n/tu-negocio</code>{' '}
              al instante sin esperar llaves de Supabase.
            </div>
          )}

          {emailConfirmSent ? (
            <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center">
              <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600" />
              <h2 className="mt-2 text-base font-bold text-slate-900">
                Revisa tu correo electrónico
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                Te enviamos un enlace de confirmación a <strong>{email}</strong>.
                Confírmalo e inicia sesión para iniciar tu onboarding.
              </p>
              <button
                type="button"
                onClick={() => {
                  setEmailConfirmSent(false);
                  setMode('login');
                }}
                className="mt-4 min-h-[48px] w-full rounded-xl bg-emerald-700 text-sm font-bold text-white"
              >
                Ir a Iniciar sesión
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
              {mode === 'register' && (
                <>
                  <div>
                    <label
                      htmlFor="auth-nombre"
                      className="block text-xs font-bold text-slate-700"
                    >
                      Tu nombre
                    </label>
                    <div className="relative mt-1">
                      <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        id="auth-nombre"
                        type="text"
                        required
                        placeholder="Ej. Andrea Lozano"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        className="min-h-[48px] w-full rounded-xl border border-slate-300 pl-10 pr-3 text-base text-slate-900 focus:border-indigo-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="auth-tel"
                      className="block text-xs font-bold text-slate-700"
                    >
                      Celular / WhatsApp (opcional)
                    </label>
                    <div className="relative mt-1">
                      <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        id="auth-tel"
                        type="tel"
                        inputMode="numeric"
                        maxLength={9}
                        placeholder="964112233"
                        value={telefono}
                        onChange={(e) =>
                          setTelefono(
                            e.target.value.replace(/\D/g, '').slice(0, 9)
                          )
                        }
                        className="min-h-[48px] w-full rounded-xl border border-slate-300 pl-10 pr-3 text-base text-slate-900 tabular-nums focus:border-indigo-600 focus:outline-none"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label
                  htmlFor="auth-email"
                  className="block text-xs font-bold text-slate-700"
                >
                  Correo electrónico
                </label>
                <div className="relative mt-1">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="auth-email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="dueño@tunegocio.pe"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="min-h-[48px] w-full rounded-xl border border-slate-300 pl-10 pr-3 text-base text-slate-900 focus:border-indigo-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="auth-password"
                  className="block text-xs font-bold text-slate-700"
                >
                  Contraseña
                </label>
                <div className="relative mt-1">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="auth-password"
                    type="password"
                    required
                    minLength={6}
                    autoComplete={
                      mode === 'register' ? 'new-password' : 'current-password'
                    }
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="min-h-[48px] w-full rounded-xl border border-slate-300 pl-10 pr-3 text-base text-slate-900 focus:border-indigo-600 focus:outline-none"
                  />
                </div>
              </div>

              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-semibold text-rose-800"
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="tap-feedback flex min-h-[52px] w-full items-center justify-center rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-60"
              >
                {loading
                  ? 'Procesando...'
                  : mode === 'register'
                    ? 'Continuar al Onboarding →'
                    : 'Ingresar a mi panel'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
