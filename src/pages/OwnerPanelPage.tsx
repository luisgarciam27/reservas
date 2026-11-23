import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  Calendar,
  Check,
  Clock,
  Cloud,
  Copy,
  Download,
  ExternalLink,
  Gift,
  Kanban,
  Lock,
  LogOut,
  Menu,
  MessageSquare,
  Package,
  Plus,
  Save,
  Scissors,
  Settings,
  Share2,
  Trash2,
  Users,
  Volume2,
  X,
} from 'lucide-react';
import { generateQrSvgDataUrl } from '../lib/qrHelper';
import { isSupabaseConfigured } from '../lib/supabase';
import { OwnerAgendaView } from '../components/owner/OwnerAgendaView';
import { OwnerCobrosView } from '../components/owner/OwnerCobrosView';
import { OwnerClientesView } from '../components/owner/OwnerClientesView';
import { OwnerHoyView } from '../components/owner/OwnerHoyView';
import { OwnerKanbanView } from '../components/owner/OwnerKanbanView';
import { OwnerMonthlyChart } from '../components/owner/OwnerMonthlyChart';
import {
  ADMIN_STATUS_META,
  generateDemoSampleCitas,
} from '../components/owner/ownerSeedData';
import {
  playAttentionChime,
  playNewBookingChime,
  playSuccessChime,
} from '../lib/soundAlerts';
import { PromosTab } from '../components/PromosTab';
import { WhatsAppSvgIcon } from '../components/RubroIcons';
import {
  buildModulesForPlanAndSelection,
  isModuleAllowedByPlan,
  MODULO_ORDER,
  MODULOS_META,
  PLAN_ORDER,
  PLANS,
} from '../config/plans';
import { buildRubroConfigFromNegocio, RUBROS_SAAS } from '../config/rubros';
import {
  fetchNegocioOperationalData,
  type FullBusinessBundle,
  isSafeLogoUrl,
  saveSaaSManualCita,
  saveNegocioProductos,
  saveNegocioProfesionales,
  saveNegocioServicios,
  toggleSaaSBloqueo,
  updateNegocioModulosAndPlan,
  updateNegocioProfile,
  updateSaaSCitaEstado,
} from '../lib/saasService';
import type {
  AppointmentRecord,
  BlockedSlot,
  ClientTag,
  EstadoCitaAdmin,
  MetodoPago,
  PagoEstado,
} from '../types/app';
import type {
  MascotaSaaS,
  ModuloId,
  PlanId,
  ProductoCatalogo,
  ProfesionalSaaS,
  SaaSUser,
  ServicioSaaS,
} from '../types/saas';

type PanelSection = ModuloId | 'ajustes';

interface OwnerPanelPageProps {
  user: SaaSUser;
  bundle: FullBusinessBundle;
  onUpdateBundle: (next: FullBusinessBundle) => void;
  onOpenPublicSlug: (slug: string) => void;
  onBackToLanding: () => void;
  onLogout: () => void;
}

export const OwnerPanelPage: React.FC<OwnerPanelPageProps> = ({
  user,
  bundle,
  onUpdateBundle,
  onOpenPublicSlug,
  onBackToLanding,
  onLogout,
}) => {
  const { negocio, modulos, servicios, profesionales, productos } = bundle;
  const preset = RUBROS_SAAS[negocio.rubro] || RUBROS_SAAS.otro;

  const rubroAdapter = useMemo(
    () => buildRubroConfigFromNegocio(negocio, servicios),
    [negocio, servicios]
  );

  const [activeSection, setActiveSection] = useState<PanelSection>('agenda');
  const [agendaSubView, setAgendaSubView] = useState<'kanban' | 'hoy' | 'calendario'>('kanban');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Datos operacionales (citas, bloqueos, mascotas)
  const [citas, setCitas] = useState<AppointmentRecord[]>([]);
  const [bloqueos, setBloqueos] = useState<BlockedSlot[]>([]);
  const [mascotas, setMascotas] = useState<MascotaSaaS[]>([]);
  const [loadingOps, setLoadingOps] = useState(true);
  const [editingCitaId, setEditingCitaId] = useState<string | null>(null);
  const [clientTags, setClientTags] = useState<Record<string, ClientTag[]>>({});

  // Estados locales editables de módulos
  const [svcDraft, setSvcDraft] = useState<ServicioSaaS[]>(servicios);
  const [profDraft, setProfDraft] = useState<ProfesionalSaaS[]>(profesionales);
  const [prodDraft, setProdDraft] = useState<ProductoCatalogo[]>(productos);

  // Recordatorios
  const [tplDraft, setTplDraft] = useState(
    `Hola [cliente], te recordamos tu cita de [servicio] el [fecha] en ${negocio.nombre}. Responde 1 para confirmar o 2 para reprogramar.`
  );

  // Ajustes del negocio y módulos
  const [nombreDraft, setNombreDraft] = useState(negocio.nombre);
  const [logoDraft, setLogoDraft] = useState(negocio.logo);
  const [colorDraft, setColorDraft] = useState(negocio.color);
  const [dirDraft, setDirDraft] = useState(negocio.direccion);
  const [horarioDraft, setHorarioDraft] = useState(negocio.horario);
  const [waDraft, setWaDraft] = useState(negocio.whatsapp);
  const [planDraft, setPlanDraft] = useState<PlanId>(negocio.plan);
  const [modDraft, setModDraft] = useState<Record<ModuloId, boolean>>(modulos);
  const [yapeNumDraft, setYapeNumDraft] = useState(negocio.yape_numero || '');
  const [yapeNomDraft, setYapeNomDraft] = useState(negocio.yape_nombre || '');
  const [bancoInfoDraft, setBancoInfoDraft] = useState(negocio.banco_info || '');
  const [qrPagoUrlDraft, setQrPagoUrlDraft] = useState(negocio.qr_pago_url || '');
  const [horaInicioDraft, setHoraInicioDraft] = useState(negocio.hora_inicio || '09:00');
  const [horaFinDraft, setHoraFinDraft] = useState(negocio.hora_fin || '19:00');
  const [diasAtencionDraft, setDiasAtencionDraft] = useState<string[]>(
    negocio.dias_atencion || ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
  );

  const [notice, setNotice] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  const publicUrlPath = `/n/${negocio.slug}`;
  const fullPublicUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${publicUrlPath}`
      : publicUrlPath;

  useEffect(() => {
    if (fullPublicUrl) {
      generateQrSvgDataUrl(fullPublicUrl).then(setQrDataUrl);
    }
  }, [fullPublicUrl]);

  const handleShareWhatsApp = () => {
    const text = `¡Hola! Ya puedes agendar tu cita en ${negocio.nombre} directo desde nuestra App oficial 24/7:\n${fullPublicUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `qr-app-${negocio.slug}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  useEffect(() => {
    setSvcDraft(servicios);
    setProfDraft(profesionales);
    setProdDraft(productos);
    setPlanDraft(negocio.plan);
    setModDraft(modulos);
  }, [servicios, profesionales, productos, negocio.plan, modulos]);

  useEffect(() => {
    let mounted = true;
    setLoadingOps(true);
    fetchNegocioOperationalData(negocio.id)
      .then((res) => {
        if (!mounted) return;
        setCitas(res.citas);
        setBloqueos(res.bloqueos);
        setMascotas(res.mascotas);
      })
      .finally(() => {
        if (mounted) setLoadingOps(false);
      });
    return () => {
      mounted = false;
    };
  }, [negocio.id]);

  // Si un módulo activo se desactiva en Ajustes, volver a Agenda si estaba seleccionado
  useEffect(() => {
    if (activeSection !== 'ajustes' && !modulos[activeSection]) {
      setActiveSection('agenda');
    }
  }, [modulos, activeSection]);

  const showSuccess = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3000);
  };

  // Menú lateral DINÁMICO: muestra SOLO módulos activos + Ajustes
  const sidebarItems = useMemo(() => {
    const iconMap: Record<
      ModuloId,
      React.ComponentType<{ className?: string }>
    > = {
      agenda: Calendar,
      servicios: Scissors,
      recordatorios: MessageSquare,
      clientes: Users,
      promos: Gift,
      catalogo: Package,
      reportes: BarChart3,
    };

    const activeMods = MODULO_ORDER.filter((m) => modulos[m]).map((m) => ({
      id: m as PanelSection,
      label:
        m === 'clientes' ? `${preset.sujetoPluralCap}` : MODULOS_META[m].nombre,
      icon: iconMap[m],
    }));

    return [
      ...activeMods,
      { id: 'ajustes' as PanelSection, label: 'Ajustes y módulos', icon: Settings },
    ];
  }, [modulos, preset.sujetoPluralCap]);

  const handleCopyPublicLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(fullPublicUrl).catch(() => {});
    }
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleChangeEstado = async (id: string, estado: EstadoCitaAdmin) => {
    setCitas((prev) => prev.map((c) => (c.id === id ? { ...c, estado } : c)));
    if (estado === 'confirmada' || estado === 'atendido') {
      playSuccessChime();
    } else if (estado === 'reprogramar' || estado === 'cancelada') {
      playAttentionChime();
    }
    await updateSaaSCitaEstado(id, estado);
  };

  const handleUpdatePago = (
    id: string,
    pagoEstado: PagoEstado,
    montoPagado: number,
    metodoPago?: MetodoPago
  ) => {
    if (pagoEstado === 'pagado') {
      playSuccessChime();
    }
    setCitas((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, pagoEstado, montoPagado, metodoPago } : c
      )
    );
  };

  const handleCreateManualCita = async (created: AppointmentRecord) => {
    const saved = await saveSaaSManualCita({
      ...created,
      negocioId: negocio.id,
    });
    setCitas((prev) => [saved, ...prev]);
    playNewBookingChime();
  };

  const handleToggleBlock = async (
    fecha: string,
    hora: string,
    motivo?: string
  ) => {
    const next = await toggleSaaSBloqueo({
      negocioId: negocio.id,
      fecha,
      hora,
      motivo,
    });
    setBloqueos(next);
  };

  const handleApplyBulkDuration = (minutos: number) => {
    setSvcDraft((prev) =>
      prev.map((s) => ({
        ...s,
        duracion: `${minutos} min`,
        duracion_min: minutos,
      }))
    );
    showSuccess(`Duración predeterminada (${minutos} min) aplicada a todos los servicios.`);
  };

  const handleSaveServicios = async () => {
    const clean = svcDraft.filter((s) => s.nombre.trim());
    const saved = await saveNegocioServicios(negocio.id, clean);
    const savedProfs =
      negocio.plan === 'full'
        ? await saveNegocioProfesionales(
            negocio.id,
            profDraft.filter((p) => p.nombre.trim())
          )
        : profesionales;
    onUpdateBundle({
      ...bundle,
      servicios: saved,
      profesionales: savedProfs,
    });
    showSuccess('Servicios actualizados y visibles en tu link público.');
  };

  const handleSaveProductos = async () => {
    const saved = await saveNegocioProductos(
      negocio.id,
      prodDraft.filter((p) => p.nombre.trim())
    );
    onUpdateBundle({ ...bundle, productos: saved });
    showSuccess('Catálogo de productos actualizado.');
  };

  const handleSaveAjustes = async (e: React.FormEvent) => {
    e.preventDefault();
    const updatedProfile = await updateNegocioProfile({
      negocioId: negocio.id,
      nombre: nombreDraft,
      logo: logoDraft,
      color: colorDraft,
      direccion: dirDraft,
      horario: horarioDraft,
      whatsapp: waDraft,
      yape_numero: yapeNumDraft,
      yape_nombre: yapeNomDraft,
      banco_info: bancoInfoDraft,
      qr_pago_url: qrPagoUrlDraft,
      hora_inicio: horaInicioDraft,
      hora_fin: horaFinDraft,
      dias_atencion: diasAtencionDraft,
    });
    const updatedMods = await updateNegocioModulosAndPlan({
      negocioId: negocio.id,
      plan: planDraft,
      modulos: modDraft,
    });

    onUpdateBundle({
      ...bundle,
      negocio: {
        ...(updatedProfile || negocio),
        plan: updatedMods.plan,
      },
      modulos: updatedMods.modulos,
    });
    showSuccess('Ajustes, plan y módulos guardados correctamente.');
  };

  const editingCita = useMemo(
    () => citas.find((c) => c.id === editingCitaId) ?? null,
    [citas, editingCitaId]
  );

  const logoIsImg = isSafeLogoUrl(negocio.logo);

  return (
    <div className="min-h-[100dvh] flex flex-col bg-slate-50 text-slate-900">
      {/* Header superior fijo */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md pt-safe">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-2 px-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Abrir menú de módulos"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 md:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl text-lg text-white"
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
              <p className="truncate text-sm font-extrabold text-slate-900">
                {negocio.nombre}
              </p>
              <p className="truncate text-[11px] font-semibold text-slate-500">
                {PLANS[negocio.plan].nombre} · {preset.rubroLabel}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={handleCopyPublicLink}
              className="tap-feedback hidden min-h-[38px] items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-800 hover:bg-slate-100 sm:inline-flex"
            >
              {copiedLink ? (
                <Check className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              <span>{copiedLink ? 'Link copiado' : publicUrlPath}</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenPublicSlug(negocio.slug)}
              style={{ backgroundColor: negocio.color }}
              className="tap-feedback inline-flex min-h-[38px] items-center gap-1.5 rounded-xl px-3 text-xs font-bold text-white shadow-2xs"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Ver App Cliente</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-6 px-4 py-5 sm:px-6">
        {/* MENÚ LATERAL DESKTOP — Muestra SOLO los módulos activos + Ajustes */}
        <aside className="hidden w-60 shrink-0 md:block">
          <div className="sticky top-20 space-y-1.5 rounded-3xl border border-slate-200 bg-white p-3 shadow-2xs">
            <p className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Módulos activos
            </p>
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const active = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveSection(item.id)}
                  style={
                    active
                      ? {
                          backgroundColor: `${negocio.color}15`,
                          color: negocio.color,
                        }
                      : undefined
                  }
                  className={`flex min-h-[44px] w-full items-center gap-2.5 rounded-xl px-3 text-left text-xs font-bold transition-colors ${
                    active
                      ? ''
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}

            <div className="mt-4 border-t border-slate-100 pt-3 space-y-1">
              <button
                type="button"
                onClick={onBackToLanding}
                className="flex min-h-[40px] w-full items-center gap-2 rounded-xl px-3 text-xs font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-800"
              >
                Inicio MarIA Citas
              </button>
              <button
                type="button"
                onClick={onLogout}
                className="flex min-h-[40px] w-full items-center gap-2 rounded-xl px-3 text-xs font-semibold text-rose-600 hover:bg-rose-50"
              >
                <LogOut className="h-4 w-4" />
                Cerrar sesión
              </button>
            </div>
          </div>
        </aside>

        {/* CONTENIDO PRINCIPAL DEL PANEL */}
        <main className="min-w-0 flex-1 pb-24 md:pb-16">
          {notice && (
            <div className="mb-4 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-900">
              <Check className="h-4 w-4 shrink-0 text-emerald-700" />
              {notice}
            </div>
          )}

          {/* MÓDULO: AGENDA Y CITAS */}
          {activeSection === 'agenda' && (
            <div className="space-y-6">
              {/* Tarjeta Compartir App y QR */}
              <div className="rounded-3xl border border-indigo-200 bg-gradient-to-br from-indigo-50/80 via-white to-slate-50 p-5 shadow-2xs sm:p-6">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="space-y-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-800">
                      <Share2 className="h-3.5 w-3.5" /> Enlace y Código QR Oficial
                    </span>
                    <h2 className="text-xl font-extrabold text-slate-900">
                      Comparte tu App de citas con tus clientes
                    </h2>
                    <p className="text-xs leading-relaxed text-slate-600 max-w-xl">
                      Pega este enlace en tus redes sociales (Instagram, WhatsApp, TikTok) o imprime el código QR para que tus clientes agenden directo en 3 toques las 24 horas.
                    </p>

                    <div className="flex flex-wrap items-center gap-2 pt-2">
                      <div className="flex min-h-[42px] flex-1 min-w-[240px] items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 text-xs font-medium text-slate-800 shadow-2xs">
                        <span className="truncate flex-1 select-all">{fullPublicUrl}</span>
                        <button
                          type="button"
                          onClick={handleCopyPublicLink}
                          className="tap-feedback inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1.5 font-bold text-slate-700 hover:bg-slate-200"
                        >
                          {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                          <span>{copiedLink ? 'Copiado' : 'Copiar'}</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={handleShareWhatsApp}
                        className="tap-feedback inline-flex min-h-[42px] items-center gap-1.5 rounded-xl bg-[#25D366] px-4 text-xs font-bold text-white shadow-md hover:bg-emerald-600 whitespace-nowrap"
                      >
                        <WhatsAppSvgIcon className="h-4 w-4" />
                        <span>Enviar por WhatsApp</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onOpenPublicSlug(negocio.slug)}
                        style={{ backgroundColor: negocio.color }}
                        className="tap-feedback inline-flex min-h-[42px] items-center gap-1.5 rounded-xl px-4 text-xs font-bold text-white shadow-2xs whitespace-nowrap"
                      >
                        <ExternalLink className="h-4 w-4" />
                        <span>Abrir App Cliente</span>
                      </button>
                    </div>
                  </div>

                  {/* QR Visualizer */}
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shrink-0">
                    {qrDataUrl ? (
                      <img src={qrDataUrl} alt={`QR de ${negocio.nombre}`} className="h-32 w-32 object-contain" />
                    ) : (
                      <div className="flex h-32 w-32 items-center justify-center bg-slate-100 text-xs text-slate-400">
                        Generando QR...
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={handleDownloadQr}
                      className="tap-feedback mt-3 inline-flex min-h-[36px] items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-700 hover:bg-slate-100 whitespace-nowrap"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Descargar QR (SVG)</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Barra de Sub-vistas de la Agenda: Kanban, Turnos de Hoy, Calendario */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-2.5 shadow-2xs">
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setAgendaSubView('kanban')}
                    className={`tap-feedback inline-flex min-h-[38px] items-center gap-1.5 rounded-xl px-3.5 text-xs font-bold transition-all ${
                      agendaSubView === 'kanban'
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <Kanban className="h-3.5 w-3.5 text-indigo-400" />
                    <span>🗂️ Tablero Kanban</span>
                    <span className="rounded-full bg-indigo-500/20 px-1.5 py-0.2 text-[10px] text-indigo-300">
                      Recepción
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAgendaSubView('hoy')}
                    className={`tap-feedback inline-flex min-h-[38px] items-center gap-1.5 rounded-xl px-3.5 text-xs font-bold transition-all ${
                      agendaSubView === 'hoy'
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <Clock className="h-3.5 w-3.5" />
                    <span>⏱️ Turnos de Hoy</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAgendaSubView('calendario')}
                    className={`tap-feedback inline-flex min-h-[38px] items-center gap-1.5 rounded-xl px-3.5 text-xs font-bold transition-all ${
                      agendaSubView === 'calendario'
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <Calendar className="h-3.5 w-3.5" />
                    <span>📅 Calendario Semanal</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      playNewBookingChime();
                      showSuccess('🔔 Timbre de cita reproducido');
                    }}
                    className="tap-feedback inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 text-xs font-bold text-indigo-800 hover:bg-indigo-100"
                    title="Probar sonido de notificación de citas"
                  >
                    <Volume2 className="h-3.5 w-3.5 text-indigo-600" />
                    <span>Probar timbre</span>
                  </button>
                </div>
              </div>

              {loadingOps ? (
                <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-xs text-slate-500">
                  Cargando citas de tu agenda...
                </div>
              ) : agendaSubView === 'kanban' ? (
                <OwnerKanbanView
                  rubro={rubroAdapter}
                  citas={citas}
                  onChangeEstado={handleChangeEstado}
                  onOpenCitaSheet={(c) => setEditingCitaId(c.id)}
                  onOpenNewCitaModal={() => setAgendaSubView('calendario')}
                />
              ) : agendaSubView === 'hoy' ? (
                <OwnerHoyView
                  rubro={rubroAdapter}
                  citas={citas}
                  onChangeEstado={handleChangeEstado}
                  onOpenCitaSheet={(c) => setEditingCitaId(c.id)}
                />
              ) : (
                <OwnerAgendaView
                  rubro={rubroAdapter}
                  citas={citas}
                  blockedSlots={bloqueos}
                  onCreateCita={handleCreateManualCita}
                  onOpenCitaSheet={(c) => setEditingCitaId(c.id)}
                  onToggleBlockSlot={handleToggleBlock}
                />
              )}
            </div>
          )}

          {/* MÓDULO: SERVICIOS Y PRECIOS */}
          {activeSection === 'servicios' && (
            <section className="space-y-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-2xs sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Servicios y precios (S/)
                  </h2>
                  <p className="text-xs text-slate-500">
                    Los cambios se reflejan automáticamente en {publicUrlPath}.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setSvcDraft((prev) => [
                      ...prev,
                      {
                        id: `svc-${Date.now()}`,
                        negocio_id: negocio.id,
                        nombre: 'Nuevo servicio',
                        duracion: '30 min',
                        duracion_min: 30,
                        precio: 50,
                        descripcion: '',
                        activo: true,
                        orden: prev.length,
                      },
                    ])
                  }
                  className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-800"
                >
                  <Plus className="h-4 w-4" />
                  Agregar servicio
                </button>
              </div>

              <div className="space-y-3">
                {svcDraft.map((svc, idx) => (
                  <div
                    key={svc.id}
                    className="grid grid-cols-1 gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3.5 sm:grid-cols-12"
                  >
                    <input
                      type="text"
                      value={svc.nombre}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSvcDraft((prev) =>
                          prev.map((it, i) =>
                            i === idx ? { ...it, nombre: val } : it
                          )
                        );
                      }}
                      placeholder="Nombre del servicio"
                      className="min-h-[44px] rounded-xl border border-slate-300 bg-white px-3 text-xs font-bold sm:col-span-5"
                    />
                    <input
                      type="text"
                      value={svc.duracion}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSvcDraft((prev) =>
                          prev.map((it, i) =>
                            i === idx ? { ...it, duracion: val } : it
                          )
                        );
                      }}
                      placeholder="45 min"
                      className="min-h-[44px] rounded-xl border border-slate-300 bg-white px-3 text-xs sm:col-span-3"
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
                          setSvcDraft((prev) =>
                            prev.map((it, i) =>
                              i === idx ? { ...it, precio: val } : it
                            )
                          );
                        }}
                        className="min-h-[44px] w-full rounded-xl border border-slate-300 bg-white pl-7 pr-2 text-xs font-bold tabular-nums"
                      />
                    </div>
                    <button
                      type="button"
                      disabled={svcDraft.length <= 1}
                      onClick={() =>
                        setSvcDraft((prev) => prev.filter((_, i) => i !== idx))
                      }
                      className="flex min-h-[44px] items-center justify-center rounded-xl border border-slate-200 bg-white text-rose-600 disabled:opacity-40 sm:col-span-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              {negocio.plan === 'full' && (
                <div className="border-t border-slate-100 pt-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900">
                      Profesionales (Plan Full)
                    </h3>
                    <button
                      type="button"
                      onClick={() =>
                        setProfDraft((prev) => [
                          ...prev,
                          {
                            id: `prof-${Date.now()}`,
                            negocio_id: negocio.id,
                            nombre: 'Nuevo especialista',
                            especialidad: 'General',
                            activo: true,
                          },
                        ])
                      }
                      className="text-xs font-bold text-indigo-700"
                    >
                      + Agregar profesional
                    </button>
                  </div>
                  <div className="mt-2.5 space-y-2">
                    {profDraft.map((p, idx) => (
                      <div key={p.id} className="grid grid-cols-1 gap-2 sm:grid-cols-12">
                        <input
                          type="text"
                          value={p.nombre}
                          onChange={(e) => {
                            const v = e.target.value;
                            setProfDraft((prev) =>
                              prev.map((item, i) =>
                                i === idx ? { ...item, nombre: v } : item
                              )
                            );
                          }}
                          className="min-h-[42px] rounded-xl border border-slate-300 px-3 text-xs font-bold sm:col-span-6"
                        />
                        <input
                          type="text"
                          value={p.especialidad}
                          onChange={(e) => {
                            const v = e.target.value;
                            setProfDraft((prev) =>
                              prev.map((item, i) =>
                                i === idx ? { ...item, especialidad: v } : item
                              )
                            );
                          }}
                          className="min-h-[42px] rounded-xl border border-slate-300 px-3 text-xs sm:col-span-5"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setProfDraft((prev) =>
                              prev.filter((_, i) => i !== idx)
                            )
                          }
                          className="flex min-h-[42px] items-center justify-center rounded-xl border border-slate-200 text-rose-600 sm:col-span-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handleSaveServicios}
                style={{ backgroundColor: negocio.color }}
                className="tap-feedback flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl text-sm font-bold text-white"
              >
                <Save className="h-4 w-4" />
                Guardar servicios
              </button>
            </section>
          )}

          {/* MÓDULO: RECORDATORIOS POR WHATSAPP */}
          {activeSection === 'recordatorios' && (
            <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-2xs sm:p-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Recordatorios por WhatsApp
                </h2>
                <p className="text-xs text-slate-500">
                  Personaliza tu mensaje y envía recordatorios en un toque a tus{' '}
                  {preset.sujetoPlural}.
                </p>
              </div>

              <textarea
                rows={3}
                value={tplDraft}
                onChange={(e) => setTplDraft(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 p-3 text-xs text-slate-900"
              />

              <div className="space-y-2 border-t border-slate-100 pt-3">
                <p className="text-xs font-bold text-slate-700">
                  Citas próximas para recordar ({citas.length})
                </p>
                {citas.length === 0 ? (
                  <p className="rounded-2xl bg-slate-50 p-4 text-xs text-slate-500">
                    Cuando lleguen reservas desde {publicUrlPath}, aparecerán aquí
                    listas para recordar por WhatsApp.
                  </p>
                ) : (
                  citas.slice(0, 10).map((c) => {
                    const msg = tplDraft
                      .replace(/\[cliente\]/gi, c.cliente)
                      .replace(/\[servicio\]/gi, c.servicio)
                      .replace(/\[fecha\]/gi, `${c.fecha} a las ${c.hora}`);
                    const cleanTel = c.telefono.replace(/\D/g, '');
                    return (
                      <div
                        key={c.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200 p-3"
                      >
                        <div>
                          <p className="text-xs font-bold text-slate-900">
                            {c.cliente} · +51 {cleanTel}
                          </p>
                          <p className="text-[11px] text-slate-500 tabular-nums">
                            {c.servicio} · {c.fecha} {c.hora}
                          </p>
                        </div>
                        <a
                          href={`https://wa.me/51${cleanTel}?text=${encodeURIComponent(msg)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl bg-[#25D366] px-3 text-xs font-bold text-white"
                        >
                          <WhatsAppSvgIcon className="h-3.5 w-3.5" />
                          Enviar recordatorio
                        </a>
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          )}

          {/* MÓDULO: CLIENTES / PACIENTES / MASCOTAS */}
          {activeSection === 'clientes' && (
            <div className="space-y-5">
              {negocio.rubro === 'veterinaria' && mascotas.length > 0 && (
                <section className="rounded-3xl border border-emerald-200 bg-white p-5 shadow-2xs">
                  <h3 className="text-sm font-bold text-slate-900">
                    Fichas de mascotas registradas ({mascotas.length})
                  </h3>
                  <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                    {mascotas.map((m) => (
                      <div
                        key={m.id}
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs"
                      >
                        <p className="font-bold text-slate-900">
                          🐾 {m.nombre} ({m.especie})
                        </p>
                        <p className="mt-0.5 text-slate-500">
                          Tutor: {m.cliente_nombre || '+51 ' + m.cliente_telefono}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <OwnerClientesView
                rubro={rubroAdapter}
                citas={citas}
                clientTags={clientTags}
                onToggleClientTag={(tel, tag) =>
                  setClientTags((prev) => {
                    const curr = prev[tel] || [];
                    return {
                      ...prev,
                      [tel]: curr.includes(tag)
                        ? curr.filter((t) => t !== tag)
                        : [...curr, tag],
                    };
                  })
                }
              />
            </div>
          )}

          {/* MÓDULO: PROMOS Y CUPONES */}
          {activeSection === 'promos' && (
            <PromosTab
              rubro={rubroAdapter}
              isOwner={true}
              onSelectServiceAndBook={() => onOpenPublicSlug(negocio.slug)}
            />
          )}

          {/* MÓDULO: CATÁLOGO DE PRODUCTOS */}
          {activeSection === 'catalogo' && (
            <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-2xs sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Catálogo de productos y pedidos por WhatsApp
                  </h2>
                  <p className="text-xs text-slate-500">
                    Tus {preset.sujetoPlural} verán estos productos en{' '}
                    {publicUrlPath} para pedirlos directo por WhatsApp.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setProdDraft((prev) => [
                      ...prev,
                      {
                        id: `prod-${Date.now()}`,
                        negocio_id: negocio.id,
                        nombre: 'Nuevo producto',
                        precio: 35,
                        descripcion: '',
                        stock: 10,
                        activo: true,
                      },
                    ])
                  }
                  className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-800"
                >
                  <Plus className="h-4 w-4" />
                  Agregar producto
                </button>
              </div>

              <div className="space-y-3">
                {prodDraft.map((pr, idx) => (
                  <div
                    key={pr.id}
                    className="grid grid-cols-1 gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3.5 sm:grid-cols-12"
                  >
                    <input
                      type="text"
                      value={pr.nombre}
                      onChange={(e) => {
                        const v = e.target.value;
                        setProdDraft((prev) =>
                          prev.map((it, i) =>
                            i === idx ? { ...it, nombre: v } : it
                          )
                        );
                      }}
                      className="min-h-[42px] rounded-xl border border-slate-300 bg-white px-3 text-xs font-bold sm:col-span-5"
                    />
                    <input
                      type="text"
                      value={pr.descripcion}
                      onChange={(e) => {
                        const v = e.target.value;
                        setProdDraft((prev) =>
                          prev.map((it, i) =>
                            i === idx ? { ...it, descripcion: v } : it
                          )
                        );
                      }}
                      placeholder="Descripción corta"
                      className="min-h-[42px] rounded-xl border border-slate-300 bg-white px-3 text-xs sm:col-span-4"
                    />
                    <div className="relative sm:col-span-2">
                      <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
                        S/
                      </span>
                      <input
                        type="number"
                        min={0}
                        value={pr.precio}
                        onChange={(e) => {
                          const v = Number(e.target.value) || 0;
                          setProdDraft((prev) =>
                            prev.map((it, i) =>
                              i === idx ? { ...it, precio: v } : it
                            )
                          );
                        }}
                        className="min-h-[42px] w-full rounded-xl border border-slate-300 bg-white pl-6 pr-2 text-xs font-bold tabular-nums"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setProdDraft((prev) => prev.filter((_, i) => i !== idx))
                      }
                      className="flex min-h-[42px] items-center justify-center rounded-xl border border-slate-200 bg-white text-rose-600 sm:col-span-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handleSaveProductos}
                style={{ backgroundColor: negocio.color }}
                className="tap-feedback flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl text-sm font-bold text-white"
              >
                <Save className="h-4 w-4" />
                Guardar catálogo
              </button>
            </section>
          )}

          {/* MÓDULO: REPORTES */}
          {activeSection === 'reportes' && (
            <div className="space-y-5">
              <OwnerMonthlyChart
                rubro={rubroAdapter}
                citas={citas}
                onLoadSampleData={() => {
                  const demo = generateDemoSampleCitas(rubroAdapter);
                  setCitas(demo);
                  showSuccess('Historial semestral de ejemplo cargado con éxito.');
                }}
              />
              <OwnerCobrosView
                rubro={rubroAdapter}
                citas={citas}
                onUpdatePago={handleUpdatePago}
              />
            </div>
          )}

          {/* AJUSTES DEL NEGOCIO Y MÓDULOS */}
          {activeSection === 'ajustes' && (
            <form onSubmit={handleSaveAjustes} className="space-y-5">
              {/* Perfil + Link Público */}
              <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-2xs sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">
                      Ajustes del negocio y módulos
                    </h2>
                    <p className="text-xs text-slate-500">
                      Cuenta: {user.email} · Link público:{' '}
                      <strong className="text-indigo-700">{publicUrlPath}</strong>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenPublicSlug(negocio.slug)}
                    className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 text-xs font-bold text-indigo-800"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Abrir {publicUrlPath}
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700">
                      Nombre del negocio
                    </label>
                    <input
                      type="text"
                      value={nombreDraft}
                      onChange={(e) => setNombreDraft(e.target.value)}
                      className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-300 px-3 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700">
                      Logo (emoji o URL)
                    </label>
                    <input
                      type="text"
                      value={logoDraft}
                      onChange={(e) => setLogoDraft(e.target.value)}
                      className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-300 px-3 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700">
                      Color principal
                    </label>
                    <div className="mt-1 flex items-center gap-2">
                      <input
                        type="color"
                        value={colorDraft}
                        onChange={(e) => setColorDraft(e.target.value)}
                        className="h-11 w-14 rounded-xl border border-slate-300 p-1"
                      />
                      <input
                        type="text"
                        value={colorDraft}
                        onChange={(e) => setColorDraft(e.target.value)}
                        className="min-h-[44px] flex-1 rounded-xl border border-slate-300 px-3 text-xs font-mono uppercase"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700">
                      WhatsApp (+51)
                    </label>
                    <input
                      type="tel"
                      value={waDraft}
                      onChange={(e) => setWaDraft(e.target.value)}
                      className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-300 px-3 text-sm tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700">
                      Dirección
                    </label>
                    <input
                      type="text"
                      value={dirDraft}
                      onChange={(e) => setDirDraft(e.target.value)}
                      className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-300 px-3 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700">
                      Horario visible
                    </label>
                    <input
                      type="text"
                      value={horarioDraft}
                      onChange={(e) => setHorarioDraft(e.target.value)}
                      className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-300 px-3 text-sm"
                    />
                  </div>
                </div>
              </section>

              {/* Configuración de Pagos (Yape, Plin y Transferencia) */}
              <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-2xs sm:p-6">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Métodos de Pago (Yape, Plin y Cuentas Bancarias)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Configura los datos para que tus clientes puedan adjuntar su pago al reservar.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700">
                      Nro. de Celular Yape / Plin
                    </label>
                    <input
                      type="tel"
                      placeholder="964112233"
                      value={yapeNumDraft}
                      onChange={(e) => setYapeNumDraft(e.target.value)}
                      className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-300 px-3 text-sm tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700">
                      Titular de Yape / Plin
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Juan Pérez"
                      value={yapeNomDraft}
                      onChange={(e) => setYapeNomDraft(e.target.value)}
                      className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-300 px-3 text-sm"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700">
                      Información de cuentas bancarias (BCP, Interbank, etc.)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="BCP Cta Cte: 193-xxxxxx-0-12&#10;CCI: 002-19300xxxxxx"
                      value={bancoInfoDraft}
                      onChange={(e) => setBancoInfoDraft(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-300 p-3 text-xs"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700">
                      URL de imagen QR de pago (opcional)
                    </label>
                    <input
                      type="url"
                      placeholder="https://ejemplo.com/qr-yape.png"
                      value={qrPagoUrlDraft}
                      onChange={(e) => setQrPagoUrlDraft(e.target.value)}
                      className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-300 px-3 text-sm"
                    />
                  </div>
                </div>
              </section>

              {/* Horarios, Días de Atención y Jornada */}
              <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-2xs sm:p-6">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Horarios de Atención, Días Libres y Duración
                  </h3>
                  <p className="text-xs text-slate-500">
                    Define la jornada diaria, los días laborables y aplica la duración predeterminada de tus servicios.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700">
                      Hora de apertura
                    </label>
                    <input
                      type="time"
                      value={horaInicioDraft}
                      onChange={(e) => setHoraInicioDraft(e.target.value)}
                      className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-300 px-3 text-sm tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700">
                      Hora de cierre
                    </label>
                    <input
                      type="time"
                      value={horaFinDraft}
                      onChange={(e) => setHoraFinDraft(e.target.value)}
                      className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-300 px-3 text-sm tabular-nums"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Días de atención (Deselecciona los días libres)
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map((dia) => {
                        const selected = diasAtencionDraft.includes(dia);
                        return (
                          <button
                            key={dia}
                            type="button"
                            onClick={() => {
                              setDiasAtencionDraft((prev) =>
                                selected ? prev.filter((d) => d !== dia) : [...prev, dia]
                              );
                            }}
                            className={`min-h-[38px] rounded-xl px-3 text-xs font-bold transition-colors ${
                              selected
                                ? 'bg-indigo-600 text-white'
                                : 'border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            {dia} {selected ? '✓' : ''}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="sm:col-span-2 border-t border-slate-100 pt-3">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Duración predeterminada en lote para servicios
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[15, 30, 45, 60, 90].map((mins) => (
                        <button
                          key={mins}
                          type="button"
                          onClick={() => handleApplyBulkDuration(mins)}
                          className="tap-feedback inline-flex min-h-[38px] items-center gap-1 rounded-xl border border-indigo-200 bg-indigo-50 px-3 text-xs font-bold text-indigo-800 hover:bg-indigo-100"
                        >
                          Aplicar {mins} min a todos
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              {/* Estado de Base de Datos en la Nube */}
              <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-2xs sm:p-6">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
                    <Cloud className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Estado de Base de Datos en la Nube (Supabase)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Sincronización multi-dispositivo y en tiempo real
                    </p>
                  </div>
                </div>

                <div
                  className={`rounded-2xl border p-4 text-xs font-semibold leading-relaxed ${
                    isSupabaseConfigured
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                      : 'border-amber-200 bg-amber-50 text-amber-900'
                  }`}
                >
                  {isSupabaseConfigured ? (
                    <p>
                      ✓ <strong>Conectado a la nube.</strong> Tus clientes pueden agendar desde cualquier celular o PC y las citas llegan al instante a tu agenda en tiempo real.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      <p>
                        ⚡ <strong>Modo Vista Previa Local.</strong> Las reservas e información se guardan en el almacenamiento local de tu navegador.
                      </p>
                      <p className="text-[11px] font-normal text-amber-800">
                        Para habilitar la base de datos real multi-compañía en producción, configura las variables <code className="font-mono bg-white/80 px-1 py-0.5 rounded font-bold">VITE_SUPABASE_URL</code> y <code className="font-mono bg-white/80 px-1 py-0.5 rounded font-bold">VITE_SUPABASE_ANON_KEY</code> en tu archivo de entorno y ejecuta el esquema SQL de Supabase.
                      </p>
                    </div>
                  )}
                </div>
              </section>

              {/* Plan y Toggle de Módulos */}
              <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-2xs sm:p-6">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Plan y módulos activos en menú lateral
                  </h3>
                  <p className="text-xs text-slate-500">
                    Activa o desactiva módulos en cualquier momento según tu plan.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {PLAN_ORDER.map((pId) => {
                    const p = PLANS[pId];
                    const active = planDraft === pId;
                    return (
                      <button
                        key={pId}
                        type="button"
                        onClick={() => {
                          setPlanDraft(pId);
                          setModDraft((prev) =>
                            buildModulesForPlanAndSelection(pId, prev)
                          );
                        }}
                        className={`rounded-2xl border p-3 text-left ${
                          active
                            ? 'border-indigo-600 bg-indigo-50/70 ring-1 ring-indigo-600'
                            : 'border-slate-200 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs font-extrabold">
                          <span>{p.nombre}</span>
                          <span className="tabular-nums text-indigo-700">
                            S/ {p.precioMensual}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-2">
                  {MODULO_ORDER.map((mId) => {
                    const meta = MODULOS_META[mId];
                    const allowed = isModuleAllowedByPlan(planDraft, mId);
                    const active = modDraft[mId];
                    return (
                      <button
                        key={mId}
                        type="button"
                        disabled={meta.siempreActivo || !allowed}
                        onClick={() =>
                          setModDraft((prev) => ({ ...prev, [mId]: !prev[mId] }))
                        }
                        className={`flex w-full items-center justify-between gap-3 rounded-2xl border p-3.5 text-left ${
                          !allowed
                            ? 'cursor-not-allowed border-slate-200 bg-slate-50 opacity-70'
                            : active
                              ? 'border-indigo-500 bg-indigo-50/40'
                              : 'border-slate-200 bg-white'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">
                              {mId === 'clientes'
                                ? `${preset.sujetoPluralCap} y fichas`
                                : meta.nombre}
                            </span>
                            {!allowed && (
                              <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                                <Lock className="h-3 w-3" />
                                Plan {PLANS[meta.planMinimo].nombre.replace('Plan ', '')}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500">
                            {meta.descripcion}
                          </p>
                        </div>
                        <div
                          className={`flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors ${
                            active
                              ? 'bg-indigo-600 justify-end'
                              : 'bg-slate-300 justify-start'
                          }`}
                        >
                          <span className="h-5 w-5 rounded-full bg-white shadow-xs" />
                        </div>
                      </button>
                    );
                  })}
                </div>

                <button
                  type="submit"
                  style={{ backgroundColor: negocio.color }}
                  className="tap-feedback flex min-h-[50px] w-full items-center justify-center gap-2 rounded-xl text-sm font-bold text-white shadow-xs"
                >
                  <Save className="h-4 w-4" />
                  Guardar cambios en mi panel
                </button>
              </section>
            </form>
          )}
        </main>
      </div>

      {/* Drawer móvil del menú lateral modular */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 flex bg-slate-950/60 backdrop-blur-xs md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="h-full w-72 bg-white p-5 shadow-2xl flex flex-col justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <p className="text-sm font-extrabold text-slate-900 truncate">
                  {negocio.nombre}
                </p>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="mt-4 space-y-1">
                {sidebarItems.map((item) => {
                  const Icon = item.icon;
                  const active = activeSection === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setActiveSection(item.id);
                        setMobileMenuOpen(false);
                      }}
                      style={
                        active
                          ? {
                              backgroundColor: `${negocio.color}15`,
                              color: negocio.color,
                            }
                          : undefined
                      }
                      className="flex min-h-[44px] w-full items-center gap-2.5 rounded-xl px-3 text-left text-xs font-bold"
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3 space-y-1.5">
              <button
                type="button"
                onClick={handleCopyPublicLink}
                className="flex min-h-[42px] w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800"
              >
                <Copy className="h-3.5 w-3.5" />
                {copiedLink ? '¡Link copiado!' : `Copiar ${publicUrlPath}`}
              </button>
              <button
                type="button"
                onClick={onLogout}
                className="flex min-h-[42px] w-full items-center justify-center gap-1.5 rounded-xl bg-rose-50 text-xs font-bold text-rose-700"
              >
                <LogOut className="h-4 w-4" />
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal edición rápida de cita */}
      {editingCita && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 sm:items-center sm:p-4"
          onClick={() => setEditingCitaId(null)}
        >
          <div
            className="w-full max-w-md rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingCita.cliente}
                </h3>
                <p className="text-xs text-slate-500">
                  +51 {editingCita.telefono} · {editingCita.servicio} (S/{' '}
                  {editingCita.precio})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingCitaId(null)}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              {(Object.keys(ADMIN_STATUS_META) as EstadoCitaAdmin[]).map(
                (stKey) => {
                  const meta = ADMIN_STATUS_META[stKey];
                  const active = editingCita.estado === stKey;
                  return (
                    <button
                      key={stKey}
                      type="button"
                      onClick={() => handleChangeEstado(editingCita.id, stKey)}
                      style={
                        active
                          ? {
                              backgroundColor: meta.bg,
                              color: meta.text,
                              borderColor: meta.text,
                            }
                          : undefined
                      }
                      className="min-h-[42px] rounded-xl border border-slate-200 px-3 text-xs font-bold"
                    >
                      {meta.label}
                    </button>
                  );
                }
              )}
            </div>

            <button
              type="button"
              onClick={() => setEditingCitaId(null)}
              style={{ backgroundColor: negocio.color }}
              className="mt-5 min-h-[48px] w-full rounded-xl text-sm font-bold text-white"
            >
              Listo
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
