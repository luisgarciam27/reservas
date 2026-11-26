import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  Copy,
  Lock,
  Mail,
  MapPin,
  Minus,
  Phone,
  Plus,
  ShieldCheck,
  Smartphone,
  Sparkles,
  User,
  UserCog,
  Users,
  Wallet,
} from 'lucide-react';
import { MariaLogoMark, RubroSvgIcon, WhatsAppSvgIcon } from '../components/RubroIcons';
import { PLAN_ORDER, PLANS } from '../config/plans';
import { RUBRO_SAAS_ORDER, RUBROS_SAAS } from '../config/rubros';
import { signInOwner, slugifyBusinessName } from '../lib/saasService';
import type { PlanId, RubroSaasKey, SaaSUser } from '../types/saas';

interface AuthPageProps {
  initialMode?: 'register' | 'login';
  initialPlan?: PlanId;
  onBack: () => void;
  onAuthenticated: (user: SaaSUser) => void;
  onViewDemo?: () => void;
}

const YAPE_NUMBER = '964112233';
const YAPE_NUMBER_DISPLAY = '964 112 233';
const YAPE_TITULAR = 'MarIA Citas · GaorSystem Perú';
const ADMIN_WHATSAPP = '51964112233';
const LS_ACCOUNT_REQUESTS_KEY = 'maria_saas_account_requests_v1';

const RUBRO_AUTOMATION_HIGHLIGHTS: Record<RubroSaasKey, string[]> = {
  consultorio: ['Agenda sin cruces', 'Fichas de pacientes', 'Recordatorios WhatsApp'],
  salon: ['Catálogo visual', 'Promos flash', 'Reservas por estilista'],
  veterinaria: ['Fichas de mascotas', 'Control de vacunas', 'Turnos de baño'],
  otro: ['Link propio 24/7', 'Bloqueo de horas', 'Avisos automáticos'],
};

interface SavedAccountRequest {
  id: string;
  rubro: RubroSaasKey;
  negocioNombre: string;
  slug: string;
  solicitante: string;
  whatsapp: string;
  ciudad: string;
  adminUsers: number;
  cajaUsers: number;
  totalUsers: number;
  planId: PlanId;
  montoMensual: number;
  yapeOperacion?: string;
  createdAt: string;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  initialMode = 'register',
  initialPlan = 'pro',
  onBack,
  onAuthenticated,
  onViewDemo,
}) => {
  const [mode, setMode] = useState<'register' | 'login'>(initialMode);

  // Estado del configurador "Solicitar cuenta para tu negocio" (3 pasos sin correo ni contraseña)
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [rubro, setRubro] = useState<RubroSaasKey>('salon');
  const [negocioNombre, setNegocioNombre] = useState('');
  const [solicitante, setSolicitante] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [ciudad, setCiudad] = useState('Lima');

  // Usuarios del sistema (Admin + Caja/Recepción)
  const [adminUsers, setAdminUsers] = useState<number>(1);
  const [cajaUsers, setCajaUsers] = useState<number>(1);
  const [planId, setPlanId] = useState<PlanId>(initialPlan);

  // Pago con Yape + envío
  const [yapeOperacion, setYapeOperacion] = useState('');
  const [yapeCopied, setYapeCopied] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [submittedRequest, setSubmittedRequest] =
    useState<SavedAccountRequest | null>(null);

  // Estado para Iniciar Sesión (cuentas ya aprobadas)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const totalUsers = adminUsers + cajaUsers;
  const rubroMeta = RUBROS_SAAS[rubro];
  const selectedPlan = PLANS[planId];
  const generatedSlug = useMemo(
    () => slugifyBusinessName(negocioNombre || 'tu-negocio'),
    [negocioNombre]
  );

  const isWhatsappValid = /^9\d{8}$/.test(whatsapp);

  const handleSelectTeamPreset = (admins: number, cajas: number) => {
    setAdminUsers(admins);
    setCajaUsers(cajas);
    const sum = admins + cajas;
    if (sum <= 1) {
      setPlanId('basico');
    } else if (sum <= 3) {
      setPlanId('pro');
    } else {
      setPlanId('full');
    }
  };

  const handleCopyYape = async () => {
    try {
      await navigator.clipboard.writeText(YAPE_NUMBER);
      setYapeCopied(true);
      setTimeout(() => setYapeCopied(false), 2600);
    } catch {
      setYapeCopied(true);
      setTimeout(() => setYapeCopied(false), 2600);
    }
  };

  const handleValidateStep1 = () => {
    setRequestError(null);
    if (negocioNombre.trim().length < 2) {
      setRequestError('Ingresa el nombre comercial de tu negocio.');
      return;
    }
    if (solicitante.trim().length < 2) {
      setRequestError('Ingresa tu nombre y apellido.');
      return;
    }
    if (!isWhatsappValid) {
      setRequestError(
        'Ingresa tu WhatsApp de 9 dígitos empezando con 9 (ahí te enviaremos la aprobación y guía).'
      );
      return;
    }
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmitAccountRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setRequestError(null);

    if (negocioNombre.trim().length < 2 || solicitante.trim().length < 2 || !isWhatsappValid) {
      setRequestError('Completa correctamente los datos del negocio y tu WhatsApp.');
      return;
    }

    const record: SavedAccountRequest = {
      id: `req-${Date.now()}`,
      rubro,
      negocioNombre: negocioNombre.trim(),
      slug: generatedSlug,
      solicitante: solicitante.trim(),
      whatsapp,
      ciudad: ciudad.trim() || 'Lima',
      adminUsers,
      cajaUsers,
      totalUsers,
      planId,
      montoMensual: selectedPlan.precioMensual,
      yapeOperacion: yapeOperacion.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    try {
      const raw = localStorage.getItem(LS_ACCOUNT_REQUESTS_KEY);
      const prev = raw ? (JSON.parse(raw) as SavedAccountRequest[]) : [];
      localStorage.setItem(
        LS_ACCOUNT_REQUESTS_KEY,
        JSON.stringify([record, ...prev].slice(0, 20))
      );
    } catch {
      // Ignorar si localStorage no está disponible
    }

    setSubmittedRequest(record);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);
    try {
      const user = await signInOwner({ email, password });
      onAuthenticated(user);
    } catch (err) {
      setLoginError(
        err instanceof Error
          ? err.message
          : 'No se pudo iniciar sesión. Verifica tus datos.'
      );
    } finally {
      setLoginLoading(false);
    }
  };

  // Mensajes preparados para WhatsApp tras enviar solicitud
  const approvalWhatsappUrl = useMemo(() => {
    if (!submittedRequest) return '#';
    const rMeta = RUBROS_SAAS[submittedRequest.rubro];
    const pMeta = PLANS[submittedRequest.planId];
    const lines = [
      `Hola equipo *MarIA Citas*, solicito la activación de mi cuenta:`,
      `• *Negocio:* ${submittedRequest.negocioNombre}`,
      `• *Rubro:* ${rMeta.rubroLabel}`,
      `• *Link sugerido:* /n/${submittedRequest.slug}`,
      `• *Responsable:* ${submittedRequest.solicitante}`,
      `• *WhatsApp para aprobación:* +51 ${submittedRequest.whatsapp}`,
      `• *Ciudad:* ${submittedRequest.ciudad}`,
      `• *Plan elegido:* ${pMeta.nombre} (S/ ${submittedRequest.montoMensual}/mes)`,
      `• *Usuarios solicitados:* ${submittedRequest.totalUsers} usuario(s) (${submittedRequest.adminUsers} Admin y ${submittedRequest.cajaUsers} Caja/Recepción)`,
      submittedRequest.yapeOperacion
        ? `• *Pago Yape (N° op.):* ${submittedRequest.yapeOperacion}`
        : `• *Pago Yape:* S/ ${submittedRequest.montoMensual}.00 al ${YAPE_NUMBER_DISPLAY} (adjunto captura)`,
      ``,
      `Quedo atento a la aprobación y accesos. ¡Gracias!`,
    ];
    return `https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(lines.join('\n'))}`;
  }, [submittedRequest]);

  const clientGuideWhatsappUrl = useMemo(() => {
    if (!submittedRequest) return '#';
    const rMeta = RUBROS_SAAS[submittedRequest.rubro];
    const pMeta = PLANS[submittedRequest.planId];
    const lines = [
      `Hola *${submittedRequest.solicitante}* 👋 ¡Bienvenido a *MarIA Citas*!`,
      `Tu solicitud para *${submittedRequest.negocioNombre}* (${rMeta.rubroLabel} · ${pMeta.nombre}) está en revisión para aprobación.`,
      ``,
      `*1. MODO DE INICIO (una vez aprobada):*`,
      `Ingresa a MarIA Citas → toca "Iniciar sesión" con los accesos que te enviaremos a este WhatsApp (+51 ${submittedRequest.whatsapp}). Tu enlace público será /n/${submittedRequest.slug}.`,
      ``,
      `*2. CÓMO CREAR TUS ${submittedRequest.totalUsers} USUARIOS (${submittedRequest.adminUsers} Admin y ${submittedRequest.cajaUsers} Caja):*`,
      `Dentro de tu panel ve a *Ajustes → Equipo y Accesos → Agregar usuario*:`,
      `• *Rol Admin (${submittedRequest.adminUsers}):* Control total de agenda, reportes, precios y configuración.`,
      `• *Rol Caja / Recepción (${submittedRequest.cajaUsers}):* Cobros del día, confirmación de citas y atención en mostrador.`,
    ];
    return `https://wa.me/51${submittedRequest.whatsapp}?text=${encodeURIComponent(lines.join('\n'))}`;
  }, [submittedRequest]);

  return (
    <div className="min-h-[100dvh] flex flex-col bg-slate-50 px-4 py-5 pb-14 sm:px-6">
      <div
        className={`mx-auto w-full ${
          mode === 'register' ? 'max-w-3xl' : 'max-w-md'
        }`}
      >
        <div className="mb-4 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onBack}
            className="tap-feedback inline-flex min-h-[44px] items-center gap-1.5 rounded-xl px-2.5 text-xs font-bold text-slate-600 hover:bg-white hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a MarIA Citas
          </button>

          {/* Selector compacto entre Solicitar App e Iniciar sesión */}
          <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-2xs">
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setLoginError(null);
              }}
              className={`min-h-[36px] rounded-lg px-3 text-xs font-bold transition-colors whitespace-nowrap ${
                mode === 'register'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Solicitar cuenta
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setRequestError(null);
              }}
              className={`min-h-[36px] rounded-lg px-3 text-xs font-bold transition-colors whitespace-nowrap ${
                mode === 'login'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Iniciar sesión
            </button>
          </div>
        </div>

        {/* ================================================================ */}
        {/* MODO: SOLICITAR CUENTA PARA TU NEGOCIO (SIN CORREO NI CONTRASEÑA) */}
        {/* ================================================================ */}
        {mode === 'register' ? (
          submittedRequest ? (
            /* PANTALLA DE CONFIRMACIÓN + GUÍA DE INICIO Y USUARIOS ADMIN / CAJA */
            <div className="space-y-5">
              <section className="rounded-3xl border border-emerald-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="flex flex-col items-center text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <CheckCircle2 className="h-9 w-9" aria-hidden="true" />
                  </div>
                  <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3.5 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
                    <Sparkles className="h-3.5 w-3.5" />
                    Solicitud lista para aprobación
                  </span>
                  <h1 className="mt-3 text-2xl font-extrabold text-slate-900 sm:text-3xl [text-wrap:balance]">
                    ¡Tu negocio está a un paso de funcionar en automático!
                  </h1>
                  <p className="mt-2 max-w-xl text-sm text-slate-600">
                    Envía tu solicitud por WhatsApp para validar tu Yape y activar{' '}
                    <strong className="text-slate-900">
                      {submittedRequest.negocioNombre}
                    </strong>
                    . Te responderemos al{' '}
                    <strong className="text-slate-900 tabular-nums">
                      +51 {submittedRequest.whatsapp}
                    </strong>{' '}
                    con tu aprobación y accesos.
                  </p>
                </div>

                {/* Resumen de la solicitud */}
                <div className="mt-6 grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs sm:grid-cols-2">
                  <div>
                    <p className="text-slate-500">Negocio y Rubro</p>
                    <p className="mt-0.5 text-sm font-bold text-slate-900">
                      {submittedRequest.negocioNombre} ·{' '}
                      {RUBROS_SAAS[submittedRequest.rubro].rubroLabel}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">Plan y pago Yape</p>
                    <p className="mt-0.5 text-sm font-bold text-slate-900 tabular-nums">
                      {PLANS[submittedRequest.planId].nombre} · S/{' '}
                      {submittedRequest.montoMensual}/mes
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">Usuarios solicitados</p>
                    <p className="mt-0.5 text-sm font-bold text-indigo-700">
                      {submittedRequest.totalUsers} usuario(s):{' '}
                      {submittedRequest.adminUsers} Admin y{' '}
                      {submittedRequest.cajaUsers} Caja/Recepción
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">Link público reservado</p>
                    <p className="mt-0.5 text-sm font-mono font-bold text-slate-900">
                      /n/{submittedRequest.slug}
                    </p>
                  </div>
                </div>

                {/* Acciones directas de WhatsApp */}
                <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <a
                    href={approvalWhatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tap-feedback flex min-h-[54px] items-center justify-center gap-2.5 rounded-2xl bg-[#25D366] px-5 text-sm font-extrabold text-white shadow-md shadow-emerald-950/15 hover:brightness-95"
                  >
                    <WhatsAppSvgIcon className="h-5 w-5 shrink-0" />
                    <span>Enviar solicitud para aprobación</span>
                  </a>

                  <a
                    href={clientGuideWhatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tap-feedback flex min-h-[54px] items-center justify-center gap-2 rounded-2xl border border-indigo-200 bg-indigo-50 px-5 text-sm font-bold text-indigo-800 hover:bg-indigo-100"
                  >
                    <Smartphone className="h-4 w-4 shrink-0" />
                    <span>Enviar guía a mi WhatsApp</span>
                  </a>
                </div>
              </section>

              {/* Guía clara: Modo de inicio + Cómo crear usuarios de Caja y Admin */}
              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs sm:p-7">
                <h2 className="text-lg font-extrabold text-slate-900">
                  Modo de inicio y cómo crear tus usuarios ({submittedRequest.adminUsers} Admin · {submittedRequest.cajaUsers} Caja)
                </h2>
                <p className="mt-1 text-xs text-slate-600">
                  Guarda esta guía rápida; también se incluye al enviar la información a tu WhatsApp.
                </p>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-xs font-extrabold text-white">
                      1
                    </span>
                    <h3 className="mt-2 text-sm font-bold text-slate-900">
                      Aprobación por WhatsApp
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600">
                      Validamos tu Yape al{' '}
                      <strong>{YAPE_NUMBER_DISPLAY}</strong> y te enviamos la confirmación al{' '}
                      <strong>+51 {submittedRequest.whatsapp}</strong>.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-xs font-extrabold text-white">
                      2
                    </span>
                    <h3 className="mt-2 text-sm font-bold text-slate-900">
                      Modo de inicio
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600">
                      Ingresa en <strong>Iniciar sesión</strong> con tus accesos aprobados y comparte tu link{' '}
                      <strong>/n/{submittedRequest.slug}</strong> con tus clientes.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-xs font-extrabold text-white">
                      3
                    </span>
                    <h3 className="mt-2 text-sm font-bold text-slate-900">
                      Crea tus usuarios Caja o Admin
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600">
                      En <strong>Ajustes → Equipo y Accesos</strong> agrega tus{' '}
                      <strong>{submittedRequest.adminUsers} Admin</strong> (control total) y{' '}
                      <strong>{submittedRequest.cajaUsers} Caja</strong> (cobros y agenda).
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setSubmittedRequest(null);
                      setStep(1);
                    }}
                    className="text-xs font-bold text-slate-600 hover:text-slate-900"
                  >
                    Editar datos de la solicitud
                  </button>
                  {onViewDemo && (
                    <button
                      type="button"
                      onClick={onViewDemo}
                      className="tap-feedback inline-flex min-h-[42px] items-center gap-1.5 rounded-xl bg-slate-900 px-4 text-xs font-bold text-white"
                    >
                      Probar rubros demo mientras tanto
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </section>
            </div>
          ) : (
            /* CONFIGURADOR DE SOLICITUD DE CUENTA (3 PASOS IMPACTANTES) */
            <div className="space-y-5">
              {/* Cabecera visual de impacto */}
              <div
                className="relative overflow-hidden rounded-3xl p-6 text-white shadow-md sm:p-7"
                style={{
                  background: `linear-gradient(135deg, ${rubroMeta.colorDefault}, #1E1B4B)`,
                }}
              >
                <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold tracking-wide backdrop-blur-xs">
                      <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                      Activación asistida · Sin correo ni contraseñas
                    </span>
                    <h1 className="mt-2.5 text-2xl font-extrabold tracking-tight sm:text-3xl [text-wrap:balance]">
                      Tu negocio funcionando en automático, a un paso
                    </h1>
                    <p className="mt-1.5 text-xs sm:text-sm text-white/85">
                      Elige lo mejor para tu rubro, define tus usuarios Admin o Caja y solicita tu cuenta por WhatsApp.
                    </p>
                  </div>

                  {/* Mini vista previa en vivo de su futura App */}
                  <div className="shrink-0 rounded-2xl border border-white/20 bg-white/10 p-3.5 backdrop-blur-xs sm:w-60">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-lg shadow-xs">
                        {rubroMeta.logoDefault}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-extrabold text-white">
                          {negocioNombre.trim() || 'Tu Negocio'}
                        </p>
                        <p className="truncate text-[10px] font-mono text-white/80">
                          /n/{generatedSlug}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2.5 flex flex-wrap gap-1">
                      {RUBRO_AUTOMATION_HIGHLIGHTS[rubro].map((tag) => (
                        <span
                          key={tag}
                          className="rounded-md bg-white/15 px-2 py-0.5 text-[10px] font-semibold text-white"
                        >
                          ✓ {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Barra de pasos */}
              <div className="grid grid-cols-3 gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xs">
                {[
                  { n: 1, label: '1. Rubro y Negocio' },
                  { n: 2, label: '2. Usuarios y Plan' },
                  { n: 3, label: '3. Yape y Enviar' },
                ].map((item) => {
                  const active = step === item.n;
                  const done = step > item.n;
                  return (
                    <button
                      key={item.n}
                      type="button"
                      onClick={() => {
                        if (item.n < step) setStep(item.n as 1 | 2 | 3);
                      }}
                      className={`flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl px-2 text-xs font-bold transition-colors ${
                        active
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : done
                            ? 'bg-emerald-50 text-emerald-800'
                            : 'text-slate-400'
                      }`}
                    >
                      {done && <Check className="h-3.5 w-3.5 shrink-0" />}
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* PASO 1: Rubro + Datos del negocio (Sin correo ni contraseña) */}
              {step === 1 && (
                <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs sm:p-7">
                  <h2 className="text-lg font-extrabold text-slate-900">
                    ¿Qué tipo de negocio tienes?
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Preparamos automáticamente tus horarios, servicios y fichas ideales.
                  </p>

                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {RUBRO_SAAS_ORDER.map((rKey) => {
                      const preset = RUBROS_SAAS[rKey];
                      const selected = rubro === rKey;
                      return (
                        <button
                          key={rKey}
                          type="button"
                          onClick={() => setRubro(rKey)}
                          style={
                            selected
                              ? {
                                  borderColor: preset.colorDefault,
                                  backgroundColor: `${preset.colorDefault}10`,
                                }
                              : undefined
                          }
                          className={`tap-feedback flex items-start gap-3.5 rounded-2xl border-2 p-4 text-left transition-all ${
                            selected
                              ? 'shadow-xs'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <div
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-xs"
                            style={{ backgroundColor: preset.colorDefault }}
                          >
                            <RubroSvgIcon rubro={rKey} className="h-5 w-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-extrabold text-slate-900">
                                {preset.rubroLabel}
                              </p>
                              {selected && (
                                <Check
                                  className="h-4 w-4 shrink-0"
                                  style={{ color: preset.colorDefault }}
                                />
                              )}
                            </div>
                            <p className="mt-0.5 text-xs text-slate-600">
                              {preset.descripcionCorta}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="req-negocio"
                        className="block text-xs font-bold text-slate-700"
                      >
                        Nombre de tu negocio
                      </label>
                      <div className="relative mt-1">
                        <Building2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          id="req-negocio"
                          type="text"
                          required
                          placeholder="Ej. Clínica Sonrisa Viva"
                          value={negocioNombre}
                          onChange={(e) => setNegocioNombre(e.target.value)}
                          className="min-h-[48px] w-full rounded-xl border border-slate-300 pl-10 pr-3 text-base text-slate-900 focus:border-indigo-600 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="req-nombre"
                        className="block text-xs font-bold text-slate-700"
                      >
                        Tu nombre completo
                      </label>
                      <div className="relative mt-1">
                        <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          id="req-nombre"
                          type="text"
                          required
                          placeholder="Ej. Andrea Lozano"
                          value={solicitante}
                          onChange={(e) => setSolicitante(e.target.value)}
                          className="min-h-[48px] w-full rounded-xl border border-slate-300 pl-10 pr-3 text-base text-slate-900 focus:border-indigo-600 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="req-whatsapp"
                        className="block text-xs font-bold text-slate-700"
                      >
                        Tu WhatsApp (para enviarte tu aprobación)
                      </label>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="flex min-h-[48px] items-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-700">
                          +51
                        </span>
                        <div className="relative flex-1">
                          <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <input
                            id="req-whatsapp"
                            type="tel"
                            inputMode="numeric"
                            maxLength={9}
                            required
                            placeholder="964112233"
                            value={whatsapp}
                            onChange={(e) =>
                              setWhatsapp(e.target.value.replace(/\D/g, '').slice(0, 9))
                            }
                            className="min-h-[48px] w-full rounded-xl border border-slate-300 pl-9 pr-3 text-base text-slate-900 tabular-nums focus:border-indigo-600 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="req-ciudad"
                        className="block text-xs font-bold text-slate-700"
                      >
                        Ciudad
                      </label>
                      <div className="relative mt-1">
                        <MapPin className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          id="req-ciudad"
                          type="text"
                          placeholder="Lima, Arequipa, Trujillo..."
                          value={ciudad}
                          onChange={(e) => setCiudad(e.target.value)}
                          className="min-h-[48px] w-full rounded-xl border border-slate-300 pl-10 pr-3 text-base text-slate-900 focus:border-indigo-600 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {requestError && (
                    <div
                      role="alert"
                      className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-semibold text-rose-800"
                    >
                      {requestError}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleValidateStep1}
                    className="tap-feedback mt-6 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 text-sm font-bold text-white shadow-sm hover:bg-indigo-700"
                  >
                    <span>Elegir usuarios y sistema ideal</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </section>
              )}

              {/* PASO 2: Cuántos usuarios trabajarán (Admin / Caja) + Plan ideal */}
              {step === 2 && (
                <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs sm:p-7">
                  <h2 className="text-lg font-extrabold text-slate-900">
                    ¿Cuántos usuarios trabajarán con el sistema?
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Define quiénes operarán tu negocio: accesos de <strong>Admin</strong> y de <strong>Caja / Recepción</strong>.
                  </p>

                  {/* Presets rápidos de tamaño de equipo */}
                  <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                    {[
                      {
                        label: 'Solo yo (1 usuario)',
                        desc: '1 Admin · Ideal independiente',
                        admins: 1,
                        cajas: 0,
                      },
                      {
                        label: 'Equipo pequeño (2-3)',
                        desc: '1 Admin + 2 Caja/Recepción',
                        admins: 1,
                        cajas: 2,
                      },
                      {
                        label: 'Negocio completo (4+)',
                        desc: '2 Admin + 3 Caja/Recepción',
                        admins: 2,
                        cajas: 3,
                      },
                    ].map((preset) => {
                      const active =
                        adminUsers === preset.admins && cajaUsers === preset.cajas;
                      return (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() =>
                            handleSelectTeamPreset(preset.admins, preset.cajas)
                          }
                          className={`tap-feedback rounded-2xl border-2 p-3.5 text-left transition-all ${
                            active
                              ? 'border-indigo-600 bg-indigo-50/70'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <p className="text-xs font-extrabold text-slate-900">
                            {preset.label}
                          </p>
                          <p className="mt-0.5 text-[11px] text-slate-600">
                            {preset.desc}
                          </p>
                        </button>
                      );
                    })}
                  </div>

                  {/* Contadores exactos de Admin y Caja */}
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-1.5">
                          <UserCog className="h-4 w-4 text-indigo-600 shrink-0" />
                          <p className="text-sm font-bold text-slate-900">
                            Usuarios Admin
                          </p>
                        </div>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                          Control total, precios y reportes
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setAdminUsers((v) => Math.max(1, v - 1))}
                          aria-label="Restar usuario Admin"
                          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-6 text-center text-base font-extrabold text-slate-900 tabular-nums">
                          {adminUsers}
                        </span>
                        <button
                          type="button"
                          onClick={() => setAdminUsers((v) => Math.min(10, v + 1))}
                          aria-label="Sumar usuario Admin"
                          className="flex h-9 w-9 items-center justify-center rounded-xl border border-indigo-200 bg-indigo-600 text-white hover:bg-indigo-700"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-1.5">
                          <Users className="h-4 w-4 text-emerald-600 shrink-0" />
                          <p className="text-sm font-bold text-slate-900">
                            Usuarios Caja
                          </p>
                        </div>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                          Agenda del día, cobros y recepción
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setCajaUsers((v) => Math.max(0, v - 1))}
                          aria-label="Restar usuario Caja"
                          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-6 text-center text-base font-extrabold text-slate-900 tabular-nums">
                          {cajaUsers}
                        </span>
                        <button
                          type="button"
                          onClick={() => setCajaUsers((v) => Math.min(20, v + 1))}
                          aria-label="Sumar usuario Caja"
                          className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-600 text-white hover:bg-emerald-700"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Selección del Plan ideal */}
                  <div className="mt-6 border-t border-slate-100 pt-5">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-extrabold text-slate-900">
                        Elige el plan para tus {totalUsers} usuario(s)
                      </h3>
                      <span className="rounded-lg bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-700">
                        Activación inmediata tras Yape
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                      {PLAN_ORDER.map((pId) => {
                        const p = PLANS[pId];
                        const active = planId === pId;
                        return (
                          <button
                            key={pId}
                            type="button"
                            onClick={() => setPlanId(pId)}
                            className={`tap-feedback flex flex-col justify-between rounded-2xl border-2 p-4 text-left transition-all ${
                              active
                                ? 'border-indigo-600 bg-indigo-50/70 shadow-xs'
                                : 'border-slate-200 bg-white hover:border-slate-300'
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-sm font-extrabold text-slate-900">
                                  {p.nombre}
                                </span>
                                {p.destacado && (
                                  <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                                    Ideal
                                  </span>
                                )}
                              </div>
                              <p className="mt-1.5 text-xl font-black text-indigo-700 tabular-nums">
                                S/ {p.precioMensual}
                                <span className="text-xs font-medium text-slate-500">
                                  /mes
                                </span>
                              </p>
                              <ul className="mt-2.5 space-y-1 text-[11px] text-slate-600">
                                {p.beneficios.slice(0, 3).map((b) => (
                                  <li key={b} className="flex items-start gap-1">
                                    <Check className="mt-0.5 h-3 w-3 shrink-0 text-emerald-600" />
                                    <span>{b}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-6 flex gap-2.5">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="tap-feedback inline-flex min-h-[50px] items-center justify-center gap-1.5 rounded-2xl border border-slate-200 px-4 text-xs font-bold text-slate-700 hover:bg-slate-50"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Atrás
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setStep(3);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="tap-feedback flex min-h-[50px] flex-1 items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 text-sm font-bold text-white shadow-sm hover:bg-indigo-700"
                    >
                      <span>Ir al pago con Yape y enviar solicitud</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </section>
              )}

              {/* PASO 3: Pago con Yape (número para copiar) + Enviar solicitud */}
              {step === 3 && (
                <form
                  onSubmit={handleSubmitAccountRequest}
                  className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-xs sm:p-7"
                >
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-900">
                      Último paso: Paga con Yape y envía tu solicitud
                    </h2>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Copia el número de Yape, realiza tu pago y envía tu solicitud para activar tus{' '}
                      <strong>
                        {totalUsers} usuarios ({adminUsers} Admin · {cajaUsers} Caja)
                      </strong>
                      .
                    </p>
                  </div>

                  {/* Tarjeta oficial Yape */}
                  <div
                    className="rounded-3xl p-5 text-white shadow-md"
                    style={{
                      background:
                        'linear-gradient(135deg, #742284 0%, #4C1D95 100%)',
                    }}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="inline-flex items-center gap-2">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
                          <Wallet className="h-5 w-5 text-[#00D2B8]" />
                        </span>
                        <div>
                          <p className="text-xs font-semibold text-white/80">
                            Pago rápido por Yape
                          </p>
                          <p className="text-sm font-extrabold">
                            {YAPE_TITULAR}
                          </p>
                        </div>
                      </div>
                      <div className="rounded-xl bg-white/15 px-3 py-1.5 text-right">
                        <p className="text-[10px] uppercase tracking-wider text-white/80">
                          {selectedPlan.nombre}
                        </p>
                        <p className="text-lg font-black tabular-nums">
                          S/ {selectedPlan.precioMensual}.00
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-col gap-3 rounded-2xl bg-white p-4 text-slate-900 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                          Número Yape a transferir
                        </p>
                        <p className="mt-0.5 text-2xl font-black tracking-wide text-[#742284] tabular-nums">
                          {YAPE_NUMBER_DISPLAY}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyYape}
                        className={`tap-feedback inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl px-4 text-xs font-extrabold transition-colors whitespace-nowrap ${
                          yapeCopied
                            ? 'bg-emerald-600 text-white'
                            : 'bg-[#742284] text-white hover:bg-[#5E1A6B]'
                        }`}
                      >
                        {yapeCopied ? (
                          <>
                            <Check className="h-4 w-4" />
                            <span>¡Número copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4" />
                            <span>Copiar número Yape</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="mt-3">
                      <label
                        htmlFor="yape-op"
                        className="block text-xs font-semibold text-white/90"
                      >
                        N° de operación Yape (opcional, o envía captura por WhatsApp)
                      </label>
                      <input
                        id="yape-op"
                        type="text"
                        placeholder="Ej. 04829103"
                        value={yapeOperacion}
                        onChange={(e) => setYapeOperacion(e.target.value)}
                        className="mt-1 min-h-[44px] w-full rounded-xl border border-white/25 bg-white/10 px-3.5 text-sm font-semibold text-white placeholder:text-white/55 focus:border-white focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Resumen final antes de enviar */}
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs space-y-1.5">
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-500">Negocio y Rubro</span>
                      <span className="font-bold text-slate-900 text-right">
                        {negocioNombre} ({rubroMeta.rubroLabel})
                      </span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-500">WhatsApp de aprobación</span>
                      <span className="font-bold text-slate-900 tabular-nums">
                        +51 {whatsapp}
                      </span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-500">Accesos solicitados</span>
                      <span className="font-bold text-indigo-700">
                        {totalUsers} usuario(s) · {adminUsers} Admin y {cajaUsers} Caja
                      </span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-500">Guía incluida</span>
                      <span className="font-semibold text-emerald-700 inline-flex items-center gap-1">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Modo de inicio + creación de usuarios
                      </span>
                    </div>
                  </div>

                  {requestError && (
                    <div
                      role="alert"
                      className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-semibold text-rose-800"
                    >
                      {requestError}
                    </div>
                  )}

                  <div className="flex gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="tap-feedback inline-flex min-h-[52px] items-center justify-center gap-1.5 rounded-2xl border border-slate-200 px-4 text-xs font-bold text-slate-700 hover:bg-slate-50"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Atrás
                    </button>
                    <button
                      type="submit"
                      className="tap-feedback flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 text-sm font-extrabold text-white shadow-sm hover:bg-emerald-700"
                    >
                      <Sparkles className="h-4 w-4 shrink-0" />
                      <span>Enviar solicitud de cuenta</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )
        ) : (
          /* ================================================================ */
          /* MODO: INICIAR SESIÓN (CUENTAS YA APROBADAS)                      */
          /* ================================================================ */
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
            <div className="flex items-center gap-3">
              <MariaLogoMark className="h-10 w-10 shrink-0" />
              <div>
                <h1 className="text-lg sm:text-xl font-extrabold text-slate-900">
                  Ingresa a tu panel
                </h1>
                <p className="text-xs text-slate-500">
                  Administra tus citas, usuarios de Caja/Admin y enlace público.
                </p>
              </div>
            </div>

            <form onSubmit={handleLoginSubmit} className="mt-5 space-y-3.5">
              <div>
                <label
                  htmlFor="auth-email"
                  className="block text-xs font-bold text-slate-700"
                >
                  Correo de acceso asignado
                </label>
                <div className="relative mt-1">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="auth-email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="acceso@tunegocio.pe"
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
                  Clave de acceso
                </label>
                <div className="relative mt-1">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="auth-password"
                    type="password"
                    required
                    minLength={6}
                    autoComplete="current-password"
                    placeholder="Tu clave asignada"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="min-h-[48px] w-full rounded-xl border border-slate-300 pl-10 pr-3 text-base text-slate-900 focus:border-indigo-600 focus:outline-none"
                  />
                </div>
              </div>

              {loginError && (
                <div
                  role="alert"
                  className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-semibold text-rose-800"
                >
                  {loginError}
                </div>
              )}

              <button
                type="submit"
                disabled={loginLoading}
                className="tap-feedback flex min-h-[52px] w-full items-center justify-center rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-60"
              >
                {loginLoading ? 'Ingresando...' : 'Ingresar a mi panel'}
              </button>

              <div className="border-t border-slate-100 pt-3 text-center">
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="text-xs font-bold text-indigo-700 hover:underline"
                >
                  ¿Aún no tienes cuenta aprobada? Solicítala aquí sin correo
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
