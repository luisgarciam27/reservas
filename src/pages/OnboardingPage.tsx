import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Lock,
  Plus,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { MariaLogoMark, RubroSvgIcon } from '../components/RubroIcons';
import {
  buildModulesForPlanAndSelection,
  isModuleAllowedByPlan,
  MODULO_ORDER,
  MODULOS_META,
  PLAN_ORDER,
  PLANS,
} from '../config/plans';
import { RUBRO_SAAS_ORDER, RUBROS_SAAS } from '../config/rubros';
import {
  createBusinessFromOnboarding,
  type FullBusinessBundle,
  slugifyBusinessName,
} from '../lib/saasService';
import type {
  ModuloId,
  OnboardingDraft,
  PlanId,
  RubroSaasKey,
  SaaSUser,
} from '../types/saas';

interface OnboardingPageProps {
  user: SaaSUser;
  initialPlan?: PlanId;
  onComplete: (bundle: FullBusinessBundle) => void;
  onLogout: () => void;
}

const COLOR_SWATCHES = [
  { hex: '#15803D', label: 'Verde Vet' },
  { hex: '#0369A1', label: 'Azul Clínico' },
  { hex: '#9D4E65', label: 'Rosa Spa' },
  { hex: '#4F46E5', label: 'Índigo MarIA' },
  { hex: '#0F766E', label: 'Teal Bienestar' },
  { hex: '#B45309', label: 'Ámbar Studio' },
];

const LOGO_PRESETS = ['🐾', '🦷', '✨', '💅', '🩺', '✂️', '🧘', '📅'];

export const OnboardingPage: React.FC<OnboardingPageProps> = ({
  user,
  initialPlan = 'pro',
  onComplete,
  onLogout,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const defaultPreset = RUBROS_SAAS.veterinaria;

  const [draft, setDraft] = useState<OnboardingDraft>(() => ({
    rubro: 'veterinaria',
    nombre: '',
    slug: '',
    logo: defaultPreset.logoDefault,
    color: defaultPreset.colorDefault,
    direccion: '',
    horario: 'Lunes a Sábado · 9:00 a 19:00',
    whatsapp: user.telefono || '',
    plan: initialPlan,
    modulos: buildModulesForPlanAndSelection(
      initialPlan,
      Object.fromEntries(
        defaultPreset.modulosRecomendados.map((m) => [m, true])
      ) as Partial<Record<ModuloId, boolean>>
    ),
    servicios: defaultPreset.serviciosEjemplo.map((s) => ({ ...s })),
    profesionales: defaultPreset.profesionalesEjemplo.map((p, i) => ({
      id: `prof-${i + 1}`,
      ...p,
    })),
  }));

  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  const handleSelectRubro = (rubroKey: RubroSaasKey) => {
    const preset = RUBROS_SAAS[rubroKey];
    setDraft((prev) => ({
      ...prev,
      rubro: rubroKey,
      logo: preset.logoDefault,
      color: preset.colorDefault,
      modulos: buildModulesForPlanAndSelection(
        prev.plan,
        Object.fromEntries(
          preset.modulosRecomendados.map((m) => [m, true])
        ) as Partial<Record<ModuloId, boolean>>
      ),
      servicios: preset.serviciosEjemplo.map((s) => ({ ...s })),
      profesionales: preset.profesionalesEjemplo.map((p, i) => ({
        id: `prof-${i + 1}`,
        ...p,
      })),
    }));
  };

  const handlePlanChange = (planId: PlanId) => {
    const preset = RUBROS_SAAS[draft.rubro];
    setDraft((prev) => ({
      ...prev,
      plan: planId,
      modulos: buildModulesForPlanAndSelection(planId, {
        ...Object.fromEntries(preset.modulosRecomendados.map((m) => [m, true])),
        ...prev.modulos,
      }),
    }));
  };

  const handleToggleModulo = (modulo: ModuloId) => {
    if (modulo === 'agenda') return;
    if (!isModuleAllowedByPlan(draft.plan, modulo)) return;
    setDraft((prev) => ({
      ...prev,
      modulos: {
        ...prev.modulos,
        [modulo]: !prev.modulos[modulo],
      },
    }));
  };

  const activeModuleCount = useMemo(
    () => Object.values(draft.modulos).filter(Boolean).length,
    [draft.modulos]
  );

  const canGoStep3 =
    draft.nombre.trim().length >= 2 &&
    draft.whatsapp.replace(/\D/g, '').length >= 9;

  const handleFinish = async () => {
    setError(null);
    if (draft.servicios.filter((s) => s.nombre.trim()).length === 0) {
      setError('Agrega al menos 1 servicio antes de finalizar.');
      return;
    }
    setSubmitting(true);
    try {
      const bundle = await createBusinessFromOnboarding(user.id, {
        ...draft,
        servicios: draft.servicios.filter((s) => s.nombre.trim()),
      });
      onComplete(bundle);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No pudimos finalizar la configuración de tu negocio.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-slate-50 text-slate-900">
      {/* Header compacto */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <MariaLogoMark className="h-8 w-8" />
            <span className="text-sm font-extrabold text-slate-900">
              Configura tu negocio
            </span>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="text-xs font-semibold text-slate-500 hover:text-slate-900"
          >
            Salir ({user.email})
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 pb-16">
        {/* Indicador de 4 pasos */}
        <div className="mb-6 grid grid-cols-4 gap-2 rounded-2xl border border-slate-200 bg-white p-2">
          {[
            { n: 1, t: '1. Rubro' },
            { n: 2, t: '2. Negocio' },
            { n: 3, t: '3. Módulos' },
            { n: 4, t: '4. Servicios' },
          ].map((item) => {
            const active = step === item.n;
            const done = step > item.n;
            return (
              <div
                key={item.n}
                className={`flex min-h-[40px] items-center justify-center gap-1 rounded-xl px-2 text-xs font-bold ${
                  active
                    ? 'bg-indigo-600 text-white'
                    : done
                      ? 'bg-emerald-50 text-emerald-800'
                      : 'text-slate-400'
                }`}
              >
                {done && <Check className="h-3.5 w-3.5 shrink-0" />}
                <span className="truncate">{item.t}</span>
              </div>
            );
          })}
        </div>

        {/* PASO 1: Elegir Rubro */}
        {step === 1 && (
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-2xs sm:p-7">
            <h1 className="text-xl font-extrabold text-slate-900 sm:text-2xl">
              ¿Cuál es el rubro de tu negocio?
            </h1>
            <p className="mt-1 text-xs text-slate-500 sm:text-sm">
              Adaptaremos los términos (mascota, paciente o cliente), los campos
              de reserva y los servicios iniciales.
            </p>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {RUBRO_SAAS_ORDER.map((rKey) => {
                const preset = RUBROS_SAAS[rKey];
                const selected = draft.rubro === rKey;
                return (
                  <button
                    key={rKey}
                    type="button"
                    onClick={() => handleSelectRubro(rKey)}
                    style={
                      selected
                        ? {
                            borderColor: preset.colorDefault,
                            backgroundColor: `${preset.colorDefault}0D`,
                          }
                        : undefined
                    }
                    className={`tap-feedback flex items-start gap-3.5 rounded-2xl border p-4 text-left transition-colors ${
                      selected
                        ? 'ring-1'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white"
                      style={{ backgroundColor: preset.colorDefault }}
                    >
                      <RubroSvgIcon rubro={rKey} className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-extrabold text-slate-900">
                        {preset.rubroLabel}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-600">
                        {preset.descripcionCorta}
                      </p>
                      <p className="mt-1.5 text-[11px] font-bold text-slate-500">
                        Ficha: {preset.sujetoPluralCap}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setStep(2)}
              className="tap-feedback mt-6 flex min-h-[50px] w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 text-sm font-bold text-white hover:bg-indigo-700"
            >
              Continuar a datos del negocio
              <ArrowRight className="h-4 w-4" />
            </button>
          </section>
        )}

        {/* PASO 2: Datos del negocio + Plan */}
        {step === 2 && (
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-2xs sm:p-7">
            <h1 className="text-xl font-extrabold text-slate-900">
              Datos de tu negocio
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              Con esto crearemos tu enlace público y tu app instalable PWA.
            </p>

            <div className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700">
                  Nombre comercial del negocio
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Veterinaria Patitas del Valle"
                  value={draft.nombre}
                  onChange={(e) => {
                    const val = e.target.value;
                    setDraft((prev) => ({
                      ...prev,
                      nombre: val,
                      slug: slugManuallyEdited
                        ? prev.slug
                        : slugifyBusinessName(val),
                    }));
                  }}
                  className="mt-1 min-h-[48px] w-full rounded-xl border border-slate-300 px-3.5 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">
                  Link público de reservas
                </label>
                <div className="mt-1 flex items-center rounded-xl border border-slate-300 bg-slate-50 px-3">
                  <span className="text-xs font-semibold text-slate-500 select-none">
                    /n/
                  </span>
                  <input
                    type="text"
                    value={draft.slug}
                    onChange={(e) => {
                      setSlugManuallyEdited(true);
                      setDraft((prev) => ({
                        ...prev,
                        slug: slugifyBusinessName(e.target.value),
                      }));
                    }}
                    placeholder="mi-negocio"
                    className="min-h-[46px] w-full bg-transparent px-1 text-sm font-bold text-indigo-700 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700">
                    Logo (emoji o URL de imagen)
                  </label>
                  <input
                    type="text"
                    value={draft.logo}
                    onChange={(e) =>
                      setDraft((prev) => ({ ...prev, logo: e.target.value }))
                    }
                    placeholder="🐾 o https://..."
                    className="mt-1 min-h-[46px] w-full rounded-xl border border-slate-300 px-3 text-sm text-slate-900"
                  />
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {LOGO_PRESETS.map((em) => (
                      <button
                        key={em}
                        type="button"
                        onClick={() =>
                          setDraft((prev) => ({ ...prev, logo: em }))
                        }
                        className={`flex h-9 w-9 items-center justify-center rounded-lg border text-base ${
                          draft.logo === em
                            ? 'border-indigo-600 bg-indigo-50'
                            : 'border-slate-200 bg-white'
                        }`}
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700">
                    Color principal
                  </label>
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      type="color"
                      value={draft.color}
                      onChange={(e) =>
                        setDraft((prev) => ({ ...prev, color: e.target.value }))
                      }
                      aria-label="Selector de color"
                      className="h-11 w-14 cursor-pointer rounded-xl border border-slate-300 bg-white p-1"
                    />
                    <input
                      type="text"
                      value={draft.color}
                      onChange={(e) =>
                        setDraft((prev) => ({ ...prev, color: e.target.value }))
                      }
                      className="min-h-[46px] flex-1 rounded-xl border border-slate-300 px-3 text-sm font-mono uppercase text-slate-900"
                    />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {COLOR_SWATCHES.map((sw) => (
                      <button
                        key={sw.hex}
                        type="button"
                        onClick={() =>
                          setDraft((prev) => ({ ...prev, color: sw.hex }))
                        }
                        title={sw.label}
                        className={`h-8 w-8 rounded-lg border-2 ${
                          draft.color.toUpperCase() === sw.hex
                            ? 'border-slate-900 scale-105'
                            : 'border-white shadow-2xs'
                        }`}
                        style={{ backgroundColor: sw.hex }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700">
                    WhatsApp del negocio (para recibir confirmaciones)
                  </label>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="flex min-h-[46px] items-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-700">
                      +51
                    </span>
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={9}
                      required
                      placeholder="964112233"
                      value={draft.whatsapp}
                      onChange={(e) =>
                        setDraft((prev) => ({
                          ...prev,
                          whatsapp: e.target.value.replace(/\D/g, '').slice(0, 9),
                        }))
                      }
                      className="min-h-[46px] w-full rounded-xl border border-slate-300 px-3 text-sm text-slate-900 tabular-nums"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700">
                    Dirección
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Av. Principal 428, Miraflores"
                    value={draft.direccion}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        direccion: e.target.value,
                      }))
                    }
                    className="mt-1 min-h-[46px] w-full rounded-xl border border-slate-300 px-3 text-sm text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">
                  Horario de atención visible
                </label>
                <input
                  type="text"
                  value={draft.horario}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, horario: e.target.value }))
                  }
                  className="mt-1 min-h-[46px] w-full rounded-xl border border-slate-300 px-3 text-sm text-slate-900"
                />
              </div>

              {/* Plan elegido */}
              <div className="border-t border-slate-100 pt-3">
                <label className="block text-xs font-bold text-slate-700">
                  Plan activo (define los módulos disponibles)
                </label>
                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {PLAN_ORDER.map((pId) => {
                    const p = PLANS[pId];
                    const selected = draft.plan === pId;
                    return (
                      <button
                        key={pId}
                        type="button"
                        onClick={() => handlePlanChange(pId)}
                        className={`rounded-2xl border p-3 text-left transition-colors ${
                          selected
                            ? 'border-indigo-600 bg-indigo-50/70 ring-1 ring-indigo-600'
                            : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-slate-900">
                            {p.nombre}
                          </span>
                          <span className="text-xs font-bold text-indigo-700 tabular-nums">
                            S/ {p.precioMensual}
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] text-slate-500">
                          {p.modulosPermitidos.length} módulos incluidos
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-2.5">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="tap-feedback inline-flex min-h-[50px] items-center justify-center gap-1 rounded-xl border border-slate-200 px-4 text-xs font-bold text-slate-700"
              >
                <ArrowLeft className="h-4 w-4" />
                Atrás
              </button>
              <button
                type="button"
                disabled={!canGoStep3}
                onClick={() => setStep(3)}
                className="tap-feedback flex min-h-[50px] flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 text-sm font-bold text-white hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400"
              >
                Elegir módulos ({activeModuleCount})
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </section>
        )}

        {/* PASO 3: Módulos a activar */}
        {step === 3 && (
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-2xs sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h1 className="text-xl font-extrabold text-slate-900">
                  Módulos de tu panel
                </h1>
                <p className="mt-0.5 text-xs text-slate-500">
                  Tu menú lateral mostrará solo los módulos que actives. Plan
                  actual: <strong>{PLANS[draft.plan].nombre}</strong>.
                </p>
              </div>
              <div className="flex gap-1.5">
                {PLAN_ORDER.map((pId) => (
                  <button
                    key={pId}
                    type="button"
                    onClick={() => handlePlanChange(pId)}
                    className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-bold ${
                      draft.plan === pId
                        ? 'border-indigo-600 bg-indigo-600 text-white'
                        : 'border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    {PLANS[pId].nombre.replace('Plan ', '')}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 space-y-2.5">
              {MODULO_ORDER.map((mId) => {
                const meta = MODULOS_META[mId];
                const allowed = isModuleAllowedByPlan(draft.plan, mId);
                const active = draft.modulos[mId];
                const displayName =
                  mId === 'clientes'
                    ? `${RUBROS_SAAS[draft.rubro].sujetoPluralCap} y fichas`
                    : meta.nombre;

                return (
                  <button
                    key={mId}
                    type="button"
                    disabled={meta.siempreActivo || !allowed}
                    onClick={() => handleToggleModulo(mId)}
                    className={`flex w-full items-center justify-between gap-3 rounded-2xl border p-4 text-left transition-colors ${
                      !allowed
                        ? 'cursor-not-allowed border-slate-200 bg-slate-50 opacity-75'
                        : active
                          ? 'border-indigo-600 bg-indigo-50/50'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">
                          {displayName}
                        </span>
                        {meta.siempreActivo && (
                          <span className="rounded-md bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                            Siempre activo
                          </span>
                        )}
                        {!allowed && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                            <Lock className="h-3 w-3" />
                            Requiere {PLANS[meta.planMinimo].nombre}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-slate-600">
                        {meta.descripcion}
                      </p>
                    </div>

                    <div
                      className={`flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition-colors ${
                        active ? 'bg-indigo-600 justify-end' : 'bg-slate-300 justify-start'
                      }`}
                    >
                      <span className="h-5 w-5 rounded-full bg-white shadow-xs" />
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 flex gap-2.5">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="tap-feedback inline-flex min-h-[50px] items-center justify-center gap-1 rounded-xl border border-slate-200 px-4 text-xs font-bold text-slate-700"
              >
                <ArrowLeft className="h-4 w-4" />
                Atrás
              </button>
              <button
                type="button"
                onClick={() => setStep(4)}
                className="tap-feedback flex min-h-[50px] flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 text-sm font-bold text-white hover:bg-indigo-700"
              >
                Revisar servicios iniciales
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </section>
        )}

        {/* PASO 4: Servicios precargados por rubro, editables */}
        {step === 4 && (
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-2xs sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h1 className="text-xl font-extrabold text-slate-900">
                  Tus servicios iniciales
                </h1>
                <p className="mt-0.5 text-xs text-slate-500">
                  Precargamos ejemplos de{' '}
                  <strong>{RUBROS_SAAS[draft.rubro].rubroLabel}</strong>. Edita
                  precios en Soles o agrega nuevos.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setDraft((prev) => ({
                    ...prev,
                    servicios: [
                      ...prev.servicios,
                      {
                        id: `svc-${Date.now()}`,
                        nombre: 'Nuevo servicio',
                        duracion: '30 min',
                        precio: 50,
                        descripcion: 'Atención programada.',
                      },
                    ],
                  }))
                }
                className="inline-flex min-h-[40px] items-center gap-1 rounded-xl border border-indigo-200 bg-indigo-50 px-3 text-xs font-bold text-indigo-800 hover:bg-indigo-100"
              >
                <Plus className="h-4 w-4" />
                Agregar servicio
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {draft.servicios.map((svc, idx) => (
                <div
                  key={svc.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5"
                >
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-12">
                    <input
                      type="text"
                      value={svc.nombre}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDraft((prev) => ({
                          ...prev,
                          servicios: prev.servicios.map((item, i) =>
                            i === idx ? { ...item, nombre: val } : item
                          ),
                        }));
                      }}
                      placeholder="Nombre del servicio"
                      className="min-h-[42px] rounded-xl border border-slate-300 bg-white px-3 text-xs font-bold text-slate-900 sm:col-span-6"
                    />
                    <input
                      type="text"
                      value={svc.duracion}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDraft((prev) => ({
                          ...prev,
                          servicios: prev.servicios.map((item, i) =>
                            i === idx ? { ...item, duracion: val } : item
                          ),
                        }));
                      }}
                      placeholder="30 min"
                      className="min-h-[42px] rounded-xl border border-slate-300 bg-white px-3 text-xs text-slate-700 sm:col-span-2"
                    />
                    <div className="relative sm:col-span-3">
                      <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
                        S/
                      </span>
                      <input
                        type="number"
                        min={0}
                        value={svc.precio}
                        onChange={(e) => {
                          const val = Number(e.target.value) || 0;
                          setDraft((prev) => ({
                            ...prev,
                            servicios: prev.servicios.map((item, i) =>
                              i === idx ? { ...item, precio: val } : item
                            ),
                          }));
                        }}
                        className="min-h-[42px] w-full rounded-xl border border-slate-300 bg-white pl-7 pr-2 text-xs font-bold text-slate-900 tabular-nums"
                      />
                    </div>
                    <button
                      type="button"
                      disabled={draft.servicios.length <= 1}
                      onClick={() =>
                        setDraft((prev) => ({
                          ...prev,
                          servicios: prev.servicios.filter((_, i) => i !== idx),
                        }))
                      }
                      aria-label="Eliminar servicio"
                      className="flex min-h-[42px] items-center justify-center rounded-xl border border-slate-200 bg-white text-rose-600 hover:bg-rose-50 disabled:opacity-40 sm:col-span-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {draft.plan === 'full' && (
              <div className="mt-5 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4">
                <p className="text-xs font-bold text-indigo-950">
                  Equipo profesional incluido en tu Plan Full:
                </p>
                <p className="mt-0.5 text-[11px] text-indigo-800">
                  Tus clientes podrán elegir especialista opcionalmente al reservar.
                  Podrás editarlos luego en Ajustes.
                </p>
                <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {draft.profesionales.map((p, i) => (
                    <input
                      key={p.id}
                      type="text"
                      value={p.nombre}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDraft((prev) => ({
                          ...prev,
                          profesionales: prev.profesionales.map((item, idx) =>
                            idx === i ? { ...item, nombre: val } : item
                          ),
                        }));
                      }}
                      className="min-h-[40px] rounded-xl border border-indigo-200 bg-white px-3 text-xs font-semibold text-slate-900"
                    />
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-semibold text-rose-800">
                {error}
              </div>
            )}

            <div className="mt-6 flex gap-2.5">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="tap-feedback inline-flex min-h-[50px] items-center justify-center gap-1 rounded-xl border border-slate-200 px-4 text-xs font-bold text-slate-700"
              >
                <ArrowLeft className="h-4 w-4" />
                Atrás
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleFinish}
                className="tap-feedback flex min-h-[50px] flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 text-sm font-bold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-60"
              >
                <Sparkles className="h-4 w-4" />
                {submitting
                  ? 'Creando tu app...'
                  : 'Crear negocio e ir a mi panel'}
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};
